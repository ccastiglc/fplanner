import { importValue, splitImportedEmails, type ImportedRow } from "@/lib/spreadsheet";

export type ImportEntity = "clients" | "venues" | "staff" | "services" | "payments";

export class ImportRowError extends Error {}

function required(value: string, label: string) {
  const result = value.trim();
  if (!result) throw new ImportRowError(`Missing ${label}.`);
  return result;
}

function decimal(value: string, label: string, optional: true): number | null;
function decimal(value: string, label: string, optional?: false): number;
function decimal(value: string, label: string, optional = false): number | null {
  const normalized = value.trim().replace(/[$,\s]/g, "");
  if (!normalized && optional) return null;
  const result = Number(normalized);
  if (!Number.isFinite(result)) throw new ImportRowError(`Invalid ${label}.`);
  return result;
}

function integer(value: string, label: string) {
  if (!value.trim()) return null;
  const result = Number.parseInt(value.replace(/[^0-9-]/g, ""), 10);
  if (!Number.isInteger(result)) throw new ImportRowError(`Invalid ${label}.`);
  return result;
}

function dateValue(value: string, label: string, optional: true): Date | null;
function dateValue(value: string, label: string, optional?: false): Date;
function dateValue(value: string, label: string, optional = false): Date | null {
  if (!value.trim() && optional) return null;
  const result = new Date(value.trim());
  if (Number.isNaN(result.getTime())) throw new ImportRowError(`Invalid ${label}.`);
  return result;
}

function securePhotoUrl(value: string) {
  if (!value.trim()) return null;
  try {
    const url = new URL(value.trim());
    if (url.protocol === "https:") return url.toString();
    if (url.protocol === "http:") {
      url.protocol = "https:";
      return url.toString();
    }
  } catch {
    return null;
  }
  return null;
}

