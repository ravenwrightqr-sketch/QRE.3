import { useState } from "react";
import type { CSSProperties } from "react";

type Props = {
  prompt: string;
  category?: string | null;
  hasLocation: boolean;
  hasTime: boolean;
  onAdd: (question: string, answer: string) => void;
};

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
    width: "min(900px, 92vw)",
    marginTop: 12,
    padding: "12px 14px",
    border: "1px solid rgba(185,255,241,.08)",
    background: "rgba(185,255,241,.025)",
    borderRadius: 18,
    boxSizing: "border-box",
  };
  const eyebrow: CSSProperties = { fontSize: 9, letterSpacing: 3, opacity: .34, marginBottom: 5 };
  const text: CSSProperties = { fontSize: 12, opacity: .54, marginBottom: 9 };
  const row: CSSProperties = { display: "flex", flexWrap: "wrap", gap: 7 };
  const chip: CSSProperties = {
    border: "1px solid rgba(255,255,255,.1)",
    background: "rgba(255,255,255,.035)",
    color: "rgba(255,255,255,.72)",
    borderRadius: 999,
    padding: "7px 10px",
    cursor: "pointer",
    fontSize: 10,
    letterSpacing: 1,
  };
  const answerShell: CSSProperties = { display: "flex", gap: 7, marginTop: 10, flexWrap: "wrap" };
  const answerInput: CSSProperties = { flex: "1 1 260px", minWidth: 180, border: "1px solid rgba(255,255,255,.1)", background: "rgba(0,0,0,.18)", color: "#fff", borderRadius: 999, padding: "8px 11px", outline: "none" };
  const answerButton: CSSProperties = { ...chip, borderColor: "rgba(185,255,241,.22)", color: "#d9fff7" };

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
    <section style={shell} aria-label="Optional details QRE noticed">
      <div style={eyebrow}>QRE NOTICED</div>
      <div style={text}>Add only what matters. Skip everything else.</div>
      <div style={row}>
        {questions.map((question) => (
          <button key={question} type="button" onClick={() => choose(question)} style={chip}>
            {question}
          </button>
        ))}
      </div>
      {activeQuestion && (
        <div style={answerShell}>
          <input
            autoFocus
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
            onKeyDown={(event) => { if (event.key === "Enter") submit(); if (event.key === "Escape") setActiveQuestion(null); }}
            placeholder={`${activeQuestion.replace(/\?$/, "")}...`}
            style={answerInput}
            aria-label={activeQuestion}
          />
          <button type="button" onClick={submit} disabled={!answer.trim()} style={{ ...answerButton, opacity: answer.trim() ? 1 : .38 }}>
            ADD
          </button>
        </div>
      )}
    </section>
  );
}
