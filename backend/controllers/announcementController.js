import { announcementService } from "../services/announcementService.js";

const parseQuery = (query) => ({
  page: query.page,
  limit: query.limit,
  search: query.search,
  onlyDrafts: query.onlyDrafts,
  published: query.published,
});

export const listAnnouncements = async (req, res, next) => {
  try {
    const result = await announcementService.listForUser(req.user, parseQuery(req.query));
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export const createAnnouncement = async (req, res, next) => {
  try {
    const announcement = await announcementService.createAnnouncement(req.user, req.body);
    return res.status(201).json({ success: true, announcement });
  } catch (error) {
    next(error);
  }
};

export const markAnnouncementRead = async (req, res, next) => {
  try {
    const record = await announcementService.markRead(req.user, req.params.id);
    return res.status(200).json({ success: true, record });
  } catch (error) {
    next(error);
  }
};

export const reactToAnnouncement = async (req, res, next) => {
  try {
    const record = await announcementService.react(req.user, req.params.id, req.body.reaction);
    return res.status(200).json({ success: true, record });
  } catch (error) {
    next(error);
  }
};

export const announcementAnalytics = async (req, res, next) => {
  try {
    const result = await announcementService.getAnalytics(req.user, req.params.id, req.query.role);
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};
