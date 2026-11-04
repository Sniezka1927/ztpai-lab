const { createBuildingsRepository } = require("../modules/buildings/buildings.repository.knex");
const { createRoomsRepository } = require("../modules/rooms/rooms.repository.knex");
const { createReservationsRepository } = require("../modules/reservations/reservations.repository.knex");

function createKnexRepositories(db) {
  return {
    buildingsRepository: createBuildingsRepository(db),
    roomsRepository: createRoomsRepository(db),
    reservationsRepository: createReservationsRepository(db)
  };
}

function createKnexUnitOfWork(db) {
  return {
    runInTransaction: (fn) => db.transaction((trx) => fn(createKnexRepositories(trx)))
  };
}

module.exports = { createKnexUnitOfWork };
