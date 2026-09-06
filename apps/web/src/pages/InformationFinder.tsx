import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/layout/DashboardLayout";
import { apiPost } from "../lib/api";

type FinderQuestion = {
  question: string;
  kind: string;
  why: string;
};

type FinderResponse = {
  questions?: FinderQuestion[];
};

const clean = (value: string) => value.replace(/\s+/g, " ").trim();

export default function InformationFinder() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"consumer" | "business">("consumer");
  const [prompt, setPrompt] = useState("");
  const [subject, setSubject] = useState("");
  const [question, setQuestion] = useState<FinderQuestion | null>(null);
  const [moreQuestions, setMoreQuestions] = useState<FinderQuestion[]>([]);
  const [answer, setAnswer] = useState("");
  const [knownQuestions, setKnownQuestions] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const allQuestions = useMemo(() => question ? [question, ...moreQuestions.filter((item) => item.question !== question.question)] : moreQuestions, [question, moreQuestions]);

  async function find() {
    if (!clean(prompt) || busy) return;
    setBusy(true); setError("");
    try {
      const result = await apiPost("/api/ai/finder", {
        prompt: clean(prompt),
        subject: clean(subject),
        accountType: mode,
        knownQuestions,
      }) as FinderResponse;
      const questions = Array.isArray(result.questions) ? result.questions.filter((item) => item?.question) : [];
      setQuestion(questions[0] ?? null);
      setMoreQuestions(questions.slice(1));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Finder unavailable.");
    } finally {
      setBusy(false);
    }
  }

  function addAnswer() {
    const current = clean(answer);
    const active = question;
    if (!current || !active) return;
    setPrompt((value) => `${value.trim()}\n${current}`.trim());
    setKnownQuestions((values) => [...values.slice(-9), active.question]);
    setAnswer("");
    setMoreQuestions((values) => values.filter((item) => item.question !== active.question));
    setQuestion(null);
    requestAnimationFrame(() => void find());
  }

  useEffect(() => {
    if (!question && prompt.trim().length > 0 && knownQuestions.length === 0) return;
  }, [question, prompt, knownQuestions.length]);

  return (
    <DashboardLayout>
      <main style={pageStyle}>
        <div style={eyebrow}>QRE INFORMATION FINDER</div>
        <h1 style={title}>Start with whatever you know.</h1>
        <p style={sub}>QRE finds the next useful real detail. You do not need to know how to tell a story.</p>

        <div style={modeRow}>
          <button type="button" onClick={() => setMode("consumer")} style={{ ...modeButton, ...(mode === "consumer" ? selected : {}) }}>FOR ME</button>
          <button type="button" onClick={() => setMode("business")} style={{ ...modeButton, ...(mode === "business" ? selected : {}) }}>FOR MY BUSINESS</button>
        </div>

        <section style={card}>
          <input value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Who or what?  Coco · my restaurant · this surfboard · the house" style={input} />
          <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="Tell QRE anything you already know…" rows={6} style={textarea} />
          <div style={footer}>
            <span style={hint}>{prompt.trim() ? `${knownQuestions.length} questions answered` : "No form. No required fields."}</span>
            <button type="button" onClick={() => void find()} disabled={!prompt.trim() || busy} style={primary}>{busy ? "THINKING…" : "FIND THE NEXT DETAIL"}</button>
          </div>
        </section>

        {error && <div style={errorStyle}>{error}</div>}

        {question && (
          <section style={questionCard}>
            <div style={questionLabel}>QRE FOUND SOMETHING MISSING</div>
            <h2 style={questionTitle}>{question.question}</h2>
            <p style={questionWhy}>{question.why}</p>
            <div style={answerRow}>
              <input autoFocus value={answer} onChange={(event) => setAnswer(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addAnswer(); } }} placeholder="Your answer…" style={answerInput} />
              <button type="button" onClick={addAnswer} disabled={!answer.trim()} style={primary}>ADD</button>
            </div>
            {moreQuestions.length > 0 && <div style={alternates}><span style={hint}>Also useful:</span>{moreQuestions.map((item) => <button key={item.question} type="button" onClick={() => { setQuestion(item); setMoreQuestions((values) => values.filter((value) => value.question !== item.question)); }} style={alternate}>{item.question}</button>)}</div>}
          </section>
        )}

        <div style={bottomRow}>
          <button type="button" onClick={() => navigate("/dashboard")} style={secondary}>← BACK TO CREATE</button>
          <span style={bottomHint}>Facts first. Author later.</span>
        </div>
      </main>
    </DashboardLayout>
  );
}

