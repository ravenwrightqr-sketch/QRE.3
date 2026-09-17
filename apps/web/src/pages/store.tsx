import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiGet } from "../lib/api";
import { useAuth } from "../components/auth/authContext";

type Product = {
  id: string;
  slug: string;
  displayName: string;
  priceCents: number;
};

export default function Store() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { isAuthed } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await apiGet("/api/product/available");
        if (!cancelled) setProducts(data?.products ?? []);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to load QRE inventory");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const buy = (slug: string) => {
    if (!isAuthed) {
      navigate(`/login?next=${encodeURIComponent(`/checkout/${slug}`)}`);
      return;
    }
    navigate(`/checkout/${slug}`);
  };

  return (
    <main style={page}>
      <header style={header}>
        <Link to="/" style={logo}>QRE</Link>
        <nav style={nav}>
          <Link to="/store" style={navLink}>Shop</Link>
          {isAuthed ? (
            <Link to="/dashboard" style={navLink}>Dashboard</Link>
          ) : (
            <Link to="/login" style={navLink}>Sign in</Link>
          )}
        </nav>
      </header>

      <section style={hero}>
        <p style={eyebrow}>PHYSICAL IDENTITY · DIGITAL CONTROL</p>
        <h1 style={title}>Give a QR something<br />worth scanning.</h1>
        <p style={lede}>
          QRE physical pieces connect a real object to an experience you control.
          Change what it does later without replacing the piece.
        </p>
      </section>

      <section style={section}>
        <div style={sectionHeading}>
          <div>
            <p style={eyebrow}>AVAILABLE NOW</p>
            <h2 style={sectionTitle}>QRE physical pieces</h2>
          </div>
          <span style={inventory}>{products.length} available</span>
        </div>

        {loading && <div style={state}>Loading available pieces…</div>}
        {error && <div style={state}>Inventory is temporarily unavailable. Please try again.</div>}
        {!loading && !error && products.length === 0 && (
          <div style={empty}>
            <h3 style={emptyTitle}>Inventory is being prepared.</h3>
            <p style={emptyText}>Create retail inventory from the QRE admin panel, then it will appear here automatically.</p>
            <Link to="/login" style={button}>Open QRE</Link>
          </div>
        )}

        <div style={grid}>
          {products.map((product) => (
            <article key={product.id} style={card}>
              <div style={productVisual} aria-hidden="true">
                <div style={qrMark}>
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                </div>
              </div>
              <div style={cardBody}>
                <p style={cardEyebrow}>QRE · ONE-TIME</p>
                <h3 style={productName}>{product.displayName}</h3>
                <p style={productDescription}>Owner-controlled QR identity with a dynamic digital destination.</p>
                <div style={cardFooter}>
                  <strong style={price}>${(product.priceCents / 100).toFixed(2)}</strong>
                  <button type="button" onClick={() => buy(product.slug)} style={button}>
                    {isAuthed ? "Buy now" : "Sign in to buy"}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section style={howSection}>
        <p style={eyebrow}>HOW QRE WORKS</p>
        <div style={steps}>
          <div><b>01</b><span>Buy a physical QRE piece.</span></div>
          <div><b>02</b><span>Claim and configure it from your account.</span></div>
          <div><b>03</b><span>People scan it and reach the experience you choose.</span></div>
        </div>
      </section>

      <footer style={footer}>QRE · Physical identity with a living digital layer.</footer>
    </main>
  );
}

const page: React.CSSProperties = {
  minHeight: "100vh",
  background: "#050608",
  color: "#f4f6f8",
  fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
};
const header: React.CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "24px clamp(20px, 5vw, 72px)", borderBottom: "1px solid rgba(255,255,255,.08)" };
const logo: React.CSSProperties = { color: "#fff", textDecoration: "none", fontWeight: 900, letterSpacing: 5, fontSize: 18 };
const nav: React.CSSProperties = { display: "flex", gap: 24 };
const navLink: React.CSSProperties = { color: "rgba(255,255,255,.7)", textDecoration: "none", fontSize: 14 };
const hero: React.CSSProperties = { maxWidth: 1000, margin: "0 auto", padding: "clamp(80px, 12vw, 150px) 24px 100px" };
const eyebrow: React.CSSProperties = { margin: 0, color: "#00e5a0", fontSize: 11, fontWeight: 800, letterSpacing: 3 };
const title: React.CSSProperties = { margin: "18px 0 24px", fontSize: "clamp(48px, 8vw, 92px)", lineHeight: .96, letterSpacing: -5, fontWeight: 850 };
const lede: React.CSSProperties = { maxWidth: 650, margin: 0, color: "rgba(255,255,255,.62)", fontSize: "clamp(17px, 2vw, 21px)", lineHeight: 1.55 };
const section: React.CSSProperties = { maxWidth: 1200, margin: "0 auto", padding: "0 24px 110px" };
const sectionHeading: React.CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "end", gap: 20, marginBottom: 28 };
const sectionTitle: React.CSSProperties = { margin: "8px 0 0", fontSize: 32, letterSpacing: -1 };
const inventory: React.CSSProperties = { color: "rgba(255,255,255,.45)", fontSize: 13 };
const grid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 };
const card: React.CSSProperties = { overflow: "hidden", border: "1px solid rgba(255,255,255,.1)", borderRadius: 24, background: "rgba(255,255,255,.035)" };
const productVisual: React.CSSProperties = { height: 230, display: "grid", placeItems: "center", background: "radial-gradient(circle at center, rgba(0,229,160,.12), transparent 55%)" };
const qrMark: React.CSSProperties = { width: 116, height: 116, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, padding: 8, border: "8px solid #f4f6f8", background: "#050608" };
const cardBody: React.CSSProperties = { padding: 24 };
const cardEyebrow: React.CSSProperties = { margin: 0, fontSize: 9, letterSpacing: 2.5, color: "#00e5a0", fontWeight: 800 };
const productName: React.CSSProperties = { margin: "10px 0 8px", fontSize: 24 };
const productDescription: React.CSSProperties = { minHeight: 48, margin: 0, color: "rgba(255,255,255,.52)", lineHeight: 1.5, fontSize: 14 };
const cardFooter: React.CSSProperties = { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, marginTop: 24 };
const price: React.CSSProperties = { fontSize: 24 };
const button: React.CSSProperties = { display: "inline-flex", alignItems: "center", justifyContent: "center", border: 0, borderRadius: 999, padding: "12px 18px", background: "#f4f6f8", color: "#050608", fontWeight: 800, textDecoration: "none", cursor: "pointer" };
const state: React.CSSProperties = { padding: 24, border: "1px solid rgba(255,255,255,.1)", borderRadius: 18, color: "rgba(255,255,255,.55)" };
const empty: React.CSSProperties = { padding: 40, border: "1px solid rgba(255,255,255,.1)", borderRadius: 24, background: "rgba(255,255,255,.025)" };
const emptyTitle: React.CSSProperties = { margin: "0 0 8px", fontSize: 24 };
const emptyText: React.CSSProperties = { maxWidth: 620, margin: "0 0 22px", color: "rgba(255,255,255,.55)", lineHeight: 1.5 };
const howSection: React.CSSProperties = { maxWidth: 1200, margin: "0 auto", padding: "70px 24px", borderTop: "1px solid rgba(255,255,255,.08)" };
const steps: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginTop: 28 };
const footer: React.CSSProperties = { padding: "36px 24px 60px", textAlign: "center", color: "rgba(255,255,255,.32)", fontSize: 12 };

// Keep the QR-inspired visual purely decorative; the actual asset QR is served by the scan system.
void qrMark;
