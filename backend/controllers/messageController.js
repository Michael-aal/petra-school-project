import { validationResult } from "express-validator";
import { messageService } from "../services/messageService.js";

const validate = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array(),
    });
  }
  return null;
};

export const listMessages = async (req, res, next) => {
  try {
    const invalid = validate(req, res);
    if (invalid) return invalid;
    const result = await messageService.listMessages(req.user, req.query);
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export const sendMessage = async (req, res, next) => {
  try {
    const invalid = validate(req, res);
    if (invalid) return invalid;
    const message = await messageService.sendMessage(req.user, req.body);
    return res.status(201).json({ success: true, message });
  } catch (error) {
    next(error);
  }
};

export const getConversation = async (req, res, next) => {
  try {
    const invalid = validate(req, res);
    if (invalid) return invalid;
    const conversation = await messageService.getConversation(req.user, req.params.id);
    return res.status(200).json({ success: true, conversation });
  } catch (error) {
    next(error);
  }
};
