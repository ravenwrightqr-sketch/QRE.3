import { useState } from "react";

export default function CreateAsset() {
  const [slug, setSlug] = useState("");
  const [priceCents, setPriceCents] = useState(299);
  const [flowId, setFlowId] = useState("");

  const create = async () => {
    await fetch("http://localhost:3000/admin/assets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug,
        priceCents,
        flowId: flowId || null,
      }),
    });

    window.location.href = "/admin";
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Create Keychain</h1>

      <input
        placeholder="slug (e.g. killer-queen)"
        value={slug}
        onChange={(e) => setSlug(e.target.value)}
      />

      <br />

      <input
        type="number"
        placeholder="price in cents"
        value={priceCents}
        onChange={(e) => setPriceCents(Number(e.target.value))}
      />

      <br />

      <input
        placeholder="flowId (optional)"
        value={flowId}
        onChange={(e) => setFlowId(e.target.value)}
      />

      <br />

      <button onClick={create}>Create</button>
    </div>
  );
}