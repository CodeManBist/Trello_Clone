import type { Request, Response } from 'express';
import { prisma } from 'db/client';

export async function getBoards(req: Request<{ organizationId: string }>, res: Response) {
    const { organizationId } = req.params;

    try {
        const membership = await prisma.membership.findFirst({
            where: {
                userId: req.userId,
                organizationId,
            },
        });

        if(!membership) {
            return res.status(403).json({ message: 'You are not authorized to view boards in this organization' });
        }

        const boards = await prisma.board.findMany({
            where: {
                organizationId,
            },
            include: {
                sections: true,
            },
        });

        return res.status(200).json(boards);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'error fetching boards' });
    }
}

export async function createBoard(req: Request<{ organizationId: string }>, res: Response) {
    const { organizationId } = req.params;

    const { title } = req.body;

    if(!title) {
        return res.status(400).json({ message: 'title is required' });
    }

    try {
        const membership = await prisma.membership.findFirst({
            where: {
                userId: req.userId,
                organizationId,
                role: 'ADMIN',
            },
        }); 

        if(!membership) {
            return res.status(403).json({ message: 'You are not authorized to create a board in this organization' });
        }

        const board = await prisma.board.create({
            data: {
                title,
                organizationId,
            }
        });

        return res.status(201).json(board);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'error creating board' });
    }
}

export async function updateBoard(req: Request<{ boardId: string }>, res: Response) {
    const { boardId } = req.params;

    const { title } = req.body;

    if(!title) {
        return res.status(400).json({ message: 'title is required' });
    }

    try {
        const board = await prisma.board.findUnique({
            where: {
                id: boardId,
            },
        });

        if(!board) {
            return res.status(404).json({ message: 'Board not found' });
        }

        const membership = await prisma.membership.findFirst({
            where: {
                userId: req.userId,
                organizationId: board.organizationId,
                role: 'ADMIN',
            },
        });

        if(!membership) {
            return res.status(403).json({ message: 'You are not authorized to update this board' });
        }

        const updatedBoard = await prisma.board.update({
            where: {
                id: boardId,
            },
            data: {
                title,
            }
        });

        return res.status(200).json(updatedBoard);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'error updating board' });
    }
}

export async function deleteBoard(req: Request<{ boardId: string }>, res: Response) {
    const { boardId } = req.params;

    try {
        const board = await prisma.board.findUnique({
            where: {
                id: boardId,
            },
        });

        if(!board) {
            return res.status(404).json({ message: 'Board not found' });
        }

        const membership = await prisma.membership.findFirst({
            where: {
                userId: req.userId,
                organizationId: board.organizationId,
                role: 'ADMIN',
            },
        });

        if(!membership) {
            return res.status(403).json({ message: 'You are not authorized to delete this board' });
        }

        await prisma.board.delete({
            where: {
                id: boardId,
            }
        });

        return res.status(200).json({ message: 'Board deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'error deleting board' });
    }
}