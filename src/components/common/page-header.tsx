export function PageHeader({ title, description, eyebrow, children }: { title: string; description?: string; eyebrow?: string; children?: React.ReactNode }) {
  return (
    <header className="page-header">
      <div className="page-header-copy">
        {eyebrow && <p className="page-header-eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {description && <p className="page-header-description">{description}</p>}
      </div>
      {children && <div className="page-header-actions">{children}</div>}
    </header>
  );
}
