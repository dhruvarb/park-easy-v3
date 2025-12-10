# ParkEasy Backend

Node.js + Express + PostgreSQL service powering the ParkEasy parking marketplace. Ships with JWT-based auth, admin + user flows, slot management, pricing configuration, and booking endpoints.

## Stack

- Node 20+
- Express 5
- PostgreSQL 14+ (any recent version works)
- `pg` for queries, `zod` for validation, `bcryptjs` for hashing, `jsonwebtoken` for access tokens

## Getting started

```bash
cd backend
cp env.example .env             # update credentials
npm install
npm run dev                     # starts nodemon on http://localhost:5000
```

## Environment

| Key | Description |
| --- | --- |
| `PORT` | HTTP port (default 5000) |
| `DATABASE_URL` | Postgres connection string |
| `DB_SSL` | Set to `true` if your DB requires SSL |
| `JWT_SECRET` | Secret for signing JWT access tokens |
| `TOKEN_TTL_HOURS` | Token lifetime window |

## Database schema

See `sql/schema.sql` for the baseline schema. Run it once in your Postgres instance. Helpful commands:

```sql
\c postgres;
CREATE DATABASE suprit;
\c suprit;
\i sql/schema.sql;
```

## Project structure

```
backend/
  src/
    config/db.js          # pg pool
    config/env.js         # env loader + helpers
    app.js                # express app wiring
    server.js             # bootstrap
    routes/               # HTTP routers
    controllers/          # business logic
    services/             # reusable DB helpers
    middleware/           # error handler, auth guard, etc.
    utils/                # shared helpers
```

## API surface (high level)

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/api/auth/signup` | Create user or admin (role auto detected) |
| `POST` | `/api/auth/login` | Authenticate user or admin |
| `GET` | `/api/user/slots` | Filter parking inventory by vehicle/duration/EV |
| `POST` | `/api/user/bookings` | Book a slot within a time range |
| `GET` | `/api/admin/parking-lots` | Admin list of owned lots + stats |
| `POST` | `/api/admin/parking-lots` | Register/update parking lot |
| `PATCH` | `/api/admin/parking-lots/:lotId/pricing` | Update pricing tiers |
| `GET` | `/api/admin/analytics/vehicle-mix` | Snapshot metrics for dashboard |

Each route expects/returns JSON. See individual controllers for payload details and validations.

## Testing

This starter does not include automated tests yet—add your preferred framework (Vitest, Jest, etc.) before shipping to production.

