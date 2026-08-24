import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import CinematicScanPlayer from "../components/scan/CinematicScanPlayer";
import type { Experience, CinematicScene } from "@qre/contracts";

type StoredExperience = {
  title?: string;
  moments?: Array<Record<string, unknown>>;
  cinematicScenes?: Array<Record<string, unknown>>;
};

const INTERNAL_LABEL = /\b(?:INTENT|DOMAIN|SUBJECT|TYPE|GOAL|OUTPUT|TONE|CURRENT FACTS|KNOWN ASSET FACTS|REAL FACTS|FIELDS|AUTHORING|COGNITIVE|LEARNING SIGNALS|PROVENANCE|DIAGNOSTICS)\s*:/i;
const INTERNAL_META = /\b(?:second meaning|gave the moment its shape|made the larger moment stay|next beat was|this was the hinge|according to qre|the transformation|the symbol|the tension|the contrast|the premise|the operation|the lens|the trajectory|the movie)\b/i;

function cleanText(value: unknown): string {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function renderableText(value: unknown): string {
  const text = cleanText(value);
  if (!text || text.length > 800) return "";
  if (INTERNAL_LABEL.test(text) || INTERNAL_META.test(text)) return "";
  if (text.includes("{") || text.includes("}")) return "";
  if ((text.match(/\|/g)?.length ?? 0) >= 2) return "";
  return text;
}

function presentScene(raw: Record<string, unknown>, index: number): CinematicScene | null {
  const rawMoment = raw.moment && typeof raw.moment === "object" ? raw.moment as Record<string, unknown> : {};
  const text = renderableText(rawMoment.text ?? rawMoment.description ?? rawMoment.title);
  const media = Array.isArray(rawMoment.media) ? rawMoment.media : undefined;
  if (!text && !media?.length) return null;

  return {
    id: cleanText(raw.id) || `preview-scene-${index + 1}`,
    type: (raw.type as CinematicScene["type"]) ?? (index === 0 ? "intro" : "action"),
    duration: Math.max(1200, Number(raw.duration ?? 4000)),
    order: index,
    transition: index === 0 ? "none" : (raw.transition as CinematicScene["transition"]) ?? "fade",
    visual: raw.visual && typeof raw.visual === "object" ? raw.visual as CinematicScene["visual"] : { theme: "cinematic", animation: "parallax" },
    preload: Boolean(raw.preload),
    moment: {
      type: (rawMoment.type as any) ?? "message",
      order: index,
      text,
      media: media as any,
    },
  };
}

function loadPresentation(): Experience | null {
  const stored = sessionStorage.getItem("experiencePreview");
  if (!stored) return null;

  try {
    const input = JSON.parse(stored) as StoredExperience;
    const scenes = (input.cinematicScenes ?? [])
      .map((scene, index) => presentScene(scene, index))
      .filter((scene): scene is CinematicScene => Boolean(scene));

    if (!scenes.length) return null;

    return {
      sessionId: crypto.randomUUID(),
      access: "PREVIEW",
      preview: true,
      asset: {
        id: "preview",
        slug: "preview",
        title: renderableText(input.title) || "Living Experience",
        ownerId: null,
        paid: false,
      },
      moments: scenes.map((scene) => scene.moment),
      geoStory: null,
      cinematicScenes: scenes,
      memorySnapshot: {
        id: "preview",
        title: renderableText(input.title) || "Living Experience",
        moments: scenes.map((scene) => scene.moment),
        createdAt: new Date().toISOString(),
      },
      receipt: null,
      insights: [],
      meta: { source: "presentation-boundary" },
    } as Experience;
  } catch {
    return null;
  }
}

function sceneText(scene: CinematicScene): string {
  return renderableText(scene.moment?.text ?? "");
}

export default function ExperiencePreview() {
  const navigate = useNavigate();
  const [experience, setExperience] = useState<Experience | null>(null);
  const [editing, setEditing] = useState(true);

  useEffect(() => {
    setExperience(loadPresentation());
  }, []);

  const scenes = useMemo(() => experience?.cinematicScenes ?? [], [experience]);
  const hasContent = scenes.some((scene) => sceneText(scene).length > 0 || Boolean(scene.moment?.media?.length));

  function updateScene(index: number, text: string) {
    setExperience((current) => {
      if (!current) return current;
      const next = current.cinematicScenes.map((scene, sceneIndex) =>
        sceneIndex === index
          ? { ...scene, moment: { ...scene.moment, text: renderableText(text) } }
          : scene,
      );
      return { ...current, cinematicScenes: next, moments: next.map((scene) => scene.moment) };
    });
  }

  function persistAndPlay() {
    if (!experience || !hasContent) return;
    sessionStorage.setItem("experiencePreview", JSON.stringify({
      title: experience.asset?.title ?? "Living Experience",
      moments: experience.moments,
      cinematicScenes: experience.cinematicScenes,
    }));
    setEditing(false);
  }

  if (!experience) {
    return (
      <main style={shell}>
        <div style={empty}>
          <div style={eyebrow}>QRE</div>
          <h1 style={headline}>No renderable experience.</h1>
          <p style={body}>The browser refused to display internal authoring data. Build the experience again and QRE will only send the cinematic presentation forward.</p>
          <button type="button" onClick={() => navigate("/dashboard")} style={button}>BACK TO CREATE</button>
        </div>
      </main>
    );
  }

  if (!editing) {
    return <main style={playWorld}><CinematicScanPlayer data={experience as any} /></main>;
  }

  return (
    <main style={editor}>
      <header style={header}>
        <div>
          <div style={eyebrow}>EXPERIENCE</div>
          <h1 style={title}>{experience.asset?.title ?? "Living Experience"}</h1>
        </div>
        <button type="button" onClick={persistAndPlay} disabled={!hasContent} style={{ ...button, opacity: hasContent ? 1 : .35 }}>PLAY</button>
      </header>
      <p style={body}>Only final cinematic moments appear here. QRE's reasoning, memory ledger, diagnostics, and authoring metadata stay behind the mouth boundary.</p>
      <section style={list} aria-label="Cinematic sequence">
        {scenes.map((scene, index) => (
          <article key={scene.id ?? index} style={card}>
            <div style={topline}><span>SCENE {String(index + 1).padStart(2, "0")}</span><span>{Math.round((scene.duration ?? 4000) / 1000)}s</span></div>
            {scene.moment.media?.length ? <div style={mediaNote}>MEDIA BEAT</div> : null}
            <textarea value={sceneText(scene)} onChange={(event) => updateScene(index, event.target.value)} rows={3} style={textarea} placeholder="What happens here?" />
          </article>
        ))}
      </section>
      <footer style={footer}>
        <span style={count}>{scenes.length} MOMENTS</span>
        <button type="button" onClick={persistAndPlay} disabled={!hasContent} style={{ ...button, opacity: hasContent ? 1 : .35 }}>PLAY EXPERIENCE</button>
      </footer>
    </main>
  );
}

const shell: React.CSSProperties = { minHeight: "100dvh", display: "grid", placeItems: "center", padding: 24, background: "#050608", color: "#fff" };
const empty: React.CSSProperties = { width: "min(720px, 92vw)", textAlign: "center" };
const editor: React.CSSProperties = { minHeight: "100dvh", boxSizing: "border-box", background: "radial-gradient(circle at 50% 0%, rgba(70,255,220,.055), transparent 36%), #050608", color: "#fff", padding: "clamp(18px, 5vw, 64px)" };
const header: React.CSSProperties = { width: "min(1000px, 100%)", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 18 };
const eyebrow: React.CSSProperties = { fontSize: 9, letterSpacing: 4, opacity: .35, marginBottom: 8 };
const title: React.CSSProperties = { margin: 0, fontSize: "clamp(32px, 7vw, 62px)", fontWeight: 500, letterSpacing: "-2px" };
const headline: React.CSSProperties = { fontSize: "clamp(34px, 7vw, 60px)", margin: 0, letterSpacing: "-2px", fontWeight: 500 };
const body: React.CSSProperties = { width: "min(1000px, 100%)", margin: "16px auto 28px", color: "rgba(255,255,255,.48)", lineHeight: 1.65, fontSize: 14 };
const list: React.CSSProperties = { width: "min(1000px, 100%)", margin: "0 auto", display: "grid", gap: 12 };
const card: React.CSSProperties = { border: "1px solid rgba(255,255,255,.08)", borderRadius: 22, background: "rgba(10,12,16,.86)", padding: 16 };
const topline: React.CSSProperties = { display: "flex", justifyContent: "space-between", marginBottom: 10, fontSize: 9, letterSpacing: 2.5, color: "rgba(255,255,255,.32)" };
const textarea: React.CSSProperties = { width: "100%", minHeight: 92, boxSizing: "border-box", resize: "vertical", border: 0, outline: 0, background: "transparent", color: "#fff", font: "inherit", fontSize: "clamp(19px, 3vw, 30px)", lineHeight: 1.3 };
const mediaNote: React.CSSProperties = { fontSize: 9, letterSpacing: 2, opacity: .4, marginBottom: 10 };
const footer: React.CSSProperties = { width: "min(1000px, 100%)", margin: "20px auto 0", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 };
const count: React.CSSProperties = { opacity: .35, fontSize: 10, letterSpacing: 1.5 };
const button: React.CSSProperties = { border: "1px solid rgba(120,255,230,.32)", background: "rgba(120,255,230,.09)", color: "#e2fff9", borderRadius: 999, padding: "12px 20px", cursor: "pointer", fontSize: 10, fontWeight: 700, letterSpacing: 2 };
const playWorld: React.CSSProperties = { position: "fixed", inset: 0, minHeight: "100dvh", background: "#030305", overflow: "hidden", zIndex: 9999 };
