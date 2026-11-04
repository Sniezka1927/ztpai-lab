const { toRoomResponse } = require("./rooms.mapper");

function createRoomsController(roomsService) {
  return {
    async list(req, res) {
      const rooms = await roomsService.listRooms();
      res.json(rooms.map(toRoomResponse));
    },

    async getById(req, res) {
      const room = await roomsService.getRoom(req.validated.params.id);
      res.json(toRoomResponse(room));
    },

    async create(req, res) {
      const room = await roomsService.createRoom(req.validated.body);
      res.status(201).location(`/api/rooms/${room.id}`).json(toRoomResponse(room));
    },

    async update(req, res) {
      const room = await roomsService.updateRoom(req.validated.params.id, req.validated.body);
      res.json(toRoomResponse(room));
    },

    async remove(req, res) {
      await roomsService.deleteRoom(req.validated.params.id);
      res.status(204).end();
    }
  };
}

module.exports = { createRoomsController };
