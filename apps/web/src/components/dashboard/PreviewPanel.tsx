import { useEffect, useState } from "react";
import type { FlowAction } from "../../types/flow";
import { runFlow } from "../../lib/flowExecutor";

export default function PreviewPanel({ data }: { data: any }) {
  const [output, setOutput] = useState<string[]>([]);
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    if (!data) return;

    setOutput([]);
    setUnlocked(false);

    // ⚡ IF FLOW EXISTS → RUN REAL ENGINE
    if (data.flow) {
      runFlow(data.flow.actions || [], {
        sessionId: data.sessionId,
        onMessage: (text) => {
          setOutput((prev) => [...prev, text]);
        },
        onRedirect: (url) => {
          window.location.href = url;
        },
        onUnlock: () => {
          setUnlocked(true);
        },
      });

      return;
    }

    // ⚡ OTHERWISE FALLBACK TEASER MODE
    if (data.teaser) {
      const teaserText = data.teaser.map((t: any) => t.text).join(" ");
      setOutput([teaserText]);
    }
  }, [data]);

  if (!data) {
    return (
      <div style={{ padding: 10 }}>
        Run scan to preview experience
      </div>
    );
  }

  return (
    <div style={{ padding: 10, background: "#111", color: "#0f0" }}>
      <h3>👁 Live Scan Preview</h3>

      <div>Access: {data.access}</div>
      <div>Mode: {data.mode}</div>

      <hr />

      {/* LIVE OUTPUT */}
      {output.map((msg, i) => (
        <p key={i} style={{ margin: 5 }}>
          {msg}
        </p>
      ))}

      {/* UNLOCK STATE */}
      {unlocked && (
        <div style={{ marginTop: 10, color: "yellow" }}>
          🔓 CONTENT UNLOCKED
        </div>
      )}

      {/* TEASER CTA FALLBACK */}
      {!data.flow && data.teaser?.map((t: any, i: number) => {
        if (t.type === "cta") {
          return (
            <a key={i} href={t.url} style={{ color: "cyan" }}>
              {t.text}
            </a>
          );
        }
        return null;
      })}
    </div>
  );
}