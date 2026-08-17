# Nuvora

Petra is a modern school management platform that brings academic operations, finance, communication, and family engagement into one secure workspace. It gives school leaders and staff the tools to manage daily operations while giving parents a clear view of their children’s progress, fees, and school updates.

## What Nuvora does

- **School operations:** Set up schools, classes, subjects, timetables, staff, and students from a central dashboard.
- **Admissions and enrolment:** Capture applicant details, follow admissions progress, and manage student enrolment.
- **Academic management:** Record attendance, manage assessments, publish results and report cards, and support CBT workflows.
- **Finance and payments:** Create invoices and fee items, monitor cash flow and wallets, and accept online payments through Paystack.
- **Parent portal:** Give parents secure access to their children’s information, fees, receipts, academic updates, and announcements.
- **Communication:** Send announcements, messages, notifications, and parent-access links from one place.
- **Role-based access:** Provides tailored workspaces for super administrators, principals, administrators, teachers, students, and parents.

## Technology

| Area | Stack |
| --- | --- |
| Frontend | React, Vite, React Router, Tailwind CSS, Lucide |
| Backend | Node.js, Express, Prisma |
| Database | PostgreSQL |
| Authentication | JWT bearer tokens and role-based authorization |
| Payments | Paystack |

## Project structure

```text
petra-school-project/
├── Petra-Project/       # React frontend
│   ├── src/
│   └── .env.example
├── backend/             # Express API and Prisma schema
│   ├── prisma/
│   ├── routes/
│   ├── services/
│   └── .env.example
└── README.md
```

## Getting started

### Prerequisites

- Node.js 20 or later
- npm 10 or later
- A PostgreSQL database

### 1. Configure the backend

```bash
cd backend
npm install
cp .env.example .env
```

Update `backend/.env` with your database connection string and a strong JWT secret:

```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/petra_school?schema=public"
JWT_SECRET="replace-with-a-long-random-secret"
JWT_EXPIRES_IN="7d"
CLIENT_URL="http://localhost:5173"
```

Run the database migrations and start the API:

```bash
npm run db:migrate
npm run dev
```

The API health check is available at `http://localhost:5000/health`.

### 2. Configure the frontend

In a second terminal:

```bash
cd Petra-Project
npm install
cp .env.example .env
npm run dev
```

For local development, `Petra-Project/.env` should contain:

```env
VITE_API_URL=http://localhost:5000
```

Open the URL shown by Vite, usually `http://localhost:5173`.

## Environment configuration

The frontend must be built with the public URL of the API. `localhost` works only during local development; it must not be used in a deployed parent portal.

| Environment variable | Used by | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Backend | PostgreSQL connection string |
| `JWT_SECRET` | Backend | Secret used to sign authentication tokens |
| `CLIENT_URL` | Backend | Allowed frontend origin; multiple origins may be comma-separated |
| `VITE_API_URL` | Frontend | Public base URL of the Petra API |

Example production configuration:

```env
# Frontend build environment
VITE_API_URL=https://api.your-school-domain.com

# Backend environment
CLIENT_URL=https://app.your-school-domain.com
```

Rebuild and redeploy the frontend whenever `VITE_API_URL` changes.

## Verification

```bash
# Frontend production build
cd Petra-Project && npm run build

# Backend tests and schema validation
cd ../backend && npm test && npm run db:validate
```

## Security notes

- Never commit `.env` files, database credentials, JWT secrets, or payment keys.
- Use HTTPS and a strong, unique `JWT_SECRET` in production.
- Restrict `CLIENT_URL` to your approved frontend domains.
- Configure payment and webhook credentials only in the backend environment.

## License

This project is proprietary. All rights reserved.
