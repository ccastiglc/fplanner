import { fromZonedTime, formatInTimeZone } from "date-fns-tz";

export function validTimezone(value: string) {
  try { new Intl.DateTimeFormat("en-US", { timeZone: value }); return true; } catch { return false; }
}

export function eventDateValue(value: string) {
  const match = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  const normalized = match ? `${match[3]}-${match[1].padStart(2, "0")}-${match[2].padStart(2, "0")}` : value.slice(0, 10);
  const date = new Date(`${normalized}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized) || Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== normalized) return null;
  return date;
}

export function eventTimeValue(value: string) {
  if (!value.trim()) return "";
  const match = value.trim().match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?$/i);
  if (!match) return null;
  let hour = Number(match[1]);
  const minute = Number(match[2]);
  if (minute > 59 || (match[3] ? hour < 1 || hour > 12 : hour > 23)) return null;
  if (match[3]) hour = hour % 12 + (match[3].toUpperCase() === "PM" ? 12 : 0);
  return `${String(hour).padStart(2, "0")}:${match[2]}`;
}

export function eventInstants(date: Date, start: string | null, end: string | null, nextDay: boolean, timezone: string) {
  const key = date.toISOString().slice(0, 10);
  const endKey = nextDay ? new Date(date.getTime() + 86400000).toISOString().slice(0, 10) : key;
  return {
    startDateTime: start ? fromZonedTime(`${key}T${start}:00`, timezone) : null,
    endDateTime: end ? fromZonedTime(`${endKey}T${end}:00`, timezone) : null,
  };
}

export function localEventTime(date: Date | null, timezone: string) {
  return date ? formatInTimeZone(date, timezone, "MMM d, yyyy · h:mm a zzz") : "Time not set";
}
