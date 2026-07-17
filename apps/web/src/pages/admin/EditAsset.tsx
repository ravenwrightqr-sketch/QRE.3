import { useEffect, useState } from "react";
import { apiGet, apiPut } from "../../lib/api";
import { useParams, useNavigate } from "react-router-dom";

export default function EditAsset() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [priceCents, setPriceCents] = useState(0);
  const [flowId, setFlowId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await apiGet(`/admin/assets/${slug}`);

        setPriceCents(data.priceCents ?? 0);
        setFlowId(data.flowId ?? "");
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }

    if (slug) load();
  }, [slug]);

  async function save() {
    try {
      await apiPut(`/admin/assets/${slug}`, {
        priceCents,
        flowId: flowId || null,
      });

      navigate("/admin");
    } catch (e) {
      console.error("Update failed", e);
      alert("Update failed");
    }
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div style={{ padding: 20 }}>
      <h1>Edit Keychain</h1>

      <input
        type="number"
        value={priceCents}
        onChange={(e) => setPriceCents(Number(e.target.value))}
        placeholder="price"
      />

      <br />

      <input
        value={flowId}
        onChange={(e) => setFlowId(e.target.value)}
        placeholder="flowId"
      />

      <br />

      <button onClick={save}>Save</button>
    </div>
  );
}