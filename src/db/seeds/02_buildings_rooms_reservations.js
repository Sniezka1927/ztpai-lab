exports.seed = async function (knex) {
  await knex("buildings").insert([
    { name: "Budynek A", address: "ul. Warszawska 24, Kraków" },
    { name: "Budynek B", address: "ul. Podchorążych 2, Kraków" }
  ]);

  await knex("rooms").insert([
    { building_id: 1, name: "101", capacity: 30 },
    { building_id: 1, name: "102", capacity: 20 },
    { building_id: 1, name: "201", capacity: 50 },
    { building_id: 2, name: "101", capacity: 40 },
    { building_id: 2, name: "102", capacity: 10 }
  ]);

  await knex("reservations").insert([
    { room_id: 1, user_id: 2, participants: 20, start_time: "2026-11-10T10:00:00Z", end_time: "2026-11-10T12:00:00Z", status: "CONFIRMED", created_at: "2026-10-27T08:00:00Z" },
    { room_id: 2, user_id: 2, participants: 15, start_time: "2026-11-12T09:00:00Z", end_time: "2026-11-12T11:00:00Z", status: "CONFIRMED", created_at: "2026-10-28T08:00:00Z" },
    { room_id: 3, user_id: 3, participants: 40, start_time: "2026-11-14T12:00:00Z", end_time: "2026-11-14T14:00:00Z", status: "CANCELLED", cancelled_at: "2026-10-30T10:00:00Z", created_at: "2026-10-29T08:00:00Z" },
    { room_id: 4, user_id: 3, participants: 25, start_time: "2026-10-01T10:00:00Z", end_time: "2026-10-01T12:00:00Z", status: "CONFIRMED", created_at: "2026-09-20T08:00:00Z" },
    { room_id: 5, user_id: 3, participants: 8, start_time: "2026-11-20T08:00:00Z", end_time: "2026-11-20T09:30:00Z", status: "CONFIRMED", created_at: "2026-10-31T08:00:00Z" }
  ]);
};
