import type { Response } from "express";

export function ok<T>(res: Response, data: T): Response {
  return res.status(200).json({ success: true, data });
}

export function created<T>(res: Response, data: T): Response {
  return res.status(201).json({ success: true, data });
}
