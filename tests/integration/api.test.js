const request = require("supertest");
const config = require("../../src/config");
const db = require("../../src/db/knex");
const { createApp } = require("../../src/app");
const { createKnexUnitOfWork } = require("../../src/db/knexUnitOfWork");
const { createUsersRepository } = require("../../src/modules/auth/users.repository.knex");

const app = createApp({
  config,
  runInTransaction: createKnexUnitOfWork(db).runInTransaction,
  usersRepository: createUsersRepository(db)
});

const PASSWORD = "password-123";

async function registerAndLogin(email, role = "USER") {
  await request(app).post("/api/auth/register").send({ email, password: PASSWORD }).expect(201);
  if (role === "ADMIN") await db("users").where({ email }).update({ role });
  const res = await request(app).post("/api/auth/login").send({ email, password: PASSWORD }).expect(200);
  return res.body.accessToken;
}

const booking = (start, end, extra = {}) => ({
  roomId: 1,
  participants: 5,
  startTime: `2030-01-10T${start}:00Z`,
  endTime: `2030-01-10T${end}:00Z`,
  ...extra
});

function reserve(token, body) {
  return request(app).post("/api/reservations").set("Authorization", `Bearer ${token}`).send(body);
}

beforeAll(async () => {
  await db.migrate.latest();
});

beforeEach(async () => {
  await db.raw("TRUNCATE audit_log, reservations, rooms, buildings, users RESTART IDENTITY CASCADE");
  await db("buildings").insert({ name: "Budynek A", address: "ul. Warszawska 24, Kraków" });
  await db("rooms").insert([
    { building_id: 1, name: "101", capacity: 30 },
    { building_id: 1, name: "102", capacity: 10 }
  ]);
});

afterAll(async () => {
  await db.destroy();
});

describe("Room Booking API", () => {
  test("register + login + GET /api/auth/me", async () => {
    const token = await registerAndLogin("jan@example.com");

    const res = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ email: "jan@example.com", role: "USER" });
  });

  test("POST /api/reservations creates reservation and persists it", async () => {
    const token = await registerAndLogin("jan@example.com");

    const res = await reserve(token, booking("10:00", "12:00"));

    expect(res.status).toBe(201);
    expect(res.headers.location).toBe(`/api/reservations/${res.body.id}`);
    const row = await db("reservations").where({ id: res.body.id }).first();
    expect(row).toMatchObject({ room_id: 1, participants: 5, status: "CONFIRMED" });
  });

  test("400 with details for invalid body", async () => {
    const token = await registerAndLogin("jan@example.com");

    const res = await reserve(token, { roomId: "abc", participants: 5, startTime: "jutro" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(res.body.error.details).toEqual(expect.arrayContaining([
      expect.objectContaining({ location: "body", field: "roomId" }),
      expect.objectContaining({ location: "body", field: "startTime" }),
      expect.objectContaining({ location: "body", field: "endTime" })
    ]));
  });

  test("401 without token", async () => {
    const res = await request(app).get("/api/reservations");

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  test("403 when USER creates a room", async () => {
    const token = await registerAndLogin("jan@example.com");

    const res = await request(app)
      .post("/api/rooms")
      .set("Authorization", `Bearer ${token}`)
      .send({ buildingId: 1, name: "301", capacity: 15 });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
  });

  test("404 when USER gets someone else's reservation", async () => {
    const janToken = await registerAndLogin("jan@example.com");
    const annaToken = await registerAndLogin("anna@example.com");
    const { body: created } = await reserve(janToken, booking("10:00", "12:00")).expect(201);

    const res = await request(app).get(`/api/reservations/${created.id}`).set("Authorization", `Bearer ${annaToken}`);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });

  test("409 ROOM_ALREADY_BOOKED for overlapping reservation", async () => {
    const janToken = await registerAndLogin("jan@example.com");
    const annaToken = await registerAndLogin("anna@example.com");
    await reserve(janToken, booking("10:00", "12:00")).expect(201);

    const res = await reserve(annaToken, booking("11:00", "13:00"));

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("ROOM_ALREADY_BOOKED");
    expect(await db("reservations").count({ count: "*" }).first()).toEqual({ count: "1" });
  });

  test("pagination returns meta.total and limited data", async () => {
    const token = await registerAndLogin("jan@example.com");
    await reserve(token, booking("08:00", "09:00")).expect(201);
    await reserve(token, booking("10:00", "11:00")).expect(201);
    await reserve(token, booking("12:00", "13:00")).expect(201);

    const res = await request(app).get("/api/reservations?limit=2&page=1").set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.meta).toMatchObject({ page: 1, limit: 2, total: 3, totalPages: 2 });
  });
});
