import { useState } from "react";
import { apiPost } from "../../lib/api";
import type { FlowAction } from "@qre/contracts";

type FlowResponse = {
  actions: FlowAction[];
};

export function FlowBridge() {
  const [input, setInput] = useState("");
  const [actions, setActions] = useState<FlowAction[]>([]);
  const [loading, setLoading] = useState(false);

  async function generateFlow() {
    setLoading(true);

    try {
      const data = (await apiPost("/flow/compile", {
        input,
      })) as FlowResponse;

      setActions(data.actions ?? []);
    } finally {
      setLoading(false);
    }
  }

  async function saveFlow() {
    await apiPost("/flow/create", {
      name: "QR Flow",
      actions,
    });
  }

  function updateAction(index: number, patch: Partial<FlowAction>) {
    setActions((prev) =>
      prev.map((a, i) => (i === index ? ({ ...a, ...patch } as FlowAction) : a))
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <textarea
        placeholder="Type your idea..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />

      <button onClick={generateFlow} disabled={loading}>
        {loading ? "Generating..." : "Generate Flow"}
      </button>

      <div>
        {actions.map((a, i) => (
          <div key={i} style={{ marginBottom: 10 }}>
            {/* MESSAGE */}
            {a.type === "message" && (
              <input
                placeholder="Message"
                value={a.text || ""}
                onChange={(e) =>
                  updateAction(i, { text: e.target.value })
                }
              />
            )}

            {/* DELAY */}
            {a.type === "delay" && (
              <input
                type="number"
                placeholder="Delay ms"
                value={a.ms || 0}
                onChange={(e) =>
                  updateAction(i, { ms: Number(e.target.value) })
                }
              />
            )}

            {/* REDIRECT */}
            {a.type === "redirect" && (
              <input
                placeholder="Redirect URL"
                value={a.url || ""}
                onChange={(e) =>
                  updateAction(i, { url: e.target.value })
                }
              />
            )}

            {/* CTA */}
            {a.type === "cta" && (
              <>
                <input
                  placeholder="CTA text"
                  value={a.text}
                  onChange={(e) =>
                    updateAction(i, { text: e.target.value })
                  }
                />
                <input
                  placeholder="CTA url"
                  value={a.url || ""}
                  onChange={(e) =>
                    updateAction(i, { url: e.target.value })
                  }
                />
              </>
            )}

            {/* PAYMENT */}
            {a.type === "payment" && (
              <input
                type="number"
                placeholder="Amount"
                value={a.amount || 0}
                onChange={(e) =>
                  updateAction(i, {
                    amount: Number(e.target.value),
                  })
                }
              />
            )}

            {/* UNLOCK */}
            {a.type === "unlock" && (
              <div>🔓 Unlock action (no config)</div>
            )}
          </div>
        ))}
      </div>

      <button onClick={saveFlow}>Save Flow</button>
    </div>
  );
}