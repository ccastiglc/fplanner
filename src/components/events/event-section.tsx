export default function EventSection({ id, title, children, grid = false }: { id: string; title: string; children: React.ReactNode; grid?: boolean }) {
  return (
    <section id={id} aria-labelledby={`${id}-heading`} className={`scroll-mt-36 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7 ${grid ? "grid gap-4 sm:grid-cols-2" : "space-y-4"}`}>
      <h2 id={`${id}-heading`} className={`text-xl font-semibold text-slate-900 ${grid ? "sm:col-span-2" : ""}`}>{title}</h2>
      {children}
    </section>
  );
}
