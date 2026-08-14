import { Link } from "react-router-dom";
import DashboardLayout from "../components/layout/DashboardLayout";

const capabilities = [
  ["CREATE", "Turn a sentence into a shareable QR experience. No template-building required."],
  ["MEMORY", "Remember people, places, objects, events, returns, preferences, and evolving history."],
  ["WRITE", "Generate cinematic, funny, romantic, mysterious, horror, service, real-estate, and memory prose."],
  ["KNOW", "Accumulate arbitrary facts: paint, materials, models, warranties, builders, owners, notes, links, and photos."],
  ["MEDIA", "Attach photos, video, and soundtrack assets to an experience."],
  ["LOCATION", "Connect exact places, visits, and recurring geography to the memory graph."],
  ["TICKETS", "Create QR event tickets, check people in, and learn attendance behavior."],
  ["REWARDS", "Run sponsor-funded attribution/reward programs while keeping the customer's experience primary."],
  ["ANALYTICS", "See scans, completion, replay, media behavior, memory behavior, CTA behavior, tickets, and cognitive signals."],
  ["LEARN", "Feed behavior and feedback back into creative state so future experiences can adapt."],
];

export default function QreInfo() {
  return (
    <DashboardLayout>
      <main style={{ minHeight: "100vh", color: "#fff", padding: "52px 28px", maxWidth: 1000, margin: "0 auto" }}>
        <p style={{ opacity: .45, letterSpacing: 5, fontSize: 11, marginBottom: 8 }}>QRE CAPABILITY MAP</p>
        <h1 style={{ fontSize: 48, margin: 0 }}>What you can do with QRE</h1>
        <p style={{ opacity: .6, maxWidth: 680, lineHeight: 1.7, fontSize: 17 }}>
          QRE is an experience engine, memory system, creative writer, information ledger, QR runtime, and analytics loop in one place.
        </p>
        <div style={{ display: "grid", gap: 12, marginTop: 30 }}>
          {capabilities.map(([name, description]) => (
            <section key={name} style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: 20, padding: "18px 20px", borderRadius: 16, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)" }}>
              <strong style={{ letterSpacing: 2 }}>{name}</strong>
              <span style={{ opacity: .72, lineHeight: 1.55 }}>{description}</span>
            </section>
          ))}
        </div>
        <div style={{ display: "flex", gap: 14, marginTop: 30, flexWrap: "wrap" }}>
          <Link to="/dashboard" style={{ color: "#fff", padding: "12px 16px", borderRadius: 12, background: "rgba(255,255,255,.08)", textDecoration: "none" }}>← Dashboard</Link>
          <Link to="/experience/create" style={{ color: "#fff", padding: "12px 16px", borderRadius: 12, background: "rgba(255,255,255,.08)", textDecoration: "none" }}>Create an experience →</Link>
        </div>
      </main>
    </DashboardLayout>
  );
}
