-- RLS is only meaningful when the API connects as a non-owner role.
-- The production startup check enforces that deployment requirement.
ALTER TABLE "Student" FORCE ROW LEVEL SECURITY;
ALTER TABLE "Grade" FORCE ROW LEVEL SECURITY;
ALTER TABLE "StudentFee" FORCE ROW LEVEL SECURITY;
ALTER TABLE "Payment" FORCE ROW LEVEL SECURITY;
