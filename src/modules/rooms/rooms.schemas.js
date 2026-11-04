const { z } = require("zod");

const idParams = z.object({
  id: z.coerce.number().int().positive()
});

const createRoomBody = z.object({
  buildingId: z.number().int().positive(),
  name: z.string().trim().min(1).max(50),
  capacity: z.number().int().positive()
}).strict();

const updateRoomBody = z.object({
  name: z.string().trim().min(1).max(50),
  capacity: z.number().int().positive()
}).partial().strict().refine((b) => Object.keys(b).length > 0, {
  message: "At least one field is required"
});

module.exports = { idParams, createRoomBody, updateRoomBody };
