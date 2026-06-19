import { useEffect, useState } from "react";

export default function AdminDashboard() {
  const [assets, setAssets] = useState<any[]>([]);

  useEffect(() => {
    fetch("http://localhost:3000/admin/assets")
      .then((r) => r.json())
      .then(setAssets);
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1>Admin Panel - QRE</h1>

      <a href="/admin/new">+ Create Asset</a>

      <hr />

      {assets.map((a) => (
        <div key={a.id} style={{ marginBottom: 20 }}>
          <h3>{a.slug}</h3>

          <p>Price: ${(a.priceCents / 100).toFixed(2)}</p>
          <p>Status: {a.status}</p>

          <p>Flow: {a.flowId ?? "none"}</p>

          <p>
            QR Link:{" "}
            <code>
              http://localhost:3000/scan/{a.slug}
            </code>
          </p>

          <button
            onClick={() =>
              navigator.clipboard.writeText(
                `http://localhost:3000/scan/${a.slug}`
              )
            }
          >
            Copy QR Link
          </button>
        </div>
      ))}
    </div>
  );
}