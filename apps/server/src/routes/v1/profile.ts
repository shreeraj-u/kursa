import { Router } from "express";

import * as dashboardController from "../../controllers/dashboard.controller.js";
import * as pathsController from "../../controllers/paths.controller.js";
import * as profileController from "../../controllers/profile.controller.js";
import * as resumeController from "../../controllers/resume.controller.js";
import * as skillsController from "../../controllers/skills.controller.js";
import { requireAuth } from "../../middleware/require-auth.js";

const router: Router = Router();

// Apply authentication middleware to all profile routes
router.use(requireAuth);

const meRouter: Router = Router();

meRouter.get("/", profileController.getMe);
meRouter.put("/", profileController.updateMe);
meRouter.get("/observations", profileController.getObservations);
meRouter.get("/dashboard", dashboardController.getDashboardMetrics);
meRouter.get("/paths", pathsController.getPaths);
meRouter.post("/paths/generate", pathsController.generatePaths);
meRouter.put("/paths/:id/activate", pathsController.activatePath);
meRouter.get("/resumes", resumeController.listResumes);
meRouter.post("/resumes/generate", resumeController.generateResume);
meRouter.put("/resumes/:id", resumeController.updateResume);
meRouter.post("/resumes/:id/analyze", resumeController.analyzeResume);
meRouter.get("/resumes/:id", resumeController.getResume);
meRouter.post("/social-links", profileController.createSocialLink);
meRouter.put("/social-links/:id", profileController.updateSocialLink);
meRouter.delete("/social-links/:id", profileController.deleteSocialLink);
meRouter.get("/skills/overview", skillsController.getSkillsOverview);
meRouter.post("/skills", skillsController.createSkill);
meRouter.put("/skills/:id", skillsController.updateSkill);
meRouter.delete("/skills/:id", skillsController.deleteSkill);
meRouter.get("/skill-proposals", skillsController.listSkillProposals);
meRouter.post("/skill-proposals/:id/accept", skillsController.acceptSkillProposal);
meRouter.post("/skill-proposals/:id/dismiss", skillsController.dismissSkillProposal);

router.use("/me", meRouter);

export default router;
