import { auth } from "@kursa/auth";
import { getAllowedOrigins } from "@kursa/auth/allowed-origins";
import { env } from "@kursa/env/server";
import { toNodeHandler } from "better-auth/node";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";

import { errorHandler } from "./middleware/error-handler.js";
import { notFound } from "./middleware/not-found.js";
import { requestId } from "./middleware/request-id.js";
import { OPENAI_API_KEY_HEADER, openAIApiKey } from "./middleware/openai-api-key.js";
import v1Router from "./routes/v1/index.js";

const app = express();

const allowedOrigins = getAllowedOrigins(env.CORS_ORIGIN);

// ── Security ─────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", OPENAI_API_KEY_HEADER],
    credentials: true,
  }),
);

// ── Request tracing ───────────────────────────────────────────────────────────
app.use(requestId);

// ── Demo BYO OpenAI key context ───────────────────────────────────────────────
app.use(openAIApiKey);

// ── Auth (before rate-limit and json — Better Auth handles its own body parsing) ─
app.all("/api/auth{/*path}", toNodeHandler(auth));

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: "100kb" }));

// ── Rate limiting (production only — dev SSR hammers /api/v1 while /api/auth is exempt) ─
if (env.NODE_ENV === "production") {
  app.use(
    "/api",
    rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        success: false,
        error: { code: "RATE_LIMITED", message: "Too many requests, please try again later." },
      },
    }),
  );
}

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/", (_req, res) => {
  res.status(200).json({ success: true, data: { status: "ok" } });
});

// ── API v1 ────────────────────────────────────────────────────────────────────
app.use("/api/v1", v1Router);

// ── 404 + error handlers (must be last) ──────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

app.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
  if (process.env.REDIS_URL) {
    import("./jobs/index.js").then(({ startJobWorkers }) => {
      startJobWorkers(process.env.REDIS_URL!);
    });
  }
});
