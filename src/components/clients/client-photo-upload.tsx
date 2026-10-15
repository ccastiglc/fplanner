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
        {source && <img src={source} alt={`${clientName} profile`} width={40} height={40} className="size-10 rounded-lg border border-border object-cover" />}
        <label className="ui-upload">
          {busy ? "Uploading…" : "Upload photo"}
          <input type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={uploadPhoto} className="sr-only" />
        </label>
        {error && <span role="alert" className="text-xs text-error-foreground">{error}</span>}
      </div>
    );
  }

  return (
    <section aria-label="Client photo" className="ui-surface mb-5 flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
      {source ? (
        <img src={source} alt={`${clientName} profile`} width={80} height={80} className="size-20 rounded-xl border border-border object-cover" />
      ) : (
        <div aria-label="No client photo" className="grid size-20 place-items-center rounded-xl bg-surface-secondary text-2xl font-medium text-foreground">{clientName.slice(0, 1).toUpperCase()}</div>
      )}
      <div className="flex-1">
        <h2 className="text-sm font-medium text-foreground">Client photo</h2>
        <p className="mt-1 text-xs text-muted-foreground">JPEG, PNG, or WebP · up to 5 MB. Uploaded photos are private to authorized dashboard users.</p>
        {error && <p role="alert" className="ui-feedback ui-feedback-error mt-2">{error}</p>}
      </div>
      <label className="ui-upload">
        {busy ? "Uploading…" : source ? "Replace photo" : "Upload photo"}
        <input type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={uploadPhoto} className="sr-only" />
      </label>
    </section>
  );
}
