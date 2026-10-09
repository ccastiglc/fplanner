"use client";

import * as React from "react";

interface MenuTriggerProps {
  children: React.ReactNode;
}

interface MenuContentProps {
  children: React.ReactNode;
  align?: "start" | "end";
}

interface MenuItemProps {
  children: React.ReactNode;
  href?: string;
}

export const Menu = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ children, ...props }, ref) => (
  <div ref={ref} {...props} className="hidden sm:block">
    {children}
  </div>
));

Menu.displayName = "Menu";

export const MenuTrigger = ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => {
  const [open, setOpen] = React.useState(false);

  return (
    <button
      onClick={() => setOpen(!open)}
      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:text-foreground transition-colors"
    >
      {children}
      <svg
        className="w-4 h-4 transform transition-transform"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M3 4h18M3 12h18M3 20h18" />
      </svg>
      <span className="hidden md:inline">Menu</span>
    </button>
  );
};

MenuTrigger.displayName = "MenuTrigger";

export const MenuContent = ({
  children,
  align = "end",
}: MenuContentProps) => (
  <div
    className={
      `absolute right-0 mt-2 w-48 rounded-md bg-surface shadow-lg py-1 ${
        align === "start" ? "left-0 right-auto" : ""
      }`
    }
  >
    {children}
  </div>
);

MenuContent.displayName = "MenuContent";

export const MenuItem = ({ children, href }: MenuItemProps) => {
  const handleClick = () => {
    if (href) {
      window.location.href = href;
    }
  };

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-primary/5 transition-colors"
    >
      {children}
    </button>
  );
};

MenuItem.displayName = "MenuItem";