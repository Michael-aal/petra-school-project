-- Run once as a PostgreSQL administrator, before deploying the application.
-- Example:
--   psql "$ADMIN_DATABASE_URL" -v app_password='generate-a-long-random-password' -f scripts/provision-app-role.sql
-- Do not run Prisma migrations with this role. Set DATABASE_URL to this role's
-- credential only for the running API and worker processes.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'petra_app') THEN
    EXECUTE format('CREATE ROLE petra_app LOGIN NOINHERIT PASSWORD %L', :'app_password');
  END IF;
END $$;

SELECT format('GRANT CONNECT ON DATABASE %I TO petra_app', current_database()) \gexec
GRANT USAGE ON SCHEMA public TO petra_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO petra_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO petra_app;

-- Run these default privileges as the role that owns the application tables.
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO petra_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO petra_app;
