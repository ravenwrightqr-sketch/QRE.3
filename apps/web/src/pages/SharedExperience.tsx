import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getSharedExperience } from "../lib/api";

type Shared = {
  success: boolean;
  share: {
    id: string;
    createdAt: string;
    dominantLayer: string | null;
    asset: { slug: string; displayName?: string | null };
    dropOffPoints: {
      moments?: Array<Record<string, unknown>>;
      cinematicScenes?: Array<Record<string, any>>;
      geoStory?: unknown;
    };
  };
};

function textOf(value: unknown): string {
  if (!value || typeof value !== "object") return "";
  const record = value as Record<string, unknown>;
  const payload = record.payload && typeof record.payload === "object"
    ? record.payload as Record<string, unknown>
    : undefined;
  return String(record.text ?? payload?.text ?? record.content ?? payload?.content ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

export default function SharedExperience() {
  const { id } = useParams();
  const [data, setData] = useState<Shared | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    void getSharedExperience(id)
      .then((next) => setData(next))
      .catch((err) => setError(err instanceof Error ? err.message : String(err)));
  }, [id]);

  if (error) {
    return <main style={stage}><section style={card}><div style={eyebrow}>QRE</div><h1 style={title}>Experience unavailable.</h1><p style={sub}>{error}</p></section></main>;
  }

  if (!data) {
    return <main style={stage}><div style={loading}>LOADING EXPERIENCE…</div></main>;
  }

  const scenes = Array.isArray(data.share.dropOffPoints?.cinematicScenes)
    ? data.share.dropOffPoints.cinematicScenes
    : [];
  const moments = Array.isArray(data.share.dropOffPoints?.moments)
    ? data.share.dropOffPoints.moments
    : [];
  const source = scenes.length ? scenes : moments;
  const lines = source.map(textOf).filter(Boolean);

  return (
    <main style={stage}>
      <div style={vignette} />
      <section style={card} aria-label="QRE shared experience">
        <div style={eyebrow}>QRE EXPERIENCE</div>
        <h1 style={title}>{data.share.asset.displayName || data.share.asset.slug}</h1>
        <div style={film}>
          {lines.map((line, index) => <div key={`${index}-${line}`} style={lineStyle}>{line}</div>)}
        </div>
        <div style={footer}>A QRE living-world experience.</div>
      </section>
    </main>
  );
}

const stage = { minHeight: "100dvh", display: "grid", placeItems: "center", background: "#030305", color: "#fff", padding: "28px 18px", boxSizing: "border-box" as const };
const card = { position: "relative" as const, zIndex: 2, width: "min(900px,100%)", padding: "clamp(26px,6vw,68px)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 30, background: "rgba(255,255,255,.025)" };
const eyebrow = { fontSize: 10, letterSpacing: 6, opacity: .42, marginBottom: 14 };
const title = { margin: 0, fontSize: "clamp(42px,8vw,82px)", fontWeight: 500, letterSpacing: "-3px", lineHeight: .94 };
const sub = { color: "rgba(255,255,255,.58)", lineHeight: 1.5 };
const film = { marginTop: 38, padding: "clamp(20px,5vw,42px)", borderRadius: 22, background: "#000", border: "1px solid rgba(255,255,255,.07)" };
const lineStyle = { fontSize: "clamp(21px,4vw,38px)", lineHeight: 1.15, marginBottom: 20 };
const footer = { marginTop: 24, fontSize: 11, letterSpacing: 2, opacity: .32 };
const loading = { letterSpacing: 4, fontSize: 11, opacity: .5 };
const vignette = { position: "fixed" as const, inset: 0, pointerEvents: "none" as const, background: "radial-gradient(circle at center, transparent 28%, rgba(0,0,0,.55) 100%)" };
