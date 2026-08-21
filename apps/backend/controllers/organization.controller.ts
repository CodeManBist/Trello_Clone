import type { Request, Response } from "express";
import { prisma } from "db/client";

export async function createOrganization(
  req: Request,
  res: Response
) {
  const name = String(req.body.name ?? "").trim();
  const description = String(req.body.description ?? "").trim();

  if (!name) {
    return res.status(400).json({
      message: "Organization name is required",
    });
  }

  try {
    const organization = await prisma.organization.create({
      data: {
        name,
        description: description || null,

        memberships: {
          create: {
            userId: req.userId,
            role: "ADMIN",
          },
        },
      },
    });

    return res.status(201).json(organization);
  } catch (error: any) {
    if (error?.code === "P2002") {
      return res.status(409).json({
        message: "Organization name must be unique",
      });
    }

    console.error("Error creating organization:", error);

    return res.status(500).json({
      message: "Error creating organization",
    });
  }
}

export async function getOrganizations(
  req: Request,
  res: Response
) {
  try {
    const organizations = await prisma.membership.findMany({
      where: {
        userId: req.userId,
      },
      include: {
        organization: true,
      },
    });

    return res.status(200).json(organizations);
  } catch (error) {
    console.error("Error fetching organizations:", error);

    return res.status(500).json({
      message: "Error fetching organizations",
    });
  }
}

export async function getOrganizationMembers(
  req: Request<{ organizationId: string }>,
  res: Response
) {
  const { organizationId } = req.params;

  try {
    const membership = await prisma.membership.findFirst({
      where: {
        userId: req.userId,
        organizationId,
      },
    });

    if (!membership) {
      return res.status(403).json({
        message: "You are not a member of this organization",
      });
    }

    const members = await prisma.membership.findMany({
      where: {
        organizationId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
      orderBy: {
        user: {
          username: "asc",
        },
      },
    });

    return res.status(200).json(members);
  } catch (error) {
    console.error("Error fetching organization members:", error);

    return res.status(500).json({
      message: "Error fetching organization members",
    });
  }
}

export async function updateOrganization(
  req: Request<{ organizationId: string }>,
  res: Response
) {
  const { organizationId } = req.params;

  const name = String(req.body.name ?? "").trim();
  const description = String(req.body.description ?? "").trim();

  if (!name) {
    return res.status(400).json({
      message: "Organization name is required",
    });
  }

  try {
    const membership = await prisma.membership.findFirst({
      where: {
        userId: req.userId,
        organizationId,
      },
    });

    if (!membership) {
      return res.status(404).json({
        message: "Organization not found",
      });
    }

    if (membership.role !== "ADMIN") {
      return res.status(403).json({
        message: "Only admins can update the organization",
      });
    }

    const organization = await prisma.organization.update({
      where: {
        id: organizationId,
      },
      data: {
        name,
        description: description || null,
      },
    });

    return res.status(200).json(organization);
  } catch (error: any) {
    if (error?.code === "P2002") {
      return res.status(409).json({
        message: "Organization name must be unique",
      });
    }

    console.error("Error updating organization:", error);

    return res.status(500).json({
      message: "Error updating organization",
    });
  }
}

export async function removeOrganizationMember(
  req: Request<{
    organizationId: string;
    userId: string;
  }>,
  res: Response
) {
  const { organizationId, userId } = req.params;

  try {
    const adminMembership = await prisma.membership.findFirst({
      where: {
        userId: req.userId,
        organizationId,
        role: "ADMIN",
      },
    });

    if (!adminMembership) {
      return res.status(403).json({
        message: "Only organization admins can remove members",
      });
    }

    if (userId === req.userId) {
      return res.status(400).json({
        message: "You cannot remove yourself from the organization",
      });
    }

    const membership = await prisma.membership.findFirst({
      where: {
        userId,
        organizationId,
      },
    });

    if (!membership) {
      return res.status(404).json({
        message: "Member not found in this organization",
      });
    }

    await prisma.membership.delete({
      where: {
        id: membership.id,
      },
    });

    return res.status(200).json({
      message: "Member removed successfully",
    });
  } catch (error) {
    console.error("Error removing organization member:", error);

    return res.status(500).json({
      message: "Error removing member",
    });
  }
}

export async function deleteOrganization(
  req: Request<{ organizationId: string }>,
  res: Response
) {
  const { organizationId } = req.params;

  try {
    const membership = await prisma.membership.findFirst({
      where: {
        userId: req.userId,
        organizationId,
      },
    });

    if (!membership) {
      return res.status(404).json({
        message: "Organization not found",
      });
    }

    if (membership.role !== "ADMIN") {
      return res.status(403).json({
        message: "Only admins can delete the organization",
      });
    }

    await prisma.organization.delete({
      where: {
        id: organizationId,
      },
    });

    return res.status(200).json({
      message: "Organization deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting organization:", error);

    return res.status(500).json({
      message: "Error deleting organization",
    });
  }
}