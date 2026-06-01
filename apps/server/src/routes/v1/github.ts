import { Router } from "express";

import * as githubController from "../../controllers/github.controller.js";
import { requireAuth } from "../../middleware/require-auth.js";

const router: Router = Router();
router.use(requireAuth);

router.get("/repos", githubController.getRepos);
router.post("/sync", githubController.syncRepos);

export default router;
