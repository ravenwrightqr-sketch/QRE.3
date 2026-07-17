import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { scan } from "../lib/api";
import { runFlow } from "../lib/flowExecutor";

import type { ScanRuntimeResponse } from "../types/runtime";

export default function Scan() {
  const { slug } = useParams();

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<ScanRuntimeResponse | null>(null);

  const [output, setOutput] = useState<string[]>([]);
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function run() {
      try {
        if (!slug) throw new Error("Missing slug");

        const data: ScanRuntimeResponse = await scan(slug);

        setResult(data);

        // =========================
        // FLOW SAFE ACCESS (FIXED)
        // =========================
        const actions = data.flow?.actions ?? [];

        if (Array.isArray(actions) && actions.length > 0) {
          runFlow(actions, {
            sessionId: data.sessionId,

            onMessage: (text) =>
              setOutput((prev) => [...prev, text]),

            onRedirect: (url) => {
              window.location.href = url;
            },

            onUnlock: () => {
              setUnlocked(true);
            },
          });

          return;
        }

        // =========================
        // TEASER FALLBACK
        // =========================
        if (Array.isArray(data.teaser) && data.teaser.length > 0) {
          setOutput(data.teaser.map((t) => t.text ?? ""));
        }
      } catch (e: any) {
        setError(e.message || "Scan failed");
      } finally {
        setLoading(false);
      }
    }

    run();
  }, [slug]);

  if (loading) return <div>SCANNING NODE...</div>;
  if (error) return <div style={{ color: "red" }}>{error}</div>;

  return (
    <div style={{ padding: 20 }}>
      <h3>SCAN OUTPUT</h3>

      <div>Access: {result?.access}</div>
      <div>Session: {result?.sessionId}</div>
      <div>Flow ID: {result?.flowId ?? "none"}</div>

      <hr />

      {output.map((o, i) => (
        <p key={i}>{o}</p>
      ))}

      {unlocked && <div>🔓 UNLOCKED</div>}
    </div>
  );
}