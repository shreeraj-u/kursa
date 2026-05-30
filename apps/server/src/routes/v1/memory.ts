import { Router } from "express";

import * as journalController from "../../controllers/journal.controller.js";
import { requireAuth } from "../../middleware/require-auth.js";

const router: Router = Router();
router.use(requireAuth);
router.get("/", journalController.getMemories);

export default router;
