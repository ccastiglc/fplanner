"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";

const subscribe = () => () => {};

export function AppearanceSelector({ showLabel = false }) {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);

  return (
    <label className="appearance-control">
      <span className={showLabel ? "" : "sr-only"}>Appearance</span>
      <select
        className="appearance-select"
        autoComplete="off"
        value={mounted ? theme ?? "system" : "system"}
        onChange={(event) => setTheme(event.target.value)}
      >
        <option value="light">Light</option>
        <option value="dark">Dark</option>
        <option value="system">System</option>
      </select>
    </label>
  );
}
