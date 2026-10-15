"use client";

import { useState } from "react";
import { ArrowDownToLine, ArrowUpFromLine, Database, FileSpreadsheet } from "lucide-react";

const ENTITIES = [
  { value: "clients", label: "Clients" },
  { value: "venues", label: "Venues" },
  { value: "staff", label: "Staff" },
  { value: "services", label: "Services" },
  { value: "payments", label: "Payments" },
  { value: "events", label: "Events" },
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
  const [messageTone, setMessageTone] = useState("information");

  async function importFile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!file) {
      setMessageTone("error");
      setMessage("Choose a CSV or XLSX file first.");
      return;
    }

    setBusy(true);
    setMessageTone("information");
    setMessage("Importing file…");
    const formData = new FormData();
    formData.set("entity", entity);
    formData.set("source", source);
    formData.set("file", file);

    try {
      const response = await fetch("/plan/api/settings/import", { method: "POST", body: formData });
      const result = await response.json();
      if (!response.ok) {
        setMessageTone("error");
        setMessage(result.error || "Import failed.");
        return;
      }
      const rowErrors = result.errors?.length ? ` First issue: ${result.errors[0]}` : "";
      setMessageTone(result.errorCount ? "warning" : "success");
      setMessage(`Imported ${result.imported} of ${result.total} rows; ${result.errorCount} failed.${rowErrors}`);
      setFile(null);
      form.reset();
    } catch {
      setMessageTone("error");
      setMessage("Import failed. Check the file and try again.");
    } finally {
      setBusy(false);
    }
  }

  const exportUrl = `/plan/api/settings/export?entity=${entity}&format=${format}`;

  return (
    <section id="data-management" aria-labelledby="data-management-title" className="record-form ui-surface scroll-mt-36 space-y-6">
      <div>
        <p className="text-xs font-medium text-muted-foreground">Import and export</p>
        <h2 id="data-management-title" className="mt-1 text-xl font-semibold text-foreground">Data management</h2>
        <p className="mt-1 text-sm text-muted-foreground">Import and export events, clients, venues, staff, services, and payments using CSV or Excel workbooks.</p>
      </div>
      <div className="rounded-lg border border-border bg-surface-secondary p-4">
        <p className="text-sm font-medium text-foreground">Officially supported platforms</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="ui-badge">DJ Event Planner</span>
          <span className="text-xs text-muted-foreground">More coming soon…</span>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">Other CSV/XLSX files are imported best-effort using recognized column headings; complete field support is not guaranteed.</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">DJEP event imports link organization-owned profiles and retain financial and XML planning information. Import client, venue, staff, and package directories first for accurate matching. Times use America/New_York.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <form onSubmit={importFile} aria-busy={busy} className="space-y-4 rounded-lg border border-border p-4">
          <h3 className="flex items-center gap-2 text-sm font-medium text-foreground"><ArrowUpFromLine aria-hidden="true" className="size-4 text-muted-foreground" />Import data</h3>
          <label className="ui-label">
            Record type
            <select value={entity} onChange={(event) => setEntity(event.target.value as typeof entity)} className="ui-input mt-1.5">
              {ENTITIES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </label>
          <label className="ui-label">
            Source platform
            <select value={source} onChange={(event) => setSource(event.target.value)} className="ui-input mt-1.5">
              <option value="djep">DJ Event Planner</option>
              <option value="other">Other / generic spreadsheet</option>
            </select>
          </label>
          <label className="ui-label">
            CSV or Excel file (.csv, .xlsx)
            <input type="file" accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={(event) => setFile(event.target.files?.[0] ?? null)} className="ui-file-input" />
          </label>
          <p className="text-xs leading-relaxed text-muted-foreground">Event imports skip previously imported event IDs and reject ambiguous profile matches. Other imports append records. Raw rows, guest passwords, and XML access logs are not retained.</p>
          <button type="submit" disabled={busy || !file} className="ui-button ui-button-primary">{busy ? "Importing…" : "Import file"}</button>
          {message && <p role={messageTone === "error" ? "alert" : "status"} className={`ui-feedback ui-feedback-${messageTone}`}>{message}</p>}
        </form>

        <div className="space-y-4 rounded-lg border border-border p-4">
          <h3 className="flex items-center gap-2 text-sm font-medium text-foreground"><ArrowDownToLine aria-hidden="true" className="size-4 text-muted-foreground" />Export data</h3>
          <label className="ui-label">
            Record type
            <select value={entity} onChange={(event) => setEntity(event.target.value as typeof entity)} className="ui-input mt-1.5">
              {ENTITIES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </label>
          <label className="ui-label">
            File format
            <select value={format} onChange={(event) => setFormat(event.target.value)} className="ui-input mt-1.5">
              <option value="csv">CSV</option>
              <option value="xlsx">Excel workbook (.xlsx)</option>
            </select>
          </label>
          <a href={exportUrl} className="ui-button"><FileSpreadsheet aria-hidden="true" className="size-4" />Export selected data</a>
        </div>
      </div>

      <div className="border-t border-border pt-5">
        <h3 className="flex items-center gap-2 text-sm font-medium text-foreground"><Database aria-hidden="true" className="size-4 text-muted-foreground" />Recent imports</h3>
        {batches.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No imports yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border">
            {batches.map((batch) => (
              <li key={batch.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                <span className="min-w-0">
                  <span className="block break-words font-medium text-foreground">{batch.fileName || "Imported data"}</span>
                  <span className="text-xs tabular-nums text-muted-foreground">{batch.source.toUpperCase()} · {batch.processedRecords}/{batch.totalRecords} records · {batch.errorCount} failed</span>
                </span>
                <span className="ui-badge capitalize">{batch.status}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
