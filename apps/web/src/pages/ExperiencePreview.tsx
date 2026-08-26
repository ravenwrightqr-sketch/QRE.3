import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import CinematicScanPlayer from "../components/scan/CinematicScanPlayer";
import type { Experience, CinematicScene } from "@qre/contracts";
import type { CompiledExperience } from "../types/experience";

function compileToRuntimeExperience(input: CompiledExperience): Experience {
  return {
    sessionId: crypto.randomUUID(),
    access: "PREVIEW",
    preview: true,
    asset: {
      id: "preview",
      slug: "preview",
      title: input.title ?? "Living Experience",
      category: input.model?.metadata?.category,
      ownerId: null,
      paid: false,
    },
    moments: input.moments ?? [],
    geoStory: input.world ?? null,
    cinematicScenes: (input.cinematicScenes ?? [])
      .slice()
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    memorySnapshot: {
      id: "preview",
      title: input.title,
      moments: input.moments,
      createdAt: new Date().toISOString(),
    },
    receipt: null,
    insights: [],
    meta: { source: "experience-compiler-preview" },
  };
}

function sceneText(scene: CinematicScene) {
  const moment = scene.moment;
  return String(moment.text ?? moment.description ?? moment.title ?? "").trim();
}

function updateSceneText(scene: CinematicScene, text: string): CinematicScene {
  return {
    ...scene,
    moment: {
      ...scene.moment,
      text,
    },
  };
}

function makeScene(index: number): CinematicScene {
  return {
    id: `studio-scene-${crypto.randomUUID()}`,
    type: index === 0 ? "intro" : "action",
    duration: 4000,
    moment: {
      type: "message",
      order: index,
      text: "",
      meta: { source: "creative-studio" },
    },
    order: index,
    transition: index === 0 ? "none" : "fade",
  };
}

