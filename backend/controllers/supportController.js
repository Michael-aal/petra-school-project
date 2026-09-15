import { supportService } from "../services/supportService.js";

const handle = (fn) => async (req,res,next) => {
  try { const data = await fn(req); res.json({ success:true, data }); }
  catch (error) { next(error); }
};

export const listTickets = handle((req) => supportService.listTickets(req.user, req.query));
export const createTicket = handle((req) => supportService.createTicket(req.user, req.body || {}));
export const getTicket = handle((req) => supportService.getTicket(req.user, req.params.id));
export const addMessage = handle((req) => supportService.addMessage(req.user, req.params.id, req.body || {}));
export const updateTicket = handle((req) => supportService.updateTicket(req.user, req.params.id, req.body || {}));
