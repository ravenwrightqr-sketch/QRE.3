import type { CSSProperties } from "react";
import { Link } from "react-router-dom";

export default function Success() {
  return (
    <main style={page}>
      <section style={card}>
        <p style={eyebrow}>QRE · PAYMENT CONFIRMED</p>
        <div style={mark}>✓</div>
        <h1 style={title}>Your QRE piece is yours.</h1>
        <p style={copy}>
          Payment has been confirmed. Your physical piece is now associated with your QRE account.
          Once you have it in hand, open your dashboard to configure what it does.
        </p>
        <div style={actions}>
          <Link to="/dashboard" style={primary}>Open dashboard</Link>
          <Link to="/store" style={secondary}>Back to shop</Link>
        </div>
      </section>
    </main>
  );
}

const page: CSSProperties = { minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "#050608", color: "#f4f6f8", fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif" };
const card: CSSProperties = { width: "min(620px, 100%)", padding: "clamp(32px, 7vw, 64px)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 28, background: "rgba(255,255,255,.035)" };
const eyebrow: CSSProperties = { margin: 0, color: "#00e5a0", fontSize: 11, fontWeight: 800, letterSpacing: 3 };
const mark: CSSProperties = { width: 58, height: 58, margin: "28px 0 22px", display: "grid", placeItems: "center", borderRadius: "50%", background: "#00e5a0", color: "#050608", fontSize: 28, fontWeight: 900 };
const title: CSSProperties = { margin: 0, fontSize: "clamp(40px, 7vw, 72px)", lineHeight: .98, letterSpacing: -4 };
const copy: CSSProperties = { maxWidth: 520, margin: "22px 0 0", color: "rgba(255,255,255,.58)", lineHeight: 1.6, fontSize: 16 };
const actions: CSSProperties = { display: "flex", flexWrap: "wrap", gap: 12, marginTop: 32 };
const primary: CSSProperties = { padding: "14px 20px", borderRadius: 999, background: "#f4f6f8", color: "#050608", textDecoration: "none", fontWeight: 850 };
const secondary: CSSProperties = { padding: "14px 20px", borderRadius: 999, border: "1px solid rgba(255,255,255,.15)", color: "#fff", textDecoration: "none", fontWeight: 700 };
