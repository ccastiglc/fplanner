"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ClientPhotoUpload({
  clientId,
  clientName,
  photoSrc,
  personId,
  compact = false,
  onUploaded,
}: {
  clientId: string;
  clientName: string;
  photoSrc?: string | null;
  personId?: string;
  compact?: boolean;
  onUploaded?: (storageKey: string) => void;
}) {
  const router = useRouter();
  const [source, setSource] = useState(photoSrc ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function uploadPhoto(event: React.ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;

    setBusy(true);
    setError("");
    const formData = new FormData();
    formData.set("photo", file);
    if (personId) formData.set("personId", personId);

    try {
      const response = await fetch(`/plan/api/dashboard/clients/${clientId}/photo`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const result = await response.json().catch(() => null);
        setError(result?.error || "Photo upload failed.");
        return;
      }

      const result = await response.json();
      setSource(`/plan/api/client-photos/${result.photoStorageKey}`);
      onUploaded?.(result.photoStorageKey);
      router.refresh();
    } catch {
      setError("Photo upload failed. Please try again.");
    } finally {
      setBusy(false);
      input.value = "";
    }
  }

  if (compact) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        {source && <img src={source} alt={`${clientName} profile`} width={40} height={40} className="size-10 rounded-lg border border-slate-200 object-cover" />}
        <label className="inline-flex cursor-pointer items-center rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50">
          {busy ? "Uploading…" : "Upload photo"}
          <input type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={uploadPhoto} className="sr-only" />
        </label>
        {error && <span role="alert" className="text-xs text-red-700">{error}</span>}
      </div>
    );
  }

  return (
    <section className="mb-5 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center">
      {source ? (
        <img src={source} alt={`${clientName} profile`} width={80} height={80} className="size-20 rounded-2xl border border-slate-200 object-cover" />
      ) : (
        <div aria-label="No client photo" className="grid size-20 place-items-center rounded-2xl bg-orange-50 text-2xl font-semibold text-orange-600">{clientName.slice(0, 1).toUpperCase()}</div>
      )}
      <div className="flex-1">
        <h2 className="text-sm font-semibold text-slate-900">Client photo</h2>
        <p className="mt-1 text-xs text-slate-500">JPEG, PNG, or WebP · up to 5 MB. Uploaded photos are private to authorized dashboard users.</p>
        {error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
      </div>
      <label className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
        {busy ? "Uploading…" : source ? "Replace photo" : "Upload photo"}
        <input type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={uploadPhoto} className="sr-only" />
      </label>
    </section>
  );
}
