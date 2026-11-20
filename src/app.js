const express = require("express");
const swaggerUi = require("swagger-ui-express");
const openapiDocument = require("./docs/openapi.json");
const requestLogger = require("./middleware/requestLogger");
const authenticate = require("./middleware/authenticate");
const authorize = require("./middleware/authorize");
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");
const { createBuildingsService } = require("./modules/buildings/buildings.service");
const { createBuildingsController } = require("./modules/buildings/buildings.controller");
const { createBuildingsRouter } = require("./modules/buildings/buildings.routes");
const { createRoomsService } = require("./modules/rooms/rooms.service");
const { createRoomsController } = require("./modules/rooms/rooms.controller");
const { createRoomsRouter } = require("./modules/rooms/rooms.routes");
const { createReservationsService } = require("./modules/reservations/reservations.service");
const { createReservationsController } = require("./modules/reservations/reservations.controller");
const { createReservationsRouter } = require("./modules/reservations/reservations.routes");
const { createAuthService } = require("./modules/auth/auth.service");
const { createAuthRouter } = require("./modules/auth/auth.routes");
const { createAdminRouter } = require("./modules/admin/admin.routes");
const { noopEventBus } = require("./events/eventBus");

function createApp({ config, runInTransaction, usersRepository, eventBus = noopEventBus }) {
  const app = express();

  app.use(requestLogger);
  app.use(express.json());

  const requireAuth = authenticate(config.JWT_SECRET);

  const authService = createAuthService({
    usersRepository,
    jwtSecret: config.JWT_SECRET,
    jwtExpiresIn: config.JWT_EXPIRES_IN
  });
  const buildingsService = createBuildingsService({ runInTransaction });
  const roomsService = createRoomsService({ runInTransaction });
  const reservationsService = createReservationsService({ runInTransaction, eventBus });

  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openapiDocument));
  app.use("/api/auth", createAuthRouter({ authService, usersRepository, authenticate: requireAuth }));
  app.use("/api/buildings", requireAuth, createBuildingsRouter(createBuildingsController(buildingsService)));
  app.use("/api/rooms", requireAuth, createRoomsRouter(createRoomsController(roomsService)));
  app.use("/api/reservations", requireAuth, createReservationsRouter(createReservationsController(reservationsService)));
  app.use("/api/admin", requireAuth, authorize("ADMIN"), createAdminRouter({ runInTransaction }));

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
