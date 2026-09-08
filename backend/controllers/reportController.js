import { reportGenerationQueue } from "../jobs/queue.js";

export const queueReportGeneration = async (req, res, next) => {
  try {
    const job = await reportGenerationQueue.add("generate-report", {
      reportCardId: String(req.params.id),
      schoolId: Number(req.user.schoolId),
      requestedBy: String(req.user.id),
    });
    return res.status(202).json({ jobId: job.id, status: "queued" });
  } catch (error) {
    return next(error);
  }
};
