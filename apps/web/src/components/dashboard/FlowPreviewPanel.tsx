import { useState } from "react";
import type { FlowAction } from "@qre/contracts";

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

      {actions.length === 0 && <p>No actions yet</p>}

      {actions.map((a, i) => (
        <div
          key={i}
          draggable
          onDragStart={() => setDragIndex(i)}
          onDrop={() => {
            if (dragIndex === null) return;
            move(dragIndex, i);
            setDragIndex(null);
          }}
          onDragOver={(e) => e.preventDefault()}
          style={{
            padding: 10,
            border: "1px solid #eee",
            marginBottom: 10,
          }}
        >
          <strong>
            {i + 1}. {a.type}
          </strong>

          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => move(i, i - 1)}>↑</button>
            <button onClick={() => move(i, i + 1)}>↓</button>
            <button onClick={() => remove(i)}>✕</button>
          </div>

          {a.type === "message" && (
            <input
              value={a.text || ""}
              onChange={(e) => update(i, "text", e.target.value)}
            />
          )}

          {a.type === "delay" && (
            <input
              type="number"
              value={(a as any).ms || 0}
              onChange={(e) =>
                update(i, "ms", Number(e.target.value))
              }
            />
          )}

          {a.type === "redirect" && (
            <input
              value={(a as any).url || ""}
              onChange={(e) =>
                update(i, "url", e.target.value)
              }
            />
          )}

          {a.type === "cta" && (
            <>
              <input
                placeholder="text"
                value={(a as any).text || ""}
                onChange={(e) =>
                  update(i, "text", e.target.value)
                }
              />
              <input
                placeholder="url"
                value={(a as any).url || ""}
                onChange={(e) =>
                  update(i, "url", e.target.value)
                }
              />
            </>
          )}
        </div>
      ))}
    </div>
  );
}