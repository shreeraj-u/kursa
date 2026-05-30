import { Router } from "express";
import { ipKeyGenerator, rateLimit } from "express-rate-limit";
import multer from "multer";

import * as onboardingController from "../../controllers/onboarding.controller.js";
import { requireAuth } from "../../middleware/require-auth.js";

const router: Router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
});

const resumeUploadLimit = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 5,
  keyGenerator: (req) => req.user?.id ?? ipKeyGenerator(req.ip ?? "127.0.0.1"),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: "RATE_LIMITED", message: "You can upload up to 5 resumes per day." },
  },
});

router.use(requireAuth);

router.get("/status", onboardingController.getStatus);
router.post("/complete", onboardingController.complete);
router.post("/resume", resumeUploadLimit, upload.single("resume"), onboardingController.uploadResume);

export default router;
