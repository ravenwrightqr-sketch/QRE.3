import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "../components/layout/DashboardLayout";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";
type Asset = { id: string; slug: string };
type MemoryItem = { id: string; kind: string; predicate?: string; value?: string; summary?: string; observedAt?: string };

async function auth(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.headers || {}) },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Request failed");
  return data;
}

export default function CollectDataDashboard() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [asset, setAsset] = useState<Asset | null>(null);
  const [kind, setKind] = useState("event");
  const [text, setText] = useState("");
  const [items, setItems] = useState<MemoryItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [making, setMaking] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function load() {
    if (!slug) return;
    try {
      const assets = await auth("/api/assets");
      const found = (assets.assets ?? assets).find((item: Asset) => item.slug === slug);
      if (!found) throw new Error("Asset not found");
      setAsset(found);
      const context = await auth(`/api/collect/${found.id}`);
      const memory = context.memory ?? context;
      setItems([...(memory.facts ?? []), ...(memory.events ?? [])].slice(0, 30));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load collected data");
    }
  }

  useEffect(() => { void load(); }, [slug]);

  async function collect() {
    if (!asset || !text.trim()) return;
    setSaving(true); setError(""); setMessage("");
    try {
      await auth(`/api/collect/${asset.id}`, { method: "POST", body: JSON.stringify({ kind, text: text.trim() }) });
      setText("");
      setMessage("Saved. QRE will remember this when you build an experience.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save data");
    } finally { setSaving(false); }
  }

  async function makeMovie() {
    if (!asset) return;
    setMaking(true); setError("");
    try {
      const { compileExperience } = await import("../lib/experienceApi");
      const experience = await compileExperience({
        assetId: asset.id,
        prompt: "Make a cinematic movie from the real collected history for this QR. Use the Author to make it fun, surprising, and watchable without inventing facts, changing chronology, or adding unsupported details.",
      });
      sessionStorage.setItem("experiencePreview", JSON.stringify(experience));
      navigate("/experience/preview");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not make movie");
    } finally { setMaking(false); }
  }

  return <DashboardLayout><main style={page}>
    <Link to={`/dashboard/assets/${slug}`} style={back}>BACK TO QR</Link>
    <div style={eyebrow}>COLLECT → CREATE</div>
    <h1 style={title}>Collect real life.<br />Make a movie later.</h1>
    <p style={intro}>Save what actually happens. No story writing required. When you are ready, QRE's Author turns the collected history into a cinematic experience.</p>
    {error && <div style={errorBox}>{error}</div>}{message && <div style={successBox}>{message}</div>}
    <section style={card}>
      <div style={label}>WHAT HAPPENED?</div>
      <div style={choices}>{["event","note","measurement","location"].map(value => <button key={value} onClick={() => setKind(value)} style={kind === value ? choiceOn : choice}>{value}</button>)}</div>
      <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Coco walked 2.3 miles, came home muddy, then stole the blue bow." style={textarea}/>
      <button onClick={() => void collect()} disabled={saving || !text.trim()} style={primary}>{saving ? "SAVING…" : "COLLECT THIS"}</button>
    </section>
    <section style={card}>
      <div style={row}><div><div style={label}>COLLECTED</div><div style={count}>{items.length}</div></div><button onClick={() => void makeMovie()} disabled={making || !items.length} style={movie}>{making ? "MAKING…" : "MAKE A MOVIE"}</button></div>
      <p style={hint}>Collected facts, events, places, and measurements become source material. The Author supplies the filmmaking—not invented reality.</p>
      <div style={list}>{items.slice(0,12).map(item => <div key={item.id} style={itemRow}><span style={pill}>{item.kind}</span><span>{item.summary || [item.predicate,item.value].filter(Boolean).join(": ")}</span></div>)}</div>
    </section>
  </main></DashboardLayout>;
}
const page={minHeight:"100vh",padding:"70px 24px 110px",color:"#fff",background:"#050608",maxWidth:980,margin:"0 auto"};const back={color:"rgba(255,255,255,.45)",textDecoration:"none",fontSize:10,letterSpacing:2};const eyebrow={marginTop:32,fontSize:9,letterSpacing:4,opacity:.38};const title={fontSize:"clamp(42px,8vw,82px)",fontWeight:500,letterSpacing:"-4px",margin:"16px 0"};const intro={maxWidth:720,opacity:.62,lineHeight:1.7,fontSize:17};const card={marginTop:30,padding:26,borderRadius:28,border:"1px solid rgba(255,255,255,.08)",background:"rgba(255,255,255,.025)"};const label={fontSize:9,letterSpacing:3,opacity:.42,marginBottom:10};const choices={display:"flex",gap:8,flexWrap:"wrap" as const};const choice={padding:"10px 14px",borderRadius:999,border:"1px solid rgba(255,255,255,.12)",background:"rgba(255,255,255,.03)",color:"rgba(255,255,255,.7)",cursor:"pointer"};const choiceOn={...choice,borderColor:"rgba(185,255,241,.5)",background:"rgba(185,255,241,.12)",color:"#e8fffa"};const textarea={width:"100%",boxSizing:"border-box" as const,minHeight:170,marginTop:16,padding:16,borderRadius:18,border:"1px solid rgba(255,255,255,.12)",background:"rgba(0,0,0,.25)",color:"#fff",font:"inherit",lineHeight:1.6,outline:"none"};const primary={marginTop:14,padding:"13px 20px",borderRadius:999,border:"1px solid rgba(185,255,241,.35)",background:"rgba(185,255,241,.12)",color:"#e8fffa",cursor:"pointer",fontWeight:700};const movie={padding:"13px 18px",borderRadius:999,border:"1px solid rgba(185,255,241,.5)",background:"#b9fff1",color:"#07110f",cursor:"pointer",fontWeight:800,letterSpacing:1};const row={display:"flex",justifyContent:"space-between",alignItems:"center",gap:16};const count={fontSize:42,marginTop:4};const hint={opacity:.5,lineHeight:1.6,maxWidth:650};const list={marginTop:18,display:"grid",gap:8};const itemRow={display:"flex",gap:10,alignItems:"center",padding:"10px 12px",borderRadius:12,background:"rgba(255,255,255,.03)"};const pill={fontSize:9,letterSpacing:2,opacity:.5,minWidth:90};const errorBox={marginTop:24,padding:14,borderRadius:14,background:"rgba(255,80,80,.08)",border:"1px solid rgba(255,80,80,.2)",color:"#ffd6d6"};const successBox={marginTop:24,padding:14,borderRadius:14,background:"rgba(80,255,190,.08)",border:"1px solid rgba(80,255,190,.2)",color:"#d9fff4"};