import "dotenv/config";
import { setTimeout } from "node:timers/promises";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { completePastBookedEvents } from "../src/lib/event-status.mjs";
import { nextEventStatusCheck } from "../src/lib/event-status-schedule.mjs";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

try {
  while (true) {
    await setTimeout(nextEventStatusCheck().getTime() - Date.now());
    await completePastBookedEvents(prisma);
  }
} finally {
  await prisma.$disconnect();
}
