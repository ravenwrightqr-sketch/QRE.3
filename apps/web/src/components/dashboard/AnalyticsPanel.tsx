import { useEffect, useState } from "react";

export default function AnalyticsPanel({ assetId }: { assetId: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!assetId) return;

    setLoading(true);

    fetch(`/analytics/${assetId}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [assetId]);

  if (!assetId) return <div>Select an asset</div>;

  if (loading) return <div>Loading analytics...</div>;

  if (!data) return <div>No analytics yet</div>;

  return (
    <div style={{ marginTop: 20 }}>
      <h3>📊 Analytics</h3>

      <div>Scans: {data.scans ?? 0}</div>
      <div>Sessions: {data.sessions ?? 0}</div>
      <div>Conversion: {data.conversionRate ?? 0}%</div>
    </div>
  );
}