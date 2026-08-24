import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUserAssets } from "../lib/api";

type Asset = { id: string; slug: string; displayName?: string | null };
type Context = { id: string; kind: string; name: string; factCount: number; eventCount: number; experienceCount: number };
type Seed = { id: string; label: string; options: string[]; placeholder?: string; optional?: boolean };
type Plan = { title: string; seeds: Seed[]; skipLabel: string; continueLabel: string };

type IntakeStep = "intent" | "seed" | "create" | "done";

const API = (import.meta.env.VITE_API_URL || "http://localhost:3000").replace(/\/$/, "");

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "QRE request failed");
  return data as T;
}

function naturalQuestion(seed: Seed, index: number): string {
  const id = seed.id.toLowerCase();
  const label = seed.label.toLowerCase();

  if (/context|client|location|property|entity|who|where/.test(id)) return "Who gets this one?";
  if (/fact|event|happen|detail|story|reality|input/.test(id) || /happened|details|facts/.test(label)) return "What went down?";
  if (/memory|remember|notable|moment|continuity/.test(id)) return "Anything worth remembering?";
  if (/creative|tone|style|voice|preference/.test(id)) return "How should it feel?";
  if (/media|photo|video/.test(id)) return "Anything to show?";
  if (seed.optional) return "Anything else?";
  return index === 0 ? seed.label : `What else should QRE know?`;
}

export default function UniversalCreate() {
  const navigate = useNavigate();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [assetId, setAssetId] = useState("");
  const [contexts, setContexts] = useState<Context[]>([]);
  const [contextName, setContextName] = useState("");
  const [prompt, setPrompt] = useState("");
  const [plan, setPlan] = useState<Plan | null>(null);
  const [seedValues, setSeedValues] = useState<Record<string, string>>({});
  const [seedIndex, setSeedIndex] = useState(0);
  const [step, setStep] = useState<IntakeStep>("intent");
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const response: any = await getUserAssets();
      const list = Array.isArray(response) ? response : response.assets ?? [];
      setAssets(list);
      if (list[0]?.id) setAssetId(list[0].id);
    })();
  }, []);

  useEffect(() => {
    if (!assetId) return;
    void request<{ contexts: Context[] }>(`/api/create/contexts/${encodeURIComponent(assetId)}`)
      .then((data) => setContexts(data.contexts ?? []))
      .catch(() => setContexts([]));
  }, [assetId]);

  const visibleSeeds = useMemo(() => (plan?.seeds ?? []).filter((seed) => !seed.optional || !seed.options.length || Boolean(seed.placeholder)), [plan]);
  const currentSeed = visibleSeeds[seedIndex];

  async function begin() {
    if (!prompt.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      const data = await request<{ plan: Plan }>("/api/create/plan", {
        method: "POST",
        body: JSON.stringify({ prompt: prompt.trim() }),
      });
      setPlan(data.plan);
      setSeedValues({});
      setSeedIndex(0);
      setAnswer("");
      setStep("seed");
    } catch (e) {
      setError(e instanceof Error ? e.message : "QRE could not read that yet.");
    } finally {
      setBusy(false);
    }
  }

  async function advance() {
    if (!currentSeed || busy) return;
    const value = answer.trim();
    if (value) setSeedValues((existing) => ({ ...existing, [currentSeed.id]: value }));
    const next = seedIndex + 1;
    if (next < visibleSeeds.length) {
      setSeedIndex(next);
      setAnswer("");
      return;
    }
    setStep("create");
  }

  async function create() {
    if (!prompt.trim() || !assetId || busy) return;
    setBusy(true);
    setError(null);
    try {
      const values = { ...seedValues };
      if (currentSeed && answer.trim()) values[currentSeed.id] = answer.trim();
      const additions = Object.entries(values)
        .map(([id, value]) => {
          const seed = visibleSeeds.find((item) => item.id === id);
          return value.trim() ? `${seed?.label ?? id}: ${value.trim()}` : "";
        })
        .filter(Boolean);

      const enriched = `${prompt.trim()}${contextName ? `\n\nCONTEXT: ${contextName}` : ""}${
        additions.length ? `\n\nCREATOR INPUT:\n${additions.join("\n")}` : ""
      }`;

      const compiled: any = await request<any>("/api/contextual-experience/compile", {
        method: "POST",
        body: JSON.stringify({ prompt: enriched, assetId, entityName: contextName || undefined }),
      });

      sessionStorage.setItem("experiencePreview", JSON.stringify(compiled.experience ?? compiled));
      sessionStorage.setItem("experienceSourcePrompt", prompt.trim());
      sessionStorage.setItem("experienceAssetId", assetId);
      if (contextName) sessionStorage.setItem("experienceContextName", contextName);
      setStep("done");
      navigate("/experience/preview");
    } catch (e) {
      setError(e instanceof Error ? e.message : "QRE could not create that.");
    } finally {
      setBusy(false);
    }
  }

  const question = currentSeed ? naturalQuestion(currentSeed, seedIndex) : "Anything worth remembering?";

  return (
    <main style={page}>
      <div style={mark}>QRE</div>

      {step === "intent" && (
        <section style={stage}>
          <div style={questionStyle}>What are you making?</div>
          <textarea
            autoFocus
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void begin();
              }
            }}
            placeholder="Housekeeping receipts…"
            rows={3}
            style={input}
          />
          <button type="button" onClick={() => void begin()} disabled={busy || !prompt.trim()} style={arrowButton} aria-label="Continue">
            ▸
          </button>
        </section>
      )}

      {step === "seed" && currentSeed && (
        <section style={stage}>
          <div style={contextLine}>{plan?.title ?? ""}</div>
          <div style={questionStyle}>{question}</div>
          {contexts.length > 0 && /context|client|location|property|entity|who|where/i.test(currentSeed.id) && (
            <div style={suggestions}>
              {contexts.slice(0, 4).map((context) => (
                <button key={context.id} type="button" onClick={() => setAnswer(context.name)} style={suggestion}>
                  {context.name} <span>▸</span>
                </button>
              ))}
            </div>
          )}
          <textarea
            autoFocus
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void advance();
              }
            }}
            placeholder={currentSeed.placeholder || "Short notes are perfect."}
            rows={4}
            style={input}
          />
          <button type="button" onClick={() => void advance()} disabled={busy || (!answer.trim() && !currentSeed.optional)} style={arrowButton} aria-label="Continue">
            ▸
          </button>
          {currentSeed.optional && <button type="button" onClick={() => { setAnswer(""); void advance(); }} style={skip}>skip</button>}
        </section>
      )}

      {step === "create" && (
        <section style={stage}>
          <div style={contextLine}>{contextName || plan?.title || ""}</div>
          <div style={questionStyle}>Ready to make it memorable?</div>
          <button type="button" onClick={() => void create()} disabled={busy} style={makeButton}>
            {busy ? "…" : "△"}
          </button>
        </section>
      )}

      {error && <div style={errorStyle}>{error}</div>}
    </main>
  );
}

