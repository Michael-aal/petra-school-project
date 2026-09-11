import { handleAIQuery } from "../ai/orchestrator.js";

export const queryAI = async (req, res, next) => {
  try {
    const { message, conversationHistory, selectedStudentId } = req.body || {};

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "A question or message is required.",
      });
    }

    if (message.length > 1500) {
      return res.status(400).json({
        success: false,
        message: "Question exceeds maximum allowed length (1500 characters).",
      });
    }

    // Limit conversation history to latest 10 messages for cost and token control
    const safeHistory = Array.isArray(conversationHistory)
      ? conversationHistory.slice(-10).map((m) => ({
          role: m.role === "assistant" || m.role === "model" ? "assistant" : "user",
          content: String(m.content || "").slice(0, 1000),
        }))
      : [];

    const result = await handleAIQuery({
      user: req.user,
      message: message.trim(),
      schoolId: req.schoolId,
      conversationHistory: safeHistory,
      selectedStudentId: selectedStudentId ? String(selectedStudentId).trim() : undefined,
    });

    if (result.statusCode && result.statusCode !== 200) {
      return res.status(result.statusCode).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
