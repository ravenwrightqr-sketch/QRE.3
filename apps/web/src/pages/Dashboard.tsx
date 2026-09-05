import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getUserAssets } from "../lib/api";
import { compileExperience, type GeoAnchor } from "../lib/experienceApi";
import DashboardLayout from "../components/layout/DashboardLayout";
import IdeaParticles from "../components/effects/IdeaParticles";

type Experience = { id: string; slug: string; status: string; tier: string; flowId: string | null; displayName?: string | null; category?: string | null };
const lenses = ["LET QRE DECIDE", "FUNNY", "ROMANTIC", "HORROR", "WILD"] as const;
const ideas = ["Create a living memory.", "Make a video for my business.", "Turn a boring job into something people remember.", "Bring this place to life.", "Capture what happened today."];
const orbit = [
  { top: "17%", left: "12%", size: 10, delay: "0s" }, { top: "26%", left: "79%", size: 7, delay: "-2s" },
  { top: "69%", left: "73%", size: 9, delay: "-4s" }, { top: "76%", left: "19%", size: 13, delay: "-6s" }, { top: "44%", left: "89%", size: 6, delay: "-1s" },
];

function defaultGeoRole(asset?: Experience | null): GeoAnchor["role"] {
  return /home|house|property|business|restaurant|hotel|salon|shop|store|venue/i.test(String(asset?.category ?? "")) ? "physical_site" : "experience_place";
}

function addReality(prompt: string, question: string, answer: string): string {
  const cleanAnswer = answer.replace(/\s+/g, " ").trim();
  return cleanAnswer ? `${prompt.trim()}\n${question.replace(/\?$/, "")}: ${cleanAnswer}`.trim() : prompt;
}

