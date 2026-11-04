const bcrypt = require("bcryptjs");

exports.seed = async function (knex) {
  await knex.raw("TRUNCATE reservations, rooms, buildings, users RESTART IDENTITY CASCADE");

  await knex("users").insert([
    { email: "admin@example.com", password_hash: await bcrypt.hash("admin-password-123", 12), role: "ADMIN" },
    { email: "anna.nowak@example.com", password_hash: await bcrypt.hash("anna-password-123", 12), role: "USER" },
    { email: "piotr.zielinski@example.com", password_hash: await bcrypt.hash("piotr-password-123", 12), role: "USER" }
  ]);
};
