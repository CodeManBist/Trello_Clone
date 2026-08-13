import type{ Request, Response } from "express";
import { prisma } from "db/client";

export async function createSection(
    req: Request<{ boardId: string }>,
    res: Response
) {
    const { boardId } = req.params;
    const { title } = req.body;

    if(!title) {
        res.status(400).json({ messaage: "Section title is required" })
    }

    try {
        const board = await prisma.board.findUnique({
            where: {
                id: boardId,
            },
        });

        if(!board) {
            return res.status(404).json({ message: "Board not found" });
        }

        const membership = await prisma.membership.findFirst({
            where: {
                id: userId,
                organizationId: board.organizationId,
                role: "ADMIN",
            },
        });

        if(!membership) {
            return res.status(403).json({ message: "Only organization admins can create sections" });
        };

        const section = await prisma.section.create({
            data: {
                title,
                boardId,
            },
        });

        return res.status(201).json(section);
    } catch(error) {
        console.log(error);
        res.status(500).json({ message: "Error creating section" });
    }
}

export async function getSections(
    req: Request<{ boardId: string }>,
    res: Response
  ) {
    const { boardId } = req.params;
  
    try {
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
  
      const membership = await prisma.membership.findFirst({
        where: {
          userId: req.userId,
          organizationId: board.organizationId,
        },
      });
  
      if (!membership) {
        return res.status(403).json({
          message: "You are not a member of this organization",
        });
      }
  
      const sections = await prisma.section.findMany({
        where: {
          boardId,
        },
        include: {
          issues: true,
        },
      });
  
      return res.status(200).json(sections);
    } catch (error) {
      console.error(error);
  
      return res.status(500).json({
        message: "Error fetching sections",
      });
    }
  }

  export async function updateSection(
    req: Request<{ sectionId: string }>,
    res: Response
  ) {
    const { sectionId } = req.params;
    const { title } = req.body;
  
    if (!title) {
      return res.status(400).json({
        message: "Section title is required",
      });
    }
  
    try {
      const section = await prisma.section.findUnique({
        where: {
          id: sectionId,
        },
        include: {
          board: true,
        },
      });
  
      if (!section) {
        return res.status(404).json({
          message: "Section not found",
        });
      }
  
      const membership = await prisma.membership.findFirst({
        where: {
          userId: req.userId,
          organizationId: section.board.organizationId,
          role: "ADMIN",
        },
      });
  
      if (!membership) {
        return res.status(403).json({
          message: "Only organization admins can update sections",
        });
      }
  
      const updatedSection = await prisma.section.update({
        where: {
          id: sectionId,
        },
        data: {
          title,
        },
      });
  
      return res.status(200).json(updatedSection);
    } catch (error) {
      console.error(error);
  
      return res.status(500).json({
        message: "Error updating section",
      });
    }
  }

  export async function deleteSection(
    req: Request<{ sectionId: string }>,
    res: Response
  ) {
    const { sectionId } = req.params;
  
    try {
      const section = await prisma.section.findUnique({
        where: {
          id: sectionId,
        },
        include: {
          board: true,
        },
      });
  
      if (!section) {
        return res.status(404).json({
          message: "Section not found",
        });
      }
  
      const membership = await prisma.membership.findFirst({
        where: {
          userId: req.userId,
          organizationId: section.board.organizationId,
          role: "ADMIN",
        },
      });
  
      if (!membership) {
        return res.status(403).json({
          message: "Only organization admins can delete sections",
        });
      }
  
      await prisma.section.delete({
        where: {
          id: sectionId,
        },
      });
  
      return res.status(200).json({
        message: "Section deleted successfully",
      });
    } catch (error) {
      console.error(error);
  
      return res.status(500).json({
        message: "Error deleting section",
      });
    }
  }