import express from 'express';
import { prisma } from 'db/client';

import authRoutes from './routes/auth.routes.ts';
import organizationRoutes from './routes/organization.routes.ts';   
import invitationRoutes from './routes/invitation.routes.ts';
import boardRoutes from './routes/board.routes.ts';
import sectionRoutes from "./routes/section.routes";
import issueRoutes from "./routes/issue.routes";
import commentRoutes from "./routes/comment.routes";

const app = express();

app.use(express.json());

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/organizations', organizationRoutes);
app.use("/api", invitationRoutes);
app.use("/api", boardRoutes);
app.use("/api", sectionRoutes);
app.use("/api", issueRoutes);
app.use("/api", commentRoutes);

app.listen(3001, () => {
    console.log('Backend running on http://localhost:3001');  
});

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