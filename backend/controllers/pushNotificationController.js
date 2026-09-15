import { pushNotificationService } from "../services/pushNotificationService.js";

export const getPushPublicKey = async (req, res, next) => {
  try {
    return res.json({ publicKey: pushNotificationService.getPublicKey() });
  } catch (error) {
    return next(error);
  }
};

export const getPushStatus = async (req, res, next) => {
  try {
    const result = await pushNotificationService.getStatus(req.user.id, req.body?.endpoint || req.query?.endpoint);
    return res.json(result);
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

export const sendPushTest = async (req, res, next) => {
  try {
    const result = await pushNotificationService.sendToUser(req.user.id, {
      title: "Petra School test",
      body: "Device notifications are working. This is a test alert from Petra.",
      url: "/dashboard/communication/notifications",
      tag: `petra-push-test-${Date.now()}`,
    });

    if (!result?.sent) {
      const error = new Error("No active device subscription was found. Enable device alerts first.");
      error.statusCode = 409;
      throw error;
    }

    return res.json({ sent: result.sent, message: "Test device notification sent." });
  } catch (error) {
    return next(error);
  }
};
