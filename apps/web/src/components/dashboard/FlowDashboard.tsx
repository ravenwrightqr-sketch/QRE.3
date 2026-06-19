import { useState } from "react";
import FlowInputPanel from "./FlowInputPanel";
import FlowPreviewPanel from "./FlowPreviewPanel";
import type { FlowAction } from "../../types/flow";


export default function FlowDashboard({ slug }: { slug: string }) {
  const [input, setInput] = useState("");
  const [actions, setActions] = useState<FlowAction[]>([]);
  const [loading, setLoading] = useState(false);

  async function compileFlow() {
    if (!input) return;

    setLoading(true);

    try {
      const res = await fetch("http://localhost:3000/flow/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input }),
      });

      const data = await res.json();
      setActions(data.actions);
    } finally {
      setLoading(false);
    }
  }

  async function saveFlow() {
    await fetch("http://localhost:3000/flow/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: slug || "QR Flow",
        actions,
      }),
    });

    alert("Flow saved");
  }

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <h2>⚡ Flow Builder</h2>

      <FlowInputPanel
        input={input}
        setInput={setInput}
        onGenerate={compileFlow}
        loading={loading}
      />

     <FlowPreviewPanel actions={actions} setActions={setActions} />

      <button onClick={saveFlow} disabled={!actions.length}>
        Save Flow
      </button>
    </div>
  );
}