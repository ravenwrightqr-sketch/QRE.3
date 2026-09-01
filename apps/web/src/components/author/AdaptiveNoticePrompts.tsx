import { useState } from "react";
import type { CSSProperties } from "react";

type Props = {
  prompt: string;
  category?: string | null;
  hasLocation: boolean;
  hasTime: boolean;
  onAdd: (question: string, answer: string) => void;
};

const IDEA_PROMPTS = [
  "Create a living memory.",
  "Create a dog tag.",
  "Create a wedding living memory.",
  "Create a relationship living memory.",
  "Create an artist film.",
  "Create a business film.",
  "Create an event.",
  "Create a rave living memory.",
  "Make this funny.",
  "Make this weird.",
  "Bring this place to life.",
  "Turn this into a game.",
];

function buildQuestions({ prompt, category, hasLocation, hasTime }: Omit<Props, "onAdd">): string[] {
  const text = prompt.replace(/\s+/g, " ").trim().toLowerCase();
  if (!text) return [];

  const haystack = `${text} ${String(category ?? "").toLowerCase()}`;
  const questions: string[] = [];

  if (/clean|groom|repair|detail|wash|service|job|property|airbnb|salon|barber|restaurant|event|hotel|delivery/.test(haystack)) {
    questions.push("Anything funny?");
  }

  if (/cat|dog|pet|guest|client|customer|person|people|team|couple|friend/.test(text)) {
    questions.push("Anything different today?");
  }

  if (hasLocation || hasTime || /arrived|left|visit|place|house|home|venue/.test(haystack)) {
    questions.push("Notice anything odd?");
  }

  questions.push("Anything unexpected?");
  questions.push("Anything worth remembering?");

  return [...new Set(questions)].slice(0, 3);
}

export default function AdaptiveNoticePrompts({ prompt, category, hasLocation, hasTime, onAdd }: Props) {
  const questions = buildQuestions({ prompt, category, hasLocation, hasTime });
  const [activeQuestion, setActiveQuestion] = useState<string | null>(null);
  const [answer, setAnswer] = useState("");

  if (!questions.length) return null;

  const shell: CSSProperties = {
    width: "min(920px, 92vw)",
    marginTop: 14,
    textAlign: "center",
  };
  const eyebrow: CSSProperties = { fontSize: 9, letterSpacing: 4, opacity: .24, marginBottom: 5 };
  const text: CSSProperties = { fontSize: 12, opacity: .38, marginBottom: 8 };
  const row: CSSProperties = { display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 7 };
  const chip: CSSProperties = {
    border: 0,
    background: "transparent",
    color: "rgba(255,255,255,.58)",
    borderRadius: 999,
    padding: "7px 9px",
    cursor: "pointer",
    fontSize: 10,
    letterSpacing: .5,
  };
  const answerShell: CSSProperties = { display: "inline-flex", alignItems: "center", gap: 8, marginTop: 8, maxWidth: "min(720px, 92vw)" };
  const answerInput: CSSProperties = {
    width: "min(520px, 62vw)",
    minWidth: 180,
    border: 0,
    borderBottom: "1px solid rgba(255,255,255,.16)",
    background: "transparent",
    color: "#fff",
    outline: "none",
    padding: "6px 2px",
    font: "inherit",
    fontSize: 13,
  };
  const answerButton: CSSProperties = {
    border: 0,
    background: "transparent",
    color: "rgba(255,255,255,.55)",
    cursor: "pointer",
    letterSpacing: 1.3,
    fontSize: 9,
  };
  const ideasRow: CSSProperties = {
    display: "flex",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 2,
    marginTop: 14,
  };
  const ideaChip: CSSProperties = {
    border: 0,
    background: "transparent",
    color: "rgba(255,255,255,.24)",
    cursor: "pointer",
    fontSize: 10,
    padding: "4px 6px",
  };

  function choose(question: string) {
    setActiveQuestion(question);
    setAnswer("");
  }

  function submit() {
    const value = answer.replace(/\s+/g, " ").trim();
    if (!activeQuestion || !value) return;
    onAdd(activeQuestion, value);
    setActiveQuestion(null);
    setAnswer("");
  }

  return (
    <section style={shell} aria-label="Optional details and ideas">
      <div style={eyebrow}>QRE NOTICED</div>
      <div style={text}>Only add what feels worth mentioning.</div>

      <div style={row}>
        {questions.map((question) => (
          <button key={question} type="button" onClick={() => choose(question)} style={chip}>
            {question}
          </button>
        ))}
      </div>

      {activeQuestion && (
        <div style={answerShell}>
          <span style={{ opacity: .34, fontSize: 11 }}>{activeQuestion}</span>
          <input
            autoFocus
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                submit();
              }
              if (event.key === "Escape") {
                setActiveQuestion(null);
                setAnswer("");
              }
            }}
            placeholder="tell QRE…"
            style={answerInput}
            aria-label={activeQuestion}
          />
          <button type="button" onClick={submit} disabled={!answer.trim()} style={{ ...answerButton, opacity: answer.trim() ? 1 : .35 }}>
            ADD
          </button>
        </div>
      )}

      <div style={ideasRow} aria-label="Creation ideas">
        {IDEA_PROMPTS.map((idea) => (
          <button key={idea} type="button" onClick={() => onAdd("Idea", idea)} style={ideaChip}>
            {idea}
          </button>
        ))}
      </div>
    </section>
  );
}
