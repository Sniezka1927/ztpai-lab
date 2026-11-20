# Room Booking API

API do rezerwacji sal (Express, PostgreSQL, Knex).

## Uruchomienie

```bash
git clone https://github.com/Sniezka1927/ztpai-lab.git
cd ztpai-lab
cp .env.example .env
docker compose up --build
```

- API: http://localhost:3000
- Swagger UI: http://localhost:3000/api/docs

Migracje wykonują się przy starcie kontenera `api`. Dane testowe z kontem ADMIN (`admin@example.com` / `admin-password-123`):

```bash
docker compose exec api npx knex seed:run
```

Zatrzymanie: `docker compose down` (dane zostają w volume `pgdata`, `docker compose down -v` je usuwa).

## Testy

Testy integracyjne używają osobnej bazy `roombooking_test` (domyślnie `localhost:5433`, można nadpisać przez `TEST_DATABASE_URL`).

```bash
docker compose exec db createdb -U postgres roombooking_test
npm ci
npm test
```

- `npm run test:unit` - unit testy service'ów, bez bazy danych
- `npm run test:integration` - testy API przez supertest
