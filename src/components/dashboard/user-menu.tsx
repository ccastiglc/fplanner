"use client";

import Link from "next/link";
import { useEffect, useId, useRef } from "react";
import { ChevronDown, CircleUserRound, LogOut, Settings } from "lucide-react";
import { logout } from "@/app/actions/auth";
import { AppearanceSelector } from "@/components/appearance-selector";

export function UserMenu({ userName, canManageClients }: { userName: string; canManageClients: boolean }) {
  const details = useRef<HTMLDetailsElement>(null);
  const summary = useRef<HTMLElement>(null);
  const titleId = useId();

  useEffect(() => {
    function closeOutside(event: PointerEvent) {
      if (details.current?.open && !details.current.contains(event.target as Node)) details.current.open = false;
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && details.current?.open) {
        event.preventDefault();
        details.current.open = false;
        summary.current?.focus();
      }
    }
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  return (
    <details ref={details} className="shell-profile" onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget as Node | null)) event.currentTarget.open = false;
    }}>
      <summary ref={summary} aria-label={`Account menu for ${userName}`} className="shell-profile-trigger">
        <CircleUserRound aria-hidden="true" />
        <span className="shell-profile-name" title={userName}>{userName}</span>
        <ChevronDown aria-hidden="true" className="shell-profile-chevron" />
      </summary>
      <section aria-labelledby={titleId} className="shell-profile-panel">
        <div className="shell-profile-heading">
          <p id={titleId} className="font-medium text-foreground">{userName}</p>
          <p className="shell-caption">{canManageClients ? "Administrator" : "Staff"}</p>
        </div>
        <div className="shell-profile-appearance"><AppearanceSelector showLabel /></div>
        <div className="shell-profile-actions">
          {canManageClients && <Link href="/dashboard/settings" className="shell-menu-action" onClick={() => { if (details.current) details.current.open = false; }}><Settings aria-hidden="true" />Workspace settings</Link>}
          <form action={logout}><button type="submit" className="shell-menu-action"><LogOut aria-hidden="true" />Sign out</button></form>
        </div>
      </section>
    </details>
  );
}
