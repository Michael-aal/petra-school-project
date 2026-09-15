import { nuvoraKnowledgeService } from "../services/nuvoraKnowledgeService.js";

const handle = async (operation, req, res, next) => {
  try {
    const data = await operation();
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const listKnowledge = (req, res, next) =>
  handle(() => nuvoraKnowledgeService.list(req.user), req, res, next);

export const createKnowledge = (req, res, next) =>
  handle(() => nuvoraKnowledgeService.create(req.user, req.body), req, res, next);

export const updateKnowledge = (req, res, next) =>
  handle(() => nuvoraKnowledgeService.update(req.user, req.params.id, req.body), req, res, next);

export const deleteKnowledge = (req, res, next) =>
  handle(() => nuvoraKnowledgeService.remove(req.user, req.params.id), req, res, next);
