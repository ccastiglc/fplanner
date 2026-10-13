export function eventReturnQuery(value: unknown) {
  const eventId = String(value ?? "");
  return /^[a-zA-Z0-9_-]{1,128}$/.test(eventId) ? `&eventId=${eventId}` : "";
}
