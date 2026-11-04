const { Router } = require("express");
const validate = require("../../middleware/validate");
const { NotFoundError } = require("../../errors/AppError");
const { registerBody, loginBody } = require("./auth.schemas");

const toUserResponse = (u) => ({ id: u.id, email: u.email, role: u.role, createdAt: new Date(u.createdAt).toISOString() });

function createAuthRouter({ authService, usersRepository, authenticate }) {
  const router = Router();

  router.post("/register", validate({ body: registerBody }), async (req, res) => {
    const user = await authService.register(req.validated.body);
    res.status(201).json(toUserResponse(user));
  });

  router.post("/login", validate({ body: loginBody }), async (req, res) => {
    res.json(await authService.login(req.validated.body));
  });

  router.get("/me", authenticate, async (req, res) => {
    const user = await usersRepository.findById(req.user.id);
    if (!user) throw new NotFoundError("User");
    res.json(toUserResponse(user));
  });

  return router;
}

module.exports = { createAuthRouter };