export default function Dashboard() {
  const [objects, setObjects] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [prompt, setPrompt] = useState("");
  const [lens, setLens] = useState<(typeof lenses)[number]>("LET QRE DECIDE");
  const [creating, setCreating] = useState(false);
  const [activeAsset, setActiveAsset] = useState("");
  const [geo, setGeo] = useState<GeoAnchor | null>(null);
  const [geoBusy, setGeoBusy] = useState(false);
  const [geoLabel, setGeoLabel] = useState("");
  const [geoRole, setGeoRole] = useState<GeoAnchor["role"]>("experience_place");
  const [timeAnchor, setTimeAnchor] = useState("");
  const promptRef = useRef<HTMLTextAreaElement | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    void (async () => {
      try {
        const response = await getUserAssets();
        const assets: Experience[] = Array.isArray(response) ? response : response.assets ?? [];
        setObjects(assets); setActiveAsset(assets[0]?.id ?? "");
      } catch (error) { console.error("QRE dashboard load failed", error); }
      finally { setLoading(false); }
    })();
  }, []);

  const activeObject = useMemo(() => objects.find((object) => object.id === activeAsset) ?? objects[0] ?? null, [objects, activeAsset]);
  useEffect(() => { setGeoRole(defaultGeoRole(activeObject)); }, [activeObject?.id]);

  function resizePrompt() {
    const node = promptRef.current; if (!node) return;
    node.style.height = "0px"; node.style.height = `${Math.min(Math.max(node.scrollHeight, 74), 320)}px`;
  }
  function addNotice(question: string, answer: string) { setPrompt((current) => addReality(current, question, answer)); requestAnimationFrame(resizePrompt); promptRef.current?.focus(); }
  function dropTime() { setTimeAnchor(new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date())); }
  function dropLocation() {
    if (!navigator.geolocation) return;
    setGeoBusy(true);
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      setGeo({ latitude: coords.latitude, longitude: coords.longitude, label: geoLabel || undefined, role: geoRole, source: "dashboard", time: timeAnchor || undefined }); setGeoBusy(false);
    }, () => setGeoBusy(false), { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 });
  }
  function useIdea(value: string) { setPrompt(value); requestAnimationFrame(resizePrompt); promptRef.current?.focus(); }
  async function awaken() {
    const text = prompt.trim(); if (!text || creating) return;
    try {
      setCreating(true);
      const finalGeo = geo ? { ...geo, label: geoLabel || geo.label, role: geoRole, time: timeAnchor || geo.time } : undefined;
      const compiled = await compileExperience({ prompt: text, assetId: activeObject?.id, geo: finalGeo, lens: lens === "LET QRE DECIDE" ? undefined : lens });
      sessionStorage.setItem("experiencePreview", JSON.stringify(compiled));
      sessionStorage.setItem("experienceSourcePrompt", text);
      if (activeObject?.slug) sessionStorage.setItem("experienceAssetSlug", activeObject.slug);
      navigate("/experience/preview");
    } catch (error) { console.error("QRE experience creation failed", error); }
    finally { setCreating(false); }
  }

  if (loading) return <DashboardLayout><IdeaParticles /><main style={loadingStyle}>QRE AWAKENING...</main></DashboardLayout>;

  return (
    <DashboardLayout>
      <IdeaParticles />
      <main style={pageStyle}>
        <div style={brand}>QRE</div>
        <section style={heroStyle}>
          <div style={eyebrow}>QRE LIVING WORLDS</div>
          <h1 style={titleStyle}>Give QRE the facts.</h1>
          <p style={subStyle}>Who or what. Where. When. What happened. One detail. QRE does the creative work.</p>
          <div style={promptShell}>
            <textarea ref={promptRef} value={prompt} onChange={(event) => { setPrompt(event.target.value); requestAnimationFrame(resizePrompt); }} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void awaken(); } }} placeholder="Coco · groomer · 9 AM · bath · blue bow · stole it" spellCheck maxLength={30000} rows={3} style={promptStyle} />
            <div style={promptFooter}><span style={{ opacity: .35 }}>{prompt.length.toLocaleString()} / 30,000</span><button type="button" onClick={() => void awaken()} disabled={creating || !prompt.trim()} style={createButton}>{creating ? "BUILDING…" : "CREATE"}</button></div>
          </div>

          <div style={lensRow} aria-label="creative lens">
            {lenses.map((item) => <button key={item} type="button" onClick={() => setLens(item)} style={{ ...lensButton, ...(lens === item ? lensSelected : {}) }}>{item}</button>)}
          </div>

          <div style={realityRow}>
            <RealityPrompt label="WHO / WHAT" onSubmit={addNotice} question="Who or what?" />
            <RealityPrompt label="WHERE" onSubmit={addNotice} question="Where?" />
            <RealityPrompt label="WHEN" onSubmit={addNotice} question="When?" />
            <RealityPrompt label="WHAT HAPPENED" onSubmit={addNotice} question="What happened?" />
            <RealityPrompt label="ONE DETAIL" onSubmit={addNotice} question="Anything unusual, funny, important, or worth remembering?" wide />
          </div>

          <div style={toolRow}>
            <button type="button" onClick={dropLocation} disabled={geoBusy} style={toolButton}>{geoBusy ? "PINNING…" : geo ? "📍 LOCATION ADDED" : "+ DROP LOCATION"}</button>
            <button type="button" onClick={dropTime} style={toolButton}>{timeAnchor ? `◷ ${timeAnchor}` : "+ DROP TIME"}</button>
          </div>
          {(geo || timeAnchor) && <div style={anchorPanel}>{geo && <><input value={geoLabel} onChange={(event) => { setGeoLabel(event.target.value); setGeo((current) => current ? { ...current, label: event.target.value || undefined } : current); }} placeholder="Name this place (optional)" style={anchorInput} /><select value={geoRole} onChange={(event) => { const value = event.target.value as GeoAnchor["role"]; setGeoRole(value); setGeo((current) => current ? { ...current, role: value } : current); }} style={anchorSelect}><option value="physical_site">This QR's physical site</option><option value="experience_place">Where this happened</option><option value="event_venue">Event venue</option><option value="memory_place">Memory place</option><option value="reference_place">Reference place</option></select><span style={anchorMeta}>{geo.latitude.toFixed(5)}, {geo.longitude.toFixed(5)}</span></>}{timeAnchor && <span style={anchorMeta}>TIME · {timeAnchor}</span>}</div>}

          <div style={ideaRow}>{ideas.map((idea) => <button key={idea} type="button" onClick={() => useIdea(idea)} style={ideaChip}>{idea}</button>)}</div>
        </section>
        <section style={orbitLayer} aria-label="QRE objects">
          {objects.map((object, index) => { const point = orbit[index % orbit.length]; const selected = activeObject?.id === object.id; return <div key={object.id} style={{ position: "absolute", top: point.top, left: point.left, animation: `qreFloat ${8 + index}s ease-in-out infinite`, animationDelay: point.delay, pointerEvents: "auto" }}><button type="button" aria-label={`Open ${object.displayName || object.slug}`} onClick={() => setActiveAsset(object.id)} style={{ ...orbButton, width: point.size * 2 + 26, height: point.size * 2 + 26, boxShadow: selected ? "0 0 40px rgba(120,255,230,.35)" : "none" }}><span style={{ width: point.size, height: point.size, borderRadius: 50, background: selected ? "#b9fff1" : "#fff", boxShadow: "0 0 24px rgba(255,255,255,.95)" }} /></button><div style={{ marginTop: 6, fontSize: 10, letterSpacing: 2, opacity: selected ? .85 : .32, textAlign: "center", whiteSpace: "nowrap" }}>{object.displayName || object.slug}</div>{selected && <div style={orbitActions}><Link to={`/dashboard/assets/${object.slug}`} style={miniLink}>DETAIL</Link><Link to={`/dashboard/assets/${object.slug}/knowledge`} style={miniLink}>MEMORY</Link><Link to={`/dashboard/assets/${object.slug}/learning`} style={miniLink}>LEARNING</Link></div>}</div>; })}
        </section>
      </main>
    </DashboardLayout>
  );
}

