import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Experience, CinematicScene } from "@qre/contracts";
import CinematicScanPlayer from "../components/scan/CinematicScanPlayer";
import { apiPost } from "../lib/api";

type Compiled = { title?: string; moments?: any[]; world?: any; cinematicScenes?: CinematicScene[]; blueprint?: any; flowSteps?: any[] };
type Draft = { experienceId: string; flowId: string; assetId: string; prompt: string; brief: any };

function toRuntime(input: Compiled): Experience {
  return {
    sessionId: crypto.randomUUID(),
    access: "PREVIEW",
    preview: true,
    asset: { id: "adaptive-preview", slug: "adaptive-preview", title: input.title ?? "QRE Experience", category: input.blueprint?.type, ownerId: null, paid: false },
    moments: input.moments ?? [],
    geoStory: input.world ?? null,
    cinematicScenes: (input.cinematicScenes ?? []).slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    memorySnapshot: { id: "adaptive-preview", title: input.title, moments: input.moments, createdAt: new Date().toISOString() },
    receipt: null,
    insights: [],
    meta: { source: "adaptive-author-preview" },
  };
}

function sceneText(scene: CinematicScene) {
  const moment = scene.moment;
  return String(moment.text ?? moment.description ?? moment.title ?? "").trim();
}

export default function AdaptivePreview() {
  const navigate = useNavigate();
  const [compiled, setCompiled] = useState<Compiled | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [playing, setPlaying] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("adaptivePreview");
      const rawDraft = sessionStorage.getItem("adaptiveDraft");
      if (raw) setCompiled(JSON.parse(raw));
      if (rawDraft) setDraft(JSON.parse(rawDraft));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load preview.");
    }
  }, []);

  async function publish() {
    if (!draft || publishing) return;
    setPublishing(true);
    setError("");
    try {
      await apiPost("/api/adaptive/publish", {
        assetId: draft.assetId,
        flowId: draft.flowId,
        experienceId: draft.experienceId,
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not set the experience to the QR.");
    } finally {
      setPublishing(false);
    }
  }

  if (!compiled || !draft) {
    return <main style={shell}><div style={panel}><h1>No adaptive experience loaded.</h1><button onClick={() => navigate("/dashboard")} style={button}>BACK</button></div></main>;
  }

  if (playing) {
    return <main style={player}><button type="button" onClick={() => setPlaying(false)} style={floatingBack}>EXIT PREVIEW</button><CinematicScanPlayer data={toRuntime(compiled)} /></main>;
  }

  const scenes = compiled.cinematicScenes ?? [];

  return (
    <main style={shell}>
      <section style={panel}>
        <div style={eyebrow}>AUTHOR RESULT</div>
        <h1>{compiled.title ?? "Your QRE experience"}</h1>
        <p style={sub}>Built from the facts and preferences you supplied. Review the sequence, play it, then decide whether it becomes the active experience for your QR.</p>

        <div style={sceneList}>
          {scenes.map((scene, index) => <article key={scene.id ?? index} style={sceneCard}><div style={sceneNumber}>SCENE {String(index + 1).padStart(2, "0")}</div><div style={sceneTextStyle}>{sceneText(scene)}</div></article>)}
        </div>

        <div style={actionRow}>
          <button type="button" onClick={() => setPlaying(true)} style={button}>▶ PLAY THE MOVIE</button>
          <button type="button" onClick={() => void publish()} disabled={publishing} style={primary}>{publishing ? "SETTING TO QR…" : "APPROVE + SET TO QR"}</button>
        </div>

        {done && <div style={success}>APPROVED. The new experience is now the active experience for this physical QRE object.</div>}
        {error && <div style={errorBox}>{error}</div>}
      </section>
    </main>
  );
}

const shell: React.CSSProperties = { minHeight: "100dvh", background: "#050608", color: "#fff", padding: "40px 20px 80px" };
const panel: React.CSSProperties = { width: "min(980px,100%)", margin: "0 auto", paddingTop: 40 };
const eyebrow: React.CSSProperties = { fontSize: 9, letterSpacing: 4, opacity: .34, marginBottom: 12 };
const sub: React.CSSProperties = { maxWidth: 720, color: "rgba(255,255,255,.5)", lineHeight: 1.7 };
const sceneList: React.CSSProperties = { display: "grid", gap: 10, marginTop: 28 };
const sceneCard: React.CSSProperties = { border: "1px solid rgba(255,255,255,.08)", borderRadius: 22, padding: 18, background: "rgba(255,255,255,.025)" };
const sceneNumber: React.CSSProperties = { fontSize: 9, letterSpacing: 3, opacity: .3, marginBottom: 10 };
const sceneTextStyle: React.CSSProperties = { fontSize: "clamp(18px,3vw,30px)", lineHeight: 1.35 };
const actionRow: React.CSSProperties = { display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap", marginTop: 26 };
const button: React.CSSProperties = { border: "1px solid rgba(255,255,255,.12)", background: "rgba(255,255,255,.03)", color: "rgba(255,255,255,.78)", borderRadius: 999, padding: "12px 18px", cursor: "pointer", letterSpacing: 1.4, fontSize: 10 };
const primary: React.CSSProperties = { border: "1px solid rgba(130,255,235,.4)", background: "rgba(130,255,235,.1)", color: "#eafff8", borderRadius: 999, padding: "12px 20px", cursor: "pointer", letterSpacing: 1.4, fontSize: 10, fontWeight: 800 };
const success: React.CSSProperties = { marginTop: 20, padding: 14, borderRadius: 14, border: "1px solid rgba(130,255,235,.2)", background: "rgba(130,255,235,.06)", color: "#dffff7", fontSize: 12 };
const errorBox: React.CSSProperties = { marginTop: 20, padding: 14, borderRadius: 14, border: "1px solid rgba(255,70,90,.2)", background: "rgba(255,70,90,.08)", color: "#ffe0e4", fontSize: 12 };
const player: React.CSSProperties = { position: "fixed", inset: 0, background: "#030305", overflow: "hidden", zIndex: 9999 };
const floatingBack: React.CSSProperties = { position: "fixed", top: 18, left: 18, zIndex: 10000, border: "1px solid rgba(255,255,255,.15)", background: "rgba(0,0,0,.4)", color: "rgba(255,255,255,.7)", borderRadius: 999, padding: "10px 14px", cursor: "pointer", fontSize: 10, letterSpacing: 1.4 };
