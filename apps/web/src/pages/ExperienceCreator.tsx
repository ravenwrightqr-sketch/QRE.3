import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AnimatedBackground from "../components/effects/AnimatedBackground";
import IdeaParticles from "../components/effects/IdeaParticles";
import { compileExperience } from "../lib/experienceApi";

export default function ExperienceCreator() {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState("");
  const [movieMode, setMovieMode] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  async function createExperience() {
    if (!prompt.trim()) return;
    try {
      setCreating(true);
      setError("");
      const compiled = await compileExperience({ prompt, movieMode });
      sessionStorage.setItem("experiencePreview", JSON.stringify(compiled));
      navigate("/experience/preview");
    } catch (error: any) {
      console.error("Experience creation failed", error);
      setError(error.message ?? "Experience creation failed");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#030305", color: "#fff", position: "relative" }}>
      <AnimatedBackground />
      <IdeaParticles />
      <div style={{ position: "relative", zIndex: 2, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 30px", textAlign: "center" }}>
        <div style={{ width: "min(900px,100%)" }}>
          <p style={{ letterSpacing: 8, fontSize: 12, opacity: .5 }}>QRE EXPERIENCE ENGINE</p>

          <h1 style={{ fontSize: "clamp(42px,6vw,80px)", fontWeight: 800, lineHeight: 1, marginBottom: 30 }}>
            Bring an
            <br />
            experience alive.
          </h1>

          <p style={{ opacity: .65, fontSize: 18, maxWidth: 700, margin: "0 auto", lineHeight: 1.6 }}>
            Describe a memory, place, person, event, brand, or impossible idea.
            QRE will compile the living experience.
          </p>

          <textarea
            value={prompt}
            maxLength={25000}
            onChange={event => setPrompt(event.target.value)}
            placeholder="Create a cinematic living memory experience for a dog tag that tells someone's story..."
            style={{ display: "block", margin: "40px auto 0", width: "min(760px,90vw)", height: 320, minHeight: 320, padding: 25, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.18)", borderRadius: 20, color: "#fff", fontSize: 18, lineHeight: 1.7, fontFamily: "inherit", resize: "none", overflowY: "auto", outline: "none", boxSizing: "border-box" }}
          />

          <div style={{ margin: "22px auto 0", display: "flex", alignItems: "center", justifyContent: "center", gap: 14, fontSize: 14, opacity: .85 }}>
            <span>MOVIE</span>
            <button
              type="button"
              aria-pressed={movieMode}
              onClick={() => setMovieMode(value => !value)}
              style={{ minWidth: 92, padding: "10px 16px", borderRadius: 999, background: movieMode ? "#fff" : "transparent", color: movieMode ? "#000" : "#fff", border: "1px solid rgba(255,255,255,.35)", cursor: "pointer", letterSpacing: 2 }}
            >
              {movieMode ? "ON" : "OFF"}
            </button>
          </div>

          <button
            disabled={creating}
            onClick={createExperience}
            style={{ marginTop: 35, padding: "18px 55px", borderRadius: 100, background: "transparent", border: "1px solid rgba(255,255,255,.35)", color: "#fff", letterSpacing: 4, cursor: creating ? "wait" : "pointer" }}
          >
            {creating ? "COMPILING..." : "CREATE EXPERIENCE"}
          </button>

          {error && (
            <p style={{ color: "#ff6677", marginTop: 25 }}>{error}</p>
          )}
        </div>
      </div>
    </div>
  );
}
