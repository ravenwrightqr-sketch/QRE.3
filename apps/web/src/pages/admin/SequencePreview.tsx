import { useEffect, useMemo, useState } from "react";

type Screen = {
  id: string;
  text: string;
  duration: number;
};

type Sequence = {
  title: string;
  screens: Screen[];
};

function readSequence(): Sequence {
  try {
    const raw = decodeURIComponent(window.location.hash.slice(1));
    if (raw) return JSON.parse(atob(raw)) as Sequence;
  } catch {}

  try {
    const raw = sessionStorage.getItem("qre-sequence-preview");
    if (raw) return JSON.parse(raw) as Sequence;
  } catch {}

  return { title: "", screens: [] };
}

export default function SequencePreview() {
  const sequence = useMemo(readSequence, []);
  const screens = sequence.screens ?? [];
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    if (!playing || screens.length === 0) return;
    const duration = Math.max(700, screens[index]?.duration ?? 2500);
    const timer = window.setTimeout(() => {
      setIndex((current) => (current + 1) % screens.length);
    }, duration);
    return () => window.clearTimeout(timer);
  }, [playing, index, screens]);

  if (!screens.length) {
    return (
      <main style={styles.empty}>
        <div>
          <div style={styles.brand}>QRE</div>
          <h1 style={styles.emptyTitle}>Nothing to show yet.</h1>
          <a href="/admin" style={styles.link}>Create a sequence</a>
        </div>
      </main>
    );
  }

  return (
    <main style={styles.page} onClick={() => setPlaying((value) => !value)}>
      <div style={styles.phone}>
        <div style={styles.top}>
          <span>{sequence.title || "Untitled"}</span>
          <span>{index + 1} / {screens.length}</span>
        </div>

        <div style={styles.stage}>
          <div key={screens[index].id} style={styles.text}>{screens[index].text}</div>
        </div>

        <div style={styles.progressRow}>
          {screens.map((screen, screenIndex) => (
            <div
              key={screen.id}
              style={{
                ...styles.progress,
                opacity: screenIndex === index ? 1 : 0.22,
              }}
            />
          ))}
        </div>

        <div style={styles.bottom}>
          <button
            onClick={(event) => {
              event.stopPropagation();
              setIndex((current) => current === 0 ? screens.length - 1 : current - 1);
              setPlaying(true);
            }}
            style={styles.circle}
            aria-label="Previous"
          >‹</button>
          <button
            onClick={(event) => {
              event.stopPropagation();
              setPlaying((value) => !value);
            }}
            style={styles.play}
          >
            {playing ? "Pause" : "Play"}
          </button>
          <button
            onClick={(event) => {
              event.stopPropagation();
              setIndex((current) => (current + 1) % screens.length);
              setPlaying(true);
            }}
            style={styles.circle}
            aria-label="Next"
          >›</button>
        </div>
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100dvh",
    background: "#050505",
    color: "#fff",
    display: "grid",
    placeItems: "center",
    padding: "18px",
    boxSizing: "border-box",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', Inter, sans-serif",
  },
  phone: {
    width: "min(100%, 430px)",
    height: "min(92dvh, 860px)",
    minHeight: "600px",
    borderRadius: "40px",
    background: "#0b0b0c",
    boxShadow: "0 30px 100px rgba(0,0,0,.65), inset 0 0 0 1px rgba(255,255,255,.08)",
    overflow: "hidden",
    display: "grid",
    gridTemplateRows: "auto 1fr auto auto",
  },
  top: {
    display: "flex",
    justifyContent: "space-between",
    padding: "22px 24px",
    color: "rgba(255,255,255,.55)",
    fontSize: 12,
    letterSpacing: ".02em",
  },
  stage: {
    display: "grid",
    placeItems: "center",
    padding: "42px 28px",
    textAlign: "center",
  },
  text: {
    fontSize: "clamp(30px, 8vw, 54px)",
    lineHeight: 1.04,
    fontWeight: 650,
    letterSpacing: "-.045em",
    animation: "qreScreenIn .36s ease both",
  },
  progressRow: {
    display: "flex",
    gap: 4,
    padding: "0 22px 18px",
  },
  progress: {
    height: 3,
    flex: 1,
    background: "#fff",
    borderRadius: 20,
    transition: "opacity .2s ease",
  },
  bottom: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 22px 26px",
  },
  circle: {
    width: 42,
    height: 42,
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,.1)",
    background: "rgba(255,255,255,.06)",
    color: "#fff",
    fontSize: 25,
  },
  play: {
    border: 0,
    background: "#fff",
    color: "#000",
    borderRadius: 999,
    padding: "11px 22px",
    fontWeight: 650,
  },
  empty: {
    minHeight: "100dvh",
    display: "grid",
    placeItems: "center",
    background: "#050505",
    color: "#fff",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', Inter, sans-serif",
    textAlign: "center",
  },
  brand: {
    fontWeight: 800,
    letterSpacing: ".2em",
    opacity: .5,
    marginBottom: 18,
  },
  emptyTitle: {
    fontSize: 30,
    letterSpacing: "-.035em",
    marginBottom: 18,
  },
  link: {
    color: "#fff",
    opacity: .7,
    textDecoration: "none",
  },
};