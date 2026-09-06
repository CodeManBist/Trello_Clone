import { Router } from 'express';
import { getBoards, createBoard, updateBoard, deleteBoard, getBoardMembers } from '../controllers/board.controller.ts';
import { authMiddleware } from '../middleware/auth.middleware.ts';

const router = Router();

router.get('/organizations/:organizationId/boards', authMiddleware, getBoards);
router.get('/boards/:boardId/members', authMiddleware, getBoardMembers);
router.post('/organizations/:organizationId/boards', authMiddleware, createBoard);
router.put('/boards/:boardId', authMiddleware, updateBoard);
router.delete('/boards/:boardId', authMiddleware, deleteBoard);


export default router;