const page = {
  minHeight: "100vh",
  background: "#020304",
  color: "#f5f7f7",
  display: "flex",
  flexDirection: "column" as const,
  alignItems: "center",
  justifyContent: "center",
  padding: "32px 24px",
  boxSizing: "border-box" as const,
};

const mark = { position: "fixed" as const, top: 26, left: 28, fontSize: 11, letterSpacing: 7, opacity: 0.42 };
const stage = { width: "min(760px, 92vw)", display: "flex", flexDirection: "column" as const, alignItems: "flex-start", gap: 18 };
const contextLine = { fontSize: 11, letterSpacing: 3, textTransform: "uppercase" as const, opacity: 0.25 };
const questionStyle = { fontSize: "clamp(34px, 7vw, 68px)", lineHeight: 0.98, letterSpacing: "-3px", fontWeight: 500, marginBottom: 12 };
const input = {
  width: "100%",
  minHeight: 118,
  resize: "vertical" as const,
  background: "transparent",
  color: "#fff",
  border: 0,
  outline: 0,
  padding: "6px 0",
  fontSize: 21,
  lineHeight: 1.55,
  boxSizing: "border-box" as const,
};
const arrowButton = { border: 0, background: "transparent", color: "#b9fff1", fontSize: 34, padding: 0, cursor: "pointer", opacity: 0.9 };
const skip = { border: 0, background: "transparent", color: "rgba(255,255,255,.28)", fontSize: 12, padding: 0, cursor: "pointer" };
const makeButton = { border: 0, background: "transparent", color: "#b9fff1", fontSize: 54, lineHeight: 1, padding: 0, cursor: "pointer" };
const suggestions = { display: "grid", gap: 10, width: "100%" };
const suggestion = { display: "flex", justifyContent: "space-between", width: "100%", border: 0, background: "transparent", color: "rgba(255,255,255,.72)", textAlign: "left" as const, padding: 0, fontSize: 16, cursor: "pointer" };
const errorStyle = { position: "fixed" as const, bottom: 24, left: 24, right: 24, textAlign: "center" as const, color: "#ff8888", fontSize: 13 };
