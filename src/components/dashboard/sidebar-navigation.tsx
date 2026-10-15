import Link from "next/link";
import { NAV_ITEMS } from "@/components/dashboard/navigation";
import { initials } from "@/lib/utils";

export function SidebarNavigation({ activeHref, canManageClients, businessName, logoUrl, collapsed = false, onNavigate }: {
  activeHref: string;
  canManageClients: boolean;
  businessName: string;
  logoUrl: string | null;
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <>
      <Link href="/dashboard" aria-label={`${businessName} dashboard home`} className="shell-brand" onClick={onNavigate} title={collapsed ? businessName : undefined}>
        {logoUrl ? (
          <img src={logoUrl} alt={`${businessName} logo`} width={40} height={40} className="shell-logo" />
        ) : (
          <span aria-hidden="true" className="shell-monogram">{initials(businessName)}</span>
        )}
        {!collapsed && <span className="shell-brand-copy"><span className="shell-business-name" title={businessName}>{businessName}</span><span className="shell-caption">Event Planner</span></span>}
      </Link>
      <nav aria-label="Dashboard navigation" className="shell-navigation">
        {NAV_ITEMS.filter((item) => !item.adminOnly || canManageClients).map(({ label, href, icon: Icon, ready }) => {
          const content = <><Icon aria-hidden="true" className="shell-nav-icon" />{!collapsed && <span className="shell-nav-label">{label}</span>}{!ready && !collapsed && <span className="shell-nav-soon">Soon</span>}</>;
          return ready ? (
            <Link key={href} href={href} aria-label={label} aria-current={activeHref === href ? "page" : undefined} className="shell-nav-item" title={collapsed ? label : undefined} onClick={onNavigate}>{content}</Link>
          ) : (
            <div key={href} aria-disabled="true" aria-label={`${label} — coming soon`} className="shell-nav-item" title={collapsed ? `${label} — coming soon` : undefined}>{content}</div>
          );
        })}
      </nav>
    </>
  );
}
