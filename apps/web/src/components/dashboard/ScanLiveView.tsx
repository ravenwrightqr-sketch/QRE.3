import { useEffect, useState } from "react";
import { runFlow } from "../../lib/flowExecutor";
import type { FlowAction } from "../../types/flow";

export default function ScanLiveView({
  actions,
  sessionId,
}: {
  actions: FlowAction[];
  sessionId: string;
}) {
  const [output, setOutput] = useState<string[]>([]);
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    if (!actions?.length) return;

    setOutput([]);

    runFlow(actions, {
      sessionId,
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
  }, [actions]);

  return (
    <div style={{ border: "1px solid #ccc", padding: 10 }}>
      <h3>⚡ Live QR Execution</h3>

      {output.map((msg, i) => (
        <div key={i} style={{ marginBottom: 5 }}>
          {msg}
        </div>
      ))}

      {unlocked && (
        <div style={{ marginTop: 10, color: "green" }}>
          🔓 Content Unlocked
        </div>
      )}
    </div>
  );
}