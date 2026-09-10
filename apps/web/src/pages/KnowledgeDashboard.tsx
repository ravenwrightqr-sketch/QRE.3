import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { Link, useParams } from "react-router-dom";
import DashboardLayout from "../components/layout/DashboardLayout";
import { apiGet, setCatalogAvailability } from "../lib/api";
import UniversalKnowledgeIntake from "../components/knowledge/UniversalKnowledgeIntake";

type MemoryCatalogItem = { id: string; name: string; kind: string; category?: string | null; brand?: string | null; description?: string | null; updatedAt: string };
type MemoryObservation = { id: string; type: string; value: unknown; source: string; confidence: number; observedAt: string };
type MemoryState = {
  asset: { slug: string; displayName?: string | null };
  catalog: MemoryCatalogItem[];
  observations: MemoryObservation[];
  patterns: Array<{ id: string; type: string; statement: string; confidence: number; strength: number; firstObservedAt?: string | null; lastObservedAt?: string | null }>;
  jobs: Array<{ id: string; status: string; sourceType: string; originalName?: string | null; result?: unknown; error?: string | null; createdAt: string; startedAt?: string | null; completedAt?: string | null }>;
  metrics?: Record<string, unknown> | null;
  counts: { catalog: number; observations: number; patterns: number; jobs: number };
};
type CatalogResponse = { products: Array<MemoryCatalogItem & { status: string; availability: "available" | "unavailable" | "observed"; confidence: number; source: string | null; observedAt: string | null }>; count: number; availableCount: number };
type Tab = "recent" | "catalog" | "observations" | "patterns";
type CatalogFilter = "all" | "available" | "unavailable";

