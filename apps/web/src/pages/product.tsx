import { useParams } from "react-router-dom";
import { apiPost }from"../lib/api";

export default function Product() {
  const { slug } = useParams();

  async function buy() {
    if (!slug) return;

    const data = await apiPost(`/checkout/${slug}`, {
      plan: "base",
    });

    window.location.href = data.url;
  }

  return (
    <div>
      <h1>{slug}</h1>
      <button onClick={buy}>Buy</button>
    </div>
  );
}