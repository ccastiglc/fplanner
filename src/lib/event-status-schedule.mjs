import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

export function nextEventStatusCheck(now = new Date()) {
  const timezone = "America/New_York";
  const date = formatInTimeZone(now, timezone, "yyyy-MM-dd");
  const today = fromZonedTime(`${date}T04:00:00`, timezone);
  if (today > now) return today;
  const tomorrow = new Date(new Date(`${date}T00:00:00Z`).getTime() + 86400000).toISOString().slice(0, 10);
  return fromZonedTime(`${tomorrow}T04:00:00`, timezone);
}
