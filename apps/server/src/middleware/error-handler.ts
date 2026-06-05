import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

import { HttpError } from "../errors/http-error.js";
import { MissingOpenAIKeyError } from "../lib/openai.js";

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  if (err instanceof HttpError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err.details !== undefined && { details: err.details }),
      },
    });
    return;
  }

  if (err instanceof MissingOpenAIKeyError) {
    res.status(400).json({
      success: false,
      error: {
        code: "OPENAI_API_KEY_REQUIRED",
        message: err.message,
      },
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid input",
        details: err.flatten(),
      },
    });
    return;
  }

  console.error(`[${req.id ?? "?"}] Unhandled error:`, err);
  res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_ERROR",
      message: "Internal server error",
    },
  });
}
