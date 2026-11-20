const { Router } = require("express");
const validate = require("../../middleware/validate");
const { auditLogQuery } = require("./admin.schemas");

function createAdminRouter({ runInTransaction }) {
  const router = Router();

  router.get("/audit-log", validate({ query: auditLogQuery }), async (req, res) => {
    const query = req.validated.query;
    const { items, total } = await runInTransaction(({ auditLogRepository }) => auditLogRepository.findPage(query));
    res.json({ data: items, meta: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) } });
  });

  return router;
}

module.exports = { createAdminRouter };
