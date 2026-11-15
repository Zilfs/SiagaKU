import { Sparkles } from "lucide-react";

function renderText(text: string) {
  return text.split(/(\[\d+\])/g).map((part, index) => {
    if (/^\[\d+\]$/.test(part)) {
      const n = part.slice(1, -1);
      return (
        <a key={`${part}-${index}`} className="sk-cite" href={`#sumber-${n}`}>
          {part}
        </a>
      );
    }
    return part;
  });
}

/** One turn in the chat; the assistant's [n] citations link to the source list. */
export function MessageBubble({
  role,
  text,
  ai = false,
}: {
  role: "user" | "assistant" | "system";
  text: string;
  ai?: boolean;
}) {
  if (role === "system") {
    return (
      <div className="sk-msg sk-msg--system" role="status">
        {text}
      </div>
    );
  }
  return (
    <div className={role === "user" ? "sk-msg sk-msg--user" : "sk-msg sk-msg--assistant"}>
      {role === "assistant" && ai ? (
        <span className="sk-msg__badge">
          <Sparkles size={12} aria-hidden="true" />
          AI
        </span>
      ) : null}
      <div className="sk-msg__body">{renderText(text)}</div>
    </div>
  );
}
