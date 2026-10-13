import type { Prisma } from "@prisma/client";
import { ImportRowError } from "@/lib/data-import";
import { importValue, redactImportedNotes, type ImportedRow } from "@/lib/spreadsheet";
import { BOOLEAN_FIELDS, DATE_FIELDS, EVENT_DETAIL_GROUPS, MONEY_FIELDS } from "@/lib/event-fields";
import { eventDateValue, eventInstants, eventTimeValue } from "@/lib/event-time";
import { eventImportLink } from "@/lib/event-import-links";
import { importEventPlanning } from "@/lib/event-planning-import";

export async function importEvent(transaction: Prisma.TransactionClient, row: ImportedRow, organizationId: string, createdBy: string) {
  const value = (...labels: string[]) => importValue(row, ...labels);
  const sourceId = value("Event ID");
  if (!sourceId) throw new ImportRowError("Missing Event ID; use a DJ Event Planner event export.");
  if (await transaction.event.findUnique({ where: { organizationId_sourceId: { organizationId, sourceId } } })) throw new ImportRowError("Event already imported; edit its existing profile instead.");
  const eventDate = eventDateValue(value("Event Date"));
  if (!eventDate) throw new ImportRowError("Invalid or missing Event Date.");
  const issues: string[] = [];
  const details: Record<string, string> = {};
  for (const group of EVENT_DETAIL_GROUPS) {
    for (const label of group.fields) {
      const input = value(label);
      if (MONEY_FIELDS.has(label) && input && !/^-?\d+(?:\.\d{1,2})?$/.test(input)) throw new ImportRowError(`Invalid ${label}.`);
      if (DATE_FIELDS.has(label) && input && !eventDateValue(input)) issues.push(`${label} could not be parsed: ${input}`);
      details[label] = BOOLEAN_FIELDS.has(label) ? String(input.toLowerCase() === "true") : DATE_FIELDS.has(label) ? eventDateValue(input)?.toISOString().slice(0, 10) ?? "" : redactImportedNotes(input);
    }
  }
  const clientName = value("Client Name");
  const venueName = value("Venue Name");
  let clientId = clientName || value("Client ID") ? await eventImportLink(transaction, "client", organizationId, value("Client ID"), clientName) : null;
  if (!clientId && clientName) clientId = (await transaction.client.create({ data: { organizationId, djepId: value("Client ID") || null, name: clientName, contactName: clientName } })).id;
  let venueId = venueName || value("Venue ID") ? await eventImportLink(transaction, "venue", organizationId, value("Venue ID"), venueName) : null;
  if (!venueId && venueName && venueName.toLowerCase() !== "tbd") venueId = (await transaction.venue.create({ data: { organizationId, djepId: value("Venue ID") || null, name: venueName, address: value("Venue Address") || null, city: value("Venue City") || null, state: value("Venue State") || null, postalCode: value("Venue Zipcode") || null, country: "USA" } })).id;
  const secondId = value("Venue ID 2");
  const secondVenueId = secondId && secondId !== "0" ? await eventImportLink(transaction, "venue", organizationId, secondId, "") : null;
  if (secondId && secondId !== "0" && !secondVenueId) issues.push("Second venue source ID has no matching venue; select it in the event profile.");
  const staffAssignments: { staffId: string; role: string; fee: string }[] = [];
  for (let index = 1; index <= 15; index += 1) {
    const header = index === 1 ? "Assigned Employee" : `Assigned Employee ${index}`;
    const name = value(header);
    if (!name || name === "NO DJ ASSIGNED !!") continue;
    let staffId = await eventImportLink(transaction, "staff", organizationId, "", name);
    if (!staffId) staffId = (await transaction.staff.create({ data: { organizationId, name } })).id;
    const fee = value(`${header} Fee`) || "0";
    if (!/^\d+(?:\.\d{1,2})?$/.test(fee)) throw new ImportRowError("Invalid employee fee.");
    if (!staffAssignments.some((assignment) => assignment.staffId === staffId)) staffAssignments.push({ staffId, role: value(`${header} Role`) || "dj", fee });
  }
  const eventServices: { serviceId: string; quantity: number; bookedFee: string }[] = [];
  for (let index = 1; index <= 20; index += 1) {
    const name = value(`Addon ${index}`);
    if (!name) continue;
    const quantity = Number(value(`Addon ${index} Quantity`) || "0");
    const bookedFee = value(`Addon ${index} Fee`) || "0";
    if (!Number.isInteger(quantity) || quantity < 0 || !/^\d+(?:\.\d{1,2})?$/.test(bookedFee)) throw new ImportRowError("Invalid add-on quantity or fee.");
    let serviceId = await eventImportLink(transaction, "service", organizationId, "", name);
    if (!serviceId) serviceId = (await transaction.service.create({ data: { organizationId, name, price: 0 } })).id;
    eventServices.push({ serviceId, quantity, bookedFee });
  }
  const packageId = value("Package ID");
  if (packageId && packageId !== "0") {
    const serviceId = await eventImportLink(transaction, "service", organizationId, packageId, "");
    if (serviceId) eventServices.unshift({ serviceId, quantity: 1, bookedFee: details["Package Price"] || "0" });
    else issues.push(`Package ${packageId} has no mapped service; select its catalog record. Package price is retained in Financials.`);
  }
  const startTime = eventTimeValue(value("Start Time", "Start Time 2"));
  const endTime = eventTimeValue(value("End Time"));
  const setupTime = eventTimeValue(value("Setup Time"));
  if (!startTime) issues.push(`Start time needs review: ${value("Start Time") || "not set"}`);
  if (!endTime) issues.push(`End time needs review: ${value("End Time") || "not set"}`);
  if (setupTime === null) issues.push(`Setup time needs review: ${value("Setup Time")}`);
  const endNextDay = !!(startTime && endTime && endTime <= startTime && endTime <= "06:00");
  const conflictingEnd = !!(startTime && endTime && endTime <= startTime && !endNextDay);
  if (conflictingEnd) issues.push(`End ${endTime} precedes start ${startTime}; no overnight assumption was made.`);
  if (setupTime && startTime && setupTime > startTime) issues.push("Setup is after start time; review the exported AM/PM values.");
  const instants = eventInstants(eventDate, startTime || null, conflictingEnd ? null : endTime || null, endNextDay, "America/New_York");
  const planning = importEventPlanning(value("XML Details"));
  planning["equipment systems"] = Array.from({ length: 10 }, (_, index) => value(`System ${index + 1}`)).filter((item) => item && item !== "0").join(", ");
  planning["migration references"] = JSON.stringify(Object.fromEntries(["Client ID", "Venue ID", "Venue ID 2", "Package ID", "Timeline ID", "Quote Generator ID", "Request For Information ID", "Events Export Status"].map((key) => [key, value(key)])));
  return transaction.event.create({ data: {
    organizationId, sourceId, createdBy, name: value("Event Name") || `${value("Event Type") || "Event"} · ${clientName || sourceId}`,
    type: value("Event Type") || "Event", status: value("Status") || "Pending", eventDate, timezone: "America/New_York",
    clientId, venueId, secondVenueId, guestCount: value("Guest Count") || null, notes: redactImportedNotes(value("Comments")) || null,
    startTime: startTime || null, endTime: endTime || null, setupTime: setupTime || null, endNextDay, ...instants,
    details, planning, importIssues: issues, staffAssignments: { create: staffAssignments }, eventServices: { create: eventServices },
  } });
}
