import type { Request, Response } from 'express';
import { prisma } from 'db/client';

export async function createOrganization(req: Request, res: Response) {
    const { name, description } = req.body;

    if (!name) {
        return res.status(400).json({ message: 'Organization name is required' });
    }

    try {
        const organization = await prisma.organization.create({
            data: {
                name,
                description,

                memberships: {
                    create: {
                        userId: req.userId,
                        role: 'ADMIN'
                    }
                }
            }
        });

        return res.status(201).json(organization);
    } catch (error: any) {
        if(error.code === "p2002") {
            return res.status(409).json({ message: 'Organization name must be unique' });
        }

        console.error(error);

        return res.status(500).json({ message: 'Error creating organization' });
    }
}

export async function getOrganizations(req: Request, res: Response) {
    const userId = req.userId;

    try {
        const organizations = await prisma.membership.findMany({
            where: { userId },
            include: {
                organization: true
            }
        });

        return res.status(200).json(organizations);
    } catch (error: any) {
        console.error(error);
        return res.status(500).json({ message: 'Error fetching organizations' });
    }
}

export async function deleteOrganization(req: Request<{ organizationId: string }>, res: Response) {
    const { organizationId } = req.params;

    try {
        const membership = await prisma.membership.findFirst({
            where: {
                userId: req.userId,
                organizationId,
            }
        });

        if(!membership) {
            return res.status(404).json({
                message: "Organization not found",
            });
        }

        if(membership.role !== "ADMIN") {
            return res.status(403).json({
                message: "Only admins can delete the organization",
            });
        }

        await prisma.organization.delete({
            where: {
                id: organizationId,
            }
        })
    } catch (error: any) {
        console.log(error);
        
        res.status(500).json({ message: 'Error deleting organization' });
    }
} 
