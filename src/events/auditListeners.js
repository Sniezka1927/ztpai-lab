function registerAuditListeners(eventBus, db) {
  const save = async (event) => {
    await db("audit_log").insert({
      event_type: event.name,
      payload: event.payload,
      created_at: event.occurredAt
    });
  };

  eventBus.subscribe("reservation.created", save);
  eventBus.subscribe("reservation.cancelled", save);
}

module.exports = { registerAuditListeners };
