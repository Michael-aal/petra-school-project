# Petra School Platform

Petra is a multi-tenant school operations platform for managing the daily academic, administrative, financial, and communication workflows of schools from one workspace.

The repository contains a React/Vite web application and an Express/Prisma API backed by PostgreSQL. The backend applies school-aware access controls across authenticated requests, while the frontend provides role-specific experiences for school leaders, staff, teachers, parents, students, and platform administrators.

## Product Areas

- **School operations:** school setup, classes, subjects, sessions, departments, staff, and school configuration
- **Students and admissions:** student records, enrollment, parent linking, applicant workflows, gate and admission-pass flows
- **Academics:** attendance, assessments, examinations, CBT workflows, results, report cards, timetables, and class management
- **Finance:** fees, invoices, payments, receipts, cash flow, discounts, extra fees, and payment settings
- **Petra Pay and wallets:** wallet balances, transaction history, statements, and Paystack payment integration
- **Communication:** announcements, direct messages, notifications, and support workflows
- **Integrations:** ClassMarker and payment-provider routes
- **AI foundation:** a permissioned Ask Nuvora architecture with structured data tools; the provider endpoint is currently disabled until deployment controls are configured

## Architecture

```mermaid
flowchart LR
	Browser[React + Vite web app] -->|HTTP/JSON| API[Express API]
	API --> Auth[JWT authentication]
	Auth --> Access[RBAC + resource authorization]
	Access --> Tenant[School tenant context]
	Tenant --> Services[Domain services]
	Services --> Prisma[Prisma data layer]
	Prisma --> PostgreSQL[(PostgreSQL)]
	API --> Payments[Paystack webhooks]
	API --> Integrations[ClassMarker]
```

### Repository layout

```text
.
├── backend/                 Express API, domain services, Prisma schema, and tests
│   ├── ai/                  AI context, tools, permissions, and orchestration
│   ├── config/              Environment loading and database setup
│   ├── controllers/         HTTP request handlers
│   ├── middleware/          Authentication and error handling
│   ├── models/              Data-access helpers
│   ├── prisma/              Schema, migrations, seed, and database utilities
│   ├── routes/              API route registration
│   ├── services/            Business logic by domain
│   ├── tests/               Node.js test suite
│   └── server.js            API entry point
├── Petra-Project/           React + Vite client application
│   └── src/
│       ├── Pages/            Public pages and role-based dashboard screens
│       ├── components/       Shared UI components
│       ├── context/          Client-side auth and user state
│       └── services/         API clients by domain
├── docs/                    Architecture and security notes
└── README.md
```

## Requirements

- Node.js 20 or newer recommended
- npm
- PostgreSQL 14 or newer
- A database that the backend can reach locally or over a private network

## Local Development

### 1. Install dependencies

From the repository root:

```bash
cd backend
npm install

cd ../Petra-Project
npm install
```

### 2. Configure the backend

Create `backend/.env`:

```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DBNAME?schema=public"
JWT_SECRET="replace-with-a-long-random-secret"
JWT_EXPIRES_IN="7d"
CLIENT_URL="http://localhost:5173"
```

Optional integrations may require additional variables. Inspect the relevant service before enabling Paystack, email, ClassMarker, QuizLab, or AI functionality. Never commit `.env` files or production credentials.

### 3. Prepare the database

```bash
cd backend
npx prisma generate
npx prisma migrate dev
```

Seed data is available through the configured Prisma seed command:

```bash
npm run db:seed
```

Use `npx prisma migrate deploy` in a deployment pipeline. Avoid `db:reset` against any shared or production database.

### 4. Start both applications

In terminal one:

```bash
cd backend
npm run dev
```

In terminal two:

```bash
cd Petra-Project
npm run dev
```

The web app is normally available at `http://localhost:5173` and the API at `http://localhost:5000`. The API health endpoint is:

```text
GET http://localhost:5000/health
```

For a deployed frontend, set `VITE_API_URL` to the public API base URL. When it is unset, the frontend API client defaults to `http://localhost:5000`.

## Backend Commands

