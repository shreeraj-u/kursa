import type { auth } from "@kursa/auth";

type Session = typeof auth.$Infer.Session.session;
type User = typeof auth.$Infer.Session.user;

declare global {
  namespace Express {
    interface Request {
      id?: string;
      user?: User;
      session?: Session;
    }
  }
}

export {};
