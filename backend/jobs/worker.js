import { Worker } from "bullmq";
import IORedis from "ioredis";
import fs from "node:fs/promises";
import path from "node:path";
import { prisma } from "../config/db.js";

const connection = new IORedis(process.env.REDIS_URL || "redis://127.0.0.1:6379", {
  maxRetriesPerRequest: null,
});

const escapePdfText = (value) => String(value).replace(/([\\()])/g, "\\$1").replace(/\r?\n/g, " ");

const createPdf = (title, lines) => {
  const text = [title, ...lines].map(escapePdfText).map((line, index) => `BT /F1 12 Tf 50 ${780 - index * 18} Td (${line}) Tj ET`).join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${text.length} >>\nstream\n${text}\nendstream`,
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (let index = 0; index < objects.length; index += 1) {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${objects[index]}\nendobj\n`;
  }
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let index = 1; index < offsets.length; index += 1) pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  return Buffer.from(`${pdf}trailer\n<< /Root 1 0 R /Size ${objects.length + 1} >>\nstartxref\n${xref}\n%%EOF\n`);
};

const reportProcessor = async (job) => {
  const report = await prisma.reportCard.findFirst({ where: { id: String(job.data.reportCardId), schoolId: Number(job.data.schoolId) }, include: { student: true } });
  if (!report) throw new Error("Report card not found.");
  const directory = path.resolve("storage", "reports");
  await fs.mkdir(directory, { recursive: true });
  const filename = `${report.id}.pdf`;
  await fs.writeFile(path.join(directory, filename), createPdf("Student Report Card", [
    `Student: ${report.student.name}`,
    `Admission Number: ${report.student.admissionNumber || "N/A"}`,
  ]));
  return prisma.reportCard.update({ where: { id: report.id }, data: { fileUrl: `/storage/reports/${filename}` } });
};

const notificationProcessor = async (job) => {
  const notifications = Array.isArray(job.data.notifications) ? job.data.notifications : [];
  if (!notifications.length) return { created: 0 };
  const result = await prisma.notification.createMany({ data: notifications });
  return { created: result.count };
};

const csvProcessor = async (job) => {
  const content = String(job.data.content || "");
  const rows = content.split(/\r?\n/).filter(Boolean).map((line) => line.split(",").map((cell) => cell.trim()));
  return { rows: Math.max(0, rows.length - 1) };
};

export const reportWorker = new Worker("report-generation", async (job) => {
  if (job.name === "bulk-csv") return csvProcessor(job);
  return reportProcessor(job);
}, { connection, concurrency: 2 });

export const notificationWorker = new Worker("notifications", notificationProcessor, { connection, concurrency: 5 });

const shutdown = async () => {
  await Promise.all([reportWorker.close(), notificationWorker.close(), connection.quit()]);
};

process.once("SIGTERM", () => { void shutdown(); });
process.once("SIGINT", () => { void shutdown(); });
