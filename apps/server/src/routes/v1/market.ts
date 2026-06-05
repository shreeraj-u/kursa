import { Router } from "express";

import * as marketController from "../../controllers/market.controller.js";
import { requireAuth } from "../../middleware/require-auth.js";

const router: Router = Router();

router.use(requireAuth);
router.get("/context", marketController.getContext);

export default router;
