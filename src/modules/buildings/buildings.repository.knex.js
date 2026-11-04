function toBuilding(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    address: row.address,
    roomsCount: Number(row.rooms_count),
    createdAt: row.created_at
  };
}

function createBuildingsRepository(db) {
  const withRoomsCount = () =>
    db("buildings as b")
      .leftJoin("rooms as r", "r.building_id", "b.id")
      .select("b.*")
      .count({ rooms_count: "r.id" })
      .groupBy("b.id");

  return {
    async findAll() {
      const rows = await withRoomsCount().orderBy("b.id");
      return rows.map(toBuilding);
    },
    async findById(id) {
      return toBuilding(await withRoomsCount().where("b.id", id).first());
    },
    async create({ name, address }) {
      const [row] = await db("buildings").insert({ name, address }).returning("*");
      return toBuilding({ ...row, rooms_count: 0 });
    },
    async update(id, changes) {
      await db("buildings").where({ id }).update(changes);
      return this.findById(id);
    },
    async delete(id) {
      await db("buildings").where({ id }).del();
    }
  };
}

module.exports = { createBuildingsRepository };
