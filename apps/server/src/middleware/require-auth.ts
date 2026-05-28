import { auth } from "@kursa/auth";
import { fromNodeHeaders } from "better-auth/node";
import type { NextFunction, Request, Response } from "express";

import { Errors } from "../errors/http-error.js";

export async function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session) {
      next(Errors.unauthorized());
      return;
    }

    req.user = session.user;
    req.session = session.session;
    next();
  } catch (err) {
    console.error(`[${req.id ?? "?"}] Auth middleware error:`, err);
    next(Errors.unauthorized());
  }
}
