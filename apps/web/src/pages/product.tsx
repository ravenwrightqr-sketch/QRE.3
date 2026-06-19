import { useParams } from "react-router-dom";

const API = "http://localhost:3000";

export default function Product() {
  const { slug } = useParams<{ slug: string }>();

  async function buy() {
    if (!slug) return;

    const res = await fetch(`${API}/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug,
        plan: "base",
      }),
    });

    const data = await res.json();
    window.location.href = data.url;
  }

  if (!slug) {
    return <div>Missing product slug</div>;
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Keychain: {slug}</h1>

      <p>Unlock your Empire QR experience</p>

      <button onClick={buy}>
        Buy & Unlock
      </button>
    </div>
  );
}