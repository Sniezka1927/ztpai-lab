const { NotFoundError } = require("../../errors/AppError");

function createBuildingsService({ runInTransaction }) {
  async function listBuildings() {
    return runInTransaction(({ buildingsRepository }) => buildingsRepository.findAll());
  }

  async function getBuilding(id) {
    return runInTransaction(async ({ buildingsRepository }) => {
      const building = await buildingsRepository.findById(id);
      if (!building) throw new NotFoundError("Building");
      return building;
    });
  }

  async function listBuildingRooms(id) {
    return runInTransaction(async ({ buildingsRepository, roomsRepository }) => {
      const building = await buildingsRepository.findById(id);
      if (!building) throw new NotFoundError("Building");
      return roomsRepository.findByBuildingId(id);
    });
  }

  async function createBuilding(input) {
    return runInTransaction(({ buildingsRepository }) => buildingsRepository.create(input));
  }

  async function updateBuilding(id, input) {
    return runInTransaction(async ({ buildingsRepository }) => {
      const building = await buildingsRepository.findById(id);
      if (!building) throw new NotFoundError("Building");
      return buildingsRepository.update(id, input);
    });
  }

  async function deleteBuilding(id) {
    return runInTransaction(async ({ buildingsRepository }) => {
      const building = await buildingsRepository.findById(id);
      if (!building) throw new NotFoundError("Building");
      await buildingsRepository.delete(id);
    });
  }

  return { listBuildings, getBuilding, listBuildingRooms, createBuilding, updateBuilding, deleteBuilding };
}

module.exports = { createBuildingsService };
