-- RLS is only meaningful when the API connects as a non-owner role.
-- Force RLS only for tables that exist in this database state. Some historical
-- databases intentionally omit legacy/optional models (for example Grade).
DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['Student', 'Grade', 'StudentFee', 'Payment'] LOOP
    IF to_regclass(format('public.%I', table_name)) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', table_name);
    END IF;
  END LOOP;
END $$;
