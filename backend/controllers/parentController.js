import { parentAccessService } from "../services/parentAccessService.js";

export const getLinkedChildren = async (req, res, next) => {
  try {
    const children = await parentAccessService.listChildren(req.user.id);
    return res.status(200).json({ success: true, children, primaryChildId: children[0]?.id || null });
  } catch (error) {
    next(error);
  }
};

export const getLinkedChild = async (req, res, next) => {
  try {
    const child = await parentAccessService.assertStudentAccess(req.user.id, req.params.studentId);
    return res.status(200).json({ success: true, child });
  } catch (error) {
    next(error);
  }
};

export const getChildHub = async (req, res, next) => {
  try {
    const hub = await parentAccessService.getStudentHub(req.user.id, req.params.studentId);
    return res.status(200).json({ success: true, ...hub });
  } catch (error) {
    next(error);
  }
};
