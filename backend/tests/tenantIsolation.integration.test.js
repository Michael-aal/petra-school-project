import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { prisma, runWithSchoolContext, runWithoutSchoolContext } from "../config/db.js";

const enabled = Boolean(process.env.DATABASE_URL) && (process.env.RUN_INTEGRATION_TESTS === "true" || process.env.CI === "true");

test("two-school ID operations cannot cross tenant boundaries", {
  skip: enabled ? false : "Set RUN_INTEGRATION_TESTS=true (or CI=true) with DATABASE_URL to run the real database tenant proof.",
}, async () => {
  const suffix = crypto.randomBytes(6).toString("hex");
  let schools;
  try {
    schools = await runWithoutSchoolContext(async () => {
      const schoolA = await prisma.school.create({ data: { name: `Tenant A ${suffix}` } });
      const schoolB = await prisma.school.create({ data: { name: `Tenant B ${suffix}` } });
      schools = { schoolA, schoolB };
      const createSchoolFixture = (school, callback) => runWithSchoolContext(school.id, callback);
      const yearA = await createSchoolFixture(schoolA, () => prisma.academicYear.create({ data: { schoolId: schoolA.id, name: `Year A ${suffix}`, startsAt: new Date("2025-09-01"), endsAt: new Date("2026-07-31") } }));
      const yearB = await createSchoolFixture(schoolB, () => prisma.academicYear.create({ data: { schoolId: schoolB.id, name: `Year B ${suffix}`, startsAt: new Date("2025-09-01"), endsAt: new Date("2026-07-31") } }));
      const termA = await createSchoolFixture(schoolA, () => prisma.term.create({ data: { schoolId: schoolA.id, academicYearId: yearA.id, name: `Term A ${suffix}`, startsAt: new Date("2025-09-01"), endsAt: new Date("2025-12-31") } }));
      const termB = await createSchoolFixture(schoolB, () => prisma.term.create({ data: { schoolId: schoolB.id, academicYearId: yearB.id, name: `Term B ${suffix}`, startsAt: new Date("2025-09-01"), endsAt: new Date("2025-12-31") } }));
      const studentA = await createSchoolFixture(schoolA, () => prisma.student.create({ data: { schoolId: schoolA.id, name: "Student A" } }));
      const studentB = await createSchoolFixture(schoolB, () => prisma.student.create({ data: { schoolId: schoolB.id, name: "Student B" } }));
      const parentA = await createSchoolFixture(schoolA, () => prisma.parent.create({ data: { schoolId: schoolA.id, name: "Parent A" } }));
      const parentB = await createSchoolFixture(schoolB, () => prisma.parent.create({ data: { schoolId: schoolB.id, name: "Parent B" } }));
      const teacherA = await createSchoolFixture(schoolA, () => prisma.teacher.create({ data: { schoolId: schoolA.id } }));
      const teacherB = await createSchoolFixture(schoolB, () => prisma.teacher.create({ data: { schoolId: schoolB.id } }));
      const invoiceA = await createSchoolFixture(schoolA, () => prisma.invoice.create({ data: { schoolId: schoolA.id, studentId: studentA.id, academicYearId: yearA.id, termId: termA.id, invoiceNumber: `INV-A-${suffix}`, totalAmount: 100 } }));
      const invoiceB = await createSchoolFixture(schoolB, () => prisma.invoice.create({ data: { schoolId: schoolB.id, studentId: studentB.id, academicYearId: yearB.id, termId: termB.id, invoiceNumber: `INV-B-${suffix}`, totalAmount: 100 } }));
      const enrollmentA = await createSchoolFixture(schoolA, () => prisma.enrollment.create({ data: { schoolId: schoolA.id, studentId: studentA.id, academicYearId: yearA.id, termId: termA.id } }));
      const enrollmentB = await createSchoolFixture(schoolB, () => prisma.enrollment.create({ data: { schoolId: schoolB.id, studentId: studentB.id, academicYearId: yearB.id, termId: termB.id } }));
      return { ...schools, yearA, yearB, termA, termB, studentA, studentB, parentA, parentB, teacherA, teacherB, invoiceA, invoiceB, enrollmentA, enrollmentB };
    });

    const readFromA = async (model, id) => runWithSchoolContext(schools.schoolA.id, () => prisma[model].findUnique({ where: { id } }));
    assert.equal((await readFromA("student", schools.studentB.id)), null);
    assert.equal((await readFromA("invoice", schools.invoiceB.id)), null);
    assert.equal((await readFromA("enrollment", schools.enrollmentB.id)), null);
    assert.equal((await readFromA("teacher", schools.teacherB.id)), null);
    assert.equal((await readFromA("parent", schools.parentB.id)), null);

    await assert.rejects(
      () => runWithSchoolContext(schools.schoolA.id, () => prisma.student.update({ where: { id: schools.studentB.id }, data: { name: "Must remain B" } })),
      (error) => error?.code === "P2025" && error?.statusCode === 404,
    );

    await assert.rejects(
      () => runWithSchoolContext(schools.schoolA.id, () => prisma.student.delete({ where: { id: schools.studentB.id } })),
      (error) => error?.code === "P2025" && error?.statusCode === 404,
    );

    const crossSchoolUpsert = await runWithSchoolContext(schools.schoolA.id, () => prisma.student.upsert({
      where: { id: `upsert_${suffix}` },
      update: { name: "Must remain in A" },
      create: { id: `upsert_${suffix}`, schoolId: schools.schoolB.id, name: "Forced into A" },
    }));
    assert.equal(crossSchoolUpsert.schoolId, schools.schoolA.id);

    await runWithSchoolContext(schools.schoolB.id, async () => {
      const unchanged = await prisma.student.findUnique({ where: { id: schools.studentB.id } });
      assert.equal(unchanged.name, "Student B");
    });
    await runWithSchoolContext(schools.schoolA.id, () => prisma.student.delete({ where: { id: `upsert_${suffix}` } }));
  } finally {
    if (schools) {
      await runWithoutSchoolContext(() => prisma.school.deleteMany({ where: { id: { in: [schools.schoolA.id, schools.schoolB.id] } } })).catch(() => undefined);
    }
  }
});
