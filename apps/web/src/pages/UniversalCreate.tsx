import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/layout/DashboardLayout";
import IdeaParticles from "../components/effects/IdeaParticles";
import { getUserAssets, apiGet, apiPost } from "../lib/api";

type Asset = { id: string; slug: string; displayName?: string | null };
type Context = { id: string; kind: string; name: string; factCount: number; eventCount: number; experienceCount: number };
type Seed = { id: string; label: string; options: string[]; placeholder?: string; optional?: boolean };
type Plan = { title: string; seeds: Seed[]; skipLabel: string; continueLabel: string };

const API = (import.meta.env.VITE_API_URL || "http://localhost:3000").replace(/\/$/, "");

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(init?.headers || {}) },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "QRE request failed");
  return data as T;
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
  const [busy, setBusy] = useState(false);

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
    void request<{ contexts: Context[] }>(`/api/create/contexts/${encodeURIComponent(assetId)}`).then((data) => setContexts(data.contexts ?? [])).catch(() => setContexts([]));
  }, [assetId]);

  async function begin() {
    if (!prompt.trim() || busy) return;
    setBusy(true);
    try {
      const data = await request<{ plan: Plan }>("/api/create/plan", { method: "POST", body: JSON.stringify({ prompt }) });
      setPlan(data.plan);
      setSeedValues({});
    } finally { setBusy(false); }
  }

  async function create(skip = false) {
    if (!prompt.trim() || !assetId || busy) return;
    setBusy(true);
    try {
      const additions = Object.entries(seedValues).map(([id, value]) => value.trim() ? `${plan?.seeds.find((seed) => seed.id === id)?.label ?? id}: ${value.trim()}` : "").filter(Boolean);
      const context = contextName ? `\n\nCURRENT CONTEXT: ${contextName}` : "";
      const enriched = `${prompt.trim()}${context}${additions.length && !skip ? `\n\nADDITIONAL CREATOR INPUT:\n${additions.join("\n")}` : ""}`;
      const compiled: any = await request<any>("/experience/compile", { method: "POST", body: JSON.stringify({ prompt: enriched, assetId }) });
      sessionStorage.setItem("experiencePreview", JSON.stringify(compiled.experience ?? compiled));
      sessionStorage.setItem("experienceSourcePrompt", prompt.trim());
      sessionStorage.setItem("experienceAssetId", assetId);
      if (contextName) sessionStorage.setItem("experienceContextName", contextName);
      navigate("/experience/preview");
    } finally { setBusy(false); }
  }

  return (
    <DashboardLayout>
      <IdeaParticles />
      <main style={page}>
        <section style={hero}>
          <div style={eyebrow}>QRE</div>
          <h1 style={title}>What do you want to create?</h1>
          <p style={sub}>Say it normally. QRE learns what this creation needs.</p>
          <select value={assetId} onChange={(e) => { setAssetId(e.target.value); setContextName(""); }} style={select} aria-label="QRE asset">
            {assets.map((asset) => <option key={asset.id} value={asset.id}>{asset.displayName || asset.slug}</option>)}
          </select>
          {contexts.length > 0 && (
            <section style={contextRail}>
              <div style={contextLabel}>CONTINUE SOMETHING YOU ALREADY STARTED</div>
              <div style={contextRow}>{contexts.map((context) => (
                <button key={context.id} type="button" onClick={() => setContextName(context.name)} style={{ ...contextButton, ...(contextName === context.name ? activeContext : {}) }}>
                  <strong>{context.name}</strong><span>{context.experienceCount ? `${context.experienceCount} experiences` : `${context.factCount} facts`}</span>
                </button>
              ))}</div>
            </section>
          )}
          {contextName && <div style={selectedContext}>CONTINUING: {contextName}</div>}
          <div style={inputShell}>
            <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void begin(); } }} placeholder="Make a wedding memory… / video receipts for my service… / bring my house to life…" rows={4} style={textarea} />
            <button type="button" disabled={busy || !prompt.trim()} onClick={() => void begin()} style={createButton}>{busy ? "THINKING…" : "CREATE"}</button>
          </div>
        </section>
        {plan && (
          <section style={planCard}>
            <button type="button" onClick={() => setPlan(null)} style={back}>BACK</button>
            <div style={eyebrow}>{plan.title}</div>
            <div style={seedGrid}>
              {plan.seeds.map((seed) => (
                <div key={seed.id} style={seedBlock}>
                  <div style={seedLabel}>{seed.label}</div>
                  {seed.options.length > 0 && <div style={chips}>{seed.options.map((option) => <button key={option} type="button" onClick={() => setSeedValues((v) => ({ ...v, [seed.id]: option }))} style={{ ...chip, ...(seedValues[seed.id] === option ? chipActive : {}) }}>{option}</button>)}</div>}
                  {seed.placeholder && <input value={seedValues[seed.id] ?? ""} onChange={(e) => setSeedValues((v) => ({ ...v, [seed.id]: e.target.value }))} placeholder={seed.placeholder} style={seedInput} />}
                </div>
              ))}
            </div>
            <div style={actions}>
              <button type="button" onClick={() => void create(true)} style={secondary}>{plan.skipLabel}</button>
              <button type="button" onClick={() => void create(false)} style={primary}>{plan.continueLabel}</button>
            </div>
          </section>
        )}
      </main>
    </DashboardLayout>
  );
}

