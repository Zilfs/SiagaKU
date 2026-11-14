const QUESTIONS = [
  "Apa isi tas siaga?",
  "Kapan harus mengungsi kalau ada lansia?",
  "Bagaimana kalau air sudah masuk rumah?",
];

/** Three example questions for the empty chat; picking one sends it. */
export function SuggestionChips({ onPick }: { onPick: (question: string) => void }) {
  return (
    <div className="sk-chips" aria-label="Contoh pertanyaan">
      {QUESTIONS.map((question) => (
        <button
          key={question}
          type="button"
          className="sk-chip"
          onClick={() => onPick(question)}
        >
          {question}
        </button>
      ))}
    </div>
  );
}