export default function KnowledgeDashboard() {
  const { slug = "" } = useParams();
  const [memory, setMemory] = useState<MemoryState | null>(null);
  const [catalog, setCatalog] = useState<CatalogResponse | null>(null);
  const [tab, setTab] = useState<Tab>("recent");
  const [catalogFilter, setCatalogFilter] = useState<CatalogFilter>("available");
  const [catalogSearch, setCatalogSearch] = useState("");
  const [updatingId, setUpdatingId] = useState("");
  const [error, setError] = useState("");

  async function load() {
    if (!slug) return;
    try {
      setError("");
      const [state, catalogState] = await Promise.all([
        apiGet(`/api/knowledge/${encodeURIComponent(slug)}/state`),
        apiGet(`/api/catalog/${encodeURIComponent(slug)}`),
      ]);
      setMemory(state);
      setCatalog(catalogState);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load QRE memory.");
    }
  }

  useEffect(() => { void load(); }, [slug]);

  const recentObservations = useMemo(() => [...(memory?.observations ?? [])].sort((a, b) => new Date(b.observedAt).getTime() - new Date(a.observedAt).getTime()).slice(0, 24), [memory]);

  const visibleCatalog = useMemo(() => {
    const query = catalogSearch.trim().toLowerCase();
    return (catalog?.products ?? []).filter((item) => {
      const matchesFilter = catalogFilter === "all" || item.availability === catalogFilter;
      const haystack = [item.name, item.brand, item.category, item.description].filter(Boolean).join(" ").toLowerCase();
      return matchesFilter && (!query || haystack.includes(query));
    });
  }, [catalog, catalogFilter, catalogSearch]);

  async function updateAvailability(itemId: string, availability: "available" | "unavailable") {
    if (!slug) return;
    setUpdatingId(itemId); setError("");
    try { await setCatalogAvailability(slug, itemId, availability); await load(); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not update catalog availability."); }
    finally { setUpdatingId(""); }
  }

  if (!memory || !catalog) return <DashboardLayout><main style={loadingStyle}>{error || "LOADING QRE MEMORY…"}</main></DashboardLayout>;
  const metricScans = Number(memory.metrics?.scans ?? memory.metrics?.totalScans ?? 0);

  return (
    <DashboardLayout>
      <main style={pageStyle}>
        <header style={headerStyle}>
          <div><div style={eyebrow}>BUSINESS MEMORY</div><h1 style={titleStyle}>{memory.asset.displayName || memory.asset.slug}</h1><p style={subStyle}>Give QRE anything. This is where what it learns accumulates.</p></div>
          <Link to="/dashboard" style={backLink}>← GIVE QRE SOMETHING</Link>
        </header>
        <UniversalKnowledgeIntake slug={slug} onLearned={load} />
        {error && <div style={errorStyle}>{error}</div>}
        <section style={statsGrid} aria-label="Knowledge totals"><Stat label="Catalog" value={catalog.count} /><Stat label="Available" value={catalog.availableCount} /><Stat label="Observations" value={memory.counts.observations} /><Stat label="Scans" value={metricScans} /></section>
        <section style={{ marginTop: 34 }}>
          <nav style={tabs} aria-label="Business memory">{(["recent", "catalog", "observations", "patterns"] as Tab[]).map((item) => <button key={item} type="button" onClick={() => setTab(item)} style={{ ...tabButton, ...(tab === item ? activeTabButton : {}) }}>{item === "recent" ? "Recent Knowledge" : item[0].toUpperCase() + item.slice(1)}</button>)}</nav>

          {tab === "recent" && <section style={{ ...sectionPanel, marginTop: 16 }}><div style={sectionHeading}><div><h2 style={sectionTitle}>Recent Knowledge</h2><div style={metaText}>Latest things QRE actually recorded about this business.</div></div><span style={muted}>{memory.counts.observations}</span></div><div style={itemStack}>{recentObservations.length === 0 && <Empty text="QRE has not learned anything here yet." />}{recentObservations.map((observation) => <article key={observation.id} style={memoryRow}><div><strong>{observation.type.replace(/_/g, " ")}</strong><div style={valueText}>{formatValue(observation.value)}</div><div style={metaText}>{observation.source || "source"} · confidence {Math.round(observation.confidence * 100)}% · {new Date(observation.observedAt).toLocaleString()}</div></div></article>)}</div></section>}

          {tab === "catalog" && <section style={sectionPanel}><div style={sectionHeading}><div><h2 style={sectionTitle}>Store Catalog</h2><div style={metaText}>{catalog.availableCount} available · {catalog.count} total</div></div><span style={muted}>live</span></div><div style={catalogToolbar}><input value={catalogSearch} onChange={(event) => setCatalogSearch(event.target.value)} placeholder="Search products" style={searchInput} /><div style={filterGroup}>{(["available", "unavailable", "all"] as CatalogFilter[]).map((filter) => <button key={filter} type="button" onClick={() => setCatalogFilter(filter)} style={{ ...filterButton, ...(catalogFilter === filter ? activeFilterButton : {}) }}>{filter === "all" ? "All" : filter === "available" ? "Available" : "Unavailable"}</button>)}</div></div><div style={itemStack}>{visibleCatalog.length === 0 && <Empty text={catalog.count ? "No catalog items match this view." : "Catalog items will appear as QRE identifies things in what you provide."} />}{visibleCatalog.map((item) => <article key={item.id} style={catalogRow}><div style={{ minWidth: 0 }}><strong>{displayCatalogName(item.name)}</strong><div style={valueText}>{[item.brand, item.category].filter(Boolean).join(" · ") || "product"}</div><div style={metaText}>{item.source || "source"} · confidence {Math.round(item.confidence * 100)}%{item.observedAt ? ` · ${new Date(item.observedAt).toLocaleString()}` : ""}</div></div><div style={catalogActions}><span style={{ ...availabilityBadge, ...(item.availability === "available" ? availableBadge : unavailableBadge) }}>{item.availability === "available" ? "AVAILABLE" : item.availability === "unavailable" ? "UNAVAILABLE" : "OBSERVED"}</span>{item.availability !== "available" && <button type="button" onClick={() => void updateAvailability(item.id, "available")} disabled={updatingId === item.id} style={actionButton}>{updatingId === item.id ? "…" : "MARK AVAILABLE"}</button>}{item.availability === "available" && <button type="button" onClick={() => void updateAvailability(item.id, "unavailable")} disabled={updatingId === item.id} style={secondaryActionButton}>{updatingId === item.id ? "…" : "MARK OUT"}</button>}</div></article>)}</div></section>}

          {tab === "observations" && <section style={sectionPanel}><div style={sectionHeading}><h2 style={sectionTitle}>Observations</h2><span style={muted}>{memory.counts.observations}</span></div><div style={itemStack}>{memory.observations.length === 0 && <Empty text="Observations appear here as QRE sees and records reality." />}{memory.observations.map((observation) => <article key={observation.id} style={memoryRow}><div><strong>{observation.type}</strong><div style={valueText}>{formatValue(observation.value)}</div><div style={metaText}>{observation.source} · confidence {Math.round(observation.confidence * 100)}% · {new Date(observation.observedAt).toLocaleString()}</div></div></article>)}</div></section>}

          {tab === "patterns" && <section style={sectionPanel}><div style={sectionHeading}><h2 style={sectionTitle}>Patterns</h2><span style={muted}>{memory.counts.patterns}</span></div><div style={itemStack}>{memory.patterns.length === 0 && <Empty text="Patterns emerge as observations repeat over time." />}{memory.patterns.map((pattern) => <article key={pattern.id} style={memoryRow}><div><strong>{pattern.statement}</strong><div style={valueText}>{pattern.type}</div><div style={metaText}>strength {Math.round(pattern.strength * 100)}% · confidence {Math.round(pattern.confidence * 100)}%</div></div></article>)}</div></section>}
        </section>
      </main>
    </DashboardLayout>
  );
}

function displayCatalogName(name: string): string { return name.replace(/^Fogger\s*—\s*/i, ""); }
function Stat({ label, value }: { label: string; value: number }) { return <div style={statStyle}><div style={statValue}>{value.toLocaleString()}</div><div style={statLabel}>{label}</div></div>; }
function Empty({ text }: { text: string }) { return <div style={{ padding: 20, opacity: .38, fontSize: 12 }}>{text}</div>; }
function formatValue(value: unknown): string { if (typeof value === "string") return value; try { return JSON.stringify(value); } catch { return String(value); } }

const pageStyle: CSSProperties = { minHeight: "100vh", color: "#fff", padding: "38px 0 80px" };
const headerStyle: CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 24, marginBottom: 28, flexWrap: "wrap" };
const eyebrow: CSSProperties = { margin: 0, opacity: .3, letterSpacing: 4, fontSize: 9 };
const titleStyle: CSSProperties = { margin: "8px 0 4px", fontSize: "clamp(30px, 5vw, 52px)", fontWeight: 500, letterSpacing: "-2px" };
const subStyle: CSSProperties = { margin: 0, opacity: .45, maxWidth: 640, fontSize: 13, lineHeight: 1.6 };
const backLink: CSSProperties = { color: "rgba(255,255,255,.52)", textDecoration: "none", fontSize: 9, letterSpacing: 1.8 };
const statsGrid: CSSProperties = { display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 10, marginTop: 20 };
const statStyle: CSSProperties = { border: "1px solid rgba(255,255,255,.08)", borderRadius: 16, padding: 16, background: "rgba(255,255,255,.025)" };
const statValue: CSSProperties = { fontSize: 25, fontWeight: 700 };
const statLabel: CSSProperties = { marginTop: 4, fontSize: 9, letterSpacing: 2, opacity: .34 };
const tabs: CSSProperties = { display: "flex", gap: 8, flexWrap: "wrap", borderBottom: "1px solid rgba(255,255,255,.07)", paddingBottom: 8 };
const tabButton: CSSProperties = { border: "1px solid transparent", borderRadius: 999, background: "transparent", color: "rgba(255,255,255,.42)", padding: "8px 11px", cursor: "pointer", font: "inherit", fontSize: 9, letterSpacing: 1.3 };
const activeTabButton: CSSProperties = { color: "#fff", borderColor: "rgba(185,255,241,.22)", background: "rgba(185,255,241,.055)" };
const sectionPanel: CSSProperties = { border: "1px solid rgba(255,255,255,.08)", borderRadius: 18, background: "rgba(255,255,255,.025)", padding: 18 };
const sectionHeading: CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 10 };
const sectionTitle: CSSProperties = { margin: 0, fontSize: 17, fontWeight: 500, textTransform: "capitalize" };
const muted: CSSProperties = { opacity: .32, fontSize: 10 };
const itemStack: CSSProperties = { display: "grid", gap: 8 };
const memoryRow: CSSProperties = { display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center", padding: "13px 0", borderTop: "1px solid rgba(255,255,255,.055)" };
const catalogRow: CSSProperties = { display: "flex", justifyContent: "space-between", gap: 18, alignItems: "center", padding: "13px 0", borderTop: "1px solid rgba(255,255,255,.055)" };
const valueText: CSSProperties = { marginTop: 4, opacity: .76, fontSize: 13, lineHeight: 1.45 };
const metaText: CSSProperties = { marginTop: 5, opacity: .34, fontSize: 10 };
const catalogToolbar: CSSProperties = { display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", margin: "14px 0 4px" };
const searchInput: CSSProperties = { flex: "1 1 220px", minWidth: 180, border: "1px solid rgba(255,255,255,.1)", borderRadius: 12, background: "rgba(0,0,0,.22)", color: "#fff", padding: "10px 12px", font: "inherit", fontSize: 12, outline: "none" };
const filterGroup: CSSProperties = { display: "flex", gap: 6, flexWrap: "wrap" };
const filterButton: CSSProperties = { border: "1px solid rgba(255,255,255,.08)", borderRadius: 999, background: "rgba(255,255,255,.02)", color: "rgba(255,255,255,.45)", padding: "8px 10px", cursor: "pointer", font: "inherit", fontSize: 9, letterSpacing: 1 };
const activeFilterButton: CSSProperties = { color: "#fff", borderColor: "rgba(185,255,241,.25)", background: "rgba(185,255,241,.06)" };
const catalogActions: CSSProperties = { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" };
const availabilityBadge: CSSProperties = { borderRadius: 999, padding: "6px 8px", fontSize: 8, letterSpacing: 1.2, border: "1px solid rgba(255,255,255,.08)" };
const availableBadge: CSSProperties = { color: "rgba(185,255,241,.9)", background: "rgba(185,255,241,.055)" };
const unavailableBadge: CSSProperties = { color: "rgba(255,150,150,.85)", background: "rgba(255,80,80,.045)" };
const actionButton: CSSProperties = { border: "1px solid rgba(185,255,241,.2)", borderRadius: 10, background: "rgba(185,255,241,.06)", color: "#fff", padding: "8px 10px", cursor: "pointer", font: "inherit", fontSize: 8, letterSpacing: 1 };
const secondaryActionButton: CSSProperties = { border: "1px solid rgba(255,255,255,.08)", borderRadius: 10, background: "transparent", color: "rgba(255,255,255,.45)", padding: "8px 10px", cursor: "pointer", font: "inherit", fontSize: 8, letterSpacing: 1 };
const errorStyle: CSSProperties = { marginTop: 18, borderRadius: 12, padding: 14, background: "rgba(255,80,80,.08)", border: "1px solid rgba(255,100,100,.16)", fontSize: 12 };
const loadingStyle: CSSProperties = { minHeight: "70vh", display: "grid", placeItems: "center", color: "rgba(255,255,255,.45)", letterSpacing: 3 };
