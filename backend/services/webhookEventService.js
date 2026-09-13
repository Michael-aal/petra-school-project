import crypto from "node:crypto";
import { prisma, runWithoutSchoolContext } from "../config/db.js";

const hashPayload = (rawBody) => crypto.createHash("sha256")
  .update(Buffer.isBuffer(rawBody) ? rawBody : String(rawBody || ""))
  .digest("hex");

export const webhookEventService = {
  eventKey: ({ providerEventId, rawBody }) => String(providerEventId || hashPayload(rawBody)).slice(0, 255),

  reserve: async ({ provider, eventKey }) => {
    try {
      await runWithoutSchoolContext(() => prisma.webhookEvent.create({ data: { provider, eventKey } }));
      return true;
    } catch (error) {
      if (error?.code === "P2002") return false;
      throw error;
    }
  },

  complete: (provider, eventKey) => runWithoutSchoolContext(() => prisma.webhookEvent.update({
    where: { provider_eventKey: { provider, eventKey } },
    data: { status: "completed", completedAt: new Date() },
  })),

  release: (provider, eventKey) => runWithoutSchoolContext(() => prisma.webhookEvent.deleteMany({
    where: { provider, eventKey, status: "processing" },
  })),
};
