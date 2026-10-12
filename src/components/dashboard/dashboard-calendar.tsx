"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import { DEMO_EVENTS, SERVICE_ICONS } from "@/components/dashboard/dashboard-data";

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function monthLabel(date: Date) {
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(date);
}

export default function DashboardCalendar() {
  const now = new Date();
  const [month, setMonth] = useState(() => new Date(now.getFullYear(), now.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(dateKey(now));
  const [dateInput, setDateInput] = useState(dateKey(now));

  const days = useMemo(() => {
    const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
    const start = new Date(firstDay.getFullYear(), firstDay.getMonth(), 1 - firstDay.getDay());
    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + index);
      return { date, key: dateKey(date), inMonth: date.getMonth() === month.getMonth() };
    });
  }, [month]);

  const eventsByDate = useMemo(
    () => DEMO_EVENTS.reduce<Record<string, typeof DEMO_EVENTS[number][]>>((groups, event) => {
      groups[event.date] = [...(groups[event.date] || []), event];
      return groups;
    }, {}),
    []
  );

  function changeMonth(offset: number) {
    setMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  }

  function jumpToDate() {
    if (!dateInput) return;
    const [year, selectedMonth] = dateInput.split("-").map(Number);
    setSelectedDate(dateInput);
    setMonth(new Date(year, selectedMonth - 1, 1));
  }

  function goToToday() {
    const today = new Date();
    const todayKey = dateKey(today);
    setDateInput(todayKey);
    setSelectedDate(todayKey);
    setMonth(new Date(today.getFullYear(), today.getMonth(), 1));
  }

  return (
    <section aria-labelledby="calendar-title" className="min-w-0 rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-slate-100 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
            <CalendarDays className="size-4 text-orange-500" />
            <span>Schedule</span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-500">Demo data</span>
          </div>
          <h1 id="calendar-title" className="mt-1 text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">{monthLabel(month)}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center rounded-xl border border-slate-200 p-1">
            <button type="button" aria-label="Previous month" onClick={() => changeMonth(-1)} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100">
              <ChevronLeft className="size-4" />
            </button>
            <button type="button" aria-label="Next month" onClick={() => changeMonth(1)} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100">
              <ChevronRight className="size-4" />
            </button>
          </div>
          <button type="button" onClick={goToToday} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Today</button>
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:flex-none">
            <input
              aria-label="Choose a date to jump to"
              type="date"
              value={dateInput}
              onChange={(event) => setDateInput(event.target.value)}
              className="min-w-0 rounded-xl border border-slate-200 bg-white px-2 py-2 text-sm text-slate-700 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 sm:w-[150px]"
            />
            <button type="button" onClick={jumpToDate} className="whitespace-nowrap rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800">Go to date</button>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto p-3 sm:p-5">
        <div className="min-w-[680px]">
          <div className="grid grid-cols-7 border-b border-slate-100 pb-2 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-400 sm:text-xs">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <div key={day}>{day}</div>)}
          </div>
          <div className="grid grid-cols-7">
            {days.map(({ date, key, inMonth }) => {
              const dateEvents = eventsByDate[key] || [];
              const isToday = key === dateKey(now);
              const isSelected = key === selectedDate;
              return (
                <div key={key} className={`relative min-h-[104px] border-b border-r border-slate-100 p-1.5 sm:min-h-[118px] sm:p-2 ${inMonth ? "bg-white" : "bg-slate-50/70"} ${isSelected ? "ring-1 ring-inset ring-orange-300" : ""}`}>
                  <div className="mb-1 flex justify-end">
                    <span className={`grid size-6 place-items-center rounded-full text-xs ${isToday ? "bg-orange-500 font-semibold text-white" : inMonth ? "text-slate-600" : "text-slate-300"}`}>
                      {date.getDate()}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {dateEvents.slice(0, 2).map((event) => (
                      <Link
                        key={event.id}
                        href={`/dashboard/events/${event.id}`}
                        aria-label={`${event.type}: ${event.clients}, ${event.venue}, status ${event.status}. Open event profile.`}
                        className={`group relative block truncate rounded-md border-l-2 px-1.5 py-1 text-left text-[10px] font-medium leading-tight sm:text-xs ${event.status === "completed" ? "border-slate-400 bg-slate-100 text-slate-600" : event.status === "pending" ? "border-amber-400 bg-amber-50 text-amber-800" : "border-orange-500 bg-orange-50 text-orange-800"}`}
                      >
                        <span className="block truncate">{event.type}</span>
                        <span className="pointer-events-none invisible absolute left-0 top-full z-40 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-4 text-left opacity-0 shadow-xl transition duration-150 group-hover:visible group-hover:opacity-100 group-focus-visible:visible group-focus-visible:opacity-100">
                          <span className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-slate-900">{event.type} | {event.clients}</span>
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] capitalize text-slate-600">{event.status}</span>
                          </span>
                          <span className="mt-2 flex items-center gap-1.5 text-xs text-slate-500"><MapPin className="size-3.5 shrink-0" />{event.venue}</span>
                          <span className="mt-3 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">Booked services</span>
                          <span className="mt-1.5 flex flex-wrap gap-1.5">
                            {event.services.map((service) => {
                              const ServiceIcon = SERVICE_ICONS[service];
                              return <span key={service} title={service} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[10px] text-slate-700"><ServiceIcon className="size-3.5" />{service}</span>;
                            })}
                          </span>
                          <span className="mt-3 block text-xs font-semibold text-orange-600">Open event profile →</span>
                        </span>
                      </Link>
                    ))}
                    {dateEvents.length > 2 && <span className="block px-1 text-[10px] text-slate-400">+{dateEvents.length - 2} more</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-100 px-4 py-3 text-xs text-slate-500 sm:px-5">
        <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-orange-500" />Booked</span>
        <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-amber-400" />Pending</span>
        <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-slate-400" />Completed</span>
        <span className="ml-auto">Select an event to preview details</span>
      </div>
    </section>
  );
}
