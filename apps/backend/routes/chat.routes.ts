import { Router } from "express";

import {
  getChatMessages,
  createChatMessage,
} from "../controllers/chat.controller.ts";

import {
  authMiddleware,
} from "../middleware/auth.middleware.ts";

const router = Router();

router.get(
  "/boards/:boardId/chat-messages",
  authMiddleware,
  getChatMessages
);

router.post(
  "/boards/:boardId/chat-messages",
  authMiddleware,
  createChatMessage
);

export default router;