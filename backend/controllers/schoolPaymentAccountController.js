import { schoolPaymentAccountService } from "../services/schoolPaymentAccountService.js";

export const getSchoolPaymentAccount = async (req, res, next) => {
  try {
    const account = await schoolPaymentAccountService.get(req.user);
    return res.status(200).json({ success: true, account });
  } catch (error) {
    next(error);
  }
};

export const setupSchoolPaymentAccount = async (req, res, next) => {
  try {
    const account = await schoolPaymentAccountService.setup(req.user, req.body);
    const message = account?.status === "pending_dva"
      ? "School settlement details saved. Paystack Dedicated Virtual Account provisioning is pending business activation; sandbox payments can continue without a DVA."
      : "School payment account created successfully";
    return res.status(201).json({
      success: true,
      account,
      message,
    });
  } catch (error) {
    next(error);
  }
};
