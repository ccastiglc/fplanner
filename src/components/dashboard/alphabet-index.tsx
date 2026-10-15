const ALPHABET = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ", "#"];

export default function AlphabetIndex({
  prefix,
  letters,
}: {
  prefix: string;
  letters: Set<string>;
}) {
  return (
    <nav aria-label="Jump by first letter" className="alphabet-index">
      <div>
        {ALPHABET.map((letter) => letters.has(letter) ? (
          <a key={letter} href={`#${prefix}-${letter}`} aria-label={`Jump to ${letter}`}>{letter}</a>
        ) : (
          <span key={letter} aria-disabled="true">{letter}</span>
        ))}
      </div>
    </nav>
  );
}
