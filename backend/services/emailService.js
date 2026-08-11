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

export const sendAdmissionEmail = async ({ school, admission, studentName, admissionCode, paymentUrl, fromEmail }) => {
  const recipients = [];
  if (admission.parentEmail) recipients.push(admission.parentEmail);
  if (admission.fatherEmail) recipients.push(admission.fatherEmail);
  if (admission.motherEmail) recipients.push(admission.motherEmail);
  const uniqueRecipients = [...new Set(recipients.filter(Boolean))];

  const subject = `${school?.name || "School"}: Admission offer for ${studentName}`;

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;color:#111;line-height:1.4">
      ${school?.logo ? `<img src="${safeHtml(school.logo)}" alt="${safeHtml(school.name)}" style="max-height:48px;display:block;margin-bottom:12px"/>` : ""}
      <p>Good day,</p>
      <p>We are pleased to inform you that your child, <strong>${safeHtml(studentName)}</strong>, has successfully passed the entrance examination and has been offered admission into <strong>${safeHtml(school?.name || "your school")}</strong>.</p>
      <h3 style="background:#f7f7f7;padding:12px;border-radius:6px;display:inline-block">ADMISSION CODE<br/><span style="font-size:18px;font-weight:700">${safeHtml(admissionCode)}</span></h3>
      <p>Please keep this code safe as it may be required for future admission and enrollment processes.</p>
      <p>
        <a href="${safeHtml(paymentUrl)}" style="display:inline-block;padding:10px 16px;background:#0b66c3;color:#fff;border-radius:6px;text-decoration:none">Proceed to School Fees Payment</a>
      </p>
      <p>If you have any questions, please contact the school administration.</p>
      <p>Kind regards,<br/>${safeHtml(school?.name || "Your School")}</p>
    </div>
  `;

  const text = `Good day,\n\nYour child, ${studentName}, has successfully passed the entrance examination and has been offered admission into ${school?.name || "your school"}.\n\nADMISSION CODE: ${admissionCode}\n\nProceed to School Fees Payment: ${paymentUrl}\n\nKind regards,\n${school?.name || "Your School"}`;

  // Log attempt in EmailLog regardless
  const logPromises = uniqueRecipients.map((rcp) =>
    prisma.emailLog.create({ data: { schoolId: school?.id || 1, recipient: rcp, subject, body: text, status: transportConfigAvailable ? "pending" : "skipped" } }),
  );
  const logs = await Promise.all(logPromises);

  if (!transportConfigAvailable) {
    // No SMTP configured: return logs and indicate skipped
    return { success: false, reason: "no_smtp", logs };
  }

  try {
    const info = await transporter.sendMail({
      from: fromEmail || process.env.FROM_EMAIL || `no-reply@${(school?.website || "example.com").replace(/^https?:\/\//, "")}`,
      to: uniqueRecipients.join(", "),
      subject,
      text,
      html,
    });

    // update logs to 'sent'
    await Promise.all(logs.map((l) => prisma.emailLog.update({ where: { id: l.id }, data: { status: "sent" } })));
    return { success: true, info };
  } catch (err) {
    // mark logs as failed
    await Promise.all(logs.map((l) => prisma.emailLog.update({ where: { id: l.id }, data: { status: "failed" } })));
    return { success: false, reason: err.message, error: err };
  }
};

export default { sendAdmissionEmail };
