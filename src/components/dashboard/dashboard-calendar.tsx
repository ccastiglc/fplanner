"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import { serviceIcon } from "@/components/dashboard/dashboard-data";
import { EVENT_STATUS_COLORS, eventStatusColor } from "@/lib/event-status-colors";

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function monthLabel(date: Date) {
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(date);
}

export default function DashboardCalendar({ events, initialDate }: { events: { id: string; date: string; type: string; clients: string; venue: string; status: string; services: string[] }[]; initialDate: string }) {
  const now = new Date(`${initialDate}T12:00:00`);
  const [today, setToday] = useState(initialDate);
  const [month, setMonth] = useState(() => new Date(now.getFullYear(), now.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(dateKey(now));
  const [dateInput, setDateInput] = useState(dateKey(now));
  const [dismissedPreview, setDismissedPreview] = useState<string | null>(null);
  const calendar = useRef<HTMLTableElement>(null);
  const requestedFocus = useRef<string | null>(null);

  const days = useMemo(() => {
    const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
    const start = new Date(firstDay.getFullYear(), firstDay.getMonth(), 1 - firstDay.getDay());
    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + index);
      return { date, key: dateKey(date), inMonth: date.getMonth() === month.getMonth() };
    });
  }, [month]);
  const eventsByDate = useMemo(() => events.reduce<Record<string, typeof events>>((groups, event) => {
    (groups[event.date] ??= []).push(event);
    return groups;
  }, {}), [events]);
  const tabDate = days.some((day) => day.key === selectedDate) ? selectedDate : days.find((day) => day.inMonth)?.key;
  const selectedEvents = eventsByDate[selectedDate] ?? [];

  useEffect(() => {
    if (requestedFocus.current) {
      calendar.current?.querySelector<HTMLButtonElement>(`[data-date="${requestedFocus.current}"]`)?.focus();
      requestedFocus.current = null;
    }
  }, [selectedDate]);

  function selectDate(date: Date) {
    const key = dateKey(date);
    setSelectedDate(key);
    setDateInput(key);
    if (date.getMonth() !== month.getMonth() || date.getFullYear() !== month.getFullYear()) setMonth(new Date(date.getFullYear(), date.getMonth(), 1));
  }

  const eventDetails = (event: (typeof events)[number]) => <>
    <span className="calendar-detail-heading"><span className="calendar-detail-name">{event.type} · {event.clients}</span><span className={`dashboard-status ${eventStatusColor(event.status).badge}`}>{event.status}</span></span>
    <span className="calendar-detail-venue"><MapPin aria-hidden="true" />{event.venue}</span>
    <span className="calendar-services-label">Booked services</span>
    <span className="calendar-services">{event.services.length ? event.services.map((service) => {
      const Icon = serviceIcon(service);
      return <span key={service}><Icon aria-hidden="true" />{service}</span>;
    }) : <span>No services selected</span>}</span>
  </>;

  return (
    <section aria-labelledby="calendar-title" className="dashboard-calendar ui-surface">
      <div className="calendar-header">
        <div><p className="dashboard-supporting">Schedule</p><h2 id="calendar-title" aria-live="polite" aria-atomic="true">{monthLabel(month)}</h2></div>
        <div className="calendar-controls">
          <button type="button" aria-label="Previous month" onClick={() => setMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))} className="calendar-icon-button"><ChevronLeft aria-hidden="true" /></button>
          <button type="button" onClick={() => { const date = new Date(); setToday(dateKey(date)); selectDate(date); }} className="ui-button">Today</button>
          <button type="button" aria-label="Next month" onClick={() => setMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))} className="calendar-icon-button"><ChevronRight aria-hidden="true" /></button>
        </div>
      </div>
      <form className="calendar-date-jump" onSubmit={(event) => {
        event.preventDefault();
        const date = new Date(`${dateInput}T12:00:00`);
        if (Number.isFinite(date.getTime())) selectDate(date);
      }}>
        <label htmlFor="calendar-jump-date">Jump to date</label>
        <input id="calendar-jump-date" aria-label="Choose a date to jump to" type="date" required value={dateInput} onChange={(event) => setDateInput(event.target.value)} className="ui-input" />
        <button type="submit" className="ui-button">Go to date</button>
      </form>
      <p className="calendar-keyboard-hint" id="calendar-keyboard-hint">Select a date to see all its events. Use arrow keys to move between dates.</p>
      <div className="calendar-table-wrap">
        <table ref={calendar} className="calendar-table" aria-describedby="calendar-keyboard-hint">
          <caption className="sr-only">Event calendar for {monthLabel(month)}</caption>
          <thead><tr>{["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((day) => <th scope="col" key={day}><span aria-hidden="true">{day.slice(0, 3)}</span><span className="sr-only">{day}</span></th>)}</tr></thead>
          <tbody>{Array.from({ length: 6 }, (_, week) => <tr key={week}>
            {days.slice(week * 7, week * 7 + 7).map(({ date, key, inMonth }) => {
              const dateEvents = eventsByDate[key] ?? [];
              const isToday = key === today;
              return <td key={key} data-in-month={inMonth} data-selected={key === selectedDate}>
                <div className="calendar-day-body">
                  <button type="button" data-date={key} tabIndex={key === tabDate ? 0 : -1} aria-pressed={key === selectedDate} aria-current={isToday ? "date" : undefined} aria-label={`${date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}, ${dateEvents.length} ${dateEvents.length === 1 ? "event" : "events"}`} className="calendar-date-button" onClick={() => selectDate(date)} onKeyDown={(event) => {
                    if (event.altKey || event.ctrlKey || event.metaKey) return;
                    const offset = new Map([["ArrowLeft", -1], ["ArrowRight", 1], ["ArrowUp", -7], ["ArrowDown", 7], ["Home", -date.getDay()], ["End", 6 - date.getDay()]]).get(event.key);
                    if (offset === undefined) return;
                    event.preventDefault();
                    const target = new Date(date.getFullYear(), date.getMonth(), date.getDate() + offset);
                    requestedFocus.current = dateKey(target);
                    selectDate(target);
                  }}><span>{date.getDate()}</span>{dateEvents.length > 0 && <span aria-hidden="true" className="calendar-day-count">{dateEvents.length}</span>}</button>
                  <div className="calendar-day-events">
                    {dateEvents.slice(0, 2).map((event) => <Link key={event.id} href={`/dashboard/events/${event.id}`} aria-label={`${event.type}: ${event.clients}, ${event.venue}, status ${event.status}. Open event profile.`} className={`calendar-event-entry ${eventStatusColor(event.status).chip}`} data-preview-hidden={dismissedPreview === event.id} onFocus={() => setDismissedPreview(null)} onMouseEnter={() => setDismissedPreview(null)} onMouseLeave={() => setDismissedPreview(null)} onKeyDown={(keyboardEvent) => { if (keyboardEvent.key === "Escape") setDismissedPreview(event.id); }}>
                      <span className="calendar-event-name">{event.type} · {event.clients}</span>
                      <span aria-hidden="true" className="calendar-event-tooltip" data-align-right={date.getDay() >= 5}>{eventDetails(event)}</span>
                    </Link>)}
                    {dateEvents.length > 2 && <button type="button" className="calendar-more-events" aria-label={`Show all ${dateEvents.length} events on ${key}`} onClick={() => { selectDate(date); document.getElementById("calendar-agenda-title")?.scrollIntoView({ block: "nearest" }); }}>+{dateEvents.length - 2} more</button>}
                  </div>
                </div>
              </td>;
            })}
          </tr>)}</tbody>
        </table>
      </div>
      <details className="calendar-legend"><summary>Event status key</summary><ul>{EVENT_STATUS_COLORS.map((group) => <li key={group.label}><span aria-hidden="true" className={`dashboard-status-dot ${group.dot}`} />{group.label}</li>)}</ul></details>
      <section className="calendar-agenda" aria-labelledby="calendar-agenda-title">
        <div className="calendar-agenda-heading"><h3 id="calendar-agenda-title"><time dateTime={selectedDate}>{new Date(`${selectedDate}T12:00:00`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</time></h3><span className="dashboard-supporting" role="status">{selectedEvents.length} {selectedEvents.length === 1 ? "event" : "events"}</span></div>
        {selectedEvents.length ? <ul>{selectedEvents.map((event) => <li key={event.id}><Link href={`/dashboard/events/${event.id}`} className="calendar-agenda-event">{eventDetails(event)}</Link></li>)}</ul> : <p className="dashboard-empty">No events scheduled for this date.</p>}
      </section>
    </section>
  );
}
