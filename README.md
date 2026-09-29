# Hurriya Ride Backend

This is the backend API for the Hurriya Ride platform.

## Setup

The backend requires PostgreSQL. Create a local database named `hurriya_ride`, then set `DATABASE_URL` in `.env` to its connection URL. Do not reuse the old SQLite URL.

1. Install dependencies and generate Prisma Client:
   `npm ci`
   `npm run prisma:generate`
2. Apply the schema to the local development database:
   `npm run prisma:migrate:dev`
3. Seed local demo accounts and start the API:
   `npm run prisma:seed`
   `npm run dev`

For Render setup, migrations, and initial Admin provisioning, see the repository-level `DEPLOYMENT.md`.

## Available routes

- GET /
- GET /api/health
