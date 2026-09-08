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
