import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { AsYouType, getCountries, parsePhoneNumberFromString } from "libphonenumber-js";

const apply = process.argv.includes("--apply");
const DEFAULT_COUNTRY = "US";
const COUNTRY_CODES = new Set(getCountries());

function isCountryCode(value) {
  return !!value && COUNTRY_CODES.has(String(value).toUpperCase());
}

function formatPhone(value, country = DEFAULT_COUNTRY) {
  const code = (isCountryCode(country) ? String(country) : DEFAULT_COUNTRY).toUpperCase();
  const digits = String(value ?? "").replace(/\D/g, "");
  if (!digits) return "";
  if (code === "US" || code === "CA") {
    const national = digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
    const number = national.slice(0, 10);
    if (number.length <= 3) return number;
    if (number.length <= 6) return `${number.slice(0, 3)}-${number.slice(3)}`;
    return `${number.slice(0, 3)}-${number.slice(3, 6)}-${number.slice(6)}`;
  }
  try {
    return new AsYouType(code).input(String(value)) || digits;
  } catch {
    return String(value).trim();
  }
}

function normalize(value, country) {
  const fallback = isCountryCode(country) ? String(country).toUpperCase() : DEFAULT_COUNTRY;
  try {
    const parsed = parsePhoneNumberFromString(String(value).trim(), fallback);
    if (parsed) {
      const detected = parsed.country || fallback;
      return { number: formatPhone(parsed.nationalNumber, detected), country: detected };
    }
  } catch {
    // fall through to a basic format
  }
  return { number: formatPhone(value, fallback), country: fallback };
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

const targets = [
  { model: "organizationSettings", fields: [["businessPhone", "businessPhoneCountry"]] },
  { model: "client", fields: [["phone", "phoneCountry"]] },
  { model: "clientPerson", fields: [["phone", "phoneCountry"]] },
  { model: "clientAdditionalContact", fields: [["phone", "phoneCountry"]] },
  { model: "clientPhoneNumber", fields: [["number", "country"]] },
  { model: "venue", fields: [["telephone", "telephoneCountry"], ["faxPhone", "faxPhoneCountry"], ["cellPhone", "cellPhoneCountry"]] },
  { model: "venueContact", fields: [["phone", "phoneCountry"]] },
  { model: "staff", fields: [["phone", "phoneCountry"]] },
  { model: "vendor", fields: [["phone", "phoneCountry"]] },
];

let scanned = 0;
let changed = 0;

for (const { model, fields } of targets) {
  const delegate = prisma[model];
  const select = Object.fromEntries([["id", true], ...fields.flatMap(([number, country]) => [[number, true], [country, true]])]);
  const rows = await delegate.findMany({ select });
  for (const row of rows) {
    scanned += 1;
    const data = {};
    for (const [numberField, countryField] of fields) {
      const current = row[numberField];
      if (!current || !String(current).trim()) continue;
      const next = normalize(current, row[countryField]);
      if (next.number !== current || (row[countryField] ?? "") !== next.country) {
        data[numberField] = next.number;
        data[countryField] = next.country;
      }
    }
    if (Object.keys(data).length) {
      changed += 1;
      if (apply) await delegate.update({ where: { id: row.id }, data });
    }
  }
}

console.log(`${apply ? "Applied" : "Dry run"}: ${changed} of ${scanned} rows ${apply ? "updated" : "need formatting"}.`);
await prisma.$disconnect();
