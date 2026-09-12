import nodemailer from "nodemailer";
import { Resend } from "resend";
import { prisma } from "../config/db.js";

const transportConfigAvailable = Boolean(process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_USER && process.env.SMTP_PASS);
const resendConfigAvailable = Boolean(process.env.RESEND_API_KEY && process.env.FROM_EMAIL);
const emailProviderAvailable = transportConfigAvailable || resendConfigAvailable;

let transporter = null;
if (transportConfigAvailable) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || "false") === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

const resend = resendConfigAvailable ? new Resend(process.env.RESEND_API_KEY) : null;

const sendEmailProvider = async ({ from, to, subject, html, text }) => {
  if (resend) {
    const { data, error } = await resend.emails.send({ from, to, subject, html, text });
    if (error) throw new Error(error.message || "Resend email delivery failed");
    return data;
  }

  if (!transporter) {
    throw new Error("No email provider is configured");
  }

  return transporter.sendMail({ from, to, subject, html, text });
};

const safeHtml = (s) => String(s || "").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export const buildAdmissionPaymentUrl = (base = "") => {
  const normalizedBase = String(base || process.env.CLIENT_URL || "").replace(/\/$/, "");
  if (!normalizedBase) return "/payment";
  return `${normalizedBase}/payment`;
};

const getAdmissionRecipients = (admission) =>
  [...new Set([
    admission?.parentEmail,
    admission?.fatherEmail,
    admission?.motherEmail,
  ].filter(Boolean).map((value) => String(value).trim().toLowerCase()))];

const getEmailRecipients = (admission) => {
  const parentRecipients = getAdmissionRecipients(admission);
  const testEmail = String(process.env.TEST_EMAIL || "").trim().toLowerCase();

  if (["development", "test"].includes(process.env.NODE_ENV) && testEmail) {
    return [testEmail];
  }

  return parentRecipients;
};

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

export const sendAdmissionEmail = async ({
  school,
  admission,
  studentName,
  admissionCode,
  paymentUrl,
  score,
  percentage,
  fromEmail,
  dedupeKey,
}) => {
  const recipients = getEmailRecipients(admission);

  if (!recipients.length) {
    return { success: false, reason: "no_recipient" };
  }

  const { subject, html, text } = buildAdmissionEmailPayload({ school, studentName, admissionCode, paymentUrl, score, percentage });
  const sendTo = recipients.join(", ");
  const logData = {
    schoolId: school?.id || 1,
    recipient: sendTo,
    subject,
    body: text,
    status: emailProviderAvailable ? "pending" : "skipped",
    dedupeKey: dedupeKey || null,
    attempts: 1,
    lastAttemptAt: new Date(),
  };

  if (dedupeKey) {
    const existing = await prisma.emailLog.findUnique({
      where: { dedupeKey },
    });

    if (existing?.status === "sent") {
      return { success: true, reason: "deduped", log: existing };
    }

    if (existing) {
      await prisma.emailLog.update({
        where: { id: existing.id },
        data: {
          recipient: sendTo,
          subject,
          body: text,
          status: emailProviderAvailable ? "pending" : "skipped",
          attempts: { increment: 1 },
          lastAttemptAt: new Date(),
          errorMessage: null,
        },
      });
    } else {
      await prisma.emailLog.create({ data: logData });
    }
  } else {
    await prisma.emailLog.create({ data: logData });
  }

  const log = dedupeKey
    ? await prisma.emailLog.findUnique({ where: { dedupeKey } })
    : await prisma.emailLog.findFirst({
        where: {
          schoolId: school?.id || 1,
          recipient: sendTo,
          subject,
          createdAt: {
            gte: new Date(Date.now() - 5 * 60 * 1000),
          },
        },
        orderBy: { createdAt: "desc" },
      });

  if (!emailProviderAvailable) {
    return { success: false, reason: "no_email_provider", log };
  }

  try {
    const info = await sendEmailProvider({
      from: fromEmail || process.env.FROM_EMAIL || `no-reply@${(school?.website || "example.com").replace(/^https?:\/\//, "")}`,
      to: sendTo,
      subject,
      text,
      html,
    });

    await prisma.emailLog.update({
      where: { id: log.id },
      data: { status: "sent", errorMessage: null },
    });

    return { success: true, info, log };
  } catch (err) {
    await prisma.emailLog.update({
      where: { id: log.id },
      data: { status: "failed", errorMessage: String(err?.message || "Email delivery failed").slice(0, 2000) },
    });

    return { success: false, reason: err.message, error: err, log };
  }
};

export const sendAdmissionFailureEmail = async ({
  school,
  admission,
  studentName,
  score,
  percentage,
  fromEmail,
  dedupeKey,
}) => {
  const recipients = getEmailRecipients(admission);

  if (!recipients.length) {
    return { success: false, reason: "no_recipient" };
  }

  const { subject, html, text } = buildAdmissionFailureEmailPayload({ school, studentName, score, percentage });
  const sendTo = recipients.join(", ");
  const logData = {
    schoolId: school?.id || 1,
    recipient: sendTo,
    subject,
    body: text,
    status: emailProviderAvailable ? "pending" : "skipped",
    dedupeKey: dedupeKey || null,
    attempts: 1,
    lastAttemptAt: new Date(),
  };

  if (dedupeKey) {
    const existing = await prisma.emailLog.findUnique({ where: { dedupeKey } });
    if (existing?.status === "sent") {
      return { success: true, reason: "deduped", log: existing };
    }
    if (existing) {
      await prisma.emailLog.update({
        where: { id: existing.id },
        data: {
          recipient: sendTo,
          subject,
          body: text,
          status: emailProviderAvailable ? "pending" : "skipped",
          attempts: { increment: 1 },
          lastAttemptAt: new Date(),
          errorMessage: null,
        },
      });
    } else {
      await prisma.emailLog.create({ data: logData });
    }
  } else {
    await prisma.emailLog.create({ data: logData });
  }

  const log = dedupeKey
    ? await prisma.emailLog.findUnique({ where: { dedupeKey } })
    : await prisma.emailLog.findFirst({
        where: {
          schoolId: school?.id || 1,
          recipient: sendTo,
          subject,
          createdAt: {
            gte: new Date(Date.now() - 5 * 60 * 1000),
          },
        },
        orderBy: { createdAt: "desc" },
      });

  if (!emailProviderAvailable) {
    return { success: false, reason: "no_email_provider", log };
  }

  try {
    const info = await sendEmailProvider({
      from: fromEmail || process.env.FROM_EMAIL || `no-reply@${(school?.website || "example.com").replace(/^https?:\/\//, "")}`,
      to: sendTo,
      subject,
      text,
      html,
    });

    await prisma.emailLog.update({
      where: { id: log.id },
      data: { status: "sent", errorMessage: null },
    });

    return { success: true, info, log };
  } catch (err) {
    await prisma.emailLog.update({
      where: { id: log.id },
      data: { status: "failed", errorMessage: String(err?.message || "Email delivery failed").slice(0, 2000) },
    });

    return { success: false, reason: err.message, error: err, log };
  }
};

export default { buildAdmissionEmailPayload, buildAdmissionFailureEmailPayload, sendAdmissionEmail, sendAdmissionFailureEmail };
