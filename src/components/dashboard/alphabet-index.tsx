const ALPHABET = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ", "#"];

export default function AlphabetIndex({
  prefix,
  letters,
}: {
  prefix: string;
  letters: Set<string>;
}) {
  return (
    <nav aria-label="Jump by first letter" className="order-first -mx-4 mb-1 border-y border-slate-200 bg-white px-3 py-2 lg:order-last lg:sticky lg:top-[76px] lg:mx-0 lg:mb-0 lg:max-h-[calc(100vh-84px)] lg:overflow-y-auto lg:rounded-xl lg:border lg:p-1">
      <div className="grid grid-cols-7 gap-0.5 sm:grid-cols-9 lg:grid-cols-2">
        {ALPHABET.map((letter) => letters.has(letter) ? (
          <a key={letter} href={`#${prefix}-${letter}`} aria-label={`Jump to ${letter}`} className="grid size-6 place-items-center rounded-md text-[10px] font-semibold text-slate-600 hover:bg-orange-50 hover:text-orange-700">{letter}</a>
        ) : (
          <span key={letter} aria-disabled="true" className="grid size-6 place-items-center rounded-md text-[10px] text-slate-300">{letter}</span>
        ))}
      </div>
    </nav>
  );
}
