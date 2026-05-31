import { Router } from "express";

import * as linkedInController from "../../controllers/linkedin.controller.js";
import { requireAuth } from "../../middleware/require-auth.js";

const router: Router = Router();
router.use(requireAuth);

router.post("/sync", linkedInController.syncLinkedIn);
router.get("/status", linkedInController.getLinkedInStatus);

export default router;
