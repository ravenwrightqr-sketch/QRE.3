import { useEffect, useState } from "react";
import { apiGet } from "../../lib/api";

type Asset = {
  id: string;
  slug: string;
  priceCents: number;
  status: string;
  flowId: string | null;
};

const PUBLIC_SCAN_URL =
  import.meta.env.VITE_PUBLIC_SCAN_URL || "https://qre.ink";

export default function AdminDashboard() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadAssets() {
      try {
        setLoading(true);

        const data = await apiGet("/api/user/assets")

        setAssets(data);
      } catch (err: any) {
        console.error(err);
        setError("Failed loading assets");
      } finally {
        setLoading(false);
      }
    }

    loadAssets();
  }, []);

  async function copyLink(slug: string) {
    const url = `${PUBLIC_SCAN_URL}/scan/${slug}`;

    await navigator.clipboard.writeText(url);

    alert("QR link copied");
  }

  return (
    <div
      style={{
        padding: 24,
        maxWidth: 1100,
        margin: "0 auto",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 30,
        }}
      >
        <div>
          <h1>⚡ QRE Admin</h1>
          <p style={{ opacity: 0.7 }}>
            Manage products, QR assets, and flows
          </p>
        </div>

        <a
          href="/admin/create"
          style={{
            padding: "12px 18px",
            border: "1px solid #00ff99",
            borderRadius: 10,
            textDecoration: "none",
          }}
        >
          + Create Asset
        </a>
      </div>

      {loading && <div>Loading assets...</div>}

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

      {!loading && assets.length === 0 && (
        <div>No assets created yet.</div>
      )}

      {!loading &&
        assets.map((asset) => (
          <div
            key={asset.id}
            style={{
              border: "1px solid #333",
              borderRadius: 14,
              padding: 20,
              marginBottom: 20,
            }}
          >
            <h3>{asset.slug}</h3>

            <div>Status: {asset.status}</div>

            <div>
              Price: ${(asset.priceCents / 100).toFixed(2)}
            </div>

            <div>
              Flow: {asset.flowId || "No flow attached"}
            </div>

            <div style={{ marginTop: 10 }}>
              <code>
                {PUBLIC_SCAN_URL}/scan/{asset.slug}
              </code>
            </div>

            <div
              style={{
                display: "flex",
                gap: 10,
                marginTop: 15,
              }}
            >
              <button onClick={() => copyLink(asset.slug)}>
                Copy QR Link
              </button>

              <a href={`/admin/edit/${asset.id}`}>
                <button>Edit</button>
              </a>

              <a href={`/admin/assets/${asset.slug}`}>
                <button>Open Dashboard</button>
              </a>
            </div>
          </div>
        ))}
    </div>
  );
}