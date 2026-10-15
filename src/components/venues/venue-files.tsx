"use client";

import { FileText, Image as ImageIcon, Upload } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, type ChangeEvent } from "react";

type VenueFileItem = {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  createdAt: string;
};

function fileSize(size: number) {
  return size < 1024 * 1024 ? `${Math.max(1, Math.round(size / 1024))} KB` : `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export default function VenueFiles({ venueId, files }: { venueId: string; files: VenueFileItem[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  async function uploadFiles(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const uploads = Array.from(input.files ?? []);
    if (!uploads.length) return;

    setBusy(true);
    setStatus("");
    setError("");
    let uploaded = 0;
    const failures: string[] = [];

    try {
      for (const file of uploads) {
        const body = new FormData();
        body.set("file", file);
        const response = await fetch(`/plan/api/dashboard/venues/${venueId}/files`, { method: "POST", body });
        if (response.ok) {
          uploaded += 1;
        } else {
          const result = await response.json().catch(() => null);
          failures.push(`${file.name}: ${result?.error ?? "Upload failed"}`);
        }
      }
      if (failures.length) setError(failures.join(" "));
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      if (uploaded) {
        setStatus(`Uploaded ${uploaded} ${uploaded === 1 ? "file" : "files"}.`);
        router.refresh();
      }
      setBusy(false);
      input.value = "";
    }
  }

  return (
    <div className="space-y-4 sm:col-span-2">
      <div>
        <h3 className="text-sm font-medium text-foreground">Documents and photos</h3>
        <p className="mt-1 text-xs text-muted-foreground">PDF, JPEG, PNG, or WebP · up to 10 MB per file · private to authorized admins.</p>
      </div>
      <label className="ui-upload">
        <Upload className="size-4" aria-hidden="true" />
        {busy ? "Uploading…" : "Upload documents or photos"}
        <input type="file" multiple accept="application/pdf,image/jpeg,image/png,image/webp" disabled={busy} onChange={uploadFiles} className="sr-only" />
      </label>
      {status && <p role="status" className="ui-feedback ui-feedback-success">{status}</p>}
      {error && <p role="alert" className="ui-feedback ui-feedback-error">{error}</p>}
      {files.length > 0 && (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {files.map((file) => {
            const image = file.mimeType.startsWith("image/");
            const href = `/plan/api/venue-files/${file.id}`;
            return (
              <li key={file.id} className="flex items-center gap-3 p-3">
                {image ? (
                  <Image src={href} alt={file.originalName} width={48} height={48} unoptimized className="size-12 rounded-lg border border-border object-cover" />
                ) : (
                  <span className="grid size-12 shrink-0 place-items-center rounded-lg bg-surface-secondary text-muted-foreground"><FileText className="size-5" aria-hidden="true" /></span>
                )}
                <div className="min-w-0 flex-1">
                  <a href={href} target="_blank" rel="noreferrer" className="ui-link block break-words text-sm font-medium">{file.originalName}</a>
                  <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">{fileSize(file.size)} · {file.createdAt.slice(0, 10)}</p>
                </div>
                {image && <ImageIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />}
              </li>
            );
          })}
        </ul>
      )}
      {!files.length && <p className="text-sm text-muted-foreground">No documents or photos uploaded.</p>}
    </div>
  );
}
