const SORT_COLUMNS = { startTime: "r.start_time", createdAt: "r.created_at", participants: "r.participants" };

function toReservation(row) {
  if (!row) return null;
  return {
    id: row.id,
    roomId: row.room_id,
    room: { id: row.room_id, name: row.room_name, building: { id: row.building_id, name: row.building_name } },
    userId: row.user_id,
    user: { id: row.user_id, email: row.user_email },
    participants: row.participants,
    startTime: row.start_time,
    endTime: row.end_time,
    status: row.status,
    createdAt: row.created_at,
    cancelledAt: row.cancelled_at
  };
}

function createReservationsRepository(db) {
  const withRoom = () =>
    db("reservations as r")
      .join("rooms as ro", "ro.id", "r.room_id")
      .join("buildings as b", "b.id", "ro.building_id")
      .join("users as u", "u.id", "r.user_id");

  const columns = ["r.*", "ro.name as room_name", "ro.building_id", "b.name as building_name", "u.email as user_email"];

  async function findById(id) {
    return toReservation(await withRoom().select(columns).where("r.id", id).first());
  }

  return {
    findById,
    async list({ roomId, status } = {}) {
      const rows = await withRoom().select(columns).modify((qb) => {
        if (roomId !== undefined) qb.where("r.room_id", roomId);
        if (status !== undefined) qb.where("r.status", status);
      });
      return rows.map(toReservation);
    },
    async findPage({ roomId, buildingId, userId, status, from, to, page, limit, sort }) {
      const base = withRoom().modify((qb) => {
        if (roomId) qb.where("r.room_id", roomId);
        if (buildingId) qb.where("ro.building_id", buildingId);
        if (userId) qb.where("r.user_id", userId);
        if (status) qb.where("r.status", status);
        if (to) qb.where("r.start_time", "<", to);
        if (from) qb.where("r.end_time", ">", from);
      });

      const desc = sort.startsWith("-");
      const column = SORT_COLUMNS[desc ? sort.slice(1) : sort];

      const [rows, { count }] = await Promise.all([
        base.clone()
          .select(columns)
          .orderBy(column, desc ? "desc" : "asc")
          .orderBy("r.id", "asc")
          .limit(limit)
          .offset((page - 1) * limit),
        base.clone().count({ count: "*" }).first()
      ]);

      return { items: rows.map(toReservation), total: Number(count) };
    },
    async create({ roomId, userId, participants, startTime, endTime, status }) {
      const [{ id }] = await db("reservations")
        .insert({ room_id: roomId, user_id: userId, participants, start_time: startTime, end_time: endTime, status })
        .returning("id");
      return findById(id);
    },
    async update(id, { status, cancelledAt }) {
      await db("reservations").where({ id }).update({ status, cancelled_at: cancelledAt });
      return findById(id);
    }
  };
}

module.exports = { createReservationsRepository };
