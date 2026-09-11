import { body, param, query } from "express-validator";

export const messageValidators = {
  listMessages: [
    query("folder").optional().isIn(["inbox", "sent"]).withMessage("Folder must be either inbox or sent"),
    query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),
    query("limit").optional().isInt({ min: 1, max: 50 }).withMessage("Limit must be between 1 and 50"),
    query("search").optional().trim(),
  ],
  sendMessage: [
    body("recipientId").notEmpty().withMessage("Recipient is required"),
    body("body").notEmpty().withMessage("Message body is required"),
    body("subject").optional().trim(),
  ],
  conversation: [
    param("id").notEmpty().withMessage("Conversation user ID is required"),
  ],
};
