export const EVENT_STATUS_COLORS = [
  { label: "Booked / Confirmed", statuses: ["booked", "confirmed"], chip: "border-emerald-500 bg-emerald-50 text-emerald-800", badge: "bg-emerald-50 text-emerald-800", dot: "bg-emerald-500" },
  { label: "Contract Sent", statuses: ["contract sent"], chip: "border-blue-500 bg-blue-50 text-blue-800", badge: "bg-blue-50 text-blue-800", dot: "bg-blue-500" },
  { label: "Pending / Confirm", statuses: ["pending", "confirm", "planned"], chip: "border-amber-500 bg-amber-50 text-amber-900", badge: "bg-amber-50 text-amber-900", dot: "bg-amber-500" },
  { label: "Leads / Requested Info", statuses: ["new lead", "active lead", "requested info"], chip: "border-purple-500 bg-purple-50 text-purple-800", badge: "bg-purple-50 text-purple-800", dot: "bg-purple-500" },
  { label: "Completed / Send Thank You", statuses: ["completed", "send thank you"], chip: "border-slate-400 bg-slate-100 text-slate-700", badge: "bg-slate-100 text-slate-700", dot: "bg-slate-400" },
  { label: "Cancelled / Lost / Released", statuses: ["cancelled", "canceled", "lost sale", "never booked", "released"], chip: "border-red-500 bg-red-50 text-red-800", badge: "bg-red-50 text-red-800", dot: "bg-red-500" },
];

export function eventStatusColor(status: string) {
  return EVENT_STATUS_COLORS.find((group) => group.statuses.includes(status.trim().toLowerCase())) ?? EVENT_STATUS_COLORS[4];
}