const page = { minHeight: "100vh", color: "#f7f7f7", background: "radial-gradient(circle at 50% 40%, rgba(80,255,220,.06), transparent 34%), #050608", padding: "40px 20px 100px", boxSizing: "border-box" as const };
const hero = { maxWidth: 920, margin: "0 auto", minHeight: "70vh", display: "flex", flexDirection: "column" as const, justifyContent: "center", alignItems: "center" };
const eyebrow = { fontSize: 10, letterSpacing: 6, opacity: .38, marginBottom: 14 };
const title = { fontSize: "clamp(40px, 8vw, 78px)", letterSpacing: "-4px", lineHeight: .95, fontWeight: 500, textAlign: "center" as const, margin: 0 };
const sub = { opacity: .5, maxWidth: 560, textAlign: "center" as const, margin: "18px 0 26px" };
const select = { background: "rgba(255,255,255,.04)", color: "#fff", border: "1px solid rgba(255,255,255,.1)", borderRadius: 999, padding: "10px 14px", marginBottom: 18 };
const contextRail = { width: "min(860px, 94vw)", marginBottom: 20 };
const contextLabel = { fontSize: 9, letterSpacing: 3, opacity: .32, marginBottom: 8 };
const contextRow = { display: "flex", gap: 8, overflowX: "auto" as const, paddingBottom: 6 };
const contextButton = { flex: "0 0 auto", display: "grid", gap: 4, textAlign: "left" as const, border: "1px solid rgba(255,255,255,.08)", background: "rgba(255,255,255,.03)", color: "#fff", borderRadius: 14, padding: "12px 14px", cursor: "pointer" };
const activeContext = { borderColor: "rgba(120,255,230,.45)", boxShadow: "0 0 22px rgba(120,255,230,.1)" };
const selectedContext = { fontSize: 11, letterSpacing: 2, opacity: .55, marginBottom: 8 };
const inputShell = { width: "min(860px, 94vw)", position: "relative" as const, background: "rgba(255,255,255,.035)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 24, padding: 12, boxSizing: "border-box" as const };
const textarea = { width: "100%", resize: "vertical" as const, border: 0, outline: 0, background: "transparent", color: "#fff", fontSize: 18, lineHeight: 1.5, minHeight: 120, boxSizing: "border-box" as const, padding: 12 };
const createButton = { border: 0, background: "#b9fff1", color: "#06100d", borderRadius: 999, padding: "12px 22px", fontWeight: 700, letterSpacing: 2, cursor: "pointer", float: "right" as const, margin: "0 4px 4px 0" };
const planCard = { width: "min(860px, 94vw)", margin: "0 auto", background: "rgba(255,255,255,.035)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 24, padding: 28, boxSizing: "border-box" as const };
const back = { border: 0, background: "transparent", color: "rgba(255,255,255,.4)", cursor: "pointer", letterSpacing: 2, fontSize: 10 };
const seedGrid = { display: "grid", gap: 18, marginTop: 18 };
const seedBlock = { borderTop: "1px solid rgba(255,255,255,.06)", paddingTop: 16 };
const seedLabel = { fontSize: 11, letterSpacing: 2, opacity: .55, marginBottom: 8 };
const chips = { display: "flex", gap: 8, flexWrap: "wrap" as const };
const chip = { border: "1px solid rgba(255,255,255,.1)", background: "rgba(255,255,255,.025)", color: "#fff", borderRadius: 999, padding: "9px 12px", cursor: "pointer" };
const chipActive = { borderColor: "rgba(120,255,230,.45)", background: "rgba(120,255,230,.08)" };
const seedInput = { width: "100%", marginTop: 8, boxSizing: "border-box" as const, background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 12, color: "#fff", padding: 12 };
const actions = { display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 24 };
const secondary = { border: "1px solid rgba(255,255,255,.1)", background: "transparent", color: "#fff", borderRadius: 999, padding: "11px 16px", cursor: "pointer" };
const primary = { border: 0, background: "#b9fff1", color: "#06100d", borderRadius: 999, padding: "11px 18px", fontWeight: 700, cursor: "pointer" };
