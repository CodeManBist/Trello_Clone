import type { Request, Response } from "express";
import { prisma } from "db/client";
import crypto from "crypto";

/**
 * Create an invitation for an existing platform user.
 *
 * V1 rule:
 * - Only organization ADMINs can invite users.
 * - The invited email must already belong to a registered user.
 * - A user can only belong to an organization once.
 * - A pending invitation cannot be duplicated.
 */
export async function createInvitation(
  req: Request<{ organizationId: string }>,
  res: Response
) {
  const { organizationId } = req.params;

  const email =
    typeof req.body.email === "string"
      ? req.body.email.trim().toLowerCase()
      : "";

  if (!email) {
    return res.status(400).json({
      message: "Email is required",
    });
  }

  try {
    // --------------------------------------------------
    // 1. Check whether the logged-in user is an ADMIN
    // --------------------------------------------------
    const membership = await prisma.membership.findUnique({
      where: {
        userId_organizationId: {
          userId: req.userId,
          organizationId,
        },
      },
    });

    if (!membership || membership.role !== "ADMIN") {
      return res.status(403).json({
        message: "Only admins can invite users",
      });
    }

    // --------------------------------------------------
    // 2. Check whether the invited user exists
    // --------------------------------------------------
    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!existingUser) {
      return res.status(404).json({
        message: "No user with this email exists on the platform",
      });
    }

    // --------------------------------------------------
    // 3. Check whether the user is already a member
    // --------------------------------------------------
    const existingMembership =
      await prisma.membership.findUnique({
        where: {
          userId_organizationId: {
            userId: existingUser.id,
            organizationId,
          },
        },
      });

    if (existingMembership) {
      return res.status(409).json({
        message:
          "User is already a member of this organization",
      });
    }

    // --------------------------------------------------
    // 4. Check whether a pending invitation already exists
    // --------------------------------------------------
    const existingInvitation =
      await prisma.invitation.findFirst({
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

    // --------------------------------------------------
    // 5. Create invitation
    // --------------------------------------------------
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
    console.error("Create invitation error:", error);

    return res.status(500).json({
      message: "Error creating invitation",
    });
  }
}

/**
 * Accept an organization invitation.
 *
 * V1 rule:
 * Once the user accepts the organization invitation,
 * they become a MEMBER of the organization and therefore
 * have access to all boards in that organization.
 */
export async function acceptInvitation(
  req: Request<{ token: string }>,
  res: Response
) {
  const { token } = req.params;

  if (!token) {
    return res.status(400).json({
      message: "Invitation token is required",
    });
  }

  try {
    // --------------------------------------------------
    // 1. Find invitation
    // --------------------------------------------------
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

    // --------------------------------------------------
    // 2. Check invitation status
    // --------------------------------------------------
    if (invitation.status !== "PENDING") {
      return res.status(400).json({
        message: "Invitation has already been accepted",
      });
    }

    // --------------------------------------------------
    // 3. Find currently logged-in user
    // --------------------------------------------------
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

    // --------------------------------------------------
    // 4. Make sure invitation belongs to this user
    // --------------------------------------------------
    const userEmail = user.email.trim().toLowerCase();
    const invitationEmail = invitation.email
      .trim()
      .toLowerCase();

    if (userEmail !== invitationEmail) {
      return res.status(403).json({
        message: "This invitation is not for this user",
      });
    }

    // --------------------------------------------------
    // 5. Check if user is already a member
    // --------------------------------------------------
    const existingMembership =
      await prisma.membership.findUnique({
        where: {
          userId_organizationId: {
            userId: user.id,
            organizationId: invitation.organizationId,
          },
        },
      });

    if (existingMembership) {
      // The user is already a member.
      // Mark the invitation as accepted so it doesn't
      // remain pending.
      await prisma.invitation.update({
        where: {
          id: invitation.id,
        },
        data: {
          status: "ACCEPTED",
        },
      });

      return res.status(409).json({
        message:
          "User is already a member of this organization",
        membership: existingMembership,
      });
    }

    // --------------------------------------------------
    // 6. Create membership + accept invitation together
    // --------------------------------------------------
    const result = await prisma.$transaction(
      async (tx) => {
        const membership =
          await tx.membership.create({
            data: {
              userId: user.id,
              organizationId:
                invitation.organizationId,
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
      }
    );

    return res.status(200).json({
      message: "Invitation accepted successfully",
      membership: result,
    });
  } catch (error) {
    console.error("Accept invitation error:", error);

    return res.status(500).json({
      message: "Error accepting invitation",
    });
  }
}

/**
 * Get pending invitations for the logged-in user.
 */
export async function getInvitations(
  req: Request,
  res: Response
) {
  try {
    // --------------------------------------------------
    // 1. Find logged-in user
    // --------------------------------------------------
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

    // --------------------------------------------------
    // 2. Get pending invitations
    // --------------------------------------------------
    const invitations =
      await prisma.invitation.findMany({
        where: {
          email: user.email.trim().toLowerCase(),
          status: "PENDING",
        },
        include: {
          organization: true,
          invitedBy: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

    return res.status(200).json(invitations);
  } catch (error) {
    console.error("Get invitations error:", error);

    return res.status(500).json({
      message: "Error fetching invitations",
    });
  }
}