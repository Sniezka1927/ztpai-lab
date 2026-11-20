function registerNotificationListeners(eventBus, usersRepository) {
  eventBus.subscribe("reservation.cancelled", async ({ payload }) => {
    if (payload.cancelledBy === payload.userId) return;
    const canceller = await usersRepository.findById(payload.cancelledBy);
    if (canceller.role !== "ADMIN") return;

    const owner = await usersRepository.findById(payload.userId);
    console.log(`[notification] to: ${owner.email} - your reservation #${payload.reservationId} was cancelled by administrator`);
  });
}

module.exports = { registerNotificationListeners };
