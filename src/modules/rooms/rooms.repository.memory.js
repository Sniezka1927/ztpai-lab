function createRoomsRepository(rooms = []) {
  return {
    async findAll() {
      return rooms;
    },
    async findById(id) {
      return rooms.find((room) => room.id === id) ?? null;
    },
    async lockById() {}
  };
}

module.exports = { createRoomsRepository };
