import { Router } from 'express';

const router = Router();

import { signup, signin } from '../controllers/auth.controller.ts';

router.post('/signup', signup);
router.post('/signin', signin);

export default router;