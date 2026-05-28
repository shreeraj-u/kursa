export class HttpError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export const Errors = {
  badRequest: (message: string, details?: unknown) =>
    new HttpError(400, "BAD_REQUEST", message, details),
  unauthorized: (message = "Unauthorized") =>
    new HttpError(401, "UNAUTHORIZED", message),
  forbidden: (message = "Forbidden") =>
    new HttpError(403, "FORBIDDEN", message),
  notFound: (resource: string) =>
    new HttpError(404, "NOT_FOUND", `${resource} not found`),
  internal: (message = "Internal server error") =>
    new HttpError(500, "INTERNAL_ERROR", message),
};