const pageStyle = { minHeight: "calc(100vh - 100px)", display: "flex", flexDirection: "column" as const, alignItems: "center", padding: "56px 18px 100px", color: "#fff" };
const eyebrow = { fontSize: 10, letterSpacing: 5, opacity: .35 };
const title = { margin: "12px 0 10px", fontSize: "clamp(36px, 7vw, 64px)", fontWeight: 500, letterSpacing: "-2.5px", textAlign: "center" as const, maxWidth: 780 };
const sub = { margin: "0 0 28px", maxWidth: 620, textAlign: "center" as const, opacity: .5, lineHeight: 1.6, fontSize: 15 };
const modeRow = { display: "flex", gap: 7, marginBottom: 12, flexWrap: "wrap" as const, justifyContent: "center" };
const modeButton = { border: "1px solid rgba(255,255,255,.1)", background: "rgba(255,255,255,.025)", color: "rgba(255,255,255,.55)", borderRadius: 999, padding: "9px 13px", cursor: "pointer", fontSize: 9, letterSpacing: 1.4 };
const selected = { color: "#e8fffa", borderColor: "rgba(185,255,241,.32)", background: "rgba(185,255,241,.08)" };
const card = { width: "min(880px, 94vw)", boxSizing: "border-box" as const, padding: 16, border: "1px solid rgba(255,255,255,.1)", borderRadius: 24, background: "rgba(8,10,13,.72)", backdropFilter: "blur(24px)", boxShadow: "0 24px 90px rgba(0,0,0,.3)" };
const input = { width: "100%", boxSizing: "border-box" as const, border: 0, outline: 0, background: "transparent", color: "#fff", font: "inherit", fontSize: 15, padding: "10px 8px 12px", borderBottom: "1px solid rgba(255,255,255,.07)" };
const textarea = { width: "100%", boxSizing: "border-box" as const, border: 0, outline: 0, resize: "vertical" as const, minHeight: 150, background: "transparent", color: "#fff", font: "inherit", fontSize: 20, lineHeight: 1.5, padding: "14px 8px" };
const footer = { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" as const, padding: "4px 6px 2px" };
const hint = { fontSize: 10, opacity: .34, letterSpacing: 1 };
const primary = { border: "1px solid rgba(185,255,241,.28)", background: "rgba(185,255,241,.1)", color: "#eafffa", borderRadius: 999, padding: "10px 14px", cursor: "pointer", fontSize: 10, letterSpacing: 1.4 };
const errorStyle = { width: "min(880px, 94vw)", marginTop: 12, padding: "11px 14px", borderRadius: 14, border: "1px solid rgba(255,120,120,.2)", color: "rgba(255,210,210,.8)", background: "rgba(255,80,80,.05)", fontSize: 12 };
const questionCard = { width: "min(760px, 94vw)", marginTop: 18, boxSizing: "border-box" as const, padding: 20, border: "1px solid rgba(185,255,241,.18)", borderRadius: 22, background: "rgba(185,255,241,.045)" };
const questionLabel = { fontSize: 9, letterSpacing: 2.5, opacity: .45 };
const questionTitle = { margin: "10px 0 7px", fontSize: "clamp(23px, 4vw, 34px)", fontWeight: 500, lineHeight: 1.15 };
const questionWhy = { margin: 0, opacity: .46, fontSize: 12, lineHeight: 1.55 };
const answerRow = { display: "flex", gap: 8, marginTop: 14 };
const answerInput = { flex: 1, minWidth: 0, border: "1px solid rgba(255,255,255,.1)", background: "rgba(0,0,0,.2)", color: "#fff", outline: 0, borderRadius: 12, padding: "11px 12px", font: "inherit" };
const alternates = { display: "flex", gap: 7, flexWrap: "wrap" as const, alignItems: "center", marginTop: 12 };
const alternate = { border: "1px solid rgba(255,255,255,.08)", background: "rgba(255,255,255,.025)", color: "rgba(255,255,255,.56)", borderRadius: 999, padding: "6px 9px", cursor: "pointer", fontSize: 10 };
const bottomRow = { display: "flex", alignItems: "center", justifyContent: "space-between", width: "min(880px, 94vw)", marginTop: 22, gap: 12, flexWrap: "wrap" as const };
const secondary = { border: "1px solid rgba(255,255,255,.08)", background: "transparent", color: "rgba(255,255,255,.55)", borderRadius: 999, padding: "8px 11px", cursor: "pointer", fontSize: 9, letterSpacing: 1.2 };
const bottomHint = { fontSize: 10, opacity: .28, letterSpacing: 1.2 };
