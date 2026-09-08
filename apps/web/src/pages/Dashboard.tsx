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
          <div>
            <div style={brand}>QRE</div>
            <div style={eyebrow}>YOUR WORLD</div>
          </div>

          {objects.length > 0 && (
            <div style={assetPickerShell}>
              <span style={pickerLabel}>WORLD</span>
              <select
                value={activeObject?.id ?? ""}
                onChange={(event) => setActiveAsset(event.target.value)}
                style={assetPicker}
                aria-label="Select QRE world"
              >
                {objects.map((object) => (
                  <option key={object.id} value={object.id}>
                    {object.displayName || object.slug}
                  </option>
                ))}
              </select>
            </div>
          )}
        </header>

        <section style={heroStyle}>
          <div style={headlineEyebrow}>GIVE QRE INFORMATION</div>
          <h1 style={titleStyle}>What happened?</h1>
          <p style={subStyle}>Tell QRE. QRE figures out what it means.</p>

          {activeObject ? (
            <UniversalKnowledgeIntake
              slug={activeObject.slug}
              onLearned={loadAssets}
            />
          ) : (
            <div style={emptyStyle}>
              <div style={{ fontSize: 13, letterSpacing: 1.5 }}>CREATE YOUR FIRST QRE WORLD</div>
              <p style={{ opacity: .48, lineHeight: 1.6, maxWidth: 480 }}>
                QRE needs a business, place, person, or object to learn into before it can build memory.
              </p>
              <Link to="/admin/create" style={primaryLink}>CREATE QRE</Link>
            </div>
          )}

          {error && <div style={errorStyle}>{error}</div>}
        </section>
      </main>
    </DashboardLayout>
  );
}

const pageStyle = {
  minHeight: "calc(100vh - 1px)",
  color: "#f7f7f7",
  background: "radial-gradient(circle at 50% 35%, rgba(80,255,220,.065), transparent 34%), #050608",
  paddingBottom: 80,
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 18,
  padding: "12px 4px 34px",
};

const brand = {
  fontSize: 11,
  letterSpacing: 10,
  opacity: .5,
};

const eyebrow = {
  marginTop: 8,
  fontSize: 10,
  letterSpacing: 4,
  opacity: .28,
};

const assetPickerShell = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  border: "1px solid rgba(255,255,255,.1)",
  borderRadius: 999,
  padding: "8px 12px",
  background: "rgba(255,255,255,.025)",
};

const pickerLabel = {
  fontSize: 8,
  letterSpacing: 2,
  opacity: .3,
};

const assetPicker = {
  border: 0,
  outline: 0,
  background: "transparent",
  color: "#fff",
  font: "inherit",
  fontSize: 11,
  minWidth: 130,
};

const heroStyle = {
  display: "grid",
  justifyItems: "center",
  gap: 0,
};

const headlineEyebrow = {
  marginTop: 22,
  fontSize: 10,
  letterSpacing: 5,
  opacity: .33,
};

const titleStyle = {
  margin: "12px 0 0",
  fontSize: "clamp(52px, 10vw, 100px)",
  lineHeight: .92,
  fontWeight: 500,
  letterSpacing: "-5px",
  textAlign: "center" as const,
};

const subStyle = {
  margin: "20px 0 36px",
  color: "rgba(255,255,255,.46)",
  fontSize: 16,
  textAlign: "center" as const,
};

const emptyStyle = {
  width: "min(720px, 92vw)",
  boxSizing: "border-box" as const,
  padding: 32,
  borderRadius: 22,
  border: "1px solid rgba(255,255,255,.1)",
  background: "rgba(255,255,255,.03)",
  textAlign: "center" as const,
};

const primaryLink = {
  display: "inline-block",
  marginTop: 10,
  borderRadius: 999,
  padding: "12px 18px",
  background: "#fff",
  color: "#000",
  textDecoration: "none",
  fontSize: 10,
  fontWeight: 800,
  letterSpacing: 1.5,
};

const errorStyle = {
  marginTop: 18,
  width: "min(720px, 92vw)",
  boxSizing: "border-box" as const,
  borderRadius: 12,
  padding: 14,
  background: "rgba(255,80,80,.08)",
  border: "1px solid rgba(255,100,100,.16)",
  fontSize: 12,
};

const loadingStyle = {
  minHeight: "100vh",
  display: "grid",
  placeItems: "center",
  color: "rgba(255,255,255,.5)",
  letterSpacing: 4,
};
