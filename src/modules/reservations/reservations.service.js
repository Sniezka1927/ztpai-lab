const { NotFoundError, ConflictError, ValidationError, ForbiddenError } = require("../../errors/AppError");

const MIN_DURATION_MS = 15 * 60 * 1000;
const MAX_DURATION_MS = 8 * 60 * 60 * 1000;

const ALLOWED_TRANSITIONS = {
  CONFIRMED: ["CANCELLED"],
  CANCELLED: []
};

const canAccess = (reservation, currentUser) =>
  currentUser.role === "ADMIN" || reservation.userId === currentUser.id;

function createReservationsService({ runInTransaction, now = () => new Date() }) {
  async function listReservations(query, currentUser) {
    if (currentUser.role !== "ADMIN") {
      if (query.userId !== undefined) throw new ForbiddenError("Only ADMIN can filter by userId");
      query = { ...query, userId: currentUser.id };
    }

    return runInTransaction(async ({ reservationsRepository }) => {
      const { items, total } = await reservationsRepository.findPage(query);
      return {
        items,
        meta: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) }
      };
    });
  }

  async function getReservation(id, currentUser) {
    return runInTransaction(async ({ reservationsRepository }) => {
      const reservation = await reservationsRepository.findById(id);
      if (!reservation || !canAccess(reservation, currentUser)) throw new NotFoundError("Reservation");
      return reservation;
    });
  }

  async function createReservation(input, currentUser) {
    const start = new Date(input.startTime).getTime();
    const end = new Date(input.endTime).getTime();

    if (end <= start) {
      throw new ValidationError([{ location: "body", field: "endTime", message: "endTime must be after startTime" }]);
    }
    if (end - start < MIN_DURATION_MS || end - start > MAX_DURATION_MS) {
      throw new ValidationError([{ location: "body", field: "endTime", message: "Reservation must last from 15 minutes to 8 hours" }]);
    }
    if (start < now().getTime()) {
      throw new ValidationError([{ location: "body", field: "startTime", message: "startTime cannot be in the past" }]);
    }

    return runInTransaction(async ({ roomsRepository, reservationsRepository }) => {
      const room = await roomsRepository.findById(input.roomId);
      if (!room) throw new NotFoundError("Room");

      if (input.participants > room.capacity) {
        throw new ConflictError("Room capacity exceeded", "ROOM_CAPACITY_EXCEEDED");
      }

      await roomsRepository.lockById(input.roomId);
      const active = await reservationsRepository.list({ roomId: input.roomId, status: "CONFIRMED" });
      const overlaps = active.some((r) => start < r.endTime.getTime() && r.startTime.getTime() < end);
      if (overlaps) {
        throw new ConflictError("Room is already booked in this time range", "ROOM_ALREADY_BOOKED");
      }

      return reservationsRepository.create({
        ...input,
        userId: currentUser.id,
        startTime: new Date(start),
        endTime: new Date(end),
        status: "CONFIRMED",
        internalNote: "created via API v2"
      });
    });
  }

  async function cancelReservation(id, currentUser) {
    return runInTransaction(async ({ reservationsRepository }) => {
      const reservation = await reservationsRepository.findById(id);
      if (!reservation || !canAccess(reservation, currentUser)) throw new NotFoundError("Reservation");

      if (reservation.status === "CANCELLED") return reservation;

      if (!ALLOWED_TRANSITIONS[reservation.status].includes("CANCELLED")) {
        throw new ConflictError(`Cannot cancel reservation with status ${reservation.status}`, "INVALID_STATUS_TRANSITION");
      }
      if (reservation.startTime.getTime() <= now().getTime()) {
        throw new ConflictError("Reservation has already started", "RESERVATION_ALREADY_STARTED");
      }

      return reservationsRepository.update(id, { status: "CANCELLED", cancelledAt: now() });
    });
  }

  return { listReservations, getReservation, createReservation, cancelReservation };
}

module.exports = { createReservationsService };
