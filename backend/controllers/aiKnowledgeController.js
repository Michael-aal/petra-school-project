import * as knowledgeService from "../ai/knowledgeService.js";

const handle = (fn) => async (req, res) => {
  try {
    const data = await fn(req);
    res.json({ success: true, data });
  } catch (error) {
    const status = error.statusCode || 500;
    res.status(status).json({ success: false, message: error.message || "AI knowledge request failed" });
  }
};

export const list = handle((req) => knowledgeService.listKnowledge({ user: req.user, includeDisabled: true }));
export const create = handle((req) => knowledgeService.createKnowledge({ user: req.user, ...req.body }));
export const update = handle((req) => knowledgeService.updateKnowledge({ user: req.user, id: req.params.id, ...req.body }));
export const remove = handle((req) => knowledgeService.deleteKnowledge({ user: req.user, id: req.params.id }));
