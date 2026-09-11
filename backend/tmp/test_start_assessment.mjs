import '../config/loadEnv.js';
import { prisma } from '../config/db.js';
import * as quizlabService from '../services/quizlabService.js';
import { startAssessmentForApplicant } from '../controllers/classMarkerController.js';

async function run() {
  try {
    // Find the most recent admission we created in tests
    const rows = await prisma.$queryRawUnsafe('SELECT * FROM "Admission" ORDER BY "createdAt" DESC LIMIT 1');
    const admission = Array.isArray(rows) ? rows[0] : rows;
    if (!admission) throw new Error('No admission rows found');
    const applicantId = admission.applicantId || (admission.remarks && JSON.parse(admission.remarks).applicantId);
    const examRef = admission.examReference || (admission.remarks && JSON.parse(admission.remarks).examReference);
    if (!applicantId) throw new Error('Admission has no applicantId');
    if (!examRef) throw new Error('Admission has no examReference to map to assessment id');

    // Ensure an Assessment exists with id = examRef (auto-create step should have created it)
    const assessment = await prisma.assessment.findUnique({ where: { id: examRef } });
    if (!assessment) {
      console.log('No assessment found for examRef, creating a minimal one');
      await prisma.assessment.create({ data: { id: examRef, teacherId: `sys_teacher_${admission.schoolId}`, title: 'AutoTest', subject: 'Admission', className: 'Admission', maxScore: 100, date: new Date(), schoolId: admission.schoolId } });
    }

    // Use examRef as the quiz id (integration table may not exist in this DB snapshot)
    const quizId = examRef;

    // Local mocked QuizLab helpers (do not call external network)
    const listInvitations = async (quizId, opts = {}) => ({ invitations: [] });
    const createInvitation = async (quizId, candidate) => ({ launchUrl: `https://quizlab.fake/launch/${quizId}/${candidate.reference}` });

    // Try to reuse existing invitation
    const list = await listInvitations(quizId, { reference: applicantId }).catch(() => ({ invitations: [] }));
    const items = Array.isArray(list) ? list : (list?.invitations || []);
    let inv = items && items.length ? items[0] : null;
    if (!inv) {
      inv = await createInvitation(quizId, { reference: applicantId, email: admission.parentEmail || null, name: admission.applicantName || null });
    }
    console.log('Simulated launch URL:', inv.launchUrl || inv.url);
  } catch (err) {
    console.error('Test failed:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

run();
