import { useState } from "react";
import { compileFlow, createFlow } from "../../lib/api";
import type { FlowAction } from "@qre/contracts";

type CompileResponse = {
  actions: FlowAction[];
};

export default function FlowBuilder() {
  const [input, setInput] = useState("");
  const [flow, setFlow] = useState<FlowAction[] | null>(null);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  /**
   * STEP 1: Compile flow (preview mode)
   */
  async function handleCompile() {
    if (!input.trim()) return;

    setLoading(true);

    try {
      const res = (await compileFlow(input)) as CompileResponse;

      if (!res || !Array.isArray(res.actions)) {
        throw new Error("Invalid compiler response (expected actions[])");
      }

      setFlow(res.actions);
    } catch (e) {
      console.error("Compile error:", e);
      setFlow(null);
    } finally {
      setLoading(false);
    }
  }

  /**
   * STEP 2: Save flow to backend
   */
  async function handleSave() {
    if (!flow || flow.length === 0) return;

    setSaving(true);

    try {
      const saved = await createFlow(name || "Untitled Flow", flow);

      if (!saved?.id) {
        throw new Error("Flow save failed (no id returned)");
      }

      alert("Flow saved: " + saved.id);
    } catch (e) {
      console.error("Save error:", e);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flow-builder" style={{ display: "flex", flexDirection: "column", gap: 12 }}>

      {/* TITLE */}
      <h2>FLOW BUILDER</h2>

      {/* FLOW NAME */}
      <input
        placeholder="Flow name (e.g. Friday Promo)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={{ padding: 8 }}
      />

      {/* INPUT AREA */}
      <textarea
        placeholder="Write your story... (welcome, deals, events, CTA)"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        rows={6}
        style={{ padding: 8 }}
      />

      {/* ACTIONS */}
      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={handleCompile} disabled={loading}>
          {loading ? "Compiling..." : "Compile Flow"}
        </button>

        <button onClick={handleSave} disabled={!flow || saving}>
          {saving ? "Saving..." : "Save Flow"}
        </button>
      </div>

      {/* PREVIEW */}
      <div className="flow-preview" style={{ marginTop: 20 }}>
        {flow?.length ? (
          flow.map((node, i) => (
            <div
              key={i}
              style={{
                padding: 10,
                border: "1px solid #ddd",
                marginBottom: 8,
                borderRadius: 6,
              }}
            >
              <strong>{node.type}</strong>

              {/* SAFE TYPE-SPECIFIC RENDERING */}
              {"text" in node && node.text && (
                <p>Text: {node.text}</p>
              )}

              {"ms" in node && typeof node.ms === "number" && (
                <p>Delay: {node.ms}ms</p>
              )}

              {"url" in node && node.url && (
                <p>URL: {node.url}</p>
              )}

              {"amount" in node && (
                <p>Amount: ${node.amount}</p>
              )}

              {node.type === "unlock" && (
                <p>🔓 Unlock action</p>
              )}
            </div>
          ))
        ) : (
          <p style={{ opacity: 0.6 }}>No flow compiled yet</p>
        )}
      </div>

    </div>
  );
}