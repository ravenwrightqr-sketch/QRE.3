import { useLocation, useNavigate } from "react-router-dom";
import CinematicScanPlayer from "../components/scan/CinematicScanPlayer";
import type { Experience } from "@qre/contracts";

type PreviewState = {
  experience?: Experience;
  experienceId?: string;
  flowId?: string | null;
  assetId?: string;
  sourcePrompt?: string;
};

export default function ExperiencePreview() {
  const location = useLocation();
  const navigate = useNavigate();

  const state = (location.state ?? null) as PreviewState | null;
  const experience = state?.experience ?? null;

  if (!experience) {
    return (
      <main style={shellStyle}>
        <div style={emptyState}>
          <div style={eyebrow}>QRE</div>
          <h1 style={title}>Nothing ready to play.</h1>

          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            style={button}
          >
            BACK
          </button>
        </div>
      </main>
    );
  }

  return (
    <main style={playWorld}>
      <CinematicScanPlayer
        scenes={experience.cinematicScenes ?? []}
      />
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
