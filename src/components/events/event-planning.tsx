import type { Prisma } from "@prisma/client";
import EventSection from "@/components/events/event-section";

function label(value: string) {
  return value.replace(/^DJEP_|^wn_/, "").replace(/_/g, " ").toLowerCase();
}

function PlanningValue({ value }: { value: unknown }) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "string") return <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-secondary-foreground">{value}</p>;
  if (Array.isArray(value)) return <ol className="space-y-3">{value.map((item, index) => <li key={index} className="border-l border-border pl-3"><PlanningValue value={item} /></li>)}</ol>;
  if (typeof value === "object") return <dl className="space-y-3">{Object.entries(value).filter(([, item]) => item !== "").map(([key, item]) => <div key={key}><dt className="mb-1 text-xs font-medium capitalize text-foreground">{label(key)}</dt><dd><PlanningValue value={item} /></dd></div>)}</dl>;
  return <p className="text-sm text-secondary-foreground">{String(value)}</p>;
}

function planningValue(value: unknown) {
  if (typeof value !== "string" || !/^[\[{]/.test(value)) return value;
  try { return JSON.parse(value); } catch { return value; }
}

export default function EventPlanning({ planning }: { planning: Prisma.JsonValue }) {
  const entries = planning && typeof planning === "object" && !Array.isArray(planning) ? Object.entries(planning).filter(([key, value]) => key !== "migration references" && !!value) : [];
  return <EventSection id="event-planning" title="Planning information">{entries.map(([key, value]) => <details key={key} className="rounded-lg border border-border p-4"><summary className="cursor-pointer text-sm font-medium capitalize text-foreground">{label(key)}</summary><div className="mt-3"><PlanningValue value={planningValue(value)} /></div></details>)}{!entries.length && <p className="text-sm text-muted-foreground">No imported planning information for this event.</p>}</EventSection>;
}