function RealityPrompt({ label, question, onSubmit, wide }: { label: string; question: string; onSubmit: (question: string, answer: string) => void; wide?: boolean }) {
  const [value, setValue] = useState("");
  return <div style={{ ...(realityCard), ...(wide ? { flexBasis: "100%" } : {}) }}><div style={realityLabel}>{label}</div><div style={realityInline}><input value={value} onChange={(event) => setValue(event.target.value)} placeholder={question} onKeyDown={(event) => { if (event.key === "Enter" && value.trim()) { onSubmit(question, value); setValue(""); } }} style={realityInput} /><button type="button" onClick={() => { if (value.trim()) { onSubmit(question, value); setValue(""); } }} style={realityAdd}>+</button></div></div>;
}

const loadingStyle = { minHeight: "100vh", display: "grid", placeItems: "center", color: "rgba(255,255,255,.5)", letterSpacing: 4 };
const pageStyle = { position: "relative" as const, minHeight: "100vh", overflow: "hidden" as const, color: "#f7f7f7", background: "radial-gradient(circle at 50% 42%, rgba(80,255,220,.055), transparent 32%), #050608" };
const brand = { position: "absolute" as const, top: 22, left: 26, fontSize: 11, letterSpacing: 10, opacity: .42, zIndex: 10 };
const heroStyle = { minHeight: "100vh", display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center", padding: "90px 20px 120px", position: "relative" as const, zIndex: 4 };
const eyebrow = { fontSize: 10, letterSpacing: 6, opacity: .38, marginBottom: 14 };
const titleStyle = { fontSize: "clamp(38px, 8vw, 74px)", fontWeight: 500, letterSpacing: "-3px", lineHeight: .95, textAlign: "center" as const, margin: 0 };
const subStyle = { margin: "18px 0 32px", opacity: .46, textAlign: "center" as const, maxWidth: 600, fontSize: 15 };
const promptShell = { width: "min(900px, 92vw)", border: "1px solid rgba(255,255,255,.12)", background: "rgba(8,10,13,.72)", backdropFilter: "blur(24px)", borderRadius: 26, padding: "14px 16px 12px", boxShadow: "0 25px 100px rgba(0,0,0,.35)" };
const promptStyle = { width: "100%", boxSizing: "border-box" as const, minHeight: 74, maxHeight: 320, resize: "none" as const, overflowY: "auto" as const, background: "transparent", border: 0, outline: 0, color: "#fff", fontFamily: "inherit", fontSize: "clamp(18px, 2.3vw, 24px)", lineHeight: 1.45, padding: "8px 8px 4px" };
const promptFooter = { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 6px 2px", fontSize: 10, letterSpacing: 1.2 };
const createButton = { border: "1px solid rgba(255,255,255,.22)", background: "rgba(255,255,255,.08)", color: "#fff", borderRadius: 999, padding: "9px 15px", cursor: "pointer", letterSpacing: 1.5, fontSize: 10 };
const lensRow = { display: "flex", justifyContent: "center", gap: 7, flexWrap: "wrap" as const, marginTop: 12 };
const lensButton = { border: "1px solid rgba(255,255,255,.08)", background: "rgba(255,255,255,.025)", color: "rgba(255,255,255,.58)", borderRadius: 999, padding: "8px 12px", cursor: "pointer", fontSize: 9, letterSpacing: 1.2 };
const lensSelected = { color: "#e8fffa", borderColor: "rgba(185,255,241,.32)", background: "rgba(185,255,241,.1)" };
const realityRow = { width: "min(900px, 92vw)", display: "flex", gap: 8, flexWrap: "wrap" as const, marginTop: 18, justifyContent: "center" };
const realityCard = { flex: "1 1 170px", minWidth: 150, border: "1px solid rgba(255,255,255,.065)", background: "rgba(255,255,255,.022)", borderRadius: 14, padding: "9px 10px" };
const realityLabel = { fontSize: 8, letterSpacing: 2, opacity: .4, marginBottom: 6 };
const realityInline = { display: "flex", gap: 5 };
const realityInput = { minWidth: 0, flex: 1, border: 0, outline: 0, background: "transparent", color: "#fff", fontFamily: "inherit", fontSize: 12 };
const realityAdd = { border: 0, background: "transparent", color: "rgba(255,255,255,.55)", cursor: "pointer", fontSize: 16 };
const toolRow = { display: "flex", justifyContent: "center", gap: 8, marginTop: 10, flexWrap: "wrap" as const };
const toolButton = { border: "1px solid rgba(255,255,255,.09)", background: "rgba(255,255,255,.025)", color: "rgba(255,255,255,.58)", borderRadius: 999, padding: "7px 10px", cursor: "pointer", fontSize: 9, letterSpacing: 1.2 };
const anchorPanel = { width: "min(760px, 90vw)", display: "flex", justifyContent: "center", alignItems: "center", gap: 8, flexWrap: "wrap" as const, marginTop: 8, padding: "8px 10px", borderRadius: 14, background: "rgba(255,255,255,.025)", border: "1px solid rgba(255,255,255,.06)" };
const anchorInput = { minWidth: 220, flex: "1 1 240px", border: "1px solid rgba(255,255,255,.08)", background: "transparent", color: "#fff", borderRadius: 10, padding: "8px 10px", outline: "none" };
const anchorSelect = { border: "1px solid rgba(255,255,255,.08)", background: "#0a0c0f", color: "rgba(255,255,255,.7)", borderRadius: 10, padding: "8px 10px", outline: "none" };
const anchorMeta = { fontSize: 9, opacity: .4, letterSpacing: 1 };
const ideaRow = { display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap" as const, marginTop: 18, maxWidth: 900 };
const ideaChip = { border: "1px solid rgba(255,255,255,.07)", background: "rgba(255,255,255,.025)", color: "rgba(255,255,255,.58)", borderRadius: 999, padding: "8px 12px", cursor: "pointer", fontSize: 11 };
const orbitLayer = { position: "absolute" as const, inset: 0, zIndex: 3, pointerEvents: "none" as const };
const orbButton = { border: 0, borderRadius: 999, background: "transparent", display: "grid", placeItems: "center", cursor: "pointer", padding: 0 };
const orbitActions = { display: "flex", gap: 6, justifyContent: "center", marginTop: 7 };
const miniLink = { color: "rgba(255,255,255,.6)", textDecoration: "none", fontSize: 8, letterSpacing: 1.3, padding: "4px 6px", border: "1px solid rgba(255,255,255,.1)", borderRadius: 999 };
