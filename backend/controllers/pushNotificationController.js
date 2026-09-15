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
      body: "This is a real external device notification test from Petra.",
      url: "/dashboard/communication/notifications",
      tag: `petra-push-test-${Date.now()}`,
      forceExternal: true,
    });

    if (!result?.attempted) {
      const error = new Error("No active device subscription was found. Enable device alerts first.");
      error.statusCode = 409;
      throw error;
    }

    if (!result.sent) {
      const error = new Error("Petra reached the push service, but the device rejected the notification.");
      error.statusCode = 502;
      error.details = { attempted: result.attempted, failed: result.failed, deliveryErrors: result.errors || [] };
      throw error;
    }

    return res.json({
      sent: result.sent,
      attempted: result.attempted,
      failed: result.failed,
      message: "External device notification delivered to the browser push service. Check the system notification area.",
      deliveryErrors: result.errors || [],
    });
  } catch (error) {
    return next(error);
  }
};
