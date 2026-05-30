import { Router } from "express";

import * as journalController from "../../controllers/journal.controller.js";
import { requireAuth } from "../../middleware/require-auth.js";

const router: Router = Router();
router.use(requireAuth);

router.get("/", journalController.getTimeline);
router.post("/win", journalController.createWin);
router.post("/note", journalController.createNote);
router.get("/context", journalController.getContext);
router.get("/trend", journalController.getTrend);
router.get("/relevance", journalController.getRelevance);
router.get("/review-prep", journalController.getReviewPrep);

export default router;
