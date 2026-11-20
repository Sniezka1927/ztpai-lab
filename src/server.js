const config = require("./config");
const db = require("./db/knex");
const { createApp } = require("./app");
const { createKnexUnitOfWork } = require("./db/knexUnitOfWork");
const { createUsersRepository } = require("./modules/auth/users.repository.knex");

const app = createApp({
  config,
  runInTransaction: createKnexUnitOfWork(db).runInTransaction,
  usersRepository: createUsersRepository(db)
});

const server = app.listen(config.PORT, () => console.log(`Server running on http://localhost:${config.PORT}`));

async function shutdown(signal) {
  console.log(`${signal} received, shutting down`);
  server.close(async () => {
    await db.destroy();
    console.log("Server closed, database pool destroyed");
    process.exit(0);
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
