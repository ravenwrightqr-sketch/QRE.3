import { useState } from "react";

import FlowInputPanel from "./FlowInputPanel";
import FlowPreviewPanel from "./FlowPreviewPanel";
import type { ScanRuntimeResponse, FlowAction } from "@qre/contracts";


import {
  compileFlow,
  createFlow,
  assignFlowToAsset,
} from "../../lib/api";

export default function FlowDashboard({
  assetId,
  slug,
}: {
  assetId: string;
  slug: string;
}) {
  const [input, setInput] = useState("");

  const [actions, setActions] = useState<FlowAction[]>([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const [savedFlowId, setSavedFlowId] = useState<string | null>(null);

  /**
   * =========================
   * COMPILE FLOW
   * =========================
   */
  async function handleCompile() {
    if (!input.trim()) return;

    setLoading(true);
    setError("");

    try {
      const data = await compileFlow(input);

      if (!data || !Array.isArray(data.actions)) {
        throw new Error("Invalid compiler response");
      }

      /**
       * IMPORTANT:
       * No casting. Force contract safety.
       */
      setActions(data.actions as FlowAction[]);
    } catch (err: any) {
      setError(err.message || "Compile failed");
    } finally {
      setLoading(false);
    }
  }

  /**
   * =========================
   * SAVE FLOW
   * =========================
   */
  async function handleSave() {
    if (!actions.length) return;

    setSaving(true);
    setError("");

    try {
      const res = await createFlow(slug || "QR Flow", actions);

      if (!res?.id) {
        throw new Error("Flow save failed");
      }

      setSavedFlowId(res.id);

      alert("Flow saved");
    } catch (err: any) {
      setError(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  /**
   * =========================
   * ASSIGN FLOW
   * =========================
   */
  async function handleAssign() {
    if (!savedFlowId) return alert("Save flow first");
    if (!assetId) return alert("Asset ID required");

    try {
      await assignFlowToAsset(assetId, savedFlowId);
      alert("Flow assigned to asset");
    } catch (err: any) {
      setError(err.message || "Assign failed");
    }
  }

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <h2>⚡ Flow Builder</h2>

      {error && <div style={{ color: "red" }}>{error}</div>}

      <FlowInputPanel
        input={input}
        setInput={setInput}
        onGenerate={handleCompile}
        loading={loading}
      />

      <FlowPreviewPanel
        actions={actions}
        setActions={setActions}
      />

      <div style={{ display: "flex", gap: 10 }}>
        <button
          onClick={handleSave}
          disabled={!actions.length || saving}
        >
          {saving ? "Saving..." : "Save Flow"}
        </button>

        <button
          onClick={handleAssign}
          disabled={!savedFlowId || !assetId}
        >
          Assign To Asset
        </button>
      </div>

      {savedFlowId && (
        <div style={{ opacity: 0.7 }}>
          Saved Flow ID: {savedFlowId}
        </div>
      )}
    </div>
  );
}