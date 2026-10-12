"use client";

import { useState } from "react";

export default function ConfirmDeleteButton({
  action,
  fieldName,
  recordId,
  entityLabel,
  itemName,
  consequences,
}: {
  action: (formData: FormData) => Promise<void>;
  fieldName: string;
  recordId: string;
  entityLabel: string;
  itemName: string;
  consequences: string;
}) {
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const canDelete = confirmation.trim().toLowerCase() === "delete";

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-50">
        Delete {entityLabel}
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/50 p-4">
      <section role="alertdialog" aria-modal="true" aria-labelledby="confirm-delete-title" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <h2 id="confirm-delete-title" className="text-lg font-semibold text-slate-900">Delete {entityLabel} “{itemName}”?</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{consequences}</p>
        <form action={action} className="mt-5 space-y-4">
          <input type="hidden" name={fieldName} value={recordId} />
          <label className="block text-sm font-medium text-slate-700">
            Type DELETE to confirm
            <input
              name="confirmation"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              autoComplete="off"
              className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-3 font-normal outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100"
            />
          </label>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={!canDelete} className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">Delete {entityLabel}</button>
          </div>
        </form>
      </section>
    </div>
  );
}
