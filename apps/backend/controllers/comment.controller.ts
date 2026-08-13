import type { Request, Response } from "express";
import { prisma } from "db/client";

export async function createComment(
  req: Request<{ issueId: string }>,
  res: Response
) {
  const { issueId } = req.params;
  const { content } = req.body;

  if (!content) {
    return res.status(400).json({
      message: "Comment content is required",
    });
  }

  try {
    const issue = await prisma.issue.findUnique({
      where: {
        id: issueId,
      },
      include: {
        section: {
          include: {
            board: true,
          },
        },
      },
    });

    if (!issue) {
      return res.status(404).json({
        message: "Issue not found",
      });
    }

    const membership = await prisma.membership.findFirst({
      where: {
        userId: req.userId,
        organizationId: issue.section.board.organizationId,
      },
    });

    if (!membership) {
      return res.status(403).json({
        message: "You are not a member of this organization",
      });
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        userId: req.userId,
        issueId,
      },
      include: {
        user: true,
      },
    });

    return res.status(201).json(comment);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Error creating comment",
    });
  }
}

export async function getComments(
    req: Request<{ issueId: string }>,
    res: Response
  ) {
    const { issueId } = req.params;
  
    try {
      const issue = await prisma.issue.findUnique({
        where: {
          id: issueId,
        },
        include: {
          section: {
            include: {
              board: true,
            },
          },
        },
      });
  
      if (!issue) {
        return res.status(404).json({
          message: "Issue not found",
        });
      }
  
      const membership = await prisma.membership.findFirst({
        where: {
          userId: req.userId,
          organizationId: issue.section.board.organizationId,
        },
      });
  
      if (!membership) {
        return res.status(403).json({
          message: "You are not a member of this organization",
        });
      }
  
      const comments = await prisma.comment.findMany({
        where: {
          issueId,
        },
        include: {
          user: true,
        },
        orderBy: {
          id: "asc",
        },
      });
  
      return res.status(200).json(comments);
    } catch (error) {
      console.error(error);
  
      return res.status(500).json({
        message: "Error fetching comments",
      });
    }
  }

  export async function updateComment(
    req: Request< {commentId: string} >,
    res: Response
  ) {
    const { issueId } = req.params;

    const { content } = req.body;

    if(!content) {
        res.status(400).json({ message: "Comment content is required" });
    }

    try {
        const comment = await prisma.comment.findUnique({
            where: {
                id: commentId,
            },
        });

        if(!comment) {
            return res.status(404).json({ message: "Comment not found" });
        }

        if(comment.userId != req.userId) {
            return res.status(403).json({ message: "You can only update your own comments" });
        }

        const updatedComment = await prisma.comment.update({
            where: {
                id: commentId,
            },
            data: {
                content,
            },
        });

        return res.status(200).json(updatedComment);

    } catch(error) {
        console.log(error);
        res.status(500).json({ message: "Error updating comment" })
    }
  }

  export async function deleteComment(
    req: Request<{ commentId: string }>,
    res: Response
  ) {
    const { commentId } = req.params;
  
    try {
      const comment = await prisma.comment.findUnique({
        where: {
          id: commentId,
        },
      });
  
      if (!comment) {
        return res.status(404).json({
          message: "Comment not found",
        });
      }
  
      if (comment.userId !== req.userId) {
        return res.status(403).json({
          message: "You can only delete your own comments",
        });
      }
  
      await prisma.comment.delete({
        where: {
          id: commentId,
        },
      });
  
      return res.status(200).json({
        message: "Comment deleted successfully",
      });
    } catch (error) {
      console.error(error);
  
      return res.status(500).json({
        message: "Error deleting comment",
      });
    }
  }