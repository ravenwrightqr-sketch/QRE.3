import { useEffect, useState, type CSSProperties } from "react";

import MomentRenderer from "./MomentRenderer";
import type { ScanResponse, CinematicScene } from "@qre/contracts";

type Props = { data: ScanResponse };

export default function CinematicScanPlayer({ data }: Props) {
  const scenes: CinematicScene[] = (data.cinematicScenes ?? [])
    .slice()
    .sort(
      (a, b) =>
        (a.order ?? 0) -
        (b.order ?? 0),
    );
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [data]);

  const scene = scenes[index];

  useEffect(() => {
    if (!scene) return;
    const timer = window.setTimeout(() => {
      setIndex((current) =>
        Math.min(
          current + 1,
          scenes.length,
        ),
      );
    }, Math.max(scene.duration ?? 3000, 1200));
    return () =>
      window.clearTimeout(timer);
  }, [scene, scenes.length]);

  function restart() {
    setIndex(0);
  }

  if (!scene) {
    return (
      <main
        style={sealedStage}
        aria-label="Experience complete"
      >
        <div style={sealedCard}>
          <h1 style={sealedTitle}>
            Memory Sealed
          </h1>
          <button
            type="button"
            onClick={restart}
            style={reliveButton}
          >
            RELIVE
          </button>
        </div>
      </main>
    );
  }

  return (
    <main
      style={stage}
      aria-label="Experience sequence"
    >
      <div style={vignette} />
      <div
        style={progressTrack}
        aria-hidden="true"
      >
        <div
          style={{
            ...progressFill,
            width: `${((index + 1) / scenes.length) * 100}%`,
          }}
        />
      </div>

      <section style={sceneFrame}>
        <MomentRenderer
          moment={scene.moment}
        />
      </section>
    </main>
  );
}

const stage: CSSProperties = {
  position: "fixed",
  inset: 0,
  width: "100vw",
  height: "100dvh",
  minHeight: "100dvh",
  overflow: "hidden",
  display: "grid",
  placeItems: "center",
  color: "#fff",
  background: "#030305",
  zIndex: 9999,
  touchAction: "manipulation",
};

const vignette: CSSProperties = {
  position: "absolute",
  inset: 0,
  pointerEvents: "none",
  background:
    "radial-gradient(circle at center, transparent 35%, rgba(0,0,0,.48) 100%)",
};

const sceneFrame: CSSProperties = {
  position: "relative",
  zIndex: 2,
  width: "100%",
  maxWidth: 980,
  height: "100%",
  display: "grid",
  placeItems: "center",
  padding:
    "clamp(28px, 7vw, 88px) clamp(20px, 7vw, 100px)",
  boxSizing: "border-box",
};

const progressTrack: CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  height: 2,
  background: "rgba(255,255,255,.06)",
  zIndex: 4,
};

const progressFill: CSSProperties = {
  height: "100%",
  background: "rgba(255,255,255,.55)",
  transition: "width .25s ease",
};

const sealedStage: CSSProperties = {
  position: "fixed",
  inset: 0,
  width: "100vw",
  height: "100dvh",
  display: "grid",
  placeItems: "center",
  background: "#030305",
  color: "#fff",
  zIndex: 9999,
};

const sealedCard: CSSProperties = {
  display: "grid",
  justifyItems: "center",
  gap: 22,
  padding: 30,
};

const sealedTitle: CSSProperties = {
  margin: 0,
  fontSize: "clamp(30px, 8vw, 68px)",
  fontWeight: 500,
  letterSpacing: "-2px",
};

const reliveButton: CSSProperties = {
  border: "1px solid rgba(255,255,255,.22)",
  background: "rgba(255,255,255,.04)",
  color: "#fff",
  borderRadius: 999,
  padding: "11px 18px",
  fontSize: 10,
  letterSpacing: 2,
  cursor: "pointer",
};
