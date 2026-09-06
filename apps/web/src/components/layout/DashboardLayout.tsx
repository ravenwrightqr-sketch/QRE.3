import React from "react";
import { Link } from "react-router-dom";
import AnimatedBackground from "../effects/AnimatedBackground";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        position: "relative",
        background: "#030509",
        color: "#e8ffff",
        overflow: "hidden",
      }}
    >
      <AnimatedBackground />
      <div
        style={{
          position: "relative",
          zIndex: 2,
          padding: "24px clamp(18px, 4vw, 40px) 40px",
          maxWidth: 1400,
          margin: "0 auto",
          fontFamily: "'Courier New', monospace",
          boxSizing: "border-box",
        }}
      >
        <nav
          aria-label="QRE dashboard"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 18,
            flexWrap: "wrap",
          }}
        >
          <Link
            to="/dashboard"
            style={{ color: "rgba(255,255,255,.55)", textDecoration: "none", fontSize: 10, letterSpacing: 3 }}
          >
            QRE
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <Link
              to="/dashboard/finder"
              style={{ color: "#eafffa", textDecoration: "none", fontSize: 10, letterSpacing: 2, border: "1px solid rgba(185,255,241,.22)", borderRadius: 999, padding: "8px 12px", background: "rgba(185,255,241,.06)" }}
            >
              + FIND REALITY
            </Link>
            <Link
              to="/dashboard/service-receipt"
              style={{ color: "#fff", textDecoration: "none", fontSize: 10, letterSpacing: 2, border: "1px solid rgba(185,255,241,.25)", borderRadius: 999, padding: "8px 12px", background: "rgba(185,255,241,.07)" }}
            >
              + SERVICE RECEIPT
            </Link>
          </div>
        </nav>
        {children}
      </div>
    </div>
  );
}
