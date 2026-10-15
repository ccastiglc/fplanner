"use client";

import { Mail, Phone } from "lucide-react";
import { eventInputClass } from "@/components/events/event-detail-fields";
import EventSection from "@/components/events/event-section";

export function ProfileSelect({ label, name, value, records, onChange, directory }: { label: string; name: string; value: string; records: { id: string; name: string }[]; onChange: (value: string) => void; directory: string }) {
  return (
    <div>
      <label className="ui-label">{label}
        <select name={name} value={value} onChange={(event) => onChange(event.target.value)} className={eventInputClass}>
          <option value="">Not selected</option>{records.map((record) => <option key={record.id} value={record.id}>{record.name}</option>)}
        </select>
      </label>
      {value && <button type="submit" name="openProfile" value={`${directory}/${value}`} className="ui-link mt-2 min-h-6 text-xs">Save event &amp; edit {label.toLowerCase()}</button>}
    </div>
  );
}

export function ContactList({ records }: { records: { id: string; name: string; email: string | null; phone: string | null }[] }) {
  if (records.length === 0) return null;
  return (
    <ul className="sm:col-span-2 space-y-1.5">
      {records.map((record) => (
        <li key={record.id} className="flex flex-wrap items-center gap-2 text-sm text-foreground">
          <span className="font-medium">{record.name}</span>
          {record.email && <a href={`mailto:${record.email}`} aria-label={`Email ${record.name}`} className="ui-contact-action"><Mail aria-hidden="true" className="size-4" /></a>}
          {record.phone && <a href={`tel:${record.phone.replace(/[^+\d]/g, "")}`} aria-label={`Call ${record.name}`} className="ui-contact-action"><Phone aria-hidden="true" className="size-4" /></a>}
        </li>
      ))}
    </ul>
  );
}

export function AssignmentRows({ rows, setRows, records }: { rows: { staffId: string; role: string; fee: string }[]; setRows: (rows: { staffId: string; role: string; fee: string }[]) => void; records: { id: string; name: string }[] }) {
  return (
    <EventSection id="event-staff" title="Staff assignments">
      <input type="hidden" name="staff" value={JSON.stringify(rows)} />
      {rows.map((row, index) => (
        <div key={index} className="grid gap-3 border-t border-border pt-4 sm:grid-cols-3">
          <ProfileSelect label="Staff" name={`staff-select-${index}`} value={row.staffId} records={records} directory="staff" onChange={(staffId) => setRows(rows.map((item, number) => number === index ? { ...item, staffId } : item))} />
          <label className="ui-label">Role<input value={row.role} maxLength={120} onChange={(event) => setRows(rows.map((item, number) => number === index ? { ...item, role: event.target.value } : item))} className={eventInputClass} /></label>
          <label className="ui-label">Event fee<input value={row.fee} inputMode="decimal" onChange={(event) => setRows(rows.map((item, number) => number === index ? { ...item, fee: event.target.value } : item))} className={eventInputClass} /></label>
          <button type="button" onClick={() => setRows(rows.filter((_, number) => number !== index))} className="ui-text-danger min-h-6 text-left text-xs">Remove assignment</button>
        </div>
      ))}
      {rows.length < 15 && <button type="button" onClick={() => setRows([...rows, { staffId: "", role: "dj", fee: "0" }])} className="ui-button">Add staff</button>}
    </EventSection>
  );
}

export function ServiceRows({ rows, setRows, records }: { rows: { serviceId: string; quantity: number; bookedFee: string }[]; setRows: (rows: { serviceId: string; quantity: number; bookedFee: string }[]) => void; records: { id: string; name: string; price: string }[] }) {
  return (
    <EventSection id="event-services" title="Package and add-ons">
      <input type="hidden" name="services" value={JSON.stringify(rows)} />
      {rows.map((row, index) => (
        <div key={index} className="grid gap-3 border-t border-border pt-4 sm:grid-cols-3">
          <label className="ui-label">Service<select value={row.serviceId} onChange={(event) => setRows(rows.map((item, number) => number === index ? { ...item, serviceId: event.target.value, bookedFee: records.find((record) => record.id === event.target.value)?.price ?? "0" } : item))} className={eventInputClass}><option value="">Select service</option>{records.map((record) => <option key={record.id} value={record.id}>{record.name}</option>)}</select></label>
          <label className="ui-label">Quantity<input type="number" min={0} max={100000} value={row.quantity} onChange={(event) => setRows(rows.map((item, number) => number === index ? { ...item, quantity: Number(event.target.value) } : item))} className={eventInputClass} /></label>
          <label className="ui-label">Booked fee (line total)<input value={row.bookedFee} inputMode="decimal" onChange={(event) => setRows(rows.map((item, number) => number === index ? { ...item, bookedFee: event.target.value } : item))} className={eventInputClass} /></label>
          <button type="button" onClick={() => setRows(rows.filter((_, number) => number !== index))} className="ui-text-danger min-h-6 text-left text-xs">Remove service</button>
        </div>
      ))}
      {rows.length < 21 && <button type="button" onClick={() => setRows([...rows, { serviceId: "", quantity: 1, bookedFee: "0" }])} className="ui-button">Add service</button>}
    </EventSection>
  );
}
