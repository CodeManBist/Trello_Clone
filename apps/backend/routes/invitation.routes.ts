import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { createInvitation, acceptInvitation, getInvitations } from "../controllers/invitation.controller";

const router = Router();

router.get(
  "/invitations",
  authMiddleware,
  getInvitations
);

router.post(
  "/organizations/:organizationId/invitations",
  authMiddleware,
  createInvitation
);

router.post(
  "/invitations/:token/accept",
  authMiddleware,
  acceptInvitation
);

export default router;