import { notificationService } from "../services/notificationService.js";

export const listNotifications = async (req, res, next) => {
  try {
    const result = await notificationService.listForUser(req.user, req.query);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

export const unreadNotificationSummary = async (req, res, next) => {
  try {
    const result = await notificationService.unreadSummary(req.user);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

export const markNotificationSectionRead = async (req, res, next) => {
  try {
    const result = await notificationService.markSectionRead(req.user, req.params.section);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

export const markNotificationRead = async (req, res, next) => {
  try {
    const result = await notificationService.markRead(req.user, req.params.id);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

export const markAllNotificationsRead = async (req, res, next) => {
  try {
    const result = await notificationService.markAllRead(req.user);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
};
