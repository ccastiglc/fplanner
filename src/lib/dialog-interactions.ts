import type { KeyboardEvent, MouseEvent } from "react";

export function trapDialogTab(event: KeyboardEvent<HTMLDialogElement>) {
  if (event.key !== "Tab") return;
  const controls = [...event.currentTarget.querySelectorAll<HTMLElement>('a[href], button:enabled, input:enabled:not([type="hidden"]), select:enabled, textarea:enabled, [tabindex="0"]')].filter((control) => control.getClientRects().length);
  const first = controls[0];
  const last = controls[controls.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last?.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first?.focus();
  }
}

export function dismissDialogBackdrop(event: MouseEvent<HTMLDialogElement>) {
  if (event.target !== event.currentTarget) return;
  const bounds = event.currentTarget.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) event.currentTarget.close();
}
