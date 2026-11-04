function createReservationsRepository() {
  const reservations = [
    {
      id: 1,
      roomId: 2,
      reservedBy: "Seed User",
      participants: 5,
      startTime: new Date("2026-10-01T10:00:00.000Z"),
      endTime: new Date("2026-10-01T12:00:00.000Z"),
      status: "CONFIRMED",
      createdAt: new Date("2026-09-20T08:00:00.000Z"),
      cancelledAt: null,
      internalNote: "seed"
    }
  ];
  let nextReservationId = 2;

  return {
    async findById(id) {
      return reservations.find((item) => item.id === id) ?? null;
    },
    async list({ roomId, status } = {}) {
      return reservations.filter((item) =>
        (roomId === undefined || item.roomId === roomId) &&
        (status === undefined || item.status === status)
      );
    },
    async create(data) {
      const reservation = { id: nextReservationId++, createdAt: new Date(), cancelledAt: null, ...data };
      reservations.push(reservation);
      return reservation;
    },
    async update(id, changes) {
      const reservation = reservations.find((item) => item.id === id);
      Object.assign(reservation, changes);
      return reservation;
    }
  };
}

module.exports = { createReservationsRepository };