export default function ExperiencePreview() {
  const navigate = useNavigate();
  const [experience, setExperience] = useState<Experience | null>(null);
  const [editing, setEditing] = useState(true);

  useEffect(() => {
    const stored = sessionStorage.getItem("experiencePreview");
    if (!stored) return;

    try {
      const compiled: CompiledExperience = JSON.parse(stored);
      setExperience(compileToRuntimeExperience(compiled));
    } catch (error) {
      console.error("Invalid QRE experience", error);
    }
  }, []);

  const scenes = useMemo(() => experience?.cinematicScenes ?? [], [experience]);
  const hasContent = scenes.some((scene) => sceneText(scene).length > 0);

  function syncExperience(cinematicScenes: CinematicScene[]) {
    setExperience((current) => {
      if (!current) return current;
      const ordered = cinematicScenes.map((scene, index) => ({ ...scene, order: index, moment: { ...scene.moment, order: index } }));
      return {
        ...current,
        cinematicScenes: ordered,
        moments: ordered.map((scene) => scene.moment),
      };
    });
  }

  function updateScene(index: number, text: string) {
    if (!experience) return;
    syncExperience(
      experience.cinematicScenes.map((scene, sceneIndex) =>
        sceneIndex === index ? updateSceneText(scene, text) : scene,
      ),
    );
  }

  function updateDuration(index: number, duration: number) {
    if (!experience) return;
    syncExperience(
      experience.cinematicScenes.map((scene, sceneIndex) =>
        sceneIndex === index ? { ...scene, duration: Math.max(1800, duration) } : scene,
      ),
    );
  }

  function addScene(afterIndex?: number) {
    if (!experience) return;
    const current = [...experience.cinematicScenes];
    const insertAt = afterIndex === undefined ? current.length : afterIndex + 1;
    current.splice(insertAt, 0, makeScene(insertAt));
    syncExperience(current);
  }

  function removeScene(index: number) {
    if (!experience || experience.cinematicScenes.length <= 1) return;
    syncExperience(experience.cinematicScenes.filter((_, sceneIndex) => sceneIndex !== index));
  }

  function persistAndPlay() {
    if (!experience || !hasContent) return;
    const payload = JSON.parse(sessionStorage.getItem("experiencePreview") || "{}");
    payload.cinematicScenes = experience.cinematicScenes;
    payload.moments = experience.moments;
    sessionStorage.setItem("experiencePreview", JSON.stringify(payload));
    setEditing(false);
  }

  if (!experience) {
    return (
      <main style={shellStyle}>
        <div style={emptyState}>
          <div style={eyebrow}>QRE</div>
          <h1 style={{ margin: "10px 0 18px", fontSize: "clamp(30px, 7vw, 56px)" }}>No experience loaded.</h1>
          <button type="button" onClick={() => navigate("/dashboard")} style={secondaryButton}>BACK</button>
        </div>
      </main>
    );
  }

  if (!editing) {
    return (
      <main style={playWorld}>
        <CinematicScanPlayer data={experience} />
      </main>
    );
  }

  return (
    <main style={editorShell}>
      <header style={editorHeader}>
        <div style={headerLeft}>
          <button type="button" onClick={() => navigate("/dashboard")} style={backButton} aria-label="Back to create">
            ←
          </button>
          <div>
            <div style={eyebrow}>CREATIVE STUDIO</div>
            <h1 style={title}>{experience.asset?.title ?? "Living Experience"}</h1>
          </div>
        </div>
        <button type="button" onClick={persistAndPlay} disabled={!hasContent} style={{ ...playButton, opacity: hasContent ? 1 : 0.35 }}>
          PLAY
        </button>
      </header>

      <p style={subtitle}>
        QRE turned your idea into a sequence. Tweak any moment, add another, then press PLAY.
      </p>

      <section style={sceneList} aria-label="Cinematic sequence editor">
        {scenes.map((scene, index) => (
          <article key={scene.id ?? index} style={sceneCard}>
            <div style={sceneTopline}>
              <span>SCENE {String(index + 1).padStart(2, "0")}</span>
              <span>{Math.round((scene.duration ?? 4000) / 1000)}s</span>
            </div>
            <textarea
              value={sceneText(scene)}
              onChange={(event) => updateScene(index, event.target.value)}
              rows={3}
              style={sceneInput}
              aria-label={`Scene ${index + 1}`}
              placeholder="What happens in this moment?"
            />
            <div style={sceneFooter}>
              <button type="button" onClick={() => addScene(index)} style={ghostButton}>+ MOMENT</button>
              <label style={durationControl}>
                <span>PACE</span>
                <input
                  type="range"
                  min={1800}
                  max={12000}
                  step={200}
                  value={scene.duration ?? 4000}
                  onChange={(event) => updateDuration(index, Number(event.target.value))}
                />
              </label>
              <button type="button" onClick={() => removeScene(index)} style={ghostButton} disabled={scenes.length <= 1}>REMOVE</button>
            </div>
          </article>
        ))}

        <button type="button" onClick={() => addScene()} style={addMomentButton}>+ ADD MOMENT</button>
      </section>

      <footer style={editorFooter}>
        <div style={{ opacity: 0.35, fontSize: 10, letterSpacing: 1.5 }}>{scenes.length} MOMENTS</div>
        <button type="button" onClick={persistAndPlay} disabled={!hasContent} style={{ ...playButton, opacity: hasContent ? 1 : 0.35 }}>
          PLAY EXPERIENCE
        </button>
      </footer>
    </main>
  );
}

const shellStyle: React.CSSProperties = {
  minHeight: "100dvh",
  display: "grid",
  placeItems: "center",
  background: "#050608",
  color: "#fff",
  padding: 24,
};

const playWorld: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  minHeight: "100dvh",
  background: "#030305",
  overflow: "hidden",
  zIndex: 9999,
};

const editorShell: React.CSSProperties = {
  minHeight: "100dvh",
  boxSizing: "border-box",
  background: "radial-gradient(circle at 50% 0%, rgba(70,255,220,.055), transparent 36%), #050608",
  color: "#fff",
  padding: "clamp(18px, 4vw, 56px) clamp(16px, 5vw, 70px) 34px",
};

const editorHeader: React.CSSProperties = {
  width: "min(1100px, 100%)",
  margin: "0 auto",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 18,
};

const headerLeft: React.CSSProperties = { display: "flex", alignItems: "center", gap: 14, minWidth: 0 };
const backButton: React.CSSProperties = { width: 38, height: 38, borderRadius: 999, border: "1px solid rgba(255,255,255,.1)", background: "rgba(255,255,255,.035)", color: "rgba(255,255,255,.75)", cursor: "pointer", fontSize: 18, flex: "0 0 auto" };
const eyebrow: React.CSSProperties = { fontSize: 9, letterSpacing: 4, opacity: 0.34, marginBottom: 8 };
const title: React.CSSProperties = { margin: 0, fontSize: "clamp(30px, 6vw, 60px)", fontWeight: 500, letterSpacing: "-2.5px", lineHeight: 1 };
const subtitle: React.CSSProperties = { width: "min(1100px, 100%)", margin: "16px auto 28px", color: "rgba(255,255,255,.45)", fontSize: 14 };
const sceneList: React.CSSProperties = { width: "min(1100px, 100%)", margin: "0 auto", display: "grid", gap: 12 };
const sceneCard: React.CSSProperties = { border: "1px solid rgba(255,255,255,.08)", borderRadius: 22, background: "rgba(10,12,16,.82)", padding: 16, backdropFilter: "blur(18px)", boxShadow: "0 18px 70px rgba(0,0,0,.22)" };
const sceneTopline: React.CSSProperties = { display: "flex", justifyContent: "space-between", marginBottom: 9, fontSize: 9, letterSpacing: 2.5, color: "rgba(255,255,255,.33)" };
const sceneInput: React.CSSProperties = { width: "100%", minHeight: 92, boxSizing: "border-box", resize: "vertical", border: 0, outline: 0, background: "transparent", color: "#fff", font: "inherit", fontSize: "clamp(19px, 3vw, 30px)", lineHeight: 1.3, padding: "2px 0" };
const sceneFooter: React.CSSProperties = { display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", borderTop: "1px solid rgba(255,255,255,.06)", paddingTop: 10 };
const ghostButton: React.CSSProperties = { border: 0, background: "transparent", color: "rgba(255,255,255,.36)", cursor: "pointer", fontSize: 9, letterSpacing: 1.5, padding: "6px 2px" };
const durationControl: React.CSSProperties = { flex: "1 1 180px", display: "flex", alignItems: "center", gap: 8, color: "rgba(255,255,255,.3)", fontSize: 8, letterSpacing: 1.2 };
const addMomentButton: React.CSSProperties = { border: "1px dashed rgba(255,255,255,.13)", background: "rgba(255,255,255,.02)", color: "rgba(255,255,255,.42)", borderRadius: 18, padding: "14px 18px", cursor: "pointer", fontSize: 10, letterSpacing: 1.5 };
const editorFooter: React.CSSProperties = { width: "min(1100px, 100%)", margin: "22px auto 0", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14 };
const playButton: React.CSSProperties = { border: "1px solid rgba(120,255,230,.32)", background: "rgba(120,255,230,.09)", color: "#e2fff9", borderRadius: 999, padding: "13px 22px", cursor: "pointer", fontSize: 10, fontWeight: 700, letterSpacing: 2.4, boxShadow: "0 0 36px rgba(120,255,230,.08)", flex: "0 0 auto" };
const secondaryButton: React.CSSProperties = { border: "1px solid rgba(255,255,255,.15)", background: "transparent", color: "rgba(255,255,255,.65)", borderRadius: 999, padding: "11px 18px", cursor: "pointer", fontSize: 10, letterSpacing: 1.5 };
const emptyState: React.CSSProperties = { width: "min(700px, 90vw)", textAlign: "center", opacity: 0.6 };
