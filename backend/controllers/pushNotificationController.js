import { pushNotificationService } from "../services/pushNotificationService.js";

export const getPushPublicKey = async (req, res, next) => {
  try {
    return res.json({ publicKey: pushNotificationService.getPublicKey() });
  } catch (error) {
    return next(error);
  }
};

export const subscribeToPush = async (req, res, next) => {
  try {
    const result = await pushNotificationService.saveSubscription(req.user.id, req.body?.subscription, {
      userAgent: req.get("user-agent"),
      deviceName: req.body?.deviceName,
    });
    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

export const unsubscribeFromPush = async (req, res, next) => {
  try {
    const result = await pushNotificationService.removeSubscription(req.user.id, req.body?.endpoint);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
};
