import { useEffect, useState } from "react";

export default function Store() {
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    fetch("http://localhost:3000/store")
      .then((r) => r.json())
      .then(setProducts);
  }, []);

  const buy = async (slug: string) => {
    const res = await fetch("http://localhost:3000/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug }),
    });

    const data = await res.json();

    window.location.href = data.url;
  };

  return (
    <div>
      <h1>QRE Store</h1>

      {products.map((p) => (
        <div key={p.id}>
          <h3>{p.slug}</h3>
          <p>${(p.priceCents / 100).toFixed(2)}</p>

          <button onClick={() => buy(p.slug)}>
            Buy Unlock
          </button>
        </div>
      ))}
    </div>
  );
}