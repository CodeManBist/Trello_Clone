import type { Request, Response } from "express";
import { prisma } from "db/client";

// GET issues in a section
export async function getIssues(
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
      },
    });

    if (!membership) {
      return res.status(403).json({
        message: "You are not a member of this organization",
      });
    }

    const issues = await prisma.issue.findMany({
      where: {
        sectionId,
      },
      include: {
        assignees: {
          include: {
            user: true,
          },
        },
        comments: {
          include: {
            user: true,
          },
        },
      },
    });

    return res.status(200).json(issues);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Error fetching issues",
    });
  }
}


// CREATE issue
export async function createIssue(
  req: Request<{ sectionId: string }>,
  res: Response
) {
  const { sectionId } = req.params;
  const { title, description } = req.body;

  if (!title) {
    return res.status(400).json({
      message: "Issue title is required",
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
      },
    });

    if (!membership) {
      return res.status(403).json({
        message: "You are not a member of this organization",
      });
    }

    const issue = await prisma.issue.create({
      data: {
        title,
        description,
        boardId: section.board.id,
        sectionId,
      },
    });

    return res.status(201).json(issue);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Error creating issue",
    });
  }
}


// UPDATE issue
export async function updateIssue(
  req: Request<{ issueId: string }>,
  res: Response
) {
  const { issueId } = req.params;
  const { title, description } = req.body;

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

    const updatedIssue = await prisma.issue.update({
      where: {
        id: issueId,
      },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
      },
    });

    return res.status(200).json(updatedIssue);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Error updating issue",
    });
  }
}


// DELETE issue
export async function deleteIssue(
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
        role: "ADMIN",
      },
    });

    if (!membership) {
      return res.status(403).json({
        message: "Only organization admins can delete issues",
      });
    }

    await prisma.issue.delete({
      where: {
        id: issueId,
      },
    });

    return res.status(200).json({
      message: "Issue deleted successfully",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Error deleting issue",
    });
  }
}

export async function assignUserToIssue(
    req: Request<{ issueId: string; userId: string }>,
    res: Response
  ) {
    const { issueId, userId } = req.params;
  
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
  
      const organizationId = issue.section.board.organizationId;
  
      // Check that the logged-in user belongs to the organization
      const currentUserMembership = await prisma.membership.findFirst({
        where: {
          userId: req.userId,
          organizationId,
        },
      });
  
      if (!currentUserMembership) {
        return res.status(403).json({
          message: "You are not a member of this organization",
        });
      }
  
      // Check that the user being assigned belongs to the organization
      const userMembership = await prisma.membership.findFirst({
        where: {
          userId,
          organizationId,
        },
      });
  
      if (!userMembership) {
        return res.status(400).json({
          message: "User is not a member of this organization",
        });
      }
  
      const assignment = await prisma.issuesMapping.create({
        data: {
          issueId,
          userId,
        },
      });
  
      return res.status(201).json(assignment);
    } catch (error: any) {
      console.error(error);
  
      if (error.code === "P2002") {
        return res.status(409).json({
          message: "User is already assigned to this issue",
        });
      }
  
      return res.status(500).json({
        message: "Error assigning user to issue",
      });
    }
  }

  export async function moveIssue(
    req: Request<{ issueId: string }>,
    res: Response
  ) {
    const { issueId } = req.params;
    const { sectionId } = req.body;
  
    if (!sectionId) {
      return res.status(400).json({
        message: "Section ID is required",
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
  
      // Find the new section
      const newSection = await prisma.section.findUnique({
        where: {
          id: sectionId,
        },
        include: {
          board: true,
        },
      });
  
      if (!newSection) {
        return res.status(404).json({
          message: "New section not found",
        });
      }
  
      // Make sure both sections belong to the same board
      if (newSection.boardId !== issue.boardId) {
        return res.status(400).json({
          message: "Issue can only be moved within the same board",
        });
      }
  
      // Check that the logged-in user belongs to the organization
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
  
      const updatedIssue = await prisma.issue.update({
        where: {
          id: issueId,
        },
        data: {
          sectionId,
        },
      });
  
      return res.status(200).json(updatedIssue);
    } catch (error) {
      console.error(error);
  
      return res.status(500).json({
        message: "Error moving issue",
      });
    }
  }

  export async function removeUserFromIssue(
    req: Request<{ issueId: string; userId: string }>,
    res: Response
  ) {
    const { issueId, userId } = req.params;
  
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
  
      const assignment = await prisma.issuesMapping.findFirst({
        where: {
          issueId,
          userId,
        },
      });
  
      if (!assignment) {
        return res.status(404).json({
          message: "User is not assigned to this issue",
        });
      }
  
      await prisma.issuesMapping.delete({
        where: {
          id: assignment.id,
        },
      });
  
      return res.status(200).json({
        message: "User removed from issue successfully",
      });
    } catch (error) {
      console.error(error);
  
      return res.status(500).json({
        message: "Error removing user from issue",
      });
    }
  }