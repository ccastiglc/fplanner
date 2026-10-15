export const EVENT_STATUS_COLORS = [
  { label: "Booked / Confirmed", statuses: ["booked", "confirmed"], chip: "event-status event-status-chip event-status-confirmed", badge: "event-status event-status-confirmed", dot: "event-status-dot event-status-confirmed" },
  { label: "Contract Sent", statuses: ["contract sent"], chip: "event-status event-status-chip event-status-contract", badge: "event-status event-status-contract", dot: "event-status-dot event-status-contract" },
  { label: "Pending / Confirm", statuses: ["pending", "confirm", "planned"], chip: "event-status event-status-chip event-status-pending", badge: "event-status event-status-pending", dot: "event-status-dot event-status-pending" },
  { label: "Leads / Requested Info", statuses: ["new lead", "active lead", "requested info"], chip: "event-status event-status-chip event-status-lead", badge: "event-status event-status-lead", dot: "event-status-dot event-status-lead" },
  { label: "Completed / Send Thank You", statuses: ["completed", "send thank you"], chip: "event-status event-status-chip event-status-completed", badge: "event-status event-status-completed", dot: "event-status-dot event-status-completed" },
  { label: "Cancelled / Lost / Released", statuses: ["cancelled", "canceled", "lost sale", "never booked", "released"], chip: "event-status event-status-chip event-status-cancelled", badge: "event-status event-status-cancelled", dot: "event-status-dot event-status-cancelled" },
];

export function eventStatusColor(status: string) {
  return EVENT_STATUS_COLORS.find((group) => group.statuses.includes(status.trim().toLowerCase())) ?? EVENT_STATUS_COLORS[4];
}
