import { schoolConnectionService } from "../services/schoolConnectionService.js";

const run = (handler) => async (req, res, next) => {
  try {
    const data = await handler(req);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return next(error);
  }
};

export const listTeacherAssignments = run((req) =>
  schoolConnectionService.listTeacherAssignments(req.user),
);
export const assignTeacherClass = run((req) =>
  schoolConnectionService.assignTeacherClass(req.user, req.body),
);
export const removeTeacherClass = run((req) =>
  schoolConnectionService.removeTeacherClass(req.user, req.params.id),
);
export const assignTeacherSubject = run((req) =>
  schoolConnectionService.assignTeacherSubject(req.user, req.body),
);
export const assignClassSubject = run((req) =>
  schoolConnectionService.assignClassSubject(req.user, req.body),
);
export const removeClassSubject = run((req) =>
  schoolConnectionService.removeClassSubject(req.user, req.params.id),
);
export const listReportCards = run((req) =>
  schoolConnectionService.listReportCards(req.user, req.query),
);

export const publishReportCard = async (req, res, next) => {
  try {
    const reportCard = await schoolConnectionService.publishReportCard(
      req.user,
      req.params.id,
      req.body?.fileUrl,
    );
    return res.status(200).json({ success: true, reportCard });
  } catch (error) {
    return next(error);
  }
};
