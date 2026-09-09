import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  favoriteCatalogItem,
  getCatalogRecommendations,
  getCustomerCatalog,
  recordCatalogTryFeedback,
} from "../lib/api";

type Product = {
  id: string;
  name: string;
  brand?: string | null;
  category?: string | null;
  description?: string | null;
};

function visitorKey(slug: string) {
  return `qre-visitor:${slug}`;
}

function getVisitorId(slug: string) {
  const key = visitorKey(slug);
  const existing = localStorage.getItem(key);
  if (existing) return existing;
  const id = `visitor-${crypto.randomUUID()}`;
  localStorage.setItem(key, id);
  return id;
}

export default function CustomerCatalog() {
  const { slug = "" } = useParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [favoriteId, setFavoriteId] = useState("");
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [feedbackIds, setFeedbackIds] = useState<Record<string, "positive" | "negative">>({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const visitorId = useMemo(() => (slug ? getVisitorId(slug) : ""), [slug]);

  async function loadRecommendations(itemId: string) {
    if (!slug || !visitorId) return;
    const result = await getCatalogRecommendations(slug, itemId, visitorId);
    setRecommendations(result.recommendations.map((entry: any) => entry.item));
  }

  useEffect(() => {
    if (!slug) return;
    getCustomerCatalog(slug)
      .then((result) => setProducts(result.products ?? []))
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load catalog."));
  }, [slug]);

  const visibleProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return products;
    return products.filter((product) =>
      [product.name, product.brand, product.category, product.description]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [products, search]);

  async function chooseFavorite(product: Product) {
    if (!slug || !visitorId) return;
    setFavoriteId(product.id);
    setMessage("");
    setError("");
    try {
      await favoriteCatalogItem(slug, product.id, visitorId);
      await loadRecommendations(product.id);
      setMessage(`You picked ${product.name}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your choice.");
    }
  }

  async function react(product: Product, reaction: "positive" | "negative") {
    if (!slug || !visitorId) return;
    setError("");
    try {
      await recordCatalogTryFeedback(slug, product.id, visitorId, reaction);
      setFeedbackIds((current) => ({ ...current, [product.id]: reaction }));
      await loadRecommendations(favoriteId || product.id);
      setMessage(reaction === "positive" ? "Got it. We’ll lean toward things like that." : "Got it. We’ll back away from things like that.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save that reaction.");
    }
  }

  return (
    <main style={pageStyle}>
      <header style={headerStyle}>
        <div>
          <div style={eyebrow}>QRE CATALOG</div>
          <h1 style={titleStyle}>What’s here</h1>
          <div style={countStyle}>{products.length} products</div>
        </div>
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search"
          aria-label="Search products"
          style={searchStyle}
        />
      </header>

      {error && <p style={errorStyle}>{error}</p>}
      {message && <p style={messageStyle}>{message}</p>}

      {recommendations.length > 0 && (
        <section style={recommendationSection}>
          <div style={sectionLabel}>YOU MIGHT LIKE</div>
          <div style={recommendationList}>
            {recommendations.slice(0, 8).map((product) => (
              <button key={product.id} type="button" style={recommendationButton} onClick={() => void chooseFavorite(product)}>
                {displayName(product.name)}
              </button>
            ))}
          </div>
        </section>
      )}

      <section aria-label="Available products">
        {visibleProducts.map((product) => {
          const reaction = feedbackIds[product.id];
          return (
            <article key={product.id} style={rowStyle}>
              <button
                type="button"
                onClick={() => void chooseFavorite(product)}
                style={{ ...nameButton, ...(favoriteId === product.id ? selectedNameButton : {}) }}
              >
                {displayName(product.name)}
              </button>
              <div style={detailLine}>{[product.brand, product.category].filter(Boolean).join(" · ")}</div>
              {favoriteId === product.id && (
                <div style={feedbackRow} aria-label="Tell QRE what you thought">
                  <span style={feedbackPrompt}>Tried it?</span>
                  <button type="button" onClick={() => void react(product, "positive")} style={feedbackButton} aria-pressed={reaction === "positive"}>LIKE</button>
                  <button type="button" onClick={() => void react(product, "negative")} style={feedbackButton} aria-pressed={reaction === "negative"}>NOPE</button>
                </div>
              )}
            </article>
          );
        })}
      </section>
    </main>
  );
}

function displayName(name: string) {
  return name.replace(/^Fogger\s+—\s+/i, "");
}

const pageStyle = {
  minHeight: "100vh",
  background: "#050505",
  color: "#f5f5f5",
  padding: "28px 20px 80px",
  fontFamily: "Inter, system-ui, sans-serif",
};
const headerStyle = { maxWidth: 760, margin: "0 auto 30px", display: "flex", justifyContent: "space-between", alignItems: "end", gap: 20, flexWrap: "wrap" as const };
const eyebrow = { fontSize: 11, letterSpacing: "0.18em", opacity: 0.55 };
const titleStyle = { margin: "7px 0 3px", fontSize: 36, lineHeight: 1, fontWeight: 700 };
const countStyle = { fontSize: 13, opacity: 0.5 };
const searchStyle = { width: 220, maxWidth: "100%", padding: "11px 0", border: "none", borderBottom: "1px solid #555", background: "transparent", color: "white", outline: "none" };
const recommendationSection = { maxWidth: 760, margin: "0 auto 34px", paddingBottom: 24, borderBottom: "1px solid #252525" };
const sectionLabel = { fontSize: 11, letterSpacing: "0.16em", opacity: 0.5, marginBottom: 12 };
const recommendationList = { display: "grid", gap: 5 };
const recommendationButton = { textAlign: "left" as const, border: "none", background: "transparent", color: "#8cff00", padding: "4px 0", fontSize: 17, cursor: "pointer" };
const rowStyle = { maxWidth: 760, margin: "0 auto", padding: "12px 0 15px", borderBottom: "1px solid #171717" };
const nameButton = { border: "none", background: "transparent", color: "white", padding: 0, fontSize: 18, fontWeight: 650, cursor: "pointer", textAlign: "left" as const };
const selectedNameButton = { color: "#8cff00" };
const detailLine = { marginTop: 3, fontSize: 12, opacity: 0.45 };
const feedbackRow = { display: "flex", alignItems: "center", gap: 8, marginTop: 10 };
const feedbackPrompt = { fontSize: 12, opacity: 0.55, marginRight: 4 };
const feedbackButton = { border: "none", borderBottom: "1px solid #555", background: "transparent", color: "white", padding: "3px 7px", fontSize: 11, letterSpacing: "0.1em", cursor: "pointer" };
const errorStyle = { maxWidth: 760, margin: "0 auto 16px", color: "#ff7676", fontSize: 13 };
const messageStyle = { maxWidth: 760, margin: "0 auto 16px", color: "#8cff00", fontSize: 13 };
