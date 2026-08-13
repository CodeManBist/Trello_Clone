import { Router } from "express";

import {
  getIssues,
  createIssue,
  assignUserToIssue,
  moveIssue,
  updateIssue,
  removeUserFromIssue,
  deleteIssue,
} from "../controllers/issue.controller";

import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.get(
  "/sections/:sectionId/issues",
  authMiddleware,
  getIssues
);

router.post(
  "/sections/:sectionId/issues",
  authMiddleware,
  createIssue
);

router.post(
    "/issues/:issueId/assignees/:userId",
    authMiddleware,
    assignUserToIssue
  );

  router.put(
    "/issues/:issueId/move",
    authMiddleware,
    moveIssue
  );

router.put(
  "/issues/:issueId",
  authMiddleware,
  updateIssue
);

router.delete(
    "/issues/:issueId/assignees/:userId",
    authMiddleware,
    removeUserFromIssue
  );

router.delete(
  "/issues/:issueId",
  authMiddleware,
  deleteIssue
);

export default router;