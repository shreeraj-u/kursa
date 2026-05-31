import { Router } from "express";

import * as chatController from "../../controllers/chat.controller.js";
import { requireAuth } from "../../middleware/require-auth.js";

const router: Router = Router();
router.use(requireAuth);

router.get("/", chatController.listConversations);
router.post("/", chatController.createConversation);
router.post("/:id/messages", chatController.sendMessage);
router.post("/:id/decision", chatController.recordDecision);

export default router;
