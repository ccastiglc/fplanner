export const EVENT_STATUSES = ["New Lead", "Active Lead", "Requested Info", "Pending", "Confirm", "Contract Sent", "Booked", "Send Thank You", "Completed", "Cancelled", "Lost Sale", "Never Booked", "Released"];

export const EVENT_DETAIL_GROUPS = [
  { title: "Event details", fields: ["Attire", "Room 1", "Room 2", "Service Description", "Custom Event Id"] },
  { title: "Financials", fields: ["Package Price", "Total Fee", "Retainer Fee", "Total Payments", "Balance Due - Calculated", "Balance Due - Original", "Additional Income", "Additional Income Description", "Tax", "Second Tax", "Overtime Rate", "Travel Fee", "Overtime Fee", "Discount 1 Reason", "Discount 1 Amount", "Discount 2 Reason", "Discount 2 Amount", "Hide Fees", "Due Date", "Second Payment Amount", "Second Payment Date", "Second Payment Paid", "Third Payment Amount", "Third Payment Date", "Third Payment Paid"] },
  { title: "Workflow", fields: ["Initial Contact Date", "Inquiry Source", "Date Booked", "Contract Sent Date", "Next Action", "Next Action Date", "Salesperson", "Post Event Notes"] },
] as const;

export const MONEY_FIELDS = new Set(["Package Price", "Total Fee", "Retainer Fee", "Total Payments", "Balance Due - Calculated", "Balance Due - Original", "Additional Income", "Tax", "Second Tax", "Overtime Rate", "Travel Fee", "Overtime Fee", "Discount 1 Amount", "Discount 2 Amount", "Second Payment Amount", "Third Payment Amount"]);
export const DATE_FIELDS = new Set(["Due Date", "Initial Contact Date", "Date Booked", "Contract Sent Date", "Next Action Date", "Second Payment Date", "Third Payment Date"]);
export const BOOLEAN_FIELDS = new Set(["Hide Fees", "Second Payment Paid", "Third Payment Paid"]);

export function recordObject(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === "string"));
}
