function toRoomResponse(room) {
  return {
    id: room.id,
    name: room.name,
    capacity: room.capacity,
    building: room.building
  };
}

module.exports = { toRoomResponse };
