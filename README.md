# Full-Stack Job Importer Scaffold

This repository bootstraps a full-stack system for importing XML-based job feeds on a schedule, processing them through a Redis-backed queue, persisting them in MongoDB, and presenting import history via a Next.js admin UI.

## Project Layout

```
root/
├── client/          # Next.js admin UI (logs table, shared components)
├── server/          # Express API, BullMQ workers, cron jobs, services
├── docs/            # Architecture references and diagrams
├── .env.example     # Root template for required environment variables
└── README.md        # This file
```

Each sub-README dives deeper into client and server specifics.

## Prerequisites

- Node.js 18+
- MongoDB instance (local or Atlas)
- Redis instance (local, Docker, or managed)
- npm or yarn

> Tip: For local development, Docker Desktop plus a simple `docker compose` file for Mongo + Redis works well.

## Environment Configuration

1. Copy `.env.example` to `.env` and fill in the values.
2. Copy `server/.env.example` into `server/.env` if you prefer per-app overrides (optional).

Key settings:

- `MONGODB_URI` – connection string for MongoDB.
- `REDIS_URL` – Redis instance URI.
- `QUEUE_CONCURRENCY` – number of concurrent BullMQ workers.
- `NEXT_PUBLIC_API_URL` – base URL for the Express server, consumed by the Next.js client.
- `JOB_FEEDS` – comma-separated list of `Feed Name|https://feed-url` pairs.
- `CRON_EXPRESSION` – cron string for the hourly importer (defaults to `0 * * * *`).

## Getting Started

### Backend (Express + BullMQ)

```
cd server
npm install
npm run dev
```

This spins up the Express API, connects to Mongo + Redis, registers cron jobs, and boots the BullMQ worker.

### Frontend (Next.js)

```
cd client
npm install
npm run dev
```

Visit `http://localhost:3000` to view the admin dashboard, which will call `${NEXT_PUBLIC_API_URL}/api/import-logs`.

## Development Workflow

- Cron (`server/cron/jobFetcher.js`) fetches XML feeds hourly (configurable) and enqueues jobs.
- BullMQ worker (`server/queues/jobWorker.js`) upserts each job into MongoDB and updates import logs.
- The Express API (`server/routes/importLogs.js`) exposes import history.
- The Next.js UI queries the API and renders a filterable table for admins.

## Testing & Troubleshooting

- Use a REST client (Hoppscotch/Postman) to hit `GET /api/import-logs`.
- Tail the worker logs to confirm queue processing.
- Validate that ImportLog documents capture `total`, `newJobs`, `updatedJobs`, and failure reasons.

## Extensibility Ideas

- Add Docker Compose for MongoDB/Redis/services.
- Secure the admin UI + API with auth.
- Emit WebSocket events or server-sent events when new logs arrive.
- Split workers onto dedicated processes or containers for scale.

See `docs/architecture.md` for a deeper explanation of design decisions and flow diagrams.
