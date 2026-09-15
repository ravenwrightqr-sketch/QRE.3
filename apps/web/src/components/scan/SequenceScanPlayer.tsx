import { useEffect, useState, type CSSProperties } from "react";
import type { ScanResponse, SequenceCut } from "@qre/contracts";

type Props = {
  data: ScanResponse;
};

function cutText(cut: SequenceCut): string {
  return (
    cut.informationGain?.trim() ||
    cut.attentionDelta?.trim() ||
    cut.nextPromise?.trim() ||
    ""
  );
}

export default function SequenceScanPlayer({ data }: Props) {
  const cuts = (data.sequence?.cuts ?? [])
    .slice()
    .sort((a, b) => a.order - b.order);

  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [data]);

  const cut = cuts[index];
  const text = cut ? cutText(cut) : "";

  useEffect(() => {
    if (!cut || cuts.length <= 1) return;

    const timer = window.setTimeout(() => {
      setIndex((current) => Math.min(current + 1, cuts.length));
    }, 2400);

    return () => window.clearTimeout(timer);
  }, [cut, cuts.length]);

  function restart() {
    setIndex(0);
  }

  if (!cut || !text) {
    return (
      <main style={sealedStage} aria-label="Experience complete">
        <div style={sealedCard}>
          <h1 style={sealedTitle}>Experience Complete</h1>
          <button type="button" onClick={restart} style={reliveButton}>
            RELIVE
          </button>
        </div>
      </main>
    );
  }

  return (
    <main style={stage} aria-label="Experience sequence">
      <div style={vignette} />

      <div style={progressTrack} aria-hidden="true">
        <div
          style={{
            ...progressFill,
            width: `${((index + 1) / cuts.length) * 100}%`,
          }}
        />
      </div>

      <section style={sequenceFrame}>
        <div style={role}>{cut.role}</div>
        <p style={textStyle}>{text}</p>
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

const sequenceFrame: CSSProperties = {
  position: "relative",
  zIndex: 2,
  width: "100%",
  maxWidth: 980,
  minHeight: 280,
  padding: "48px 28px",
  display: "grid",
  placeItems: "center",
  alignContent: "center",
  gap: 18,
  textAlign: "center",
  boxSizing: "border-box",
};

const role: CSSProperties = {
  fontSize: 12,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  opacity: 0.52,
};

const textStyle: CSSProperties = {
  margin: 0,
  maxWidth: 760,
  fontSize: "clamp(28px, 5vw, 64px)",
  lineHeight: 1.04,
  fontWeight: 600,
  letterSpacing: "-0.03em",
};

const progressTrack: CSSProperties = {
  position: "absolute",
  top: 18,
  left: 18,
  right: 18,
  height: 2,
  background: "rgba(255,255,255,.14)",
  zIndex: 3,
};

const progressFill: CSSProperties = {
  height: "100%",
  background: "rgba(255,255,255,.9)",
  transition: "width 240ms ease",
};

const sealedStage: CSSProperties = {
  ...stage,
};

const sealedCard: CSSProperties = {
  position: "relative",
  zIndex: 2,
  textAlign: "center",
};

const sealedTitle: CSSProperties = {
  margin: "0 0 24px",
  fontSize: "clamp(30px, 5vw, 56px)",
  letterSpacing: "-0.03em",
};

const reliveButton: CSSProperties = {
  border: "1px solid rgba(255,255,255,.24)",
  borderRadius: 999,
  background: "rgba(255,255,255,.08)",
  color: "#fff",
  padding: "12px 20px",
  cursor: "pointer",
};
