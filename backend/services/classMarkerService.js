import { prisma } from "../config/db.js";

const CLASSMARKER_BASE = process.env.CLASSMARKER_BASE || "https://api.classmarker.com/v1";
const API_KEY = process.env.CLASSMARKER_API_KEY || "";
const API_SECRET = process.env.CLASSMARKER_API_SECRET || "";

const META_MARKER = "[ClassMarkerMeta]";

const authHeader = () => {
  if (!API_KEY || !API_SECRET) return {};
  const token = Buffer.from(`${API_KEY}:${API_SECRET}`).toString("base64");
  return { Authorization: `Basic ${token}` };
};

export const classMarkerService = {
  createRemoteExam: async (assessment) => {
    // Attempt to create a remote exam on ClassMarker.
    // This implementation uses the ClassMarker v1 REST style as a best-effort.
    // If your ClassMarker API differs, adjust the endpoint and payload accordingly.
    const url = `${CLASSMARKER_BASE}/exams`;
    const body = {
      title: assessment.title,
      maxScore: assessment.maxScore || 100,
      description: assessment.description || "",
      date: assessment.date,
      className: assessment.className,
      subject: assessment.subject,
    };

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(),
        },
        body: JSON.stringify(body),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message = data.message || `ClassMarker create exam failed status=${response.status}`;
        const error = new Error(message);
        error.response = data;
        throw error;
      }

      // Expect data to contain an `id` or similar identifier for the remote exam.
      return data;
    } catch (err) {
      throw err;
    }
  },

  fetchExamResults: async (remoteExamId) => {
    const url = `${CLASSMARKER_BASE}/exams/${encodeURIComponent(remoteExamId)}/results`;
    try {
      const response = await fetch(url, { headers: { ...authHeader() } });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const error = new Error(data.message || `ClassMarker fetch results failed status=${response.status}`);
        error.response = data;
        throw error;
      }
      return data;
    } catch (err) {
      throw err;
    }
  },

  createLaunchLink: async (remoteExamId, candidate) => {
    // ClassMarker launch URLs vary by configuration. Provide a generic link format
    // that the frontend can open. If your ClassMarker account requires signed
    // launch tokens, implement signing here.
    if (!remoteExamId) throw new Error("remoteExamId required");
    const base = process.env.CLASSMARKER_LAUNCH_HOST || "https://www.classmarker.com/online-test/start";
    const params = new URLSearchParams();
    params.set("test", remoteExamId);
    if (candidate && candidate.reference) params.set("candidate", candidate.reference);
    if (candidate && candidate.email) params.set("email", candidate.email);
    return `${base}/?${params.toString()}`;
  },

  // Helper: embed/extract metadata into assessment.description without changing DB schema
  embedMetaInDescription: (description = "", meta = {}) => {
    const without = description || "";
    // remove existing marker if present
    const parts = without.split(META_MARKER);
    const base = parts[0] || "";
    const encoded = JSON.stringify(meta);
    return `${base}\n${META_MARKER}${encoded}`;
  },

  extractMetaFromDescription: (description = "") => {
    if (!description) return null;
    const idx = description.indexOf(META_MARKER);
    if (idx === -1) return null;
    const jsonPart = description.slice(idx + META_MARKER.length).trim();
    try {
      return JSON.parse(jsonPart);
    } catch (err) {
      return null;
    }
  },
};

export default classMarkerService;
