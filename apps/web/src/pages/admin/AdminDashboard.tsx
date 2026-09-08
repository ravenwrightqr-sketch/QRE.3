import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiGet, apiPost } from "../../lib/api";
import UniversalKnowledgeIntake from "../../components/knowledge/UniversalKnowledgeIntake";

type AdminAsset = {
  id: string;
  slug: string;
  displayName?: string | null;
  accountId?: string | null;
  category?: string | null;
  status?: string | null;
  paid?: boolean;
  claimedAt?: string | null;
  totalScans?: number;
  totalUnlocks?: number;
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [assets, setAssets] = useState<AdminAsset[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");

  async function loadAssets(selectFirst = false) {
    try {
      setError("");
      const response = await apiGet("/api/admin/assets");
      const next = Array.isArray(response?.assets) ? response.assets as AdminAsset[] : [];
      setAssets(next);
      setSelectedId((current) => {
        if (current && next.some((asset) => asset.id === current)) return current;
        return selectFirst ? next[0]?.id ?? "" : next[0]?.id ?? "";
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "QRE could not load businesses.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAssets(true);
  }, []);

  const selected = useMemo(
    () => assets.find((asset) => asset.id === selectedId) ?? assets[0] ?? null,
    [assets, selectedId],
  );

  async function claim(asset: AdminAsset) {
    setBusyId(asset.id);
    setError("");
    try {
      await apiPost(`/api/admin/assets/${encodeURIComponent(asset.id)}/assign`);
      setSelectedId(asset.id);
      await loadAssets();
    } catch (err) {
      setError(err instanceof Error ? err.message : "QRE could not connect that business to your account.");
    } finally {
      setBusyId("");
    }
  }

  return (
    <main style={page}>
      <header style={header}>
        <div>
          <div style={kicker}>QRE ADMIN</div>
          <h1 style={title}>Businesses</h1>
          <p style={subtitle}>Choose a business. Then give QRE anything.</p>
        </div>
        <div style={headerActions}>
          <Link to="/admin/create" style={primaryButton}>+ Add business</Link>
          <button type="button" onClick={() => navigate("/dashboard")} style={secondaryButton}>Back to QRE</button>
        </div>
      </header>

      {error ? <div style={errorBox}>{error}</div> : null}

      {loading ? (
        <div style={loadingBox}>LOADING BUSINESSES…</div>
      ) : assets.length === 0 ? (
        <section style={emptyBox}>
          <div style={emptyTitle}>No businesses yet.</div>
          <div style={emptyText}>Create the first one and the rest of the workflow starts here.</div>
          <Link to="/admin/create" style={primaryButton}>Create a business</Link>
        </section>
      ) : (
        <section style={layout}>
          <aside style={listPanel}>
            <div style={panelLabel}>BUSINESS INVENTORY · {assets.length}</div>
            <div style={assetList}>
              {assets.map((asset) => {
                const active = asset.id === selected?.id;
                const unassigned = !asset.accountId;
                return (
                  <button
                    key={asset.id}
                    type="button"
                    onClick={() => setSelectedId(asset.id)}
                    style={{ ...assetButton, ...(active ? assetButtonActive : {}) }}
                  >
                    <div style={assetButtonTop}>
                      <span style={assetName}>{asset.displayName || asset.slug}</span>
                      <span style={statusPill}>{unassigned ? "UNASSIGNED" : "CONNECTED"}</span>
                    </div>
                    <div style={assetMeta}>{asset.category || "QRE business"} · {asset.slug}</div>
                  </button>
                );
              })}
            </div>
          </aside>

          <section style={workspace}>
            {selected ? (
              <>
                <div style={selectedHeader}>
                  <div>
                    <div style={selectedKicker}>SELECTED BUSINESS</div>
                    <h2 style={selectedTitle}>{selected.displayName || selected.slug}</h2>
                    <div style={selectedMeta}>{selected.category || "Business"} · {selected.slug}</div>
                  </div>
                  <div style={selectedActions}>
                    {!selected.accountId ? (
                      <button type="button" onClick={() => void claim(selected)} disabled={busyId === selected.id} style={claimButton}>
                        {busyId === selected.id ? "Connecting…" : "Connect to my account"}
                      </button>
                    ) : null}
                    <Link to={`/dashboard/assets/${encodeURIComponent(selected.slug)}/knowledge`} style={secondaryButton}>Open memory</Link>
                    <Link to={`/dashboard/assets/${encodeURIComponent(selected.slug)}`} style={secondaryButton}>Open business</Link>
                  </div>
                </div>

                <div style={instructionCard}>
                  <div style={instructionKicker}>ONE WORKFLOW</div>
                  <div style={instructionTitle}>Photo. PDF. Spreadsheet. Text. Website.</div>
                  <div style={instructionText}>Everything lands in this business's knowledge world. QRE handles the format.</div>
                </div>

                <UniversalKnowledgeIntake slug={selected.slug} onLearned={() => loadAssets()} />
              </>
            ) : null}
          </section>
        </section>
      )}
    </main>
  );
}

const page = {
  minHeight: "100vh",
  padding: "42px clamp(18px, 4vw, 52px) 72px",
  background: "radial-gradient(circle at 70% 15%, rgba(0,255,210,.08), transparent 32%), #050608",
  color: "#f4ffff",
  boxSizing: "border-box" as const,
  fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};

const header = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-end",
  gap: 24,
  marginBottom: 28,
};

const kicker = { fontSize: 9, letterSpacing: 4, opacity: .34 };
const title = { margin: "8px 0 0", fontSize: "clamp(42px, 7vw, 82px)", lineHeight: .94, fontWeight: 500, letterSpacing: "-4px" };
const subtitle = { margin: "16px 0 0", fontSize: 15, color: "rgba(255,255,255,.5)" };
const headerActions = { display: "flex", gap: 8, flexWrap: "wrap" as const };
const primaryButton = { display: "inline-flex", alignItems: "center", justifyContent: "center", textDecoration: "none", border: 0, borderRadius: 999, padding: "11px 16px", background: "#fff", color: "#050608", fontSize: 11, fontWeight: 800, cursor: "pointer" };
const secondaryButton = { display: "inline-flex", alignItems: "center", justifyContent: "center", textDecoration: "none", border: "1px solid rgba(255,255,255,.13)", borderRadius: 999, padding: "10px 14px", background: "rgba(255,255,255,.035)", color: "#fff", fontSize: 10, fontWeight: 700, cursor: "pointer" };
const errorBox = { marginBottom: 18, padding: "12px 14px", borderRadius: 14, background: "rgba(255,70,70,.08)", border: "1px solid rgba(255,90,90,.18)", fontSize: 12 };
const loadingBox = { padding: 34, borderRadius: 22, border: "1px solid rgba(255,255,255,.08)", color: "rgba(255,255,255,.5)", letterSpacing: 2, fontSize: 10 };
const emptyBox = { padding: 44, borderRadius: 26, border: "1px solid rgba(255,255,255,.09)", background: "rgba(255,255,255,.025)", textAlign: "center" as const };
const emptyTitle = { fontSize: 28, marginBottom: 10 };
const emptyText = { color: "rgba(255,255,255,.46)", marginBottom: 22 };
const layout = { display: "grid", gridTemplateColumns: "minmax(270px,330px) minmax(0,1fr)", gap: 18, alignItems: "start" };
const listPanel = { border: "1px solid rgba(255,255,255,.08)", borderRadius: 22, background: "rgba(255,255,255,.025)", overflow: "hidden", position: "sticky" as const, top: 20 };
const panelLabel = { padding: "14px 16px", color: "rgba(255,255,255,.35)", fontSize: 9, letterSpacing: 2 };
const assetList = { display: "grid" };
const assetButton = { width: "100%", textAlign: "left" as const, border: 0, borderTop: "1px solid rgba(255,255,255,.06)", padding: 16, background: "transparent", color: "#fff", cursor: "pointer" };
const assetButtonActive = { background: "rgba(0,255,210,.06)" };
const assetButtonTop = { display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" };
const assetName = { fontSize: 14, fontWeight: 700 };
const statusPill = { flexShrink: 0, borderRadius: 999, padding: "5px 7px", background: "rgba(255,255,255,.06)", color: "rgba(255,255,255,.42)", fontSize: 7, letterSpacing: 1 };
const assetMeta = { marginTop: 7, color: "rgba(255,255,255,.34)", fontSize: 10, overflow: "hidden", textOverflow: "ellipsis" as const };
const workspace = { minWidth: 0 };
const selectedHeader = { display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 18, marginBottom: 18 };
const selectedKicker = { fontSize: 8, letterSpacing: 2.8, opacity: .3 };
const selectedTitle = { margin: "7px 0 5px", fontSize: "clamp(28px, 4vw, 46px)", fontWeight: 520, letterSpacing: "-2px" };
const selectedMeta = { color: "rgba(255,255,255,.34)", fontSize: 11 };
const selectedActions = { display: "flex", flexWrap: "wrap" as const, justifyContent: "flex-end", gap: 7 };
const claimButton = { border: "1px solid rgba(0,255,210,.26)", borderRadius: 999, padding: "10px 14px", background: "rgba(0,255,210,.08)", color: "#cffff6", fontSize: 10, fontWeight: 800, cursor: "pointer" };
const instructionCard = { marginBottom: 16, padding: 20, borderRadius: 20, border: "1px solid rgba(255,255,255,.08)", background: "linear-gradient(135deg, rgba(255,255,255,.035), rgba(0,255,210,.025))" };
const instructionKicker = { fontSize: 8, letterSpacing: 2.5, opacity: .3 };
const instructionTitle = { marginTop: 8, fontSize: 22, letterSpacing: "-.8px" };
const instructionText = { marginTop: 8, color: "rgba(255,255,255,.46)", fontSize: 12, lineHeight: 1.5 };

