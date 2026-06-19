import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

export default function AssetDashboard() {
  const { slug } = useParams();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (!slug) return;

    fetch(`/scan/${slug}`)
      .then((r) => r.json())
      .then(setData);
  }, [slug]);

  if (!data) return <div>Loading asset...</div>;

  return (
    <div style={{ padding: 20 }}>
      <h2>Asset: {slug}</h2>

      <div>Access: {data.access}</div>
      <div>Session: {data.sessionId}</div>

      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}