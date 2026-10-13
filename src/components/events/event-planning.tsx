import type { Prisma } from "@prisma/client";
import EventSection from "@/components/events/event-section";

function label(value: string) {
  return value.replace(/^DJEP_|^wn_/, "").replace(/_/g, " ").toLowerCase();
}

function PlanningValue({ value }: { value: unknown }) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "string") return <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-600">{value}</p>;
  if (Array.isArray(value)) return <ol className="space-y-3">{value.map((item, index) => <li key={index} className="rounded-xl border border-slate-200 p-3"><PlanningValue value={item} /></li>)}</ol>;
  if (typeof value === "object") return <dl className="space-y-3">{Object.entries(value).filter(([, item]) => item !== "").map(([key, item]) => <div key={key}><dt className="mb-1 text-xs font-semibold capitalize text-slate-800">{label(key)}</dt><dd><PlanningValue value={item} /></dd></div>)}</dl>;
  return <p className="text-sm text-slate-600">{String(value)}</p>;
}

function planningValue(value: unknown) {
  if (typeof value !== "string" || !/^[\[{]/.test(value)) return value;
  try { return JSON.parse(value); } catch { return value; }
}

export default function EventPlanning({ planning }: { planning: Prisma.JsonValue }) {
  const entries = planning && typeof planning === "object" && !Array.isArray(planning) ? Object.entries(planning).filter(([key, value]) => key !== "migration references" && !!value) : [];
  return <EventSection id="event-planning" title="Planning information">{entries.map(([key, value]) => <details key={key} className="rounded-xl border border-slate-200 p-4"><summary className="cursor-pointer text-sm font-semibold capitalize text-slate-700">{label(key)}</summary><div className="mt-3"><PlanningValue value={planningValue(value)} /></div></details>)}{!entries.length && <p className="text-sm text-slate-500">No imported planning information for this event.</p>}</EventSection>;
}
