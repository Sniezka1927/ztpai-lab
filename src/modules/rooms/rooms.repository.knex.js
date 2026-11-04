function toRoom(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    capacity: row.capacity,
    building: { id: row.building_id, name: row.building_name }
  };
}

function createRoomsRepository(db) {
  const withBuilding = () =>
    db("rooms as r")
      .join("buildings as b", "b.id", "r.building_id")
      .select("r.id", "r.name", "r.capacity", "r.building_id", "b.name as building_name");

  return {
    async findAll() {
      const rows = await withBuilding().orderBy("r.id");
      return rows.map(toRoom);
    },
    async findById(id) {
      return toRoom(await withBuilding().where("r.id", id).first());
    },
    async findByBuildingId(buildingId) {
      const rows = await withBuilding().where("r.building_id", buildingId).orderBy("r.id");
      return rows.map(toRoom);
    },
    async create({ buildingId, name, capacity }) {
      const [{ id }] = await db("rooms").insert({ building_id: buildingId, name, capacity }).returning("id");
      return toRoom(await withBuilding().where("r.id", id).first());
    },
    async update(id, changes) {
      await db("rooms").where({ id }).update(changes);
      return toRoom(await withBuilding().where("r.id", id).first());
    },
    async delete(id) {
      await db("rooms").where({ id }).del();
    },
    async lockById(id) {
      await db("rooms").where({ id }).forUpdate().first();
    }
  };
}

module.exports = { createRoomsRepository };