Run these from `backend/`:

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the API with Nodemon |
| `npm start` | Start the API as a production process |
| `npm test` | Run the Node.js test suite |
| `npm run db:validate` | Validate the Prisma schema |
| `npm run db:generate` | Generate the Prisma client |
| `npm run db:migrate` | Create and apply a development migration |
| `npx prisma migrate deploy` | Apply committed migrations in deployment environments |
| `npm run db:seed` | Seed the configured database |

## Frontend Commands

Run these from `Petra-Project/`:

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Create a production build |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |

## API Domains

The API is mounted under `/api` and currently includes these domains:

| Prefix | Scope |
| --- | --- |
| `/api/auth` | Registration, login, profile, password, sessions, staff invitations, and parent linking |
| `/api/students` | Student records and student-facing operations |
| `/api/academic` | Sessions, classes, subjects, and academic setup |
| `/api/teacher` | Teacher workspace, attendance, classes, and assessments |
| `/api/assessments` | Assessment and CBT workflows |
| `/api/finance` | Fees, invoices, payments, receipts, and financial summaries |
| `/api/wallet` | Wallets and transactions |
| `/api/paystack` | Payment-provider webhook processing |
| `/api/parent` | Parent dashboard and linked children |
| `/api/enrollment` | Enrollment workflows |
| `/api/admissions` | Applicant and admission workflows |
| `/api/announcements` | School announcements |
| `/api/messages` | User messaging |
| `/api/schools` | School administration |
| `/api/admin` | School administrator operations |
| `/api/superadmin` | Platform-level school administration |
| `/api/classmarker` | ClassMarker integration |
| `/api/ai` | Ask Nuvora AI boundary and query endpoint |

Protected requests use `Authorization: Bearer <token>`. The API also supports a legacy `petra_token` cookie for compatibility. School-scoped requests are resolved from authenticated user context; clients should not treat a client-provided school ID as an authorization decision.

## Security and Tenant Model

- Passwords are hashed with bcrypt before persistence.
- JWT authentication resolves the current user before establishing request context.
- Roles include platform administration, principal, teacher/staff, parent/guardian, and student experiences.
- School-owned Prisma reads and writes are scoped through the active school context, with explicit resource checks for sensitive student and parent data.
- Parent and guardian access is restricted to linked children; students are restricted to their own records.
- Payment webhooks are handled separately from authenticated user routes and must be verified using provider signatures and production credentials.
- AI tools are structured, permissioned, and intended to return server-authoritative data rather than accept arbitrary database queries.

Read the implementation notes in [docs/AI_READINESS.md](docs/AI_READINESS.md), [backend/AUTH_REFACTOR.md](backend/AUTH_REFACTOR.md), and [docs/PARENT_CHILD_LINKING.md](docs/PARENT_CHILD_LINKING.md) before changing authentication, tenant context, parent access, or AI behavior.

## Testing

Run backend tests with:

```bash
cd backend
npm test
```

The suite covers authorization helpers, tenant context, role access, parent linking, staff invitations, and AI policy behavior. Before production launch, add integration coverage using at least two schools and verify that every role cannot read or mutate another school’s records.

For the frontend, run:

```bash
cd Petra-Project
npm run lint
npm run build
```

## Production Checklist

- Use a strong, randomly generated `JWT_SECRET`; do not rely on the development fallback.
- Set an explicit production `CLIENT_URL` and review CORS origins.
- Store database, payment, email, and integration credentials in a managed secret store.
- Apply migrations with `prisma migrate deploy` and back up PostgreSQL before releases.
- Configure TLS, reverse-proxy request limits, rate limiting, monitoring, log redaction, and alerting.
- Verify Paystack webhook signatures and make payment processing idempotent.
- Keep AI disabled until a reviewed provider integration, request limits, prompt/data policy, and tool-level authorization are in place.
- Test cross-tenant access, privilege boundaries, account recovery, webhook replay, and concurrent financial operations before launch.
- Review [FINAL_DATABASE_CHANGE_SUMMARY.md](FINAL_DATABASE_CHANGE_SUMMARY.md) when applying the current database changes.

## Project Status

Petra is under active development. The repository includes substantial operational functionality and a growing security model, but deployment-specific controls such as infrastructure hardening, production observability, rate limiting, and external-provider configuration must be completed and verified for each environment.

## License

No open-source license is currently declared for this repository. Treat the source as proprietary unless the project owners provide separate written terms.