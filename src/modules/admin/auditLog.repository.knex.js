function toEntry(row) {
  return {
    id: Number(row.id),
    eventType: row.event_type,
    payload: row.payload,
    createdAt: new Date(row.created_at).toISOString()
  };
}

function createAuditLogRepository(db) {
  return {
    async findPage({ eventType, page, limit }) {
      const base = db("audit_log").modify((qb) => {
        if (eventType) qb.where("event_type", eventType);
      });

      const [rows, { count }] = await Promise.all([
        base.clone()
          .select("*")
          .orderBy("created_at", "desc")
          .orderBy("id", "desc")
          .limit(limit)
          .offset((page - 1) * limit),
        base.clone().count({ count: "*" }).first()
      ]);

      return { items: rows.map(toEntry), total: Number(count) };
    }
  };
}

module.exports = { createAuditLogRepository };
