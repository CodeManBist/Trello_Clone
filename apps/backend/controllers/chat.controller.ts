import type { Request, Response } from "express";
import { prisma } from "db/client";

/*
 * ============================================
 * CREATE CHAT MESSAGE
 * ============================================
 */
export async function createChatMessage(
  req: Request<{ boardId: string }>,
  res: Response
) {
  const { boardId } = req.params;
  const { content } = req.body;

  /*
   * Validate content
   */
  if (
    typeof content !== "string" ||
    content.trim().length === 0
  ) {
    return res.status(400).json({
      message: "Message cannot be empty",
    });
  }

  const trimmedContent = content.trim();

  if (trimmedContent.length > 1000) {
    return res.status(400).json({
      message: "Message cannot exceed 1000 characters",
    });
  }

  try {
    /*
     * Find board
     */
    const board = await prisma.board.findUnique({
      where: {
        id: boardId,
      },
    });

    if (!board) {
      return res.status(404).json({
        message: "Board not found",
      });
    }

    /*
     * Check membership
     */
    const membership =
      await prisma.membership.findFirst({
        where: {
          userId: req.userId,
          organizationId: board.organizationId,
        },
      });

    if (!membership) {
      return res.status(403).json({
        message:
          "You are not a member of this organization",
      });
    }

    /*
     * Save message
     */
    const chatMessage =
      await prisma.chatMessage.create({
        data: {
          content: trimmedContent,
          userId: req.userId,
          boardId,
        },

        include: {
          user: {
            select: {
              id: true,
              username: true,
            },
          },
        },
      });

    /*
     * Return the exact shape
     * frontend expects.
     */
    return res.status(201).json({
      id: chatMessage.id,
      content: chatMessage.content,
      userId: chatMessage.userId,
      username: chatMessage.user.username,
      boardId: chatMessage.boardId,
      createdAt: chatMessage.createdAt,
    });
  } catch (error) {
    console.error(
      "Error creating chat message:",
      error
    );

    return res.status(500).json({
      message: "Error creating chat message",
    });
  }
}


/*
 * ============================================
 * GET CHAT MESSAGES
 * ============================================
 */
export async function getChatMessages(
  req: Request<{ boardId: string }>,
  res: Response
) {
  const { boardId } = req.params;

  try {
    /*
     * Find board
     */
    const board = await prisma.board.findUnique({
      where: {
        id: boardId,
      },
    });

    if (!board) {
      return res.status(404).json({
        message: "Board not found",
      });
    }

    /*
     * Check membership
     */
    const membership =
      await prisma.membership.findFirst({
        where: {
          userId: req.userId,
          organizationId: board.organizationId,
        },
      });

    if (!membership) {
      return res.status(403).json({
        message:
          "You are not a member of this organization",
      });
    }

    /*
     * Get messages
     */
    const messages =
      await prisma.chatMessage.findMany({
        where: {
          boardId,
        },

        include: {
          user: {
            select: {
              id: true,
              username: true,
            },
          },
        },

        orderBy: {
          createdAt: "asc",
        },

        take: 100,
      });

    return res.status(200).json(
      messages.map((message) => ({
        id: message.id,
        content: message.content,
        userId: message.userId,
        username: message.user.username,
        boardId: message.boardId,
        createdAt: message.createdAt,
      }))
    );
  } catch (error) {
    console.error(
      "Error fetching chat messages:",
      error
    );

    return res.status(500).json({
      message: "Error fetching chat messages",
    });
  }
}