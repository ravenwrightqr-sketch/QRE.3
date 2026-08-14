import { useEffect, useMemo, useState } from "react";

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
    cinematicScenes: (input.cinematicScenes ?? []).slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
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
  return moment.text ?? moment.description ?? moment.title ?? "";
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

export default function ExperiencePreview() {
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

  function updateScene(index: number, text: string) {
    setExperience((current) => {
      if (!current) return current;
      const cinematicScenes = current.cinematicScenes.map((scene, sceneIndex) =>
        sceneIndex === index ? updateSceneText(scene, text) : scene,
      );
      return {
        ...current,
        cinematicScenes,
        moments: cinematicScenes.map((scene) => scene.moment),
      };
    });
  }

  if (!experience) {
    return (
      <div style={shellStyle}>
        <div style={{ opacity: 0.7 }}>No experience loaded.</div>
      </div>
    );
  }

  if (!editing) {
    return <CinematicScanPlayer data={experience} />;
  }

  return (
    <main style={editorShell}>
      <header style={editorHeader}>
        <div>
          <div style={eyebrow}>YOUR EXPERIENCE</div>
          <h1 style={title}>{experience.asset?.title ?? "Living Experience"}</h1>
        </div>
        <button type="button" onClick={() => setEditing(false)} style={playButton}>
          PLAY
        </button>
      </header>

      <p style={subtitle}>Shape the scenes before you enter the movie.</p>

      <section style={sceneList}>
        {scenes.length === 0 ? (
          <div style={emptyState}>QRE did not produce any scenes yet.</div>
        ) : (
          scenes.map((scene, index) => (
            <article key={scene.id ?? index} style={sceneCard}>
              <div style={sceneTopline}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <span style={{ opacity: 0.35 }}>{scene.type}</span>
              </div>
              <textarea
                value={sceneText(scene)}
                onChange={(event) => updateScene(index, event.target.value)}
                rows={3}
                style={sceneInput}
                aria-label={`Scene ${index + 1}`}
              />
            </article>
          ))
        )}
      </section>

      <footer style={editorFooter}>
        <span>{scenes.length} scenes</span>
        <button type="button" onClick={() => setEditing(false)} style={playButton}>
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
  background: "#030305",
  color: "#fff",
  padding: 24,
};

const editorShell: React.CSSProperties = {
  minHeight: "100dvh",
  boxSizing: "border-box",
  background: "radial-gradient(circle at 50% 0%, rgba(70,255,220,.05), transparent 35%), #050608",
  color: "#fff",
  padding: "clamp(28px, 5vw, 64px) clamp(18px, 5vw, 70px)",
};

const editorHeader: React.CSSProperties = {
  width: "min(1100px, 100%)",
  margin: "0 auto",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "end",
  gap: 20,
};

const eyebrow: React.CSSProperties = { fontSize: 9, letterSpacing: 4, opacity: 0.35, marginBottom: 10 };
const title: React.CSSProperties = { margin: 0, fontSize: "clamp(34px, 7vw, 64px)", fontWeight: 500, letterSpacing: "-2px" };
const subtitle: React.CSSProperties = { width: "min(1100px, 100%)", margin: "16px auto 28px", opacity: 0.42 };

const sceneList: React.CSSProperties = {
  width: "min(1100px, 100%)",
  margin: "0 auto",
  display: "grid",
  gap: 12,
};

const sceneCard: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.08)",
  borderRadius: 20,
  background: "rgba(255,255,255,.025)",
  padding: 16,
  backdropFilter: "blur(16px)",
};

const sceneTopline: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  fontSize: 9,
  letterSpacing: 2,
  opacity: 0.55,
  marginBottom: 10,
};

const sceneInput: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  border: "0",
  outline: "0",
  resize: "vertical",
  minHeight: 76,
  background: "transparent",
  color: "#fff",
  font: "inherit",
  fontSize: "clamp(18px, 2.6vw, 28px)",
  lineHeight: 1.35,
};

const editorFooter: React.CSSProperties = {
  width: "min(1100px, 100%)",
  margin: "26px auto 0",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 16,
  opacity: 0.6,
};

const playButton: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.22)",
  background: "rgba(255,255,255,.08)",
  color: "#fff",
  borderRadius: 999,
  padding: "11px 18px",
  cursor: "pointer",
  letterSpacing: 2,
  fontSize: 10,
};

const emptyState: React.CSSProperties = {
  padding: 40,
  textAlign: "center",
  opacity: 0.45,
};
