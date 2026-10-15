"use client";

import { useSelectedLayoutSegments } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Menu, X } from "lucide-react";
import { SidebarNavigation } from "@/components/dashboard/sidebar-navigation";
import { Breadcrumbs } from "@/components/dashboard/breadcrumbs";
import { UserMenu } from "@/components/dashboard/user-menu";

export default function DashboardLayout({ children, canManageClients, businessName, logoUrl, userName }: Readonly<{
  children: React.ReactNode;
  canManageClients: boolean;
  businessName: string;
  logoUrl: string | null;
  userName: string;
}>) {
  const path = useSelectedLayoutSegments();
  const routeKey = path.join("/");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const drawer = useRef<HTMLDialogElement>(null);
  const mobileTrigger = useRef<HTMLButtonElement>(null);
  const collapseTrigger = useRef<HTMLButtonElement>(null);
  const activeHref = path[0] ? `/dashboard/${path[0]}` : "/dashboard";
  const navigation = { activeHref, canManageClients, businessName, logoUrl };

  useEffect(() => {
    if (!mobileOpen) return;
    const dialog = drawer.current;
    dialog?.showModal();
    document.body.classList.add("shell-navigation-open");
    return () => {
      dialog?.close();
      document.body.classList.remove("shell-navigation-open");
    };
  }, [mobileOpen]);

  useEffect(() => {
    drawer.current?.close();
  }, [routeKey]);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    function closeOnDesktop() {
      if (desktop.matches && drawer.current?.open) {
        drawer.current.close();
        collapseTrigger.current?.focus();
      }
    }
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);

  return (
    <div className="app-shell" data-collapsed={collapsed}>
      <a href="#main-content" className="shell-skip-link">Skip to content</a>
      <aside aria-label="Workspace navigation" className="shell-sidebar">
        <SidebarNavigation {...navigation} collapsed={collapsed} />
        <div className="shell-sidebar-footer">
          <button ref={collapseTrigger} type="button" className="shell-collapse-button" onClick={() => setCollapsed((value) => !value)} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} aria-expanded={!collapsed}>
            {collapsed ? <ChevronRight aria-hidden="true" /> : <ChevronLeft aria-hidden="true" />}
            {!collapsed && <span>Collapse sidebar</span>}
          </button>
        </div>
      </aside>
      <dialog ref={drawer} aria-label={`${businessName} navigation`} className="shell-drawer" onClose={() => {
        setMobileOpen(false);
        if (window.matchMedia("(max-width: 1023px)").matches) mobileTrigger.current?.focus();
      }} onKeyDown={(event) => {
        if (event.key !== "Tab") return;
        const controls = event.currentTarget.querySelectorAll<HTMLElement>("a[href], button:not([disabled])");
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }} onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) event.currentTarget.close();
      }}>
        <div className="shell-drawer-heading"><span className="shell-caption">Workspace</span><button type="button" className="shell-icon-button" aria-label="Close navigation" onClick={() => drawer.current?.close()}><X aria-hidden="true" /></button></div>
        <SidebarNavigation {...navigation} onNavigate={() => drawer.current?.close()} />
      </dialog>
      <div className="shell-workspace">
        <header className="shell-topbar">
          <div className="shell-location">
            <button ref={mobileTrigger} type="button" aria-label="Open navigation" aria-haspopup="dialog" aria-expanded={mobileOpen} className="shell-icon-button shell-mobile-trigger" onClick={() => setMobileOpen(true)}><Menu aria-hidden="true" /></button>
            <Breadcrumbs path={path} />
          </div>
          <UserMenu userName={userName} canManageClients={canManageClients} />
        </header>
        <main id="main-content" tabIndex={-1} className="shell-main">{children}</main>
      </div>
    </div>
  );
}
