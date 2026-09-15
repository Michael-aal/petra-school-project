import crypto from "node:crypto";
import { prisma, runWithoutSchoolContext } from "../config/db.js";

export const hashWebhookPayload = (rawBody) => crypto.createHash("sha256")
  .update(Buffer.isBuffer(rawBody) ? rawBody : String(rawBody || ""))
  .digest("hex");

export const webhookLogModel = {
  normalizeRequestId: (value) => String(value || "").trim(),

  reserve: async ({ provider, requestId, rawBody }) => {
    try {
      return await runWithoutSchoolContext(() => prisma.webhookLog.create({
        data: {
          provider,
          requestId: String(requestId),
          payloadHash: hashWebhookPayload(rawBody),
        },
      }));
    } catch (error) {
      if (error?.code === "P2002") return null;
      throw error;
    }
  },

  complete: ({ provider, requestId }) => runWithoutSchoolContext(() => prisma.webhookLog.update({
    where: { provider_requestId: { provider, requestId: String(requestId) } },
    data: { status: "completed", processedAt: new Date() },
  })),

  release: ({ provider, requestId }) => runWithoutSchoolContext(() => prisma.webhookLog.deleteMany({
    where: { provider, requestId: String(requestId), status: "processing" },
  })),
};
