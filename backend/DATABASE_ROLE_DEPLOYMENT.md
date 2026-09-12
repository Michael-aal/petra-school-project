# Production database roles

Use two distinct PostgreSQL credentials in production:

1. A privileged migration credential, used only by `prisma migrate deploy`.
2. The `petra_app` runtime credential, used by the API and worker in `DATABASE_URL`.

Provision the runtime role once with `scripts/provision-app-role.sql`, using a database administrator connection and a strong password supplied through `psql -v app_password=...`. Configure `DATABASE_APP_ROLE=petra_app` alongside the runtime `DATABASE_URL`.

The server refuses to start in production when its runtime role is a superuser, owns protected tenant tables, or does not match `DATABASE_APP_ROLE`. Apply the `20260913090000_force_tenant_rls` migration using the migration credential before deploying the runtime role.
