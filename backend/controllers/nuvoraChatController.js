import { nuvoraChatService } from "../services/nuvoraChatService.js";
import { handleAIQuery } from "../ai/orchestrator.js";

const getUserSchoolId = (req) => {
  const value = req.schoolId ?? req.user?.selectedSchoolId ?? req.user?.schoolId;
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : null;
};

export const listNuvoraChats = async (req, res, next) => {
  try {
    const chats = await nuvoraChatService.listConversations(req.user.id);
    return res.json({ success: true, chats });
  } catch (error) {
    next(error);
  }
};

export const getNuvoraChat = async (req, res, next) => {
  try {
    const chat = await nuvoraChatService.getConversation(req.user.id, req.params.id);
    if (!chat) return res.status(404).json({ success: false, message: "Chat not found." });
    return res.json({ success: true, chat });
  } catch (error) {
    next(error);
  }
};

export const deleteNuvoraChat = async (req, res, next) => {
  try {
    const deleted = await nuvoraChatService.deleteConversation(req.user.id, req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: "Chat not found." });
    return res.json({ success: true, message: "Chat permanently deleted." });
  } catch (error) {
    next(error);
  }
};

export const deleteAllNuvoraChats = async (req, res, next) => {
  try {
    const deletedCount = await nuvoraChatService.deleteAllConversations(req.user.id);
    return res.json({ success: true, deletedCount, message: "All Nuvora chats permanently deleted." });
  } catch (error) {
    next(error);
  }
};

export const queryNuvora = async (req, res, next) => {
  try {
    const { message, conversationId, selectedStudentId } = req.body || {};
    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ success: false, message: "A question or message is required." });
    }
    if (message.length > 1500) {
      return res.status(400).json({ success: false, message: "Question exceeds maximum allowed length (1500 characters)." });
    }

    let activeConversationId = String(conversationId || "").trim();
    if (activeConversationId) {
      const existing = await nuvoraChatService.getConversation(req.user.id, activeConversationId);
      if (!existing) return res.status(404).json({ success: false, message: "Chat not found." });
    } else {
      const chat = await nuvoraChatService.createConversation({
        userId: req.user.id,
        schoolId: getUserSchoolId(req),
        title: message.trim().slice(0, 80),
      });
      activeConversationId = chat.id;
    }

    const conversationHistory = await nuvoraChatService.getRecentMessages(req.user.id, activeConversationId, 10);
    await nuvoraChatService.addMessage({ conversationId: activeConversationId, role: "user", content: message.trim() });

    const result = await handleAIQuery({
      user: req.user,
      message: message.trim(),
      schoolId: req.schoolId,
      conversationHistory,
      selectedStudentId: selectedStudentId ? String(selectedStudentId).trim() : undefined,
    });

    if (result.success && result.answer) {
      await nuvoraChatService.addMessage({
        conversationId: activeConversationId,
        role: "assistant",
        content: result.answer,
        data: result.data || null,
      });
    }

    if (result.statusCode && result.statusCode !== 200) {
      return res.status(result.statusCode).json({ ...result, conversationId: activeConversationId, message: result.message || result.answer });
    }

    return res.status(200).json({ ...result, conversationId: activeConversationId, message: result.message || result.answer });
  } catch (error) {
    next(error);
  }
};
