import { prisma, runWithSchoolContext } from "./config/db.js";
import { admissionService } from "./services/admissionService.js";
import { teacherService } from "./services/teacherService.js";

const run = async () => {
  // Pick the latest school-2 admission
  const target = await prisma.admission.findFirst({
    where: { schoolId: 2, status: "pending" },
    orderBy: { createdAt: "desc" },
  });
  if (!target) { console.log("NO_TARGET"); await prisma.$disconnect(); return; }

  const originalStatus = target.status;
  console.log("TARGET", target.id, "school", target.schoolId, "status", originalStatus);

  // Temporarily approve it (we restore afterwards)
  await prisma.admission.update({ where: { id: target.id }, data: { status: "approved", approvedAt: new Date(), approvedBy: "verification" } });

  // Replicate the Create Assessment applicant query for the school-2 principal
  const result = await runWithSchoolContext(2, () =>
    admissionService.list({ page: 1, limit: 200, status: "approved" }, { role: "principal", id: "verifier", schoolId: 2 })
  );
  const found = (result.admissions || []).some((a) => a.id === target.id);
  console.log("APPROVED_APPLICANT_VISIBLE_FOR_SCHOOL2", found);
  console.log("APPROVED_COUNT_SCHOOL2", (result.admissions || []).length);

  // Replicate the school-2 principal's assessment query (general school assessments)
  const assessments = await teacherService.listAssessments({ role: "principal", schoolId: 2 });
  console.log("SCHOOL2_ASSESSMENT_COUNT_AFTER_CLEANUP", assessments.length);

  // The same query for a DIFFERENT school must not leak the school-2 applicant
  const otherSchool = await runWithSchoolContext(3, () =>
    admissionService.list({ page: 1, limit: 200, status: "approved" }, { role: "principal", id: "verifier3", schoolId: 3 })
  );
  const leaked = (otherSchool.admissions || []).some((a) => a.id === target.id);
  console.log("SCHOOL3_CANNOT_SEE_SCHOOL2_APPLICANT", !leaked);

  // Restore original status
  await prisma.admission.update({ where: { id: target.id }, data: { status: originalStatus } });
  console.log("RESTORED", originalStatus);

  await prisma.$disconnect();
};

run().catch((err) => { console.error("VERIFY_ERROR", err.message); process.exit(1); });