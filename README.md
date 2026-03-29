# IE213 Backend API

Backend service for the IE213 Blog System, built with Node.js, Express, TypeScript, and MongoDB.

## Overview

This service provides versioned REST APIs under `/v1/api` for:

- Authentication (register, login, refresh token, logout)
- User profile management
- Posts, categories, and tags
- Comments and notifications
- Admin operations and statistics

## Tech Stack

- Node.js + Express 5
- TypeScript (ESM)
- MongoDB + Mongoose
- Redis
- RabbitMQ
- Jest + Supertest
- Docker Compose (local infrastructure)

## Prerequisites

- Node.js 18+
- npm 9+
- Docker Desktop (for MongoDB/Redis/RabbitMQ)

## Project Structure

```text
Backend-IE213/
  src/
    app.ts
    routes/
    controllers/
    services/
    models/
    middleware/
    auth/
  server.ts
  docker-compose.yml
  package.json
```

## Quick Start

1. Install dependencies

```bash
npm install
```

2. Start local infrastructure

```bash
docker-compose up -d
```

3. Configure environment variables (create `.env`)

```env
# App
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
PORT=5001

# MongoDB
MONGO_HOST=localhost
MONGO_PORT=27017
MONGO_DB=IE213
# or use URI directly
MONGODB_URI=mongodb://localhost:27017/IE213

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# RabbitMQ
RABBITMQ_HOST=localhost
RABBITMQ_PORT=5672
RABBITMQ_USER=guest
RABBITMQ_PASS=guest
```

4. Run in development mode

```bash
npm run dev
```

Default server URL: `http://localhost:5001`

## Scripts

- `npm run dev`: Start development server with watch mode
- `npm run build`: Compile TypeScript to `dist/`
- `npm start`: Run compiled server from `dist/server.js`
- `npm test`: Run tests
- `npm run test:coverage`: Generate coverage report
- `npm run test:watch`: Run tests in watch mode
- `npm run test:e2e`: Run e2e test script
- `npm run test:quick`: Run quick smoke test script
- `npm run test:performance`: Run performance test script

## API Base Path

All endpoints are exposed under:

- `/v1/api`

Examples:

- `POST /v1/api/register`
- `POST /v1/api/login`
- `POST /v1/api/refresh-token`
- `POST /v1/api/logout`
- `GET /v1/api/posts`

## Response Format

Successful responses follow a common shape:

```json
{
  "message": "...",
  "status": 200,
  "metadata": {}
}
```

Error responses include status and message:

```json
{
  "status": 400,
  "message": "..."
}
```

## Notes

- Keep API paths in the format `/v1/api/...`.
- For protected routes, send:
  - `Authorization: Bearer <access_token>`
  - `x-client-id: <user_id>`
- Do not commit real secrets in `.env`.
