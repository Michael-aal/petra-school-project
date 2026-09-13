-- Principal registration happens before an authenticated school context exists.
-- The tenant_isolation policy correctly blocks inserts when app.current_school_id
-- is unset, but public principal registration creates the User and Principal in
-- the same transaction. Allow only a Principal row whose user owns the same
-- school and has the principal role.
--
-- This keeps RLS enabled and does not grant blanket INSERT access.

DROP POLICY IF EXISTS principal_registration ON public."Principal";

CREATE POLICY principal_registration
ON public."Principal"
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public."User" u
    WHERE u."id" = "Principal"."userId"
      AND u."schoolId" = "Principal"."schoolId"
      AND lower(u."role") = 'principal'
  )
);
