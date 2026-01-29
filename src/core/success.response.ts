import { Response } from "express";

const StatusCode = {
  OK: 200,
  CREATED: 201,
};

const ReasonStatusCode = {
  OK: "Success",
  CREATED: "Created!",
};

class SuccessResponse {
  message: string;
  status: number;
  metadata: any;

  constructor({
    message,
    statusCode = StatusCode.OK,
    reasonStatusCode = ReasonStatusCode.OK,
    metadata = {},
  }: {
    message?: string;
    statusCode?: number;
    reasonStatusCode?: string;
    metadata?: any;
  }) {
    this.message = !message ? reasonStatusCode : message;
    this.status = statusCode;
    this.metadata = metadata;
  }
  send(res: Response, headers = {}) {
    return res.status(this.status).json(this);
  }
}

class OK extends SuccessResponse {
  constructor(message?: string, metadata?: any) {
    super({ message, metadata });
  }
}

class CREATED extends SuccessResponse {
  options: any;

  constructor(
    options: any = {},
    message?: string,
    statusCode: number = StatusCode.CREATED,
    reasonStatusCode: string = ReasonStatusCode.CREATED,
    metadata?: any,
  ) {
    super({ message, statusCode, reasonStatusCode, metadata });
    this.options = options;
  }
}

export { OK, CREATED, SuccessResponse };
