const { z } = require("zod");

const auditLogQuery = z.object({
  eventType: z.string().min(1).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});

module.exports = { auditLogQuery };
