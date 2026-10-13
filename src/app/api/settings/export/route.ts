import { Workbook, type CellValue } from "exceljs";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { csvSafe } from "@/lib/spreadsheet";

const entities = ["clients", "venues", "staff", "services", "payments", "events"] as const;
type ExportEntity = (typeof entities)[number];

function phonesText(phones: Array<{ number: string; type: string }>) {
  return phones.map((phone) => `${phone.type}: ${phone.number}`).join("; ");
}

function spreadsheetSafe(value: unknown): CellValue {
  if (typeof value === "string" && /^[=+\-@]/.test(value)) return `'${value}`;
  if (value === null || value === undefined) return "";
  if (value instanceof Date || typeof value === "number" || typeof value === "boolean") return value;
  return String(value);
}

async function getExportRows(entity: ExportEntity, organizationId: string | null) {
  const where = organizationId ? { organizationId } : {};
  if (entity === "events") {
    const events = await prisma.event.findMany({ where, include: { client: true, venue: true, staffAssignments: { include: { staff: true } }, eventServices: { include: { service: true } } }, orderBy: { eventDate: "asc" } });
    return {
      headers: ["Event ID", "Event Name", "Event Type", "Event Date", "Time Zone", "Start Time", "End Time", "Setup Time", "Next Day End", "Status", "Client Name", "Venue Name", "Guest Count", "Comments", "Financials and Workflow", "Staff Assignments", "Booked Services", "Planning Information", "Import Review Notes"],
      rows: events.map((event) => [event.sourceId ?? event.id, event.name, event.type, event.eventDate.toISOString().slice(0, 10), event.timezone, event.startTime, event.endTime, event.setupTime, event.endNextDay, event.status, event.client?.name, event.venue?.name, event.guestCount, event.notes, JSON.stringify(event.details), JSON.stringify(event.staffAssignments.map((row) => ({ name: row.staff.name, role: row.role, fee: row.fee?.toString() }))), JSON.stringify(event.eventServices.map((row) => ({ name: row.service.name, quantity: row.quantity, fee: row.bookedFee?.toString() }))), JSON.stringify(event.planning), JSON.stringify(event.importIssues)]),
    };
  }

  if (entity === "clients") {
    const clients = await prisma.client.findMany({
      where,
      include: {
        phoneNumbers: true,
        persons: { include: { phoneNumbers: true } },
        additionalContacts: { include: { phoneNumbers: true } },
      },
      orderBy: { name: "asc" },
    });
    return {
      headers: ["Name", "Pronunciation", "Role", "Email", "Phone Numbers", "Mailing Address", "City", "State", "Postal Code", "Country", "Notes", "Photo URL", "Additional Persons", "Additional Contacts"],
      rows: clients.map((client) => [
        client.name,
        client.pronunciation,
        client.role,
        client.email,
        phonesText(client.phoneNumbers),
        client.address,
        client.city,
        client.state,
        client.postalCode,
        client.country,
        client.notes,
        client.photoUrl,
        JSON.stringify(client.persons.map((person) => ({
          name: person.name,
          pronunciation: person.pronunciation,
          role: person.role,
          email: person.email,
          phones: phonesText(person.phoneNumbers),
          photoUrl: person.photoUrl,
        }))),
        JSON.stringify(client.additionalContacts.map((contact) => ({
          name: contact.name,
          pronunciation: contact.pronunciation,
          role: contact.role,
          email: contact.email,
          phones: phonesText(contact.phoneNumbers),
        }))),
      ]),
    };
  }

  if (entity === "venues") {
    const venues = await prisma.venue.findMany({
      where,
      include: { contacts: { orderBy: { sortOrder: "asc" } } },
      orderBy: { name: "asc" },
    });
    const contactHeaders = Array.from({ length: 5 }, (_, index) => {
      const number = index + 1;
      return [`Contact ${number} Name`, `Contact ${number} Phone`, `Contact ${number} Email`, `Contact ${number} Position`, `Contact ${number} Notes`];
    }).flat();
    return {
      headers: ["Venue Name", "Address", "Address 2", "City", "State", "Zip Code / Postal Code", "Country", "Telephone", "Fax Phone", "Cell Phone", "Email", "Website", "Manager", "Directions", "Comments", "Needs Approval", "Exclude From Info Form", "Distance", "XML Info", "Category", "Travel Time", "Travel Fee", "Setup Fee", "Tax Rate", "One-Time Venue", "Profile Image URL", "Capacity", "Hourly Rate", "Status", "Features", ...contactHeaders],
      rows: venues.map((venue) => [
        venue.name, venue.address, venue.address2, venue.city, venue.state, venue.postalCode, venue.country,
        venue.telephone, venue.faxPhone, venue.cellPhone, venue.email, venue.website, venue.manager, venue.directions, venue.comments,
        venue.needsApproval, venue.excludeFromInfoForm, venue.distance, venue.xmlInfo, venue.category, venue.travelTime, venue.travelFee,
        venue.setupFee, venue.taxRate, venue.oneTimeVenue, venue.profileImageUrl, venue.capacity, venue.hourlyRate?.toString(), venue.status,
        Array.isArray(venue.features) ? venue.features.filter((feature): feature is string => typeof feature === "string").join(", ") : "",
        ...Array.from({ length: 5 }, (_, index) => {
          const contact = venue.contacts.find((item) => item.sortOrder === index);
          return [contact?.name, contact?.phone, contact?.email, contact?.position, contact?.notes];
        }).flat(),
      ]),
    };
  }

  if (entity === "staff") {
    const staff = await prisma.staff.findMany({ where, orderBy: { name: "asc" } });
    return {
      headers: ["Name", "Email", "Phone", "Specialty", "Experience Level", "Status", "Hourly Rate", "Notes"],
      rows: staff.map((person) => [person.name, person.email, person.phone, person.specialty, person.experienceLevel, person.status, person.hourlyRate?.toString(), person.notes]),
    };
  }

  if (entity === "services") {
    const services = await prisma.service.findMany({ where, orderBy: { name: "asc" } });
    return {
      headers: ["Name", "Description", "Category", "Price", "Duration", "Active"],
      rows: services.map((service) => [service.name, service.description, service.category, service.price.toString(), service.duration, service.isActive]),
    };
  }

  const payments = await prisma.payment.findMany({ where, orderBy: { dueDate: "asc" } });
  return {
    headers: ["Amount", "Currency", "Status", "Type", "Due Date", "Payment Date", "Notes"],
    rows: payments.map((payment) => [payment.amount.toString(), payment.currency, payment.status, payment.type, payment.dueDate, payment.paymentDate, payment.notes]),
  };
}

export async function GET(request: Request) {
  const session = await auth();
  if (session?.user.role !== "ADMIN") return new Response("Forbidden", { status: 403 });

  const params = new URL(request.url).searchParams;
  const entity = params.get("entity") as ExportEntity | null;
  const format = params.get("format") ?? "csv";
  if (!entity || !entities.includes(entity) || !["csv", "xlsx"].includes(format)) {
    return new Response("Invalid export selection", { status: 400 });
  }

  const { headers, rows } = await getExportRows(entity, session.user.organizationId);
  const date = new Date().toISOString().slice(0, 10);

  if (format === "xlsx") {
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet(entity);
    worksheet.addRow(headers);
    rows.forEach((row) => worksheet.addRow(row.map(spreadsheetSafe)));
    const bytes = new Uint8Array(await workbook.xlsx.writeBuffer());

    return new Response(bytes, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="planner-${entity}-${date}.xlsx"`,
        "Cache-Control": "private, no-store",
      },
    });
  }

  const csv = [headers, ...rows].map((row) => row.map(csvSafe).join(",")).join("\r\n");
  return new Response(`\uFEFF${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="planner-${entity}-${date}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
