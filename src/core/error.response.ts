import { StatusCodes, ReasonPhrases } from "../utils/httpStatusCode.js";

const StatusCode = {
  FORBIDDEN: 403,
  CONFLICT: 409,
};

const ReasonStatusCode = {
  FORBIDDEN: "Bad request error",
  CONFLICT: "Conflict error",
};

// Specific error codes for admin role management
export const AdminErrorCodes = {
  MINIMUM_ADMINS_REQUIRED: "MINIMUM_ADMINS_REQUIRED",
  MAXIMUM_ADMINS_REACHED: "MAXIMUM_ADMINS_REACHED",
  SELF_DEMOTION_FORBIDDEN: "SELF_DEMOTION_FORBIDDEN",
  SUPER_ADMIN_PROTECTED: "SUPER_ADMIN_PROTECTED",
  INSUFFICIENT_ADMIN_PERMISSION: "INSUFFICIENT_ADMIN_PERMISSION",
} as const;

// Error messages for admin operations
export const AdminErrorMessages = {
  MINIMUM_ADMINS_REQUIRED:
    "Cannot demote this admin. System must maintain at least 1 active admin.",
  MAXIMUM_ADMINS_REACHED:
    "Cannot promote to admin. System has reached maximum admin limit.",
  SELF_DEMOTION_FORBIDDEN: "Admins cannot demote themselves.",
  SUPER_ADMIN_PROTECTED: "Super Admin role cannot be changed.",
  INSUFFICIENT_ADMIN_PERMISSION:
    "Only Super Admin can change other admin's roles.",
} as const;

class ErrorResponse extends Error {
  status: number;
  code?: string; // Add optional error code for specific handling
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

class ConflictRequestError extends ErrorResponse {
  constructor(
    message: string = ReasonStatusCode.CONFLICT,
    statusCode: number = StatusCode.FORBIDDEN,
  ) {
    super(message, statusCode);
  }
}

class BadRequestError extends ErrorResponse {
  constructor(
    message: string = ReasonStatusCode.CONFLICT,
    statusCode: number = StatusCode.FORBIDDEN,
  ) {
    super(message, statusCode);
  }
}

class AuthFailureError extends ErrorResponse {
  constructor(
    message: string = ReasonPhrases.UNAUTHORIZED,
    statusCode: number = StatusCodes.UNAUTHORIZED,
  ) {
    super(message, statusCode);
  }
}

class NotFoundError extends ErrorResponse {
  constructor(
    message: string = ReasonPhrases.NOT_FOUND,
    statusCode: number = StatusCodes.NOT_FOUND,
  ) {
    super(message, statusCode);
  }
}

class ForBiddenError extends ErrorResponse {
  constructor(
    message: string = ReasonPhrases.FORBIDDEN,
    statusCode: number = StatusCodes.FORBIDDEN,
    code?: string,
  ) {
    super(message, statusCode);
    if (code) {
      this.code = code;
    }
  }
}

export {
  ConflictRequestError,
  BadRequestError,
  AuthFailureError,
  NotFoundError,
  ForBiddenError,
};
