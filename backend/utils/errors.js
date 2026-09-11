export class AppError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export class BadRequestError extends AppError {
  constructor(message, details = null) {
    super(message, 400, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized", details = null) {
    super(message, 401, details);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden", details = null) {
    super(message, 403, details);
  }
}

export class NotFoundError extends AppError {
  constructor(message, details = null) {
    super(message, 404, details);
  }
}

export class ConflictError extends AppError {
  constructor(message, details = null) {
    super(message, 409, details);
  }
}

export class InternalServerError extends AppError {
  constructor(message = "Internal server error", details = null) {
    super(message, 500, details);
  }
}
