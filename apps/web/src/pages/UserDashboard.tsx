import { useEffect, useState } from "react";
import { apiGet } from "./../lib/api";

type Asset = {
  id: string;
  slug: string;
  status: string;
  flowId: string | null;
};

export default function UserDashboard() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        setError(null);

        const res = await apiGet("/api/user/assets");

        const normalized: Asset[] = Array.isArray(res)
          ? res
          : res?.assets ?? [];

        if (!alive) return;

        setAssets(normalized);
      } catch (err: any) {
        if (!alive) return;
        setError(err?.message || "Failed to load assets");
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();

    return () => {
      alive = false;
    };
  }, []);

  if (loading) {
    return <div style={{ padding: 30 }}>⚡ Loading your Empire...</div>;
  }

  if (error) {
    return <div style={{ padding: 30, color: "red" }}>{error}</div>;
  }

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: 30 }}>
      <h1>⚡ Your Empire</h1>

      <p style={{ opacity: 0.7 }}>
        Manage every QR experience you own.
      </p>

      {assets.length === 0 && (
        <div
          style={{
            marginTop: 40,
            padding: 30,
            border: "1px solid #333",
            borderRadius: 12,
          }}
        >
          <h3>No assets yet.</h3>
          <a href="/store">Buy your first keychain →</a>
        </div>
      )}

      <div style={{ display: "grid", gap: 20, marginTop: 30 }}>
        {assets.map((asset) => {
          const scanUrl = `/scan/${asset.slug}`;

          return (
            <div
              key={asset.id}
              style={{
                border: "1px solid #333",
                borderRadius: 14,
                padding: 20,
                background: "#111",
                color: "#fff",
              }}
            >
              <h3>{asset.slug}</h3>

              <div>Status: {asset.status}</div>
              <div>Flow: {asset.flowId ?? "No flow"}</div>

              <div
                style={{
                  marginTop: 10,
                  opacity: 0.7,
                  fontSize: 12,
                  wordBreak: "break-all",
                }}
              >
                {scanUrl}
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
                <a href={`/asset/${asset.slug}`}>
                  <button>Manage</button>
                </a>

                <button onClick={() => navigator.clipboard.writeText(scanUrl)}>
                  Copy QR
                </button>

                <a href={`/analytics/${asset.slug}`}>
                  <button>Analytics</button>
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}