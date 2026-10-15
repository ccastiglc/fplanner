export default function SectionNavigation({ label, sections }: { label: string; sections: readonly { id: string; label: string }[] }) {
  return (
    <nav aria-label={label} className="section-navigation">
      <div>
        {sections.map((section) => <a key={section.id} href={`#${section.id}`}>{section.label}</a>)}
      </div>
    </nav>
  );
}
