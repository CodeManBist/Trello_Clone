import { Router } from "express";

import { getChatMessages } from "../controllers/chat.controller.ts";

import {
  authMiddleware,
} from "../middleware/auth.middleware.ts";

const router = Router();

router.get(
  "/boards/:boardId/chat-messages",
  authMiddleware,
  getChatMessages
);

export default router;
