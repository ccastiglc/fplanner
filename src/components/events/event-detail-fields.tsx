import { BOOLEAN_FIELDS, DATE_FIELDS, EVENT_DETAIL_GROUPS } from "@/lib/event-fields";
import EventSection from "@/components/events/event-section";

export const eventInputClass = "mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-normal text-slate-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100";

export default function EventDetailFields({ details }: { details: Record<string, string> }) {
  return EVENT_DETAIL_GROUPS.map((group) => (
    <EventSection key={group.id} id={group.id} title={group.title} grid>
      {group.fields.map((label) => (
        <label key={label} className={`block text-sm font-medium text-slate-700 ${label.includes("Description") || label.includes("Notes") ? "sm:col-span-2" : ""}`}>
          {label}
          {BOOLEAN_FIELDS.has(label) ? (
            <select name={`detail:${label}`} defaultValue={details[label] ?? "false"} className={eventInputClass}><option value="false">No</option><option value="true">Yes</option></select>
          ) : label.includes("Description") || label.includes("Notes") ? (
            <textarea name={`detail:${label}`} defaultValue={details[label] ?? ""} rows={3} maxLength={50000} className={eventInputClass} />
          ) : (
            <input name={`detail:${label}`} defaultValue={details[label] ?? ""} type={DATE_FIELDS.has(label) ? "date" : "text"} maxLength={50000} className={eventInputClass} />
          )}
        </label>
      ))}
      {group.title === "Financials" && <p className="text-xs text-slate-500 sm:col-span-2">Imported payment totals and installment amounts are historical values, not additional payment transactions.</p>}
    </EventSection>
  ));
}
