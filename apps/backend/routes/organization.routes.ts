import { Router } from 'express';
import { 
    createOrganization, 
    getOrganizations, 
    deleteOrganization, 
    getOrganizationMembers,
    removeOrganizationMember
} from "../controllers/organization.controller.ts";
import { authMiddleware } from '../middleware/auth.middleware.ts';


const router = Router();

router.get('/', authMiddleware, getOrganizations);
router.get("/:organizationId/members", authMiddleware, getOrganizationMembers);
router.post('/', authMiddleware, createOrganization);
router.delete('/:organizationId', authMiddleware, deleteOrganization);

router.delete(
    "/:organizationId/members/:userId",
    authMiddleware,
    removeOrganizationMember
  );
export default router;