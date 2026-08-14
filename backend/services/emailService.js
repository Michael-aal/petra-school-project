import nodemailer from "nodemailer";
import { prisma } from "../config/db.js";

const transportConfigAvailable = Boolean(process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_USER && process.env.SMTP_PASS);

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

const safeHtml = (s) => String(s || "").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const getAdmissionRecipients = (admission) =>
  [...new Set([
    admission?.parentEmail,
    admission?.fatherEmail,
    admission?.motherEmail,
  ].filter(Boolean).map((value) => String(value).trim().toLowerCase()))];

export const sendAdmissionEmail = async ({
  school,
  admission,
  studentName,
  admissionCode,
  paymentUrl,
  fromEmail,
  dedupeKey,
}) => {
  const recipients = getAdmissionRecipients(admission);

  if (!recipients.length) {
    return { success: false, reason: "no_recipient" };
  }

  const subject = `${school?.name || "School"}: Admission offer for ${studentName}`;
  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;color:#111;line-height:1.5">
      ${school?.logo ? `<img src="${safeHtml(school.logo)}" alt="${safeHtml(school.name)}" style="max-height:56px;display:block;margin-bottom:16px"/>` : ""}
      <p>Dear Parent/Guardian,</p>
      <p>We are pleased to inform you that <strong>${safeHtml(studentName)}</strong> has successfully passed the examination for <strong>${safeHtml(school?.name || "your school")}</strong>.</p>
      <p style="margin:20px 0 8px;font-size:12px;letter-spacing:0.08em;color:#667085;text-transform:uppercase">Admission / School Code</p>
      <div style="padding:16px 18px;border:1px solid #d0d5dd;border-radius:12px;background:#f8fafc;display:inline-block">
        <div style="font-size:12px;color:#667085;margin-bottom:4px">Use this code for the next admission/enrollment step</div>
        <div style="font-size:28px;font-weight:800;letter-spacing:0.08em;color:#102a43">${safeHtml(admissionCode)}</div>
      </div>
      <p style="margin:16px 0 8px">
        <a href="${safeHtml(paymentUrl)}" style="display:inline-block;padding:12px 18px;background:#0b66c3;color:#fff;border-radius:8px;text-decoration:none;font-weight:700">Proceed to School Fees Payment</a>
      </p>
      <p>Please use the payment link above to complete the next admission/enrollment step.</p>
      <p>Kind regards,<br/>${safeHtml(school?.name || "Your School")}</p>
    </div>
  `;
  const text = `Dear Parent/Guardian,\n\nWe are pleased to inform you that ${studentName} has successfully passed the examination for ${school?.name || "your school"}.\n\nAdmission / School Code: ${admissionCode}\nPayment link: ${paymentUrl}\n\nPlease use the payment link above to complete the next admission/enrollment step.\n\nKind regards,\n${school?.name || "Your School"}`;

  const sendTo = recipients.join(", ");
  const logData = {
    schoolId: school?.id || 1,
    recipient: sendTo,
    subject,
    body: text,
    status: transportConfigAvailable ? "pending" : "skipped",
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
          status: transportConfigAvailable ? "pending" : "skipped",
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

  if (!transportConfigAvailable) {
    return { success: false, reason: "no_smtp", log };
  }

  try {
    const info = await transporter.sendMail({
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

export default { sendAdmissionEmail };
