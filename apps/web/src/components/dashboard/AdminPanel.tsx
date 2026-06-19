import { useState } from "react";

export default function AdminPanel() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    const next = !enabled;
    setEnabled(next);

    setLoading(true);

    try {
      await fetch("/admin/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: next }),
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ marginTop: 20 }}>
      <h3>🔥 Admin Weapon Mode</h3>

      <button
        onClick={toggle}
        disabled={loading}
        style={{
          padding: 10,
          background: enabled ? "red" : "black",
          color: "white",
        }}
      >
        {loading ? "Working..." : enabled ? "ADMIN ON" : "ADMIN OFF"}
      </button>
    </div>
  );
}