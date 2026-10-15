"use client";

import { useId, useRef, useState } from "react";
import { dismissDialogBackdrop, trapDialogTab } from "@/lib/dialog-interactions";

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
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const [confirmation, setConfirmation] = useState("");
  const canDelete = confirmation.trim().toLowerCase() === "delete";

  return (
    <>
      <button ref={trigger} type="button" onClick={() => { setConfirmation(""); dialog.current?.showModal(); cancel.current?.focus(); }} className="ui-button ui-button-danger-outline">
        Delete {entityLabel}
      </button>
      <dialog ref={dialog} role="alertdialog" aria-labelledby={titleId} aria-describedby={descriptionId} className="ui-dialog" onClose={() => trigger.current?.focus()} onKeyDown={trapDialogTab} onClick={dismissDialogBackdrop}>
        <h2 id={titleId} className="text-lg font-semibold text-foreground">Delete {entityLabel} “{itemName}”?</h2>
        <p id={descriptionId} className="mt-2 text-sm leading-relaxed text-secondary-foreground">{consequences}</p>
        <form action={action} className="mt-5 space-y-4">
          <input type="hidden" name={fieldName} value={recordId} />
          <label className="ui-label">
            Type DELETE to confirm
            <input
              name="confirmation"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              autoComplete="off"
              className="ui-input mt-1.5 font-normal"
            />
          </label>
          <div className="flex justify-end gap-3">
            <button ref={cancel} type="button" onClick={() => dialog.current?.close()} className="ui-button">Cancel</button>
            <button type="submit" disabled={!canDelete} className="ui-button ui-button-danger">Delete {entityLabel}</button>
          </div>
        </form>
      </dialog>
    </>
  );
}
