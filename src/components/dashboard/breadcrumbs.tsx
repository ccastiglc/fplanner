"use client";

interface BreadcrumbsProps {
  path: string[];
}

export function Breadcrumbs({ path }: BreadcrumbsProps) {
  const segments = path.filter((s) => s !== "" && s !== "dashboard");

  return (
    <nav aria-label="breadcrumb" className="mb-4">
      <ol className="flex space-x-1">
        <li className="hidden sm:flex">
          <a
            href="/dashboard"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Dashboard
          </a>
        </li>
        {segments.map((segment, index) => (
          <li key={index} className="flex items-center text-sm">
            <a
              href={`/dashboard/${segments.slice(0, index + 1).join("/")}`}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {segment}
            </a>
            {index < segments.length - 1 ? (
              <span className="mx-2 text-xs text-muted-foreground">/</span>
            ) : null}
          </li>
        ))}
      </ol>
    </nav>
  );
}