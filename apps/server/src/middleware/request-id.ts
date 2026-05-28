import type { NextFunction, Request, Response } from "express";

export function requestId(req: Request, res: Response, next: NextFunction): void {
  const id =
    (req.headers["x-request-id"] as string | undefined) ??
    crypto.randomUUID();
  req.id = id;
  res.setHeader("x-request-id", id);
  next();
}
