import { useEffect, useState } from "react";
import { apiGet, apiPost } from "../lib/api";

type Product = {
  id: string;
  slug: string;
  priceCents: number;
};

export default function Store() {
  const [products, setProducts] = useState<Product[]>([]);

  /**
   * =========================
   * LOAD PRODUCTS
   * =========================
   */
useEffect(() => {
  setProducts([]);
}, []);

  /**
   * =========================
   * CHECKOUT FLOW
   * =========================
   */
  const buy = async (assetId: string) => {
    try {
  const data = await apiPost("/api/checkout", {
  slug: assetId,
});

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Checkout failed:", err);
    }
  };

  return (
    <div>
      <h1>QRE Store</h1>

      {products.map((p) => (
        <div key={p.id}>
          <h3>{p.slug}</h3>
          <p>${(p.priceCents / 100).toFixed(2)}</p>

          <button onClick={() => buy(p.id)}>
            Buy Unlock
          </button>
        </div>
      ))}
    </div>
  );
}