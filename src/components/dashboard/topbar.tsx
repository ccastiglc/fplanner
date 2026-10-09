"use client";

import { Menu, MenuTrigger, MenuContent, MenuItem } from "@/components/ui/menu";

export default function TopBar() {

  return (
    <header className="border-b border-border bg-surface flex items-center justify-between px-6 py-3">
      <div className="flex items-center gap-3">
        <span className="text-xl font-bold text-foreground">Fredo Productions</span>
        <span className="text-sm text-muted-foreground">Event Planner</span>
      </div>

      <Menu>
        <MenuTrigger>
          <button
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M3 4h18M3 12h18M3 20h18" />
            </svg>
            <span className="hidden md:inline">Menu</span>
          </button>
        </MenuTrigger>
        <MenuContent align="end">
          <MenuItem>
            <a href="/dashboard" className="text-sm text-foreground hover:opacity-90 transition-opacity">
              Dashboard
            </a>
          </MenuItem>
          <MenuItem>
            <a href="/auth/logout" className="text-sm text-foreground hover:opacity-90 transition-opacity">
              Logout
            </a>
          </MenuItem>
        </MenuContent>
      </Menu>
    </header>
  );
}