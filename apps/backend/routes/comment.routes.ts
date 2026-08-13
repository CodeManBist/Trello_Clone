import { Router } from "express";
import {
    createComment,
    getComments,
    updateComment,
    deleteComment
  } from "../controllers/comment.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.get(
    "/issues/:issueId/comments",
    authMiddleware,
    getComments
  );

router.post(
  "/issues/:issueId/comments",
  authMiddleware,
  createComment
);

router.put(
    "/comments/:commentId",
    authMiddleware,
    updateComment
)

router.delete(
  "/comments/:commentId",
  authMiddleware,
  deleteComment
);

export default router;