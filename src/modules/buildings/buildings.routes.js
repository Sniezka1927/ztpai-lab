const { Router } = require("express");
const validate = require("../../middleware/validate");
const authorize = require("../../middleware/authorize");
const { idParams, createBuildingBody, updateBuildingBody } = require("./buildings.schemas");

function createBuildingsRouter(controller) {
  const router = Router();

  router.get("/", controller.list);
  router.get("/:id", validate({ params: idParams }), controller.getById);
  router.get("/:id/rooms", validate({ params: idParams }), controller.listRooms);
  router.post("/", authorize("ADMIN"), validate({ body: createBuildingBody }), controller.create);
  router.patch("/:id", authorize("ADMIN"), validate({ params: idParams, body: updateBuildingBody }), controller.update);
  router.delete("/:id", authorize("ADMIN"), validate({ params: idParams }), controller.remove);

  return router;
}

module.exports = { createBuildingsRouter };
