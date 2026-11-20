const { createReservationsService } = require("../../src/modules/reservations/reservations.service");
const { createInMemoryRepositories } = require("../../src/modules/reservations/reservations.repository.memory");

const owner = { id: 1, role: "USER" };
const otherUser = { id: 2, role: "USER" };
const admin = { id: 99, role: "ADMIN" };
const NOW = new Date("2026-12-01T08:00:00Z");

const at = (time, day = "2026-12-02") => `${day}T${time}:00.000Z`;

const reservation = (id, { roomId = 1, userId = owner.id, start = "10:00", end = "12:00", day, status = "CONFIRMED" } = {}) => ({
  id,
  roomId,
  userId,
  participants: 5,
  startTime: new Date(at(start, day)),
  endTime: new Date(at(end, day)),
  status,
  createdAt: NOW,
  cancelledAt: status === "CANCELLED" ? NOW : null
});

const input = (start, end, extra = {}) => ({ roomId: 1, participants: 5, startTime: at(start), endTime: at(end), ...extra });

function setup({ reservations = [] } = {}) {
  const { runInTransaction } = createInMemoryRepositories({
    rooms: [
      { id: 1, name: "101", capacity: 20 },
      { id: 2, name: "102", capacity: 10 }
    ],
    reservations
  });
  const clock = { now: NOW };
  const eventBus = { publish: jest.fn(), subscribe: jest.fn() };
  const service = createReservationsService({ runInTransaction, eventBus, now: () => clock.now });
  return { service, eventBus, clock };
}

describe("reservationsService.createReservation - overlap", () => {
  test.each([
    ["partial overlap at the end", "11:00", "13:00"],
    ["partial overlap at the start", "09:00", "10:30"],
    ["new inside existing", "10:30", "11:00"],
    ["new contains existing", "09:00", "13:00"]
  ])("rejects %s", async (_, start, end) => {
    const { service } = setup({ reservations: [reservation(1)] });

    await expect(service.createReservation(input(start, end), owner))
      .rejects.toMatchObject({ statusCode: 409, code: "ROOM_ALREADY_BOOKED" });
  });

  test.each([
    ["right after", "12:00", "13:00"],
    ["right before", "08:00", "10:00"]
  ])("allows touching range %s", async (_, start, end) => {
    const { service } = setup({ reservations: [reservation(1)] });

    await expect(service.createReservation(input(start, end), owner))
      .resolves.toMatchObject({ status: "CONFIRMED", roomId: 1 });
  });

  test("allows the same time in another room", async () => {
    const { service } = setup({ reservations: [reservation(1)] });

    await expect(service.createReservation(input("10:00", "12:00", { roomId: 2 }), owner))
      .resolves.toMatchObject({ roomId: 2 });
  });

  test("cancelled reservation does not block the range", async () => {
    const { service } = setup({ reservations: [reservation(1, { status: "CANCELLED" })] });

    await expect(service.createReservation(input("10:00", "12:00"), owner))
      .resolves.toMatchObject({ status: "CONFIRMED" });
  });
});

describe("reservationsService.createReservation - capacity and duration", () => {
  test("allows participants equal to capacity", async () => {
    const { service } = setup();

    await expect(service.createReservation(input("10:00", "12:00", { participants: 20 }), owner))
      .resolves.toMatchObject({ participants: 20 });
  });

  test("rejects capacity + 1 participants", async () => {
    const { service } = setup();

    await expect(service.createReservation(input("10:00", "12:00", { participants: 21 }), owner))
      .rejects.toMatchObject({ statusCode: 409, code: "ROOM_CAPACITY_EXCEEDED" });
  });

  test.each([
    ["exactly 15 min", "10:00", "10:15"],
    ["exactly 8 h", "10:00", "18:00"]
  ])("allows %s", async (_, start, end) => {
    const { service } = setup();

    await expect(service.createReservation(input(start, end), owner))
      .resolves.toMatchObject({ status: "CONFIRMED" });
  });

  test.each([
    ["14 min", "10:00", "10:14"],
    ["8 h 1 min", "10:00", "18:01"]
  ])("rejects %s", async (_, start, end) => {
    const { service } = setup();

    await expect(service.createReservation(input(start, end), owner))
      .rejects.toMatchObject({ statusCode: 400, code: "VALIDATION_ERROR" });
  });
});

describe("reservationsService.cancelReservation", () => {
  test("rejects cancelling a reservation that already started", async () => {
    const { service } = setup({ reservations: [reservation(1, { day: "2026-12-01", start: "07:00", end: "09:00" })] });

    await expect(service.cancelReservation(1, owner))
      .rejects.toMatchObject({ statusCode: 409, code: "RESERVATION_ALREADY_STARTED" });
  });

  test("second cancel is idempotent and keeps cancelledAt", async () => {
    const { service, clock } = setup({ reservations: [reservation(1)] });

    const first = await service.cancelReservation(1, owner);
    const cancelledAt = first.cancelledAt;
    clock.now = new Date("2026-12-01T09:00:00Z");
    const second = await service.cancelReservation(1, owner);

    expect(second.status).toBe("CANCELLED");
    expect(second.cancelledAt).toEqual(cancelledAt);
    expect(cancelledAt).toEqual(NOW);
  });

  test("rejects other USER", async () => {
    const { service } = setup({ reservations: [reservation(1)] });

    await expect(service.cancelReservation(1, otherUser))
      .rejects.toMatchObject({ statusCode: 404, code: "NOT_FOUND" });
  });

  test("allows ADMIN to cancel someone else's reservation", async () => {
    const { service } = setup({ reservations: [reservation(1)] });

    await expect(service.cancelReservation(1, admin))
      .resolves.toMatchObject({ status: "CANCELLED" });
  });
});

describe("reservationsService events", () => {
  test("publishes reservation.created after success", async () => {
    const { service, eventBus } = setup();

    const created = await service.createReservation(input("10:00", "12:00"), owner);

    expect(eventBus.publish).toHaveBeenCalledTimes(1);
    expect(eventBus.publish).toHaveBeenCalledWith("reservation.created", {
      reservationId: created.id,
      roomId: 1,
      userId: owner.id,
      startTime: at("10:00"),
      endTime: at("12:00")
    });
  });

  test("does not publish when creation fails", async () => {
    const { service, eventBus } = setup({ reservations: [reservation(1)] });

    await expect(service.createReservation(input("11:00", "13:00"), owner)).rejects.toMatchObject({ code: "ROOM_ALREADY_BOOKED" });

    expect(eventBus.publish).not.toHaveBeenCalled();
  });

  test("publishes reservation.cancelled once, not on repeated cancel", async () => {
    const { service, eventBus } = setup({ reservations: [reservation(1)] });

    await service.cancelReservation(1, admin);
    await service.cancelReservation(1, admin);

    expect(eventBus.publish).toHaveBeenCalledTimes(1);
    expect(eventBus.publish).toHaveBeenCalledWith("reservation.cancelled", {
      reservationId: 1,
      roomId: 1,
      userId: owner.id,
      cancelledBy: admin.id
    });
  });
});
