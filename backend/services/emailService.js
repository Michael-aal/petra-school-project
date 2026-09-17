import nodemailer from "nodemailer";
import { Resend } from "resend";
import { prisma } from "../config/db.js";

const transportConfigAvailable = Boolean(process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_USER && process.env.SMTP_PASS);
const resendConfigAvailable = Boolean(process.env.RESEND_API_KEY && process.env.FROM_EMAIL);
const emailProviderAvailable = transportConfigAvailable || resendConfigAvailable;
const emailProvider = resendConfigAvailable ? "resend" : transportConfigAvailable ? "smtp" : "none";

let transporter = null;
if (transportConfigAvailable) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || "false") === "true",
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

const resend = resendConfigAvailable ? new Resend(process.env.RESEND_API_KEY) : null;
const EMAIL_ADDRESS_RE = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;

const normalizeEmailAddress = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return null;
  const namedMatch = raw.match(/^\s*(?:[^<>]+?)\s*<([^<>\s]+)>\s*$/);
  const address = (namedMatch ? namedMatch[1] : raw).trim().toLowerCase();
  return EMAIL_ADDRESS_RE.test(address) ? address : null;
};

const getAdmissionRecipients = (admission) => [...new Set([admission?.parentEmail, admission?.fatherEmail, admission?.motherEmail].map(normalizeEmailAddress).filter(Boolean))];
const getInvalidAdmissionRecipients = (admission) => [...new Set([admission?.parentEmail, admission?.fatherEmail, admission?.motherEmail].filter((value) => String(value || "").trim() && !normalizeEmailAddress(value)).map((value) => String(value).trim()))];

const getEmailRecipients = (admission) => {
  const parentRecipients = getAdmissionRecipients(admission);
  const testEmail = normalizeEmailAddress(process.env.TEST_EMAIL);
  const testMode = String(process.env.EMAIL_TEST_MODE || "false").trim().toLowerCase() === "true";
  if (testMode && testEmail) return { recipients: [testEmail], invalidRecipients: [] };
  return { recipients: parentRecipients, invalidRecipients: getInvalidAdmissionRecipients(admission) };
};

const sendEmailProvider = async ({ from, to, subject, html, text }) => {
  if (resend) {
    const { data, error } = await resend.emails.send({ from, to, subject, html, text });
    if (error) throw new Error(error.message || "Resend email delivery failed");
    return data;
  }
  if (!transporter) throw new Error("No email provider is configured");
  return transporter.sendMail({ from, to: to.join(", "), subject, html, text });
};

const safeHtml = (s) => String(s || "").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export const buildAdmissionPaymentUrl = (base = "") => {
  const normalizedBase = String(base || process.env.CLIENT_URL || "").replace(/\/$/, "");
  if (!normalizedBase) return "/payment";
  return `${normalizedBase}/payment`;
};