function secureWebUrl(value: string) {
  if (!value.trim()) return null;
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function importedBoolean(value: string) {
  return ["true", "yes", "y", "1", "on"].includes(value.trim().toLowerCase());
}

function importedFeatures(value: string) {
  return value.split(/[;,]/).map((feature) => feature.trim()).filter(Boolean).slice(0, 50);
}

function venueContacts(row: ImportedRow) {
  return Array.from({ length: 5 }, (_, index) => {
    const number = index + 1;
    const name = importValue(row, `Contact ${number} Name`, `Contact${number} Name`, `Contact Name ${number}`);
    const phone = importValue(row, `Contact ${number} Phone`, `Contact${number} Phone`, `Contact Phone ${number}`);
    const email = importValue(row, `Contact ${number} Email`, `Contact${number} Email`, `Contact Email ${number}`);
    const position = importValue(row, `Contact ${number} Position`, `Contact${number} Position`, `Contact Position ${number}`);
    const notes = importValue(row, `Contact ${number} Notes`, `Contact${number} Notes`, `Contact Notes ${number}`);
    if (![name, phone, email, position, notes].some(Boolean)) return null;
    return { name: name || `Contact ${number}`, phone: phone || null, email: email || null, position: position || null, notes: redactNotes(notes) || null, sortOrder: index };
  }).filter((contact): contact is NonNullable<typeof contact> => contact !== null);
}

function redactNotes(value: string) {
  return value
    .replace(/<(\w*?(?:PASSWORD|TOKEN|SECRET)\w*)>[^<]*<\/\1>/gi, "<$1>[REDACTED]</$1>")
    .replace(/\b(password|login\s*id|api[ _-]?key|access\s*token|secret)\s*[:=]\s*[^\r\n]+/gi, "$1: [REDACTED]");
}

function emails(value: string) {
  return splitImportedEmails(value).filter((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
}

function phoneNumbers(row: ImportedRow) {
  const fields = [
    ["Home Phone", "home"],
    ["Work Phone", "work"],
    ["Cell Phone", "mobile"],
    ["Fax Phone", "fax"],
  ] as const;
  const values: Array<{ number: string; type: "mobile" | "home" | "work" | "fax" | "other" }> = fields.flatMap(([header, type]) => {
    const value = importValue(row, header);
    return value ? [{ number: value.slice(0, 40), type }] : [];
  });

  if (!values.length) {
    const value = importValue(row, "Phone Numbers");
    if (value) {
      for (const entry of value.split(";")) {
        const match = entry.trim().match(/^(mobile|home|work|fax|other)\s*:\s*(.+)$/i);
        if (match) {
          values.push({
            number: match[2].trim().slice(0, 40),
            type: match[1].toLowerCase() as "mobile" | "home" | "work" | "fax" | "other",
          });
        }
      }
    }
    if (!values.length) {
      const phone = importValue(row, "Phone", "Phone Number", "Telephone");
      if (phone) values.push({ number: phone.slice(0, 40), type: "mobile" });
    }
  }

  return values;
}

function address(row: ImportedRow) {
  return [importValue(row, "Address", "Street Address"), importValue(row, "Address 2", "Address Line 2")]
    .filter(Boolean)
    .join(", ") || null;
}

export function mapImportRow(entity: ImportEntity, row: ImportedRow, source: "djep" | "csv", organizationId: string) {
  if (entity === "clients") {
    const firstName = importValue(row, "First Name");
    const lastName = importValue(row, "Last Name");
    const spouse = source === "djep" ? lastName.match(/^&\s*(.+)$/)?.[1]?.trim() : "";
    const name = importValue(row, "Client Name", "Full Name", "Name") ||
      [firstName, spouse ? "" : lastName].filter(Boolean).join(" ");
    const clientName = required(name || importValue(row, "Organization / Company", "Company"), "client name");
    const allEmails = emails(importValue(row, "Email", "Email Address"));
    const phones = phoneNumbers(row);
    const photoUrl = securePhotoUrl(importValue(row, "Profile Image URL", "Photo URL"));
    const person = spouse ? [{
      name: spouse,
      role: "client",
      email: allEmails[1] ?? null,
      phone: null,
      phoneType: "mobile",
      photoUrl: null,
    }] : [];
    const country = importValue(row, "Country");

    return {
      model: "clients" as const,
      data: {
        organization: { connect: { id: organizationId } },
        name: clientName,
        contactName: importValue(row, "Organization / Company", "Company") || clientName,
        email: allEmails[0] ?? null,
        role: "client",
        phone: phones[0]?.number ?? null,
        phoneType: phones[0]?.type ?? "mobile",
        phoneNumbers: { create: phones },
        address: address(row),
        city: importValue(row, "City") || null,
        state: importValue(row, "State", "Province") || null,
        postalCode: importValue(row, "Zip Code / Postal Code", "ZIP Code", "Postal Code") || null,
        country: country === "US" ? "USA" : country || "USA",
        notes: redactNotes(importValue(row, "Notes")) || null,
        photoUrl,
        persons: { create: person },
      },
    };
  }

  if (entity === "venues") {
    const name = required(importValue(row, "Venue Name", "Name"), "venue name");
    const country = importValue(row, "Country");
    return {
      model: "venues" as const,
      data: {
        organization: { connect: { id: organizationId } },
        externalId: importValue(row, "Venue ID", "External ID", "ID") || null,
        name,
        address: importValue(row, "Address", "Street Address", "Address 1") || null,
        address2: importValue(row, "Address 2", "Address Line 2") || null,
        city: importValue(row, "City") || null,
        state: importValue(row, "State", "Province") || null,
        postalCode: importValue(row, "Zip Code / Postal Code", "ZIP Code", "Postal Code") || null,
        country: country === "US" ? "USA" : country || "USA",
        telephone: importValue(row, "Telephone", "Phone", "Phone Number") || null,
        faxPhone: importValue(row, "Fax Phone", "Fax", "Fax Number") || null,
        cellPhone: importValue(row, "Cell Phone", "Mobile Phone") || null,
        email: importValue(row, "Email", "Email Address") || null,
        website: secureWebUrl(importValue(row, "Website", "Web Site", "URL")),
        manager: importValue(row, "Manager", "Venue Manager") || null,
        directions: redactNotes(importValue(row, "Directions", "Driving Directions")) || null,
        comments: redactNotes(importValue(row, "Comments", "Notes")) || null,
        xmlInfo: importValue(row, "XML Info", "XML Information") || null,
        category: importValue(row, "Category", "Venue Category") || null,
        distance: importValue(row, "Distance") || null,
        travelTime: importValue(row, "Travel Time") || null,
        travelFee: importValue(row, "Travel Fee") || null,
        setupFee: importValue(row, "Setup Fee") || null,
        taxRate: importValue(row, "Tax Rate", "Tax") || null,
        needsApproval: importedBoolean(importValue(row, "Needs Approval", "Needs Approval?")),
        excludeFromInfoForm: importedBoolean(importValue(row, "Exclude From Info Form", "Exclude Info Form", "Exclude from Info Form?")),
        oneTimeVenue: importedBoolean(importValue(row, "One-Time Venue", "One Time Venue", "One-Time")),
        profileImageUrl: securePhotoUrl(importValue(row, "Profile Image URL", "Photo URL", "Image URL")),
        capacity: integer(importValue(row, "Capacity", "Guest Capacity"), "venue capacity"),
        hourlyRate: decimal(importValue(row, "Hourly Rate", "Rate"), "venue hourly rate", true),
        features: importedFeatures(importValue(row, "Features", "Venue Features")),
        contacts: { create: venueContacts(row) },
      },
    };
  }

  if (entity === "staff") {
    const name = required(importValue(row, "Staff Name", "Name") || [importValue(row, "First Name"), importValue(row, "Last Name")].filter(Boolean).join(" "), "staff name");
    const phones = phoneNumbers(row);
    return {
      model: "staff" as const,
      data: {
        organization: { connect: { id: organizationId } },
        name,
        email: emails(importValue(row, "Email", "Email Address"))[0] ?? null,
        phone: phones[0]?.number ?? null,
        specialty: importValue(row, "Specialty", "Role") || "dj",
        experienceLevel: importValue(row, "Experience Level") || "intermediate",
        status: importValue(row, "Status") || "available",
        hourlyRate: decimal(importValue(row, "Hourly Rate", "Rate"), "staff hourly rate", true),
        notes: redactNotes(importValue(row, "Notes")) || null,
      },
    };
  }

  if (entity === "services") {
    const name = required(importValue(row, "Service Name", "Name"), "service name");
    const price = decimal(importValue(row, "Price", "Rate"), "service price");
    return {
      model: "services" as const,
      data: {
        organization: { connect: { id: organizationId } },
        name,
        description: importValue(row, "Description") || null,
        category: importValue(row, "Category") || "standard",
        price,
        duration: integer(importValue(row, "Duration", "Duration Minutes"), "service duration"),
        isActive: !["false", "no", "0", "inactive"].includes(importValue(row, "Is Active", "Active", "Status").toLowerCase()),
      },
    };
  }

  return {
    model: "payments" as const,
    data: {
      organization: { connect: { id: organizationId } },
      amount: decimal(importValue(row, "Amount", "Total"), "payment amount"),
      currency: importValue(row, "Currency") || "USD",
      status: importValue(row, "Status") || "pending",
      type: importValue(row, "Type") || "payment",
      dueDate: dateValue(importValue(row, "Due Date", "Payment Due Date", "Date"), "payment due date"),
      paymentDate: dateValue(importValue(row, "Payment Date"), "payment date", true),
      notes: redactNotes(importValue(row, "Notes")) || null,
    },
  };
}
