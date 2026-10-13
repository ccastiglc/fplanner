export async function completePastBookedEvents(client) {
  return client.$executeRaw`
    UPDATE "Event"
    SET "status" = 'Completed', "updatedAt" = CURRENT_TIMESTAMP
    WHERE LOWER("status") IN ('booked', 'confirmed')
      AND "eventDate" < (CURRENT_TIMESTAMP AT TIME ZONE "timezone")::date
  `;
}
