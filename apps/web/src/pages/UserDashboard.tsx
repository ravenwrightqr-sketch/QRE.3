import { useEffect, useState } from "react";

type Asset = {
  id: string;
  slug: string;
  status: string;
  flowId: string | null;
};

export default function UserDashboard() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/admin/assets") // (we wire backend next)
      .then((r) => r.json())
      .then(setAssets)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading dashboard...</div>;

  return (
    <div style={{ padding: 20 }}>
      <h2>⚡ Your Assets</h2>

      {assets.map((a) => (
        <div
          key={a.id}
          style={{
            padding: 10,
            marginBottom: 10,
            border: "1px solid #333",
          }}
        >
          <div><b>{a.slug}</b></div>
          <div>Status: {a.status}</div>

          <a href={`/asset/${a.slug}`}>Open</a>
        </div>
      ))}
    </div>
  );
}