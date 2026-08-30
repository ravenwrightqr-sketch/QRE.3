import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CinematicScanPlayer from "../components/scan/CinematicScanPlayer";
import type { CinematicScene, Experience } from "@qre/contracts";

type PresentationPayload = {
  sessionId?: unknown;
  access?: unknown;
  preview?: unknown;
  asset?: unknown;
  moments?: unknown;
  cinematicScenes?: unknown;
  geoStory?: unknown;
  memorySnapshot?: unknown;
  receipt?: unknown;
  insights?: unknown;
};

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function toPresentationExperience(raw: unknown): Experience | null {
  if (!isObject(raw)) return null;

  const payload = raw as PresentationPayload;
  if (!Array.isArray(payload.cinematicScenes)) return null;
  if (!Array.isArray(payload.moments)) return null;

  const scenes = payload.cinematicScenes
    .filter(isObject)
    .map((scene) => scene as unknown as CinematicScene)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  if (!scenes.length || !scenes.some((scene) => String(scene.moment?.text ?? "").trim())) {
    return null;
  }

  if (!isObject(payload.asset)) return null;

  return {
    sessionId: typeof payload.sessionId === "string" ? payload.sessionId : crypto.randomUUID(),
    access: payload.access as Experience["access"],
    preview: payload.preview !== false,
    asset: payload.asset as Experience["asset"],
    moments: payload.moments as Experience["moments"],
    cinematicScenes: scenes,
    geoStory: payload.geoStory ?? null,
    memorySnapshot: payload.memorySnapshot ?? null,
    receipt: payload.receipt ?? null,
    insights: Array.isArray(payload.insights) ? payload.insights as Experience["insights"] : [],
  };
}

export default function ExperiencePreview() {
  const navigate = useNavigate();
  const [experience, setExperience] = useState<Experience | null>(null);
  const [invalid, setInvalid] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem("experiencePreview");
    if (!stored) {
      setInvalid(true);
      return;
    }

    try {
      const parsed = JSON.parse(stored);
      const presentation = toPresentationExperience(parsed);
      if (!presentation) {
        setInvalid(true);
        return;
      }
      setExperience(presentation);
    } catch (error) {
      console.error("Invalid QRE experience payload", error);
      setInvalid(true);
    }
  }, []);

  if (!experience || invalid) {
    return (
      <main style={shellStyle}>
        <div style={emptyState}>
          <div style={eyebrow}>QRE</div>
          <h1 style={title}>Nothing ready to play.</h1>
          <button type="button" onClick={() => navigate("/dashboard")} style={button}>
            BACK
          </button>
        </div>
      </main>
    );
  }

  return (
    <main style={playWorld}>
      <CinematicScanPlayer data={experience} />
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

const emptyState: React.CSSProperties = {
  width: "min(700px, 90vw)",
  textAlign: "center",
  opacity: 0.72,
};

const eyebrow: React.CSSProperties = {
  fontSize: 9,
  letterSpacing: 4,
  opacity: 0.34,
  marginBottom: 8,
};

const title: React.CSSProperties = {
  margin: "0 0 20px",
  fontSize: "clamp(30px, 7vw, 56px)",
  fontWeight: 500,
  letterSpacing: "-2px",
};

const button: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.15)",
  background: "transparent",
  color: "rgba(255,255,255,.7)",
  borderRadius: 999,
  padding: "11px 18px",
  cursor: "pointer",
  fontSize: 10,
  letterSpacing: 1.5,
};
