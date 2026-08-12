import { Router } from 'express';
import { createOrganization, getOrganizations } from "../controllers/organization.controller.ts";
import { authMiddleware } from '../middleware/auth.middleware.ts';


const router = Router();

router.get('/', authMiddleware, getOrganizations);
router.post('/', authMiddleware, createOrganization);

export default router;