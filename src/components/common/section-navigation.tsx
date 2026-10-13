export default function SectionNavigation({ label, sections }: { label: string; sections: readonly { id: string; label: string }[] }) {
  return (
    <nav aria-label={label} className="sticky top-[68px] z-20 -mx-4 mb-6 border-y border-slate-200 bg-slate-50/95 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <div className="flex gap-2 overflow-x-auto">
        {sections.map((section) => <a key={section.id} href={`#${section.id}`} className="shrink-0 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-white hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500">{section.label}</a>)}
      </div>
    </nav>
  );
}
