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
    return res.status(201).json({
      success: true,
      account,
      message: "School payment account created successfully",
    });
  } catch (error) {
    next(error);
  }
};
