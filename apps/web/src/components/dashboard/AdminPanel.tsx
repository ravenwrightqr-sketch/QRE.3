import { useEffect, useState } from "react";
import { apiGet, apiPost } from "../../lib/api";

export default function AdminPanel() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadState() {
      try {
        const data = await apiGet("api/admin/status");
        setEnabled(Boolean(data.enabled));
      } catch (err) {
        console.error(err);
        setError("Unable to load admin status");
      }
    }

    loadState();
  }, []);

  async function toggle() {
    setLoading(true);
    setError("");

    try {
      const data = await apiPost("api/admin/toggle", {
        enabled: !enabled,
      });

      setEnabled(Boolean(data.enabled));
    } catch (err: any) {
      console.error(err);
      setError("Failed to update admin mode");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      marginTop: 20,
      padding: 20,
      border: "1px solid #333",
      borderRadius: 10,
    }}>
      <h3>🔥 Admin Mode</h3>

      <div style={{
        marginBottom: 12,
        color: enabled ? "#0f0" : "#999",
      }}>
        Current Status: {enabled ? "ENABLED" : "DISABLED"}
      </div>

      <button
        onClick={toggle}
        disabled={loading}
        style={{
          padding: "10px 16px",
          borderRadius: 8,
          cursor: loading ? "not-allowed" : "pointer",
          background: enabled ? "#b00020" : "#222",
          color: "#fff",
          border: "none",
        }}
      >
        {loading
          ? "Updating..."
          : enabled
          ? "Disable Admin Mode"
          : "Enable Admin Mode"}
      </button>

      {error && (
        <div style={{ marginTop: 10, color: "#ff4444" }}>
          {error}
        </div>
      )}
    </div>
  );
}