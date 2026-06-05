import { Router } from "express";

import * as applicationController from "../../controllers/application.controller.js";
import * as dashboardController from "../../controllers/dashboard.controller.js";
import * as profileController from "../../controllers/profile.controller.js";
import * as resumeController from "../../controllers/resume.controller.js";
import * as projectProposalController from "../../controllers/project-proposal.controller.js";
import * as skillsController from "../../controllers/skills.controller.js";
import { requireAuth } from "../../middleware/require-auth.js";
import journeyRouter from "./journey.js";

const router: Router = Router();

// Apply authentication middleware to all profile routes
router.use(requireAuth);

const meRouter: Router = Router();

meRouter.get("/", profileController.getMe);
meRouter.put("/", profileController.updateMe);
meRouter.get("/observations", profileController.getObservations);
meRouter.post("/dashboard-guide/dismiss", profileController.dismissDashboardGuide);
meRouter.get("/dashboard", dashboardController.getDashboardMetrics);
meRouter.use("/journey", journeyRouter);
meRouter.get("/resumes", resumeController.listResumes);
meRouter.post("/resumes/generate", resumeController.generateResume);
meRouter.put("/resumes/:id", resumeController.updateResume);
meRouter.post("/resumes/:id/analyze", resumeController.analyzeResume);
meRouter.post("/resumes/:id/improve-ats", resumeController.improveResumeAts);
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
meRouter.get("/project-proposals", projectProposalController.listProjectProposals);
meRouter.post("/project-proposals/:id/accept", projectProposalController.acceptProjectProposal);
meRouter.post("/project-proposals/:id/dismiss", projectProposalController.dismissProjectProposal);

meRouter.post("/skills", profileController.createSkill);
meRouter.patch("/skills/:id", profileController.updateSkill);
meRouter.delete("/skills/:id", profileController.deleteSkill);

meRouter.post("/learning-goals", profileController.createLearningGoal);
meRouter.patch("/learning-goals/:id", profileController.updateLearningGoal);
meRouter.delete("/learning-goals/:id", profileController.deleteLearningGoal);

meRouter.get("/applications", applicationController.listApplications);
meRouter.post("/applications", applicationController.createApplication);
meRouter.patch("/applications/:id", applicationController.updateApplication);
meRouter.delete("/applications/:id", applicationController.deleteApplication);

router.use("/me", meRouter);

export default router;
