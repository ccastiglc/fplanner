import type { Prisma } from "@prisma/client";

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
  if (!planning || typeof planning !== "object" || Array.isArray(planning) || !Object.values(planning).some(Boolean)) return null;
  return <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5"><h2 className="font-semibold text-slate-900">Imported planning information</h2>{Object.entries(planning).filter(([key, value]) => key !== "migration references" && !!value).map(([key, value]) => <details key={key} className="rounded-xl border border-slate-200 p-4"><summary className="cursor-pointer text-sm font-semibold capitalize text-slate-700">{label(key)}</summary><div className="mt-3"><PlanningValue value={planningValue(value)} /></div></details>)}</section>;
}
