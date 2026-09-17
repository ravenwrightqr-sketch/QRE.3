import { Link } from "react-router-dom";
import type { CSSProperties } from "react";
import { useAuth } from "../components/auth/authContext";

export default function Home() {
  const { isAuthed } = useAuth();

  return (
    <main style={page}>
      <header style={header}>
        <Link to="/" style={logo}>QRE</Link>
        <nav style={nav}>
          <Link to="/store" style={navLink}>Shop</Link>
          <Link to={isAuthed ? "/dashboard" : "/login"} style={navLink}>
            {isAuthed ? "Dashboard" : "Sign in"}
          </Link>
        </nav>
      </header>

      <section style={hero}>
        <p style={eyebrow}>PHYSICAL IDENTITY · LIVING DIGITAL LAYER</p>
        <h1 style={title}>Your physical world<br />can stay connected.</h1>
        <p style={lede}>
          QRE turns a physical QR piece into an owner-controlled digital identity.
          What it opens can change without replacing the piece.
        </p>
        <div style={actions}>
          <Link to="/store" style={primary}>Shop QRE</Link>
          <Link to={isAuthed ? "/dashboard" : "/login"} style={secondary}>
            {isAuthed ? "Open dashboard" : "Create your account"}
          </Link>
        </div>
      </section>

      <section style={featureGrid}>
        <article style={feature}>
          <span style={number}>01</span>
          <h2>One physical piece.</h2>
          <p>Put QRE on an object, product, keepsake, pet tag, package, service item, or anything that needs a persistent digital layer.</p>
        </article>
        <article style={feature}>
          <span style={number}>02</span>
          <h2>Change it later.</h2>
          <p>The physical QR does not have to change when the destination, experience, information, or workflow changes.</p>
        </article>
        <article style={feature}>
          <span style={number}>03</span>
          <h2>See what happens.</h2>
          <p>QRE can turn scans into an evolving experience while keeping the owner's control at the center.</p>
        </article>
      </section>

      <section style={bottom}>
        <p style={eyebrow}>START WITH THE PHYSICAL PIECE</p>
        <h2 style={bottomTitle}>Make something real<br />worth scanning.</h2>
        <Link to="/store" style={primary}>See available QRE pieces</Link>
      </section>

      <footer style={footer}>QRE · Physical identity with a living digital layer.</footer>
    </main>
  );
}

const page: CSSProperties = { minHeight: "100vh", background: "#050608", color: "#f4f6f8", fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif" };
const header: CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "24px clamp(20px, 5vw, 72px)", borderBottom: "1px solid rgba(255,255,255,.08)" };
const logo: CSSProperties = { color: "#fff", textDecoration: "none", fontWeight: 900, letterSpacing: 5, fontSize: 18 };
const nav: CSSProperties = { display: "flex", gap: 24 };
const navLink: CSSProperties = { color: "rgba(255,255,255,.7)", textDecoration: "none", fontSize: 14 };
const hero: CSSProperties = { maxWidth: 1100, margin: "0 auto", padding: "clamp(90px, 14vw, 170px) 24px 130px" };
const eyebrow: CSSProperties = { margin: 0, color: "#00e5a0", fontSize: 11, fontWeight: 800, letterSpacing: 3 };
const title: CSSProperties = { margin: "18px 0 24px", fontSize: "clamp(52px, 9vw, 108px)", lineHeight: .93, letterSpacing: -6, fontWeight: 850 };
const lede: CSSProperties = { maxWidth: 680, margin: 0, color: "rgba(255,255,255,.58)", fontSize: "clamp(17px, 2vw, 21px)", lineHeight: 1.55 };
const actions: CSSProperties = { display: "flex", flexWrap: "wrap", gap: 12, marginTop: 34 };
const primary: CSSProperties = { display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: 999, padding: "14px 22px", background: "#f4f6f8", color: "#050608", textDecoration: "none", fontWeight: 850 };
const secondary: CSSProperties = { display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: 999, padding: "14px 22px", border: "1px solid rgba(255,255,255,.15)", color: "#fff", textDecoration: "none", fontWeight: 700 };
const featureGrid: CSSProperties = { maxWidth: 1100, margin: "0 auto", padding: "0 24px 130px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 16 };
const feature: CSSProperties = { padding: 28, borderRadius: 22, border: "1px solid rgba(255,255,255,.09)", background: "rgba(255,255,255,.025)" };
const number: CSSProperties = { color: "#00e5a0", fontSize: 11, fontWeight: 800, letterSpacing: 2 };
const bottom: CSSProperties = { maxWidth: 1100, margin: "0 auto", padding: "90px 24px 120px", borderTop: "1px solid rgba(255,255,255,.08)" };
const bottomTitle: CSSProperties = { margin: "16px 0 28px", fontSize: "clamp(40px, 6vw, 72px)", lineHeight: 1, letterSpacing: -4 };
const footer: CSSProperties = { padding: "36px 24px 60px", textAlign: "center", color: "rgba(255,255,255,.3)", fontSize: 12 };
