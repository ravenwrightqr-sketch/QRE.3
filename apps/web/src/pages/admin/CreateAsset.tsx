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
      <h1>Create Asset</h1>

      <input
        placeholder="slug"
        value={slug}
        onChange={(e) => setSlug(e.target.value)}
      />

      <input
        type="number"
        value={priceCents}
        onChange={(e) => setPriceCents(Number(e.target.value))}
      />

      <input
        placeholder="flowId (optional)"
        value={flowId}
        onChange={(e) => setFlowId(e.target.value)}
      />

      <button onClick={create}>Create</button>
    </div>
  );
}