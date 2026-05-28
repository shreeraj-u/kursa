import { Router } from "express";

import * as dashboardController from "../../controllers/dashboard.controller.js";
import * as profileController from "../../controllers/profile.controller.js";
import { requireAuth } from "../../middleware/require-auth.js";

const router: Router = Router();

// Apply authentication middleware to all profile routes
router.use(requireAuth);

router.get("/me", profileController.getMe);
router.put("/me", profileController.updateMe);
router.get("/me/observations", profileController.getObservations);
router.get("/me/dashboard", dashboardController.getDashboardMetrics);

export default router;
