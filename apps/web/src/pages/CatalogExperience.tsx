import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  favoriteCatalogItem,
  getCustomerCatalog,
  getCatalogRecommendations,
  publicCatalogTryFeedback,
} from "../lib/api";

type Product = {
  id: string;
  name: string;
  brand?: string | null;
  category?: string | null;
};

type Recommendation = Product & { score: number };

function visitorKey(slug: string) {
  return `qre-visitor:${slug}`;
}

function getVisitorId(slug: string) {
  const key = visitorKey(slug);
  const existing = localStorage.getItem(key);
  if (existing) return existing;
  const id = crypto.randomUUID();
  localStorage.setItem(key, id);
  return id;
}

export default function CatalogExperience() {
  const { slug = "" } = useParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [selected, setSelected] = useState<Product | null>(null);
  const [feedback, setFeedback] = useState<"positive" | "negative" | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const visitorId = useMemo(() => (slug ? getVisitorId(slug) : ""), [slug]);

  async function load() {
    if (!slug) return;
    setLoading(true);
    try {
      const catalog = await getCustomerCatalog(slug);
      setProducts(catalog.products ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [slug]);

  async function choose(product: Product) {
    if (!slug || !visitorId) return;
    setSelected(product);
    setFeedback(null);
    await favoriteCatalogItem(slug, product.id, visitorId);
    const result = await getCatalogRecommendations(slug, product.id, visitorId);
    setRecommendations(result.recommendations ?? []);
  }

  async function react(reaction: "positive" | "negative") {
    if (!slug || !visitorId || !selected) return;
    setFeedback(reaction);
    await publicCatalogTryFeedback(slug, selected.id, visitorId, reaction);
    const result = await getCatalogRecommendations(slug, selected.id, visitorId);
    setRecommendations(result.recommendations ?? []);
  }

  const visible = products.filter((product) =>
    product.name.toLowerCase().includes(search.trim().toLowerCase()),
  );

  return (
    <main style={page}>
      <div style={content}>
        <header style={header}>
          <h1 style={title}>What are you feeling?</h1>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search"
            aria-label="Search products"
            style={searchInput}
          />
        </header>

        {loading ? (
          <div style={quiet}>Loading…</div>
        ) : (
          <div style={list}>
            {visible.map((product) => (
              <button key={product.id} type="button" onClick={() => void choose(product)} style={row}>
                <span>{product.name.replace(/^Fogger\s+—\s+/i, "")}</span>
                {selected?.id === product.id && <span style={picked}>●</span>}
              </button>
            ))}
          </div>
        )}

        {selected && (
          <section style={trySection} aria-live="polite">
            <div style={chosenLabel}>YOU PICKED</div>
            <div style={chosenName}>{selected.name.replace(/^Fogger\s+—\s+/i, "")}</div>
            <div style={question}>Tried it?</div>
            <div style={feedbackRow}>
              <button
                type="button"
                onClick={() => void react("positive")}
                aria-pressed={feedback === "positive"}
                style={{ ...feedbackButton, ...(feedback === "positive" ? positive : {}) }}
              >
                LIKE
              </button>
              <button
                type="button"
                onClick={() => void react("negative")}
                aria-pressed={feedback === "negative"}
                style={{ ...feedbackButton, ...(feedback === "negative" ? negative : {}) }}
              >
                NOPE
              </button>
            </div>
            {feedback && <div style={thanks}>{feedback === "positive" ? "Got it. I’ll remember that." : "Got it. I’ll steer away from that."}</div>}
          </section>
        )}

        {recommendations.length > 0 && (
          <section style={recommendationSection}>
            <div style={chosenLabel}>YOU MIGHT LIKE</div>
            <div style={recommendationList}>
              {recommendations.slice(0, 8).map((recommendation) => (
                <button key={recommendation.id} type="button" onClick={() => void choose(recommendation)} style={recommendationRow}>
                  {recommendation.name.replace(/^Fogger\s+—\s+/i, "")}
                </button>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

const page: React.CSSProperties = {
  minHeight: "100svh",
  background: "#050505",
  color: "#f5f5f5",
  padding: "24px 16px 56px",
};
const content: React.CSSProperties = { width: "100%", maxWidth: 680, margin: "0 auto" };
const header: React.CSSProperties = { position: "sticky", top: 0, zIndex: 5, background: "#050505", paddingBottom: 18 };
const title: React.CSSProperties = { margin: "8px 0 18px", fontSize: "clamp(28px, 7vw, 42px)", lineHeight: 1, fontWeight: 800 };
const searchInput: React.CSSProperties = { width: "100%", minHeight: 48, border: "0", borderBottom: "1px solid #444", background: "transparent", color: "white", outline: "none", fontSize: 18, padding: "10px 2px" };
const list: React.CSSProperties = { display: "grid" };
const row: React.CSSProperties = { minHeight: 54, padding: "14px 0", display: "flex", alignItems: "center", justifyContent: "space-between", border: 0, borderBottom: "1px solid #202020", background: "transparent", color: "white", fontSize: 20, textAlign: "left", cursor: "pointer" };
const picked: React.CSSProperties = { fontSize: 12, opacity: 0.8 };
const trySection: React.CSSProperties = { marginTop: 34, paddingTop: 28, borderTop: "1px solid #333" };
const chosenLabel: React.CSSProperties = { fontSize: 11, letterSpacing: "0.16em", opacity: 0.55, marginBottom: 8 };
const chosenName: React.CSSProperties = { fontSize: 24, fontWeight: 700 };
const question: React.CSSProperties = { marginTop: 26, fontSize: 17, opacity: 0.8 };
const feedbackRow: React.CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 };
const feedbackButton: React.CSSProperties = { minHeight: 58, border: "1px solid #555", background: "transparent", color: "white", fontWeight: 800, fontSize: 16, cursor: "pointer" };
const positive: React.CSSProperties = { background: "#fff", color: "#000", borderColor: "#fff", transform: "translateY(-1px)" };
const negative: React.CSSProperties = { background: "#171717", borderColor: "#fff", transform: "translateY(-1px)" };
const thanks: React.CSSProperties = { marginTop: 12, fontSize: 14, opacity: 0.75 };
const recommendationSection: React.CSSProperties = { marginTop: 42 };
const recommendationList: React.CSSProperties = { display: "grid" };
const recommendationRow: React.CSSProperties = { padding: "13px 0", border: 0, borderBottom: "1px solid #202020", background: "transparent", color: "white", fontSize: 18, textAlign: "left", cursor: "pointer" };
const quiet: React.CSSProperties = { padding: "40px 0", opacity: 0.6 };
