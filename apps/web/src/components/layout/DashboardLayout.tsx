import React from "react";
import { Link, useLocation } from "react-router-dom";
import AnimatedBackground from "../effects/AnimatedBackground";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const isHome = location.pathname === "/dashboard";

  return (
    <div style={shell}>
      <AnimatedBackground />

      <div style={content}>
        <header style={header}>
          <Link to="/dashboard" style={logo} aria-label="QRE home">
            QRE
          </Link>
          <div style={headerRight}>
            {!isHome && (
              <Link to="/dashboard" style={backLink}>
                ← QRE
              </Link>
            )}
            <span style={systemLabel}>YOUR WORLD</span>
          </div>
        </header>

        {children}
      </div>
    </div>
  );
}

const shell = {
  minHeight: "100vh",
  position: "relative" as const,
  background: "#030509",
  color: "#e8ffff",
  overflow: "hidden" as const,
};

const content = {
  position: "relative" as const,
  zIndex: 2,
  padding: "24px clamp(18px, 4vw, 40px) 40px",
  maxWidth: 1400,
  margin: "0 auto",
  boxSizing: "border-box" as const,
  fontFamily: "'Courier New', monospace",
};

const header = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 16,
  minHeight: 34,
};

const logo = {
  color: "rgba(255,255,255,.62)",
  textDecoration: "none",
  fontSize: 11,
  letterSpacing: 7,
};

const headerRight = {
  display: "flex",
  alignItems: "center",
  gap: 16,
};

const systemLabel = {
  fontSize: 8,
  letterSpacing: 3,
  opacity: .22,
};

const backLink = {
  color: "rgba(255,255,255,.48)",
  textDecoration: "none",
  fontSize: 9,
  letterSpacing: 2,
};
