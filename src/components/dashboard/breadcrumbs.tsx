import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { NAV_ITEMS } from "@/components/dashboard/navigation";

export function Breadcrumbs({ path }: { path: string[] }) {
  const currentModule = NAV_ITEMS.find((item) => item.href === `/dashboard/${path[0]}`);
  const items = [{ label: "Dashboard", href: "/dashboard" }];
  if (currentModule) {
    items.push({ label: currentModule.label, href: currentModule.href });
    if (path[1]) {
      const noun = path[0] === "staff" ? "staff" : currentModule.label.slice(0, -1).toLowerCase();
      items.push({ label: path[1] === "new" ? `Add ${noun}` : `${noun[0].toUpperCase()}${noun.slice(1)} profile`, href: "" });
    }
  }

  return (
    <nav aria-label="Breadcrumb" className="shell-breadcrumbs">
      <ol>
        {items.map((item, index) => (
          <li key={item.label}>
            {index > 0 && <ChevronRight aria-hidden="true" />}
            {index === items.length - 1 ? <span aria-current="page">{item.label}</span> : <Link href={item.href}>{item.label}</Link>}
          </li>
        ))}
      </ol>
    </nav>
  );
}
