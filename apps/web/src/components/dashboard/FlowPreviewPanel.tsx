import { useState } from "react";
import type { FlowAction } from "../../types/flow";

export default function FlowPreviewPanel({
  actions,
  setActions,
}: {
  actions: FlowAction[];
  setActions: React.Dispatch<React.SetStateAction<FlowAction[]>>;
}) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  function update(index: number, key: string, value: any) {
    const copy = [...actions];
    (copy[index] as any)[key] = value;
    setActions(copy);
  }

  function remove(index: number) {
    const copy = [...actions];
    copy.splice(index, 1);
    setActions(copy);
  }

  function move(from: number, to: number) {
    if (to < 0 || to >= actions.length) return;

    const copy = [...actions];
    const item = copy.splice(from, 1)[0];
    copy.splice(to, 0, item);
    setActions(copy);
  }

  return (
    <div style={{ border: "1px solid #ddd", padding: 12 }}>
      <h3>⚡ Flow Builder (Reorderable)</h3>

      {actions.length === 0 && (
        <p style={{ opacity: 0.6 }}>No actions yet</p>
      )}

      {actions.map((a, i) => (
        <div
          key={i}
          draggable
          onDragStart={() => setDragIndex(i)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => {
            if (dragIndex === null) return;
            move(dragIndex, i);
            setDragIndex(null);
          }}
          style={{
            padding: 10,
            marginBottom: 10,
            border: "1px solid #eee",
            borderRadius: 6,
            background: "#fff",
            cursor: "grab",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <strong>{i + 1}. {a.type}</strong>

            <div>
              <button onClick={() => move(i, i - 1)}>↑</button>
              <button onClick={() => move(i, i + 1)}>↓</button>
              <button onClick={() => remove(i)}>✕</button>
            </div>
          </div>

          {/* MESSAGE */}
          {a.type === "message" && (
            <input
              value={a.text || ""}
              onChange={(e) => update(i, "text", e.target.value)}
              placeholder="message"
              style={{ width: "100%" }}
            />
          )}

          {/* DELAY */}
          {a.type === "delay" && (
            <input
              type="number"
              value={a.ms || 0}
              onChange={(e) => update(i, "ms", Number(e.target.value))}
              placeholder="ms"
              style={{ width: "100%" }}
            />
          )}

          {/* REDIRECT */}
          {a.type === "redirect" && (
            <input
              value={a.url || ""}
              onChange={(e) => update(i, "url", e.target.value)}
              placeholder="url"
              style={{ width: "100%" }}
            />
          )}

          {/* UNLOCK */}
          {a.type === "unlock_preview" && (
            <div style={{ opacity: 0.6 }}>Unlock action</div>
          )}
        </div>
      ))}
    </div>
  );
}