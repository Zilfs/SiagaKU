import { Sparkles } from "lucide-react";

/** Why the score is what it is, in plain Indonesian. Sample text while the AI route is not wired. */
export function AiExplanation({ districtName, text }: { districtName: string; text: string }) {
  return (
    <section className="sk-card sk-explain" aria-labelledby="jelas-h">
      <div className="sk-card__head">
        <h2 id="jelas-h">Kenapa {districtName}?</h2>
        <span className="sk-tag sk-tag--ai">
          <Sparkles size={12} aria-hidden="true" />
          Penjelasan AI · contoh
        </span>
      </div>
      <p>{text}</p>
    </section>
  );
}
