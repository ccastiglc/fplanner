"use client";

import { useState } from "react";
import { ArrowDownToLine, ArrowUpFromLine, Database, FileSpreadsheet } from "lucide-react";

const ENTITIES = [
  { value: "clients", label: "Clients" },
  { value: "venues", label: "Venues" },
  { value: "staff", label: "Staff" },
  { value: "services", label: "Services" },
  { value: "payments", label: "Payments" },
] as const;

export default function DataManagement({
  batches,
}: {
  batches: Array<{
    id: string;
    source: string;
    fileName: string | null;
    status: string;
    totalRecords: number;
    processedRecords: number;
    errorCount: number;
    createdAt: Date;
  }>;
}) {
  const [entity, setEntity] = useState<(typeof ENTITIES)[number]["value"]>("clients");
  const [source, setSource] = useState("djep");
  const [format, setFormat] = useState("csv");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function importFile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!file) {
      setMessage("Choose a CSV or XLSX file first.");
      return;
    }

    setBusy(true);
    setMessage("Importing file…");
    const formData = new FormData();
    formData.set("entity", entity);
    formData.set("source", source);
    formData.set("file", file);

    try {
      const response = await fetch("/plan/api/settings/import", { method: "POST", body: formData });
      const result = await response.json();
      if (!response.ok) {
        setMessage(result.error || "Import failed.");
        return;
      }
      const rowErrors = result.errors?.length ? ` First issue: ${result.errors[0]}` : "";
      setMessage(`Imported ${result.imported} of ${result.total} rows; ${result.errorCount} failed.${rowErrors}`);
      setFile(null);
      form.reset();
    } catch {
      setMessage("Import failed. Check the file and try again.");
    } finally {
      setBusy(false);
    }
  }

  const exportUrl = `/plan/api/settings/export?entity=${entity}&format=${format}`;

  return (
    <section id="data-management" aria-labelledby="data-management-title" className="scroll-mt-36 space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div>
        <p className="text-sm font-medium text-orange-600">Import and export</p>
        <h2 id="data-management-title" className="mt-1 text-xl font-semibold text-slate-900">Data Management</h2>
        <p className="mt-1 text-sm text-slate-500">Import and export clients, venues, staff, services, and payments using CSV or Excel workbooks.</p>
      </div>
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm font-semibold text-slate-800">Officially supported platforms</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-orange-700">DJ Event Planner</span>
          <span className="text-xs text-slate-500">More coming soon…</span>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-slate-500">Other CSV/XLSX files are imported best-effort using recognized column headings; complete field support is not guaranteed.</p>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">The supplied DJ Event Planner client export is mapped; mappings for its other export types can be refined as sample files are provided.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <form onSubmit={importFile} className="space-y-4 rounded-xl border border-slate-200 p-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900"><ArrowUpFromLine className="size-4 text-orange-500" />Import data</h3>
          <label className="block text-sm font-medium text-slate-700">
            Record type
            <select value={entity} onChange={(event) => setEntity(event.target.value as typeof entity)} className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 font-normal">
              {ENTITIES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Source platform
            <select value={source} onChange={(event) => setSource(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 font-normal">
              <option value="djep">DJ Event Planner</option>
              <option value="other">Other / generic spreadsheet</option>
            </select>
          </label>
          <label className="block text-sm font-medium text-slate-700">
            CSV or Excel file (.csv, .xlsx)
            <input type="file" accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={(event) => setFile(event.target.files?.[0] ?? null)} className="mt-1.5 block w-full rounded-xl border border-slate-300 bg-white p-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium" />
          </label>
          <p className="text-xs leading-relaxed text-slate-500">Imports append records. Review the file first to avoid duplicates. Raw row contents are not retained in import history.</p>
          <button type="submit" disabled={busy || !file} className="rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-brand-accent-foreground hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50">{busy ? "Importing…" : "Import file"}</button>
          {message && <p role="status" className="text-sm text-slate-600">{message}</p>}
        </form>

        <div className="space-y-4 rounded-xl border border-slate-200 p-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900"><ArrowDownToLine className="size-4 text-orange-500" />Export data</h3>
          <label className="block text-sm font-medium text-slate-700">
            Record type
            <select value={entity} onChange={(event) => setEntity(event.target.value as typeof entity)} className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 font-normal">
              {ENTITIES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </label>
          <label className="block text-sm font-medium text-slate-700">
            File format
            <select value={format} onChange={(event) => setFormat(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 font-normal">
              <option value="csv">CSV</option>
              <option value="xlsx">Excel workbook (.xlsx)</option>
            </select>
          </label>
          <a href={exportUrl} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"><FileSpreadsheet className="size-4" />Export selected data</a>
        </div>
      </div>

      <div className="border-t border-slate-100 pt-5">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900"><Database className="size-4 text-slate-400" />Recent imports</h3>
        {batches.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No imports yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-100">
            {batches.map((batch) => (
              <li key={batch.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                <span className="min-w-0">
                  <span className="block truncate font-medium text-slate-800">{batch.fileName || "Imported data"}</span>
                  <span className="text-xs text-slate-500">{batch.source.toUpperCase()} · {batch.processedRecords}/{batch.totalRecords} records · {batch.errorCount} failed</span>
                </span>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs capitalize text-slate-600">{batch.status}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
