import type { Request, Response } from "express";
import { prisma } from "db/client";
import crypto from "crypto";

export async function createInvitation(req: Request<{ organizationId: string }>, res: Response) {
  const { organizationId } = req.params;
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      message: "Email is required",
    });
  }

  try {
    // Check whether the logged-in user is an admin
    const membership = await prisma.membership.findFirst({
      where: {
        userId: req.userId,
        organizationId,
      },
    });

    if (!membership || membership.role !== "ADMIN") {
      return res.status(403).json({
        message: "Only admins can invite users",
      });
    }

    // Check if this email is already a member
    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      const existingMembership = await prisma.membership.findFirst({
        where: {
          userId: existingUser.id,
          organizationId,
        },
      });

      if (existingMembership) {
        return res.status(409).json({
          message: "User is already a member of this organization",
        });
      }
    }

    // Check existing invitation
    const existingInvitation = await prisma.invitation.findFirst({
      where: {
        email,
        organizationId,
        status: "PENDING",
      },
    });

    if (existingInvitation) {
      return res.status(409).json({
        message: "Invitation already sent",
      });
    }

    const token = crypto.randomUUID();

    const invitation = await prisma.invitation.create({
      data: {
        email,
        organizationId,
        invitedById: req.userId,
        token,
      },
    });

    return res.status(201).json({
      message: "Invitation created successfully",
      invitation,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Error creating invitation",
    });
  }
}

export async function acceptInvitation(
  req: Request<{ token: string }>,
  res: Response
) {
  const { token } = req.params;

  try {
    const invitation = await prisma.invitation.findUnique({
      where: {
        token,
      },
    });

    if (!invitation) {
      return res.status(404).json({
        message: "Invitation not found",
      });
    }

    if (invitation.status !== "PENDING") {
      return res.status(400).json({
        message: "Invitation has already been accepted",
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: req.userId,
      },
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (user.email !== invitation.email) {
      return res.status(403).json({
        message: "This invitation is not for this user",
      });
    }

    // Both operations happen together
    const result = await prisma.$transaction(async (tx) => {
      const membership = await tx.membership.create({
        data: {
          userId: user.id,
          organizationId: invitation.organizationId,
          role: "MEMBER",
        },
      });

      await tx.invitation.update({
        where: {
          id: invitation.id,
        },
        data: {
          status: "ACCEPTED",
        },
      });

      return membership;
    });

    return res.status(200).json({
      message: "Invitation accepted successfully",
      membership: result,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Error accepting invitation",
    });
  }
}

export async function getInvitations(req: Request, res: Response) {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: req.userId,
      },
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const invitations = await prisma.invitation.findMany({
      where: {
        email: user.email,
        status: "PENDING",
      },
      include: {
        organization: true,
      },
    });

    return res.status(200).json(invitations);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Error fetching invitations",
    });
  }
}