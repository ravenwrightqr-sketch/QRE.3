import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiPost } from "../../lib/api";

export default function CreateAsset() {
  const navigate = useNavigate();

  const [slug, setSlug] = useState("");
  const [priceCents, setPriceCents] = useState(999);
  const [flowId, setFlowId] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function create() {
    setError("");

    if (!slug.trim()) {
      setError("Slug is required");
      return;
    }

    try {
      setLoading(true);

      await apiPost("/admin/assets", {
        slug: slug
          .trim()
          .toLowerCase()
          .replace(/\s+/g, "-"),

        priceCents,
        flowId: flowId || null,
      });

      navigate("/admin");
    } catch (err: any) {
      console.error(err);

      setError(
        err.message || "Failed creating asset"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        maxWidth: 650,
        margin: "0 auto",
        padding: 30,
      }}
    >
      <h1>⚡ Create QR Asset</h1>

      <p style={{ opacity: 0.7 }}>
        Create a new physical or digital QR product.
      </p>

      <div style={{ marginTop: 30 }}>
        <label>Slug</label>

        <input
          placeholder="killer-queen"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          style={{
            width: "100%",
            padding: 12,
            marginTop: 6,
            marginBottom: 20,
          }}
        />

        <label>Unlock Price (cents)</label>

        <input
          type="number"
          value={priceCents}
          onChange={(e) =>
            setPriceCents(Number(e.target.value))
          }
          style={{
            width: "100%",
            padding: 12,
            marginTop: 6,
            marginBottom: 20,
          }}
        />

        <label>Flow ID (optional)</label>

        <input
          placeholder="flow_cuid"
          value={flowId}
          onChange={(e) => setFlowId(e.target.value)}
          style={{
            width: "100%",
            padding: 12,
            marginTop: 6,
            marginBottom: 20,
          }}
        />

        {error && (
          <div
            style={{
              color: "red",
              marginBottom: 20,
            }}
          >
            {error}
          </div>
        )}

        <button
          onClick={create}
          disabled={loading}
          style={{
            width: "100%",
            padding: 14,
          }}
        >
          {loading
            ? "Creating Asset..."
            : "Create Asset"}
        </button>
      </div>
    </div>
  );
}