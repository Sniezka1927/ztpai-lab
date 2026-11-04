const { z } = require("zod");

const idParams = z.object({
  id: z.coerce.number().int().positive()
});

const createBuildingBody = z.object({
  name: z.string().trim().min(1).max(120),
  address: z.string().trim().min(3).max(200)
}).strict();

const updateBuildingBody = createBuildingBody.partial().refine((b) => Object.keys(b).length > 0, {
  message: "At least one field is required"
});

module.exports = { idParams, createBuildingBody, updateBuildingBody };
