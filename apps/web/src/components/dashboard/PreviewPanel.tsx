import { useEffect, useState } from "react";
import { runFlow } from "../../lib/flowExecutor";

export default function PreviewPanel({ data }: { data: any }) {
  const [output, setOutput] = useState<string[]>([]);
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    if (!data) return;

    setOutput([]);
    setUnlocked(false);

    /**
     * =========================
     * ACCESS HANDLING (REAL CONTRACT)
     * =========================
     */
    const access = data.access;

    if (access === "LOCKED" || access === "FREE") {
      const teaserText =
        data.teaser?.map((t: any) => t.text).join(" ") ||
        "Locked content";

      setOutput([teaserText]);
      return;
    }

    /**
     * =========================
     * FLOW EXECUTION (FIXED CONTRACT)
     * =========================
     *
     * IMPORTANT:
     * scanEngine does NOT return flow.actions
     * ONLY flowId exists
     *
     * So frontend must NOT try to execute flow here.
     *
     * Flow execution happens server-side in scanEngine.
     */
    if (access === "UNLOCKED") {
      setOutput([
        "✅ Unlocked content delivered from server flow execution.",
      ]);

      if (data.teaser?.length) {
        setOutput((prev) => [
          ...prev,
          ...data.teaser.map((t: any) => t.text),
        ]);
      }
    }
  }, [data]);

  if (!data) {
    return <div style={{ padding: 10 }}>Run scan to preview experience</div>;
  }

  return (
    <div style={{ padding: 10, background: "#111", color: "#0f0" }}>
      <h3>👁 Live Scan Preview</h3>

      <div>Access: {data.access}</div>
      <div>Flow ID: {data.flowId ?? "none"}</div>

      <hr />

      {output.map((msg, i) => (
        <p key={i} style={{ margin: 5 }}>
          {msg}
        </p>
      ))}

      {unlocked && (
        <div style={{ marginTop: 10, color: "yellow" }}>
          🔓 CONTENT UNLOCKED
        </div>
      )}
    </div>
  );
}