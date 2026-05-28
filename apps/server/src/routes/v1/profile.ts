import { Router } from "express";

import * as dashboardController from "../../controllers/dashboard.controller.js";
import * as profileController from "../../controllers/profile.controller.js";
import { requireAuth } from "../../middleware/require-auth.js";

const router: Router = Router();

// Apply authentication middleware to all profile routes
router.use(requireAuth);

const meRouter: Router = Router();

meRouter.get("/", profileController.getMe);
meRouter.put("/", profileController.updateMe);
meRouter.get("/observations", profileController.getObservations);
meRouter.get("/dashboard", dashboardController.getDashboardMetrics);
meRouter.post("/social-links", profileController.createSocialLink);
meRouter.put("/social-links/:id", profileController.updateSocialLink);
meRouter.delete("/social-links/:id", profileController.deleteSocialLink);

router.use("/me", meRouter);

export default router;
