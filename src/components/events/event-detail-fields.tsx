import { BOOLEAN_FIELDS, DATE_FIELDS, EVENT_DETAIL_GROUPS } from "@/lib/event-fields";
import EventSection from "@/components/events/event-section";

export const eventInputClass = "ui-input mt-1.5 font-normal";

export default function EventDetailFields({ details }: { details: Record<string, string> }) {
  return EVENT_DETAIL_GROUPS.map((group) => (
    <EventSection key={group.id} id={group.id} title={group.title} grid>
      {group.fields.map((label) => (
        <label key={label} className={`ui-label ${label.includes("Description") || label.includes("Notes") ? "sm:col-span-2" : ""}`}>
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
      {group.title === "Financials" && <p className="text-xs text-muted-foreground sm:col-span-2">Imported payment totals and installment amounts are historical values, not additional payment transactions.</p>}
    </EventSection>
  ));
}
