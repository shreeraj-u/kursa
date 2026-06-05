import { Router } from "express";

import * as journeyController from "../../controllers/journey.controller.js";

const router: Router = Router();

router.get("/", journeyController.getJourney);
router.get("/intake", journeyController.getJourneyIntake);
router.post("/generate", journeyController.generateJourney);
router.patch("/milestones/:order", journeyController.updateMilestoneStatus);
router.post("/extend", journeyController.extendJourney);
router.post("/revision/start", journeyController.startRevision);
router.post("/revision/brief", journeyController.revisionBrief);
router.post("/revise", journeyController.reviseJourney);
router.post("/setup/start", journeyController.startSetup);
router.post("/setup/apply", journeyController.applySetup);

export default router;
