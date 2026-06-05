import { Router } from "express";

import * as journeyController from "../../controllers/journey.controller.js";

const router: Router = Router();

router.get("/", journeyController.getJourney);
router.post("/generate", journeyController.generateJourney);
router.patch("/milestones/:order", journeyController.updateMilestoneStatus);
router.post("/extend", journeyController.extendJourney);

export default router;
