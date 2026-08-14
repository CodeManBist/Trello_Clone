import { prisma } from "db/client";

const bimal = await prisma.user.findUnique({
  where: {
    email: "bimal@example.com",
  },
});

if (!bimal) {
  throw new Error("Bimal not found");
}

const membership = await prisma.membership.create({
  data: {
    userId: bimal.id,
    organizationId: "34555f49-133a-429e-88e9-e9fa67d48c8e",
    role: "MEMBER",
  },
});

console.log("Bimal added:", membership);

process.exit(0);