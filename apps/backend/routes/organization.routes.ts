import { Router } from 'express';
import { createOrganization, getOrganizations, deleteOrganization } from "../controllers/organization.controller.ts";
import { authMiddleware } from '../middleware/auth.middleware.ts';


const router = Router();

router.get('/', authMiddleware, getOrganizations);
router.post('/', authMiddleware, createOrganization);
router.delete('/:organizationId', authMiddleware, deleteOrganization);

export default router;