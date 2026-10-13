import "dotenv/config";
import { setTimeout } from "node:timers/promises";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { completePastBookedEvents } from "../src/lib/event-status.mjs";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

try {
  while (true) {
    await completePastBookedEvents(prisma);
    await setTimeout(60000);
  }
} finally {
  await prisma.$disconnect();
}
