# Backend Authentication API

This backend uses Express and Prisma with PostgreSQL to provide a production-ready authentication flow.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Set the required environment variables in `.env`:

```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DBNAME?schema=public&connection_limit=15&pool_timeout=30"
JWT_PRIVATE_KEY="base64-encoded-RSA-4096-private-key"
JWT_PUBLIC_KEY="base64-encoded-RSA-4096-public-key"
ORIGIN_SECRET="replace-with-edge-origin-secret"
CLIENT_URL="http://localhost:3000"
```

3. Run Prisma migrations:

```bash
npx prisma migrate dev
```

4. Start the server:

```bash
npm run dev
```

## Auth Routes

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`

## Notes

- JWT is sent in the `Authorization: Bearer <token>` header for protected routes.
- Passwords are hashed with bcrypt before storage.
- The logout endpoint is structured for future token or cookie invalidation support.

## Load testing

The load harness is read-only and refuses production targets. Create a temporary JSON file outside version control containing at least two non-production tenant tokens:

```json
[
	{ "schoolId": 1, "token": "..." },
	{ "schoolId": 2, "token": "..." }
]
```

Run it with explicit safety confirmation:

```powershell
$env:LOAD_TEST_BASE_URL = "http://localhost:5000"
$env:LOAD_TEST_CONFIRM = "I_UNDERSTAND_NON_PRODUCTION"
$env:LOAD_TEST_TOKENS_FILE = "tmp/load-test-tokens.json"
$env:LOAD_TEST_ORIGIN_SECRET = "development-edge-secret"
$env:LOAD_TEST_PATHS = "/api/students?limit=20,/api/finance/invoices,/api/academic/classes"
$env:LOAD_TEST_REQUESTS = "20"
$env:LOAD_TEST_CONCURRENCY = "10"
npm run test:load
```

The output reports throughput, error rate, p50/p95/p99 latency, and detected foreign `schoolId` values. The harness does not create or mutate business data; payment, invoice creation, webhook, and report-generation stress tests require dedicated disposable fixtures and are not represented by the read-only default scenario.
