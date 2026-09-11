ALTER TABLE "Student" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Grade" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "StudentFee" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Payment" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS student_tenant_isolation ON "Student";
CREATE POLICY student_tenant_isolation ON "Student"
  USING ("schoolId" = NULLIF(current_setting('app.current_school_id', true), '')::integer)
  WITH CHECK ("schoolId" = NULLIF(current_setting('app.current_school_id', true), '')::integer);

DROP POLICY IF EXISTS grade_tenant_isolation ON "Grade";
CREATE POLICY grade_tenant_isolation ON "Grade"
  USING ("schoolId" = NULLIF(current_setting('app.current_school_id', true), '')::integer)
  WITH CHECK ("schoolId" = NULLIF(current_setting('app.current_school_id', true), '')::integer);

DROP POLICY IF EXISTS student_fee_tenant_isolation ON "StudentFee";
CREATE POLICY student_fee_tenant_isolation ON "StudentFee"
  USING ("schoolId" = NULLIF(current_setting('app.current_school_id', true), '')::integer)
  WITH CHECK ("schoolId" = NULLIF(current_setting('app.current_school_id', true), '')::integer);

DROP POLICY IF EXISTS payment_tenant_isolation ON "Payment";
CREATE POLICY payment_tenant_isolation ON "Payment"
  USING ("schoolId" = NULLIF(current_setting('app.current_school_id', true), '')::integer)
  WITH CHECK ("schoolId" = NULLIF(current_setting('app.current_school_id', true), '')::integer);