const getFromEmail = (school, fromEmail) => {
  const configured = String(fromEmail || process.env.FROM_EMAIL || "").trim();
  if (configured) return configured;
  if (resend) throw new Error("FROM_EMAIL is required when Resend is configured");
  const website = String(school?.website || "").trim().replace(/^https?:\/\//, "").split("/")[0];
  return website ? `no-reply@${website}` : "no-reply@example.com";
};

export const getEmailProviderStatus = () => ({ provider: emailProvider, configured: emailProviderAvailable, smtpConfigured: transportConfigAvailable, resendConfigured: resendConfigAvailable, fromEmailConfigured: Boolean(process.env.FROM_EMAIL) });

export const buildAdmissionEmailPayload = ({ school, studentName, admissionCode, paymentUrl, score, percentage }) => {
  const subject = `${school?.name || "School"}: Congratulations - ${studentName} has passed`;
  const scoreLine = `Score: ${score ?? "N/A"}`;
  const percentageLine = `Percentage: ${percentage ?? "N/A"}%`;
  const logo = school?.logo ? `<img src="${safeHtml(school.logo)}" alt="${safeHtml(school.name)}" style="max-height:56px;display:block;margin-bottom:16px"/>` : "";
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;color:#111;line-height:1.5">${logo}<p>Dear Parent/Guardian,</p><p>Your child/student has passed the admission examination.</p><p>Student: <strong>${safeHtml(studentName)}</strong></p><p>Result: <strong>PASSED</strong><br/>${safeHtml(scoreLine)}<br/>${safeHtml(percentageLine)}</p><p>Student Code: <strong>${safeHtml(admissionCode)}</strong></p><p>School-fee payment: <a href="${safeHtml(paymentUrl)}">Complete school-fee payment</a></p><p>Please use the payment link above and your Student Code to complete the next admission/enrollment step.</p><p>Kind regards,<br/>${safeHtml(school?.name || "Your School")}</p></div>`;
  const text = `Dear Parent/Guardian,\n\nYour child/student has passed the admission examination.\n\nStudent: ${studentName}\nResult: PASSED\n${scoreLine}\n${percentageLine}\nStudent Code: ${admissionCode}\nSchool-fee payment: ${paymentUrl}\n\nPlease use the payment link above and your Student Code to complete the next admission/enrollment step.\n\nKind regards,\n${school?.name || "Your School"}`;
  return { subject, html, text };
};

export const buildAdmissionFailureEmailPayload = ({ school, studentName, score, percentage }) => {
  const subject = `${school?.name || "School"}: Admission result for ${studentName}`;
  const scoreLine = `Score: ${score ?? "N/A"}`;
  const percentageLine = `Percentage: ${percentage ?? "N/A"}%`;
  const logo = school?.logo ? `<img src="${safeHtml(school.logo)}" alt="${safeHtml(school.name)}" style="max-height:56px;display:block;margin-bottom:16px"/>` : "";
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;color:#111;line-height:1.5">${logo}<p>Dear Parent/Guardian,</p><p>The admission examination result has been recorded.</p><p>Student: <strong>${safeHtml(studentName)}</strong></p><p>Result: <strong>FAILED</strong><br/>${safeHtml(scoreLine)}<br/>${safeHtml(percentageLine)}</p><p>Kind regards,<br/>${safeHtml(school?.name || "Your School")}</p></div>`;
  const text = `Dear Parent/Guardian,\n\nThe admission examination result has been recorded.\n\nStudent: ${studentName}\nResult: FAILED\n${scoreLine}\n${percentageLine}\n\nKind regards,\n${school?.name || "Your School"}`;
  return { subject, html, text };
};

const createEmailLog = async ({ school, admission, subject, text, sendTo, dedupeKey }) => {
  const schoolId = school?.id || admission?.schoolId || 1;
  const logData = {
    schoolId,
    recipient: sendTo.join(", "),
    subject,
    body: text,
    status: emailProviderAvailable ? "pending" : "skipped",
    dedupeKey: dedupeKey || null,
    attempts: 1,
    lastAttemptAt: new Date(),
  };

  if (!dedupeKey) {
    const log = await prisma.emailLog.create({ data: logData });
    return { log, deduped: false };
  }

  const existing = await prisma.emailLog.findUnique({ where: { dedupeKey } });
  if (existing) {
    if (existing.status === "sent" || existing.status === "pending") {
      return { log: existing, deduped: true };
    }
    const log = await prisma.emailLog.update({
      where: { id: existing.id },
      data: {
        recipient: sendTo.join(", "), subject, body: text,
        status: emailProviderAvailable ? "pending" : "skipped",
        attempts: { increment: 1 }, lastAttemptAt: new Date(), errorMessage: null,
      },
    });
    return { log, deduped: false };
  }

  try {
    const log = await prisma.emailLog.create({ data: logData });
    return { log, deduped: false };
  } catch (error) {
    if (error?.code !== "P2002") throw error;
    const raced = await prisma.emailLog.findUnique({ where: { dedupeKey } });
    if (raced) return { log: raced, deduped: true };
    throw error;
  }
};

const deliverAdmissionEmail = async ({ school, admission, subject, html, text, sendTo, fromEmail, dedupeKey }) => {
  const { log, deduped } = await createEmailLog({ school, admission, subject, text, sendTo, dedupeKey });
  if (deduped) return { success: true, reason: "deduped", log, provider: emailProvider };
  if (!emailProviderAvailable) return { success: false, reason: "no_email_provider", provider: emailProvider, providerStatus: getEmailProviderStatus(), log };
  try {
    const info = await sendEmailProvider({ from: getFromEmail(school, fromEmail), to: sendTo, subject, text, html });
    await prisma.emailLog.update({ where: { id: log.id }, data: { status: "sent", errorMessage: null } });
    return { success: true, info, log, provider: emailProvider };
  } catch (err) {
    const reason = String(err?.message || "Email delivery failed").slice(0, 2000);
    await prisma.emailLog.update({ where: { id: log.id }, data: { status: "failed", errorMessage: reason } });
    return { success: false, reason, error: err, log, provider: emailProvider, providerStatus: getEmailProviderStatus() };
  }
};

const recipientValidationFailure = ({ school, admission, subject, text, invalidRecipients, dedupeKey }) => ({ success: false, reason: "invalid_recipient", invalidRecipients, provider: emailProvider, schoolId: school?.id || admission?.schoolId || 1, subject, body: text, dedupeKey: dedupeKey || null });

export const sendAdmissionEmail = async ({ school, admission, studentName, admissionCode, paymentUrl, score, percentage, fromEmail, dedupeKey }) => {
  const { recipients, invalidRecipients } = getEmailRecipients(admission);
  const { subject, html, text } = buildAdmissionEmailPayload({ school, studentName, admissionCode, paymentUrl, score, percentage });
  if (!recipients.length) return recipientValidationFailure({ school, admission, subject, text, invalidRecipients, dedupeKey });
  return deliverAdmissionEmail({ school, admission, subject, html, text, sendTo: recipients, fromEmail, dedupeKey });
};

export const sendAdmissionFailureEmail = async ({ school, admission, studentName, score, percentage, fromEmail, dedupeKey }) => {
  const { recipients, invalidRecipients } = getEmailRecipients(admission);
  const { subject, html, text } = buildAdmissionFailureEmailPayload({ school, studentName, score, percentage });
  if (!recipients.length) return recipientValidationFailure({ school, admission, subject, text, invalidRecipients, dedupeKey });
  return deliverAdmissionEmail({ school, admission, subject, html, text, sendTo: recipients, fromEmail, dedupeKey });
};

export const buildTeacherApplicationDecisionEmailPayload = ({ school, applicantName, status, registrationCode, registrationPath }) => {
  const approved = String(status || "").toLowerCase() === "approved";
  const schoolName = school?.name || "the school";
  const safeName = applicantName || "Applicant";
  const subject = approved
    ? `Congratulations — Your Teacher Application Has Been Approved`
    : `Update on Your Teacher Application`;

  const nextStep = approved && registrationCode
    ? `<p>Your teacher registration code is <strong>${safeHtml(registrationCode)}</strong>.</p>${registrationPath ? `<p>Complete your teacher registration here: <a href="${safeHtml(registrationPath)}">Continue registration</a></p>` : ""}`
    : "";
  const nextStepText = approved && registrationCode
    ? `\nYour teacher registration code is: ${registrationCode}${registrationPath ? `\nComplete your teacher registration here: ${registrationPath}` : ""}\n`
    : "";

  const html = approved
    ? `<div style="font-family:Arial,Helvetica,sans-serif;color:#111;line-height:1.6"><p>Dear ${safeHtml(safeName)},</p><p><strong>Congratulations!</strong></p><p>We are pleased to let you know that your application to join <strong>${safeHtml(schoolName)}</strong> as a teacher has been approved.</p><p>Your application has successfully passed the school's review process.</p>${nextStep}<p>We look forward to welcoming you to ${safeHtml(schoolName)}.</p><p>Best regards,<br/>${safeHtml(schoolName)}<br/>Petra School Management</p></div>`
    : `<div style="font-family:Arial,Helvetica,sans-serif;color:#111;line-height:1.6"><p>Dear ${safeHtml(safeName)},</p><p>Thank you for taking the time to apply to <strong>${safeHtml(schoolName)}</strong>.</p><p>After reviewing your application, we regret to inform you that your application has not been approved at this time.</p><p>We appreciate your interest in joining our school and thank you for the time and effort you put into your application.</p><p>We wish you all the best in your future opportunities.</p><p>Best regards,<br/>${safeHtml(schoolName)}<br/>Petra School Management</p></div>`;

  const text = approved
    ? `Dear ${safeName},\n\nCongratulations!\n\nWe are pleased to let you know that your application to join ${schoolName} as a teacher has been approved.\n\nYour application has successfully passed the school's review process.\n${nextStepText}\nWe look forward to welcoming you to ${schoolName}.\n\nBest regards,\n${schoolName}\nPetra School Management`
    : `Dear ${safeName},\n\nThank you for taking the time to apply to ${schoolName}.\n\nAfter reviewing your application, we regret to inform you that your application has not been approved at this time.\n\nWe appreciate your interest in joining our school and thank you for the time and effort you put into your application.\n\nWe wish you all the best in your future opportunities.\n\nBest regards,\n${schoolName}\nPetra School Management`;

  return { subject, html, text };
};

export const sendTeacherApplicationDecisionEmail = async ({ school, application, status, registrationCode, registrationPath, fromEmail }) => {
  const recipient = normalizeEmailAddress(application?.email);
  const applicantName = [application?.firstName, application?.middleName, application?.lastName].filter(Boolean).join(" ").trim() || "Applicant";
  const payload = buildTeacherApplicationDecisionEmailPayload({ school, applicantName, status, registrationCode, registrationPath });
  const dedupeKey = `teacher-application:${application?.id}:${String(status).toLowerCase()}`;
  if (!recipient) return { success: false, reason: "invalid_recipient", invalidRecipients: application?.email ? [String(application.email)] : [], provider: emailProvider, dedupeKey };
  return deliverAdmissionEmail({
    school,
    admission: { schoolId: application?.schoolId },
    subject: payload.subject,
    html: payload.html,
    text: payload.text,
    sendTo: [recipient],
    fromEmail,
    dedupeKey,
  });
};

export default { buildAdmissionEmailPayload, buildAdmissionFailureEmailPayload, sendAdmissionEmail, sendAdmissionFailureEmail, buildTeacherApplicationDecisionEmailPayload, sendTeacherApplicationDecisionEmail, getEmailProviderStatus };
