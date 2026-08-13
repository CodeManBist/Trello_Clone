import { Router } from "express";
import {
  createSection,
  getSections,
  updateSection,
  deleteSection,
} from "../controllers/section.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.get(
  "/boards/:boardId/sections",
  authMiddleware,
  getSections
);

router.post(
  "/boards/:boardId/sections",
  authMiddleware,
  createSection
);

router.put(
  "/sections/:sectionId",
  authMiddleware,
  updateSection
);

router.delete(
  "/sections/:sectionId",
  authMiddleware,
  deleteSection
);

export default router;