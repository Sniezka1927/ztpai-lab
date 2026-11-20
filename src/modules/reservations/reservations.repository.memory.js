const { createRoomsRepository } = require("../rooms/rooms.repository.memory");

function createReservationsRepository(reservations = []) {
  let nextReservationId = Math.max(0, ...reservations.map((r) => r.id)) + 1;

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

function createInMemoryRepositories({ rooms = [], reservations = [] } = {}) {
  const repositories = {
    roomsRepository: createRoomsRepository(rooms),
    reservationsRepository: createReservationsRepository(reservations)
  };
  return { runInTransaction: (fn) => fn(repositories) };
}

module.exports = { createReservationsRepository, createInMemoryRepositories };
