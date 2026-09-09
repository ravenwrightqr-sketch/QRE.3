import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getUserAssets } from "../lib/api";
import DashboardLayout from "../components/layout/DashboardLayout";
import UniversalKnowledgeIntake from "../components/knowledge/UniversalKnowledgeIntake";

type QREObject = {
  id: string;
  slug: string;
  displayName?: string | null;
  status: string;
};

export default function Dashboard() {
  const [objects, setObjects] = useState<QREObject[]>([]);
  const [activeAsset, setActiveAsset] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    void loadAssets();
  }, []);

  async function loadAssets() {
    try {
      setError("");
      const response = await getUserAssets();
      const assets: QREObject[] = Array.isArray(response)
        ? response
        : Array.isArray(response.assets)
          ? response.assets
          : [];
      setObjects(assets);
      setActiveAsset((current) => current || assets[0]?.id || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "QRE could not load your world.");
    } finally {
      setLoading(false);
    }
  }

  const activeObject = useMemo(
    () => objects.find((object) => object.id === activeAsset) ?? objects[0] ?? null,
    [objects, activeAsset],
  );

  if (loading) {
    return (
      <DashboardLayout>
        <main style={loadingStyle}>QRE AWAKENING…</main>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <main style={pageStyle}>
        <header style={headerStyle}>
          <Link to="/dashboard" style={brandLink} aria-label="QRE home">QRE</Link>

          <div style={headerRight}>
            {objects.length > 0 ? (
              <label style={worldControl}>
                <span style={worldLabel}>WORLD</span>
                <select
                  value={activeObject?.id ?? ""}
                  onChange={(event) => setActiveAsset(event.target.value)}
                  style={worldSelect}
                  aria-label="Select QRE world"
                >
                  {objects.map((object) => (
                    <option key={object.id} value={object.id}>
                      {object.displayName || object.slug}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <Link to="/admin" style={adminLink}>ADMIN</Link>
          </div>
        </header>

        <section style={heroStyle}>
          <div style={heroEyebrow}>QRE · YOUR WORLD</div>
          <h1 style={titleStyle}>
            Tell QRE<br />what you want.
          </h1>
          <p style={subStyle}>
            Show QRE what exists. QRE figures out what it means, remembers it,
            and connects it to your world.
          </p>

          {activeObject ? (
            <UniversalKnowledgeIntake slug={activeObject.slug} onLearned={loadAssets} />
          ) : (
            <div style={emptyStyle}>
              <div style={emptyTitle}>START YOUR WORLD</div>
              <p style={emptyText}>
                Create a business, place, person, product, event, or other QRE world to begin.
              </p>
              <Link to="/admin/create" style={primaryLink}>CREATE WORLD</Link>
            </div>
          )}

          {error && <div style={errorStyle}>{error}</div>}
        </section>

        {activeObject ? (
          <section style={worldSummary}>
            <div>
              <div style={summaryEyebrow}>CURRENT WORLD</div>
              <div style={summaryTitle}>{activeObject.displayName || activeObject.slug}</div>
            </div>
            <div style={summaryMeta}>
              <span>{activeObject.status}</span>
              <Link to={`/dashboard/assets/${encodeURIComponent(activeObject.slug)}/knowledge`} style={summaryLink}>View memory →</Link>
            </div>
          </section>
        ) : null}
      </main>
    </DashboardLayout>
  );
}

const pageStyle = {
  minHeight: "calc(100vh - 1px)",
  color: "#f7f7f7",
  background: "#050608",
  paddingBottom: 72,
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 24,
  padding: "18px 8px 54px",
};

const brandLink = {
  color: "#fff",
  textDecoration: "none",
  fontSize: 14,
  fontWeight: 800,
  letterSpacing: 7,
};

const headerRight = {
  display: "flex",
  alignItems: "center",
  gap: 24,
};

const worldControl = {
  display: "flex",
  alignItems: "center",
  gap: 10,
};

const worldLabel = {
  fontSize: 9,
  fontWeight: 800,
  letterSpacing: 2.2,
  color: "rgba(255,255,255,.34)",
};

const worldSelect = {
  border: 0,
  outline: 0,
  background: "transparent",
  color: "#fff",
  font: "inherit",
  fontSize: 13,
  fontWeight: 700,
  minWidth: 145,
  cursor: "pointer",
};

const adminLink = {
  color: "rgba(255,255,255,.46)",
  textDecoration: "none",
  fontSize: 9,
  fontWeight: 800,
  letterSpacing: 2,
};

const heroStyle = {
  display: "grid",
  justifyItems: "center",
  textAlign: "center" as const,
};

const heroEyebrow = {
  marginTop: 12,
  color: "rgba(255,255,255,.34)",
  fontSize: 10,
  fontWeight: 800,
  letterSpacing: 4,
};

const titleStyle = {
  margin: "18px 0 0",
  maxWidth: 960,
  fontSize: "clamp(62px, 11vw, 136px)",
  lineHeight: .86,
  fontWeight: 800,
  letterSpacing: "-7px",
};

const subStyle = {
  margin: "26px 0 52px",
  maxWidth: 700,
  color: "rgba(255,255,255,.48)",
  fontSize: 16,
  lineHeight: 1.6,
};

const emptyStyle = {
  width: "min(720px, 92vw)",
  padding: "8px 0 20px",
};

const emptyTitle = {
  fontSize: 14,
  fontWeight: 800,
  letterSpacing: 2.5,
};

const emptyText = {
  margin: "14px auto 22px",
  maxWidth: 520,
  color: "rgba(255,255,255,.44)",
  fontSize: 14,
  lineHeight: 1.6,
};

const primaryLink = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "13px 18px",
  borderRadius: 999,
  background: "#fff",
  color: "#050608",
  textDecoration: "none",
  fontSize: 10,
  fontWeight: 900,
  letterSpacing: 1.8,
};

const errorStyle = {
  marginTop: 18,
  width: "min(720px, 92vw)",
  color: "rgba(255,210,210,.9)",
  fontSize: 12,
};

const worldSummary = {
  width: "min(1120px, 92vw)",
  margin: "76px auto 0",
  paddingTop: 20,
  borderTop: "1px solid rgba(255,255,255,.08)",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "end",
  gap: 24,
};

const summaryEyebrow = {
  color: "rgba(255,255,255,.3)",
  fontSize: 9,
  fontWeight: 800,
  letterSpacing: 2.5,
};

const summaryTitle = {
  marginTop: 8,
  fontSize: 22,
  fontWeight: 800,
  letterSpacing: "-.5px",
};

const summaryMeta = {
  display: "flex",
  alignItems: "center",
  gap: 22,
  color: "rgba(255,255,255,.36)",
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: 1.4,
  textTransform: "uppercase" as const,
};

const summaryLink = {
  color: "#fff",
  textDecoration: "none",
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: 0,
  textTransform: "none" as const,
};

const loadingStyle = {
  minHeight: "100vh",
  display: "grid",
  placeItems: "center",
  background: "#050608",
  color: "rgba(255,255,255,.5)",
  letterSpacing: 4,
  fontWeight: 700,
};
