// AppError hierarchy (400/401/403/404/409/422/429/500) +
// extractRequestContext(c)
import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import type { HonoContext } from "@/shared/context";

export class BaseAppError extends Error {
  readonly statusCode: ContentfulStatusCode;

  constructor(
    message: string,
    statusCode: ContentfulStatusCode,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
  }
}

export class BadRequest extends BaseAppError {
  constructor(message = "Bad Request", options?: ErrorOptions) {
    super(message, 400, options);
  }
}

export class Unauthorized extends BaseAppError {
  constructor(message = "Unauthorized", options?: ErrorOptions) {
    super(message, 401, options);
  }
}

export class Forbidden extends BaseAppError {
  constructor(message = "Forbidden", options?: ErrorOptions) {
    super(message, 403, options);
  }
}

export class NotFound extends BaseAppError {
  constructor(message = "Not Found", options?: ErrorOptions) {
    super(message, 404, options);
  }
}

export class Conflict extends BaseAppError {
  constructor(message = "Conflict", options?: ErrorOptions) {
    super(message, 409, options);
  }
}

export class UnprocessableEntity extends BaseAppError {
  constructor(message = "Unprocessable Entity", options?: ErrorOptions) {
    super(message, 422, options);
  }
}

export class TooManyRequests extends BaseAppError {
  constructor(message = "Too Many Requests", options?: ErrorOptions) {
    super(message, 429, options);
  }
}

export class InternalServerError extends BaseAppError {
  constructor(message = "Internal Server Error", options?: ErrorOptions) {
    // 500 preserves the underlying cause via ErrorOptions.
    super(message, 500, options);
  }
}

export function extractRequestContext(c: Context<HonoContext>) {
  return {
    requestId: c.get("requestId"),
    method: c.req.method,
    path: c.req.path,
    userId: c.get("user")?.id,
    activeOrgId: c.get("session")?.activeOrganizationId,
  };
}
