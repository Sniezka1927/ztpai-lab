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

app.listen(config.PORT, () => console.log(`Server running on http://localhost:${config.PORT}`));
