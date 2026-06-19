import { useState } from "react";

type FlowAction = {
  type: "message" | "delay" | "redirect";
  text?: string;
  ms?: number;
  url?: string;
};

export function FlowBridge() {
  const [input, setInput] = useState("");
  const [actions, setActions] = useState<FlowAction[]>([]);

  async function generateFlow() {
    const res = await fetch("/api/flow/compile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input }),
    });

    const data = await res.json();
    setActions(data.actions);
  }

  return (
    <div>
      {/* 1. FREE TEXT INPUT */}
      <textarea
        placeholder="Type your idea... (beer cold 3 sec buy 1 get 1)"
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />

      <button onClick={generateFlow}>
        Generate Flow
      </button>

      {/* 2. EDITABLE BLOCKS */}
      <div>
        {actions.map((a, i) => (
          <div key={i}>
            {a.type === "message" && (
              <input
                value={a.text}
                onChange={(e) => {
                  const copy = [...actions];
                  copy[i].text = e.target.value;
                  setActions(copy);
                }}
              />
            )}

            {a.type === "delay" && (
              <input
                type="number"
                value={a.ms}
                onChange={(e) => {
                  const copy = [...actions];
                  copy[i].ms = Number(e.target.value);
                  setActions(copy);
                }}
              />
            )}
          </div>
        ))}
      </div>

      {/* 3. SAVE */}
      <button
        onClick={() =>
          fetch("/flow/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: "QR Flow",
              actions,
            }),
          })
        }
      >
        Save Flow
      </button>
    </div>
  );
}