import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const username = (process.env.SUPERUSER_USERNAME || "djfredo").trim().toLowerCase();
const password = process.env.SUPERUSER_PASSWORD;

if (!/^[a-z0-9][a-z0-9._-]{2,31}$/.test(username)) {
  throw new Error("SUPERUSER_USERNAME must be 3–32 lowercase letters, numbers, dots, underscores, or hyphens.");
}

if (!password || Buffer.byteLength(password, "utf8") < 10 || Buffer.byteLength(password, "utf8") > 72) {
  throw new Error("SUPERUSER_PASSWORD must be between 10 and 72 bytes.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

try {
  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.upsert({
    where: { username },
    create: {
      username,
      name: username,
      email: null,
      passwordHash,
      role: "ADMIN",
      status: "ACTIVE",
      organizationId: null,
    },
    update: {
      passwordHash,
      role: "ADMIN",
      status: "ACTIVE",
      organizationId: null,
    },
  });

  process.stdout.write(`Superuser ${username} is ready.\n`);
} finally {
  await prisma.$disconnect();
}
