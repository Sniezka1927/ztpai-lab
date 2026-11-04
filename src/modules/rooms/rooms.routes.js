const { Router } = require("express");
const validate = require("../../middleware/validate");
const authorize = require("../../middleware/authorize");
const { idParams, createRoomBody, updateRoomBody } = require("./rooms.schemas");

function createRoomsRouter(controller) {
  const router = Router();

  router.get("/", controller.list);
  router.get("/:id", validate({ params: idParams }), controller.getById);
  router.post("/", authorize("ADMIN"), validate({ body: createRoomBody }), controller.create);
  router.patch("/:id", authorize("ADMIN"), validate({ params: idParams, body: updateRoomBody }), controller.update);
  router.delete("/:id", authorize("ADMIN"), validate({ params: idParams }), controller.remove);

  return router;
}

module.exports = { createRoomsRouter };
