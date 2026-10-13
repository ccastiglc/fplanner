import Link from "next/link";
import { ArrowUpRight, CalendarCheck2, Clock3, Sparkles } from "lucide-react";
import { DEMO_TASKS } from "@/components/dashboard/dashboard-data";

export function EventCountsWidget({ counts }: { counts: [string, number][] }) {
  return (
    <section aria-labelledby="event-counts-title" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">Event overview</p>
          <h2 id="event-counts-title" className="mt-1 text-lg font-semibold text-slate-900">Event counts</h2>
        </div>
        <CalendarCheck2 className="size-5 text-orange-500" />
      </div>
      <div className="mt-4 space-y-3">
        {counts.map(([status, count]) => (
          <div key={status} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5">
            <span className="text-sm text-slate-600">{status}</span>
            <span className="text-sm font-semibold tabular-nums text-slate-900">{count}</span>
          </div>
        ))}
      </div>
      {!counts.length && <p className="mt-3 text-sm text-slate-500">No events yet.</p>}
    </section>
  );
}

export function TasksWidget() {
  return (
    <section aria-labelledby="tasks-title" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-1.5 text-sm font-medium text-orange-600"><Sparkles className="size-4" />AI suggested</p>
          <h2 id="tasks-title" className="mt-1 text-lg font-semibold text-slate-900">Tasks</h2>
        </div>
        <span className="rounded-full bg-orange-50 px-2.5 py-1 text-xs font-medium text-orange-700">2 suggested</span>
      </div>
      <div className="mt-4 space-y-3">
        {DEMO_TASKS.map((task) => (
          <article key={task.title} className="rounded-xl border border-slate-100 p-3.5">
            <div className="flex items-start gap-2.5">
              <Clock3 className="mt-0.5 size-4 shrink-0 text-slate-400" />
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold text-slate-800">{task.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">{task.detail}</p>
                <button type="button" disabled title="Task automation will be added later" className="mt-3 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-400 disabled:cursor-not-allowed">{task.action}</button>
              </div>
            </div>
          </article>
        ))}
      </div>
      <p className="mt-3 text-[11px] text-slate-400">AI recommendations and automation are placeholders.</p>
    </section>
  );
}

export function WidgetPlaceholder() {
  return (
    <section aria-label="Customizable widget placeholder" className="rounded-2xl border border-dashed border-slate-300 bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-700">Your workspace</p>
        <Link href="/dashboard/settings" aria-disabled="true" tabIndex={-1} className="pointer-events-none inline-flex items-center gap-1 text-xs font-medium text-slate-400">Customize <ArrowUpRight className="size-3.5" /></Link>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-slate-500">Choose which widgets appear here. Admin widget customization will be added later.</p>
    </section>
  );
}
