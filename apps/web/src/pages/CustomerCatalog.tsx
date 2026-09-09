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

function displayName(name: string) {
  return name.replace(/^Fogger\s+—\s+/i, "");
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
    setRecommendations((result.recommendations ?? []).map((entry: any) => entry.item));
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save that reaction.");
    }
  }

  return (
    <main style={pageStyle}>
      <header style={headerStyle}>
        <h1 style={titleStyle}>What’s here</h1>
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
        <section style={recommendationSection} aria-label="You might like">
          <div style={sectionLabel}>YOU MIGHT LIKE</div>
          <div style={recommendationList}>
            {recommendations.map((product) => (
              <button key={product.id} type="button" style={recommendationButton} onClick={() => void chooseFavorite(product)}>
                {displayName(product.name)}
              </button>
            ))}
          </div>
        </section>
      )}

      <section aria-label="Available products" style={productList}>
        {visibleProducts.map((product) => {
          const reaction = feedbackIds[product.id];
          const selected = favoriteId === product.id;
          return (
            <div key={product.id} style={rowStyle}>
              <button
                type="button"
                onClick={() => void chooseFavorite(product)}
                aria-pressed={selected}
                style={{ ...nameButton, ...(selected ? selectedNameButton : {}) }}
              >
                {displayName(product.name)}
              </button>

              {selected && (
                <div style={feedbackRow} aria-label="Tell QRE what you thought">
                  <span style={feedbackPrompt}>Tried it?</span>
                  <button
                    type="button"
                    onClick={() => void react(product, "positive")}
                    aria-pressed={reaction === "positive"}
                    style={{ ...feedbackButton, ...(reaction === "positive" ? likeSelected : {}) }}
                  >
                    LIKE
                  </button>
                  <button
                    type="button"
                    onClick={() => void react(product, "negative")}
                    aria-pressed={reaction === "negative"}
                    style={{ ...feedbackButton, ...(reaction === "negative" ? nopeSelected : {}) }}
                  >
                    NOPE
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </section>
    </main>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100svh",
  background: "#050505",
  color: "#f5f5f5",
  padding: "max(18px, env(safe-area-inset-top)) 18px calc(48px + env(safe-area-inset-bottom))",
  fontFamily: "Inter, system-ui, sans-serif",
};
const headerStyle: React.CSSProperties = {
  position: "sticky",
  top: 0,
  zIndex: 10,
  width: "100%",
  maxWidth: 680,
  margin: "0 auto",
  padding: "10px 0 18px",
  background: "#050505",
};
const titleStyle: React.CSSProperties = { margin: "0 0 16px", fontSize: "clamp(30px, 9vw, 44px)", lineHeight: 0.95, fontWeight: 800 };
const searchStyle: React.CSSProperties = { width: "100%", minHeight: 48, boxSizing: "border-box", padding: "10px 0", border: "none", borderBottom: "1px solid #444", background: "transparent", color: "white", outline: "none", fontSize: 18, borderRadius: 0 };
const recommendationSection: React.CSSProperties = { width: "100%", maxWidth: 680, margin: "8px auto 30px", padding: "0 0 22px", borderBottom: "1px solid #252525" };
const sectionLabel: React.CSSProperties = { fontSize: 11, letterSpacing: "0.16em", opacity: 0.5, marginBottom: 10 };
const recommendationList: React.CSSProperties = { display: "grid" };
const recommendationButton: React.CSSProperties = { minHeight: 46, padding: "8px 0", border: 0, borderBottom: "1px solid #151515", background: "transparent", color: "#8cff00", fontSize: 18, textAlign: "left", cursor: "pointer" };
const productList: React.CSSProperties = { width: "100%", maxWidth: 680, margin: "0 auto" };
const rowStyle: React.CSSProperties = { padding: "14px 0 16px", borderBottom: "1px solid #1b1b1b" };
const nameButton: React.CSSProperties = { width: "100%", minHeight: 44, border: 0, background: "transparent", color: "white", padding: 0, fontSize: "clamp(18px, 5vw, 21px)", fontWeight: 650, cursor: "pointer", textAlign: "left" };
const selectedNameButton: React.CSSProperties = { color: "#8cff00" };
const feedbackRow: React.CSSProperties = { display: "grid", gridTemplateColumns: "auto minmax(88px, 1fr) minmax(88px, 1fr)", gap: 8, alignItems: "center", marginTop: 10 };
const feedbackPrompt: React.CSSProperties = { fontSize: 13, opacity: 0.55 };
const feedbackButton: React.CSSProperties = { minHeight: 48, border: "1px solid #444", background: "#0b0b0b", color: "white", fontSize: 13, letterSpacing: "0.12em", fontWeight: 800, cursor: "pointer", WebkitTapHighlightColor: "transparent" };
const likeSelected: React.CSSProperties = { background: "#8cff00", color: "#000", borderColor: "#8cff00" };
const nopeSelected: React.CSSProperties = { background: "#2b1515", color: "#ff8a8a", borderColor: "#ff8a8a" };
const errorStyle: React.CSSProperties = { width: "100%", maxWidth: 680, margin: "0 auto 14px", color: "#ff7676", fontSize: 13 };
const messageStyle: React.CSSProperties = { width: "100%", maxWidth: 680, margin: "0 auto 14px", color: "#8cff00", fontSize: 13 };
