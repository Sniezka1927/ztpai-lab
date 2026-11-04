const { NotFoundError } = require("../../errors/AppError");

function createRoomsService({ runInTransaction }) {
  async function listRooms() {
    return runInTransaction(({ roomsRepository }) => roomsRepository.findAll());
  }

  async function getRoom(id) {
    return runInTransaction(async ({ roomsRepository }) => {
      const room = await roomsRepository.findById(id);
      if (!room) throw new NotFoundError("Room");
      return room;
    });
  }

  async function createRoom(input) {
    return runInTransaction(async ({ buildingsRepository, roomsRepository }) => {
      const building = await buildingsRepository.findById(input.buildingId);
      if (!building) throw new NotFoundError("Building");
      return roomsRepository.create(input);
    });
  }

  async function updateRoom(id, input) {
    return runInTransaction(async ({ roomsRepository }) => {
      const room = await roomsRepository.findById(id);
      if (!room) throw new NotFoundError("Room");
      return roomsRepository.update(id, input);
    });
  }

  async function deleteRoom(id) {
    return runInTransaction(async ({ roomsRepository }) => {
      const room = await roomsRepository.findById(id);
      if (!room) throw new NotFoundError("Room");
      await roomsRepository.delete(id);
    });
  }

  return { listRooms, getRoom, createRoom, updateRoom, deleteRoom };
}

module.exports = { createRoomsService };
