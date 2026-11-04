const bcrypt = require("bcryptjs");
const { randomBytes } = require("node:crypto");

const toEmail = (name) => name.trim().toLowerCase().replace(/\s+/g, ".") + "@example.com";

exports.up = async function (knex) {
  await knex.schema.alterTable("reservations", (table) => {
    table.integer("user_id").references("id").inTable("users").onDelete("RESTRICT");
  });

  const names = await knex("reservations").distinct("reserved_by").pluck("reserved_by");
  for (const name of names) {
    const passwordHash = await bcrypt.hash(randomBytes(32).toString("hex"), 12);
    await knex("users").insert({ email: toEmail(name), password_hash: passwordHash, role: "USER" }).onConflict("email").ignore();
  }

  for (const name of names) {
    await knex("reservations")
      .where({ reserved_by: name })
      .update({ user_id: knex("users").select("id").where({ email: toEmail(name) }) });
  }

  await knex.schema.alterTable("reservations", (table) => {
    table.integer("user_id").notNullable().alter();
    table.dropColumn("reserved_by");
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable("reservations", (table) => {
    table.string("reserved_by", 100);
  });
  await knex.raw("UPDATE reservations r SET reserved_by = u.email FROM users u WHERE u.id = r.user_id");
  await knex.schema.alterTable("reservations", (table) => {
    table.string("reserved_by", 100).notNullable().alter();
    table.dropColumn("user_id");
  });
};
