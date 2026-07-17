import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiGet } from "../lib/api";

export default function AssetDashboard() {
  const { slug } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;

    setLoading(true);

    apiGet(`/api/scan/${slug}`)
      .then((res) => setData(res))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div>Loading asset...</div>;
  if (!data) return <div>No asset found</div>;

  return (
    <div style={{ padding: 20 }}>
      <h2>Asset: {slug}</h2>

      <div>
        Access: <b>{data.access}</b>
      </div>

      <div>
        Session: <code>{data.sessionId}</code>
      </div>

      <div>
        Flow: {data.flowId ?? "none"}
      </div>

      <div style={{ marginTop: 20 }}>
        <h4>Teaser Debug</h4>
        <pre>{JSON.stringify(data.teaser, null, 2)}</pre>
      </div>

      <div style={{ marginTop: 20, opacity: 0.6 }}>
        <pre>{JSON.stringify(data, null, 2)}</pre>
      </div>
    </div>
  );
}