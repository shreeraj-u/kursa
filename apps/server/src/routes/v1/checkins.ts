import { Router } from "express";

import * as checkinsController from "../../controllers/checkins.controller.js";
import { requireAuth } from "../../middleware/require-auth.js";

const router: Router = Router();
router.use(requireAuth);

router.get("/next", checkinsController.getNext);
router.post("/", checkinsController.submit);
router.get("/history", checkinsController.history);

export default router;
