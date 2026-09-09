import { useEffect, useMemo, useState, type ReactNode } from "react";
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

type KnowledgeState = {
  counts?: { catalog?: number; observations?: number; patterns?: number; jobs?: number };
  jobs?: Array<{
    id: string;
    status: string;
    sourceType: string;
    originalName?: string | null;
    createdAt?: string;
    completedAt?: string | null;
    result?: { factCount?: number } | null;
    error?: string | null;
  }>;
};

type AdminView = "overview" | "businesses" | "knowledge" | "operations" | "system";

const navItems: Array<[AdminView, string, string]> = [
  ["overview", "Overview", "Command center"],
  ["businesses", "Businesses", "All business worlds"],
  ["knowledge", "Knowledge", "Teach & inspect"],
  ["operations", "Operations", "Jobs & attention"],
  ["system", "System", "Capabilities & controls"],
];

const capabilityGroups = [
  {
    title: "Worlds",
    items: [
      ["Businesses", "Create, connect, search and inspect business worlds."],
      ["Knowledge", "Feed photos, PDFs, spreadsheets, text and websites."],
      ["Catalog", "See products, services, objects and learned attributes."],
      ["Observations", "Inspect what QRE has seen and when it saw it."],
    ],
  },
  {
    title: "Operations",
    items: [
      ["Patterns", "Surface repeated observations, changes and relationships."],
      ["Jobs", "Track intake, processing, completion and failures."],
      ["Alerts", "Put things needing attention in front of the operator."],
      ["Automations", "Turn conditions and learned changes into repeatable actions."],
    ],
  },
  {
    title: "Enterprise",
    items: [
      ["Analytics", "Measure scans, engagement, learning and business performance."],
      ["Integrations", "Connect websites, commerce, calendars, CRM and external systems."],
      ["Team & Access", "Control who can see and change business worlds."],
      ["Audit", "Keep a durable record of important administrative actions."],
    ],
  },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [view, setView] = useState<AdminView>("overview");
  const [assets, setAssets] = useState<AdminAsset[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "connected" | "unassigned" | "attention">("all");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [knowledge, setKnowledge] = useState<KnowledgeState | null>(null);
  const [knowledgeLoading, setKnowledgeLoading] = useState(false);

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

  useEffect(() => { void loadAssets(true); }, []);

  const selected = useMemo(() => assets.find((asset) => asset.id === selectedId) ?? assets[0] ?? null, [assets, selectedId]);

  useEffect(() => {
    if (!selected?.slug) { setKnowledge(null); return; }
    let cancelled = false;
    setKnowledgeLoading(true);
    void apiGet(`/api/knowledge/${encodeURIComponent(selected.slug)}/state`)
      .then((result) => { if (!cancelled) setKnowledge(result as KnowledgeState); })
      .catch(() => { if (!cancelled) setKnowledge(null); })
      .finally(() => { if (!cancelled) setKnowledgeLoading(false); });
    return () => { cancelled = true; };
  }, [selected?.slug]);

  const visibleAssets = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return assets.filter((asset) => {
      const unassigned = !asset.accountId;
      const attention = Boolean(asset.status && asset.status !== "active");
      if (filter === "connected" && unassigned) return false;
      if (filter === "unassigned" && !unassigned) return false;
      if (filter === "attention" && !attention) return false;
      if (!normalized) return true;
      return [asset.displayName, asset.slug, asset.category].filter(Boolean).some((value) => String(value).toLowerCase().includes(normalized));
    });
  }, [assets, filter, query]);

  const stats = useMemo(() => ({
    businesses: assets.length,
    connected: assets.filter((asset) => Boolean(asset.accountId)).length,
    unassigned: assets.filter((asset) => !asset.accountId).length,
    scans: assets.reduce((sum, asset) => sum + Number(asset.totalScans ?? 0), 0),
    unlocks: assets.reduce((sum, asset) => sum + Number(asset.totalUnlocks ?? 0), 0),
  }), [assets]);

  const health = stats.unassigned === 0 ? "HEALTHY" : "READY TO CONNECT";

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

  function selectBusiness(id: string) {
    setSelectedId(id);
    setView("businesses");
  }

  return (
    <main style={page}>
      <aside style={sidebar}>
        <button type="button" onClick={() => navigate("/dashboard")} style={logoButton} aria-label="Return to QRE">QRE</button>
        <div style={sidebarLabel}>ADMIN</div>
        <nav style={sideNav}>
          {navItems.map(([key, label, hint]) => (
            <button key={key} type="button" onClick={() => setView(key)} style={{ ...sideNavButton, ...(view === key ? sideNavActive : {}) }}>
              <span>{label}</span><small>{hint}</small>
            </button>
          ))}
        </nav>
        <div style={sidebarBottom}>
          <div style={healthDot}><span style={healthDotSpan} /> {health}</div>
          <Link to="/admin/create" style={addBusiness}>+ Add business</Link>
        </div>
      </aside>

      <section style={mainArea}>
        <header style={topBar}>
          <div>
            <div style={eyebrow}>CONTROL CENTER / {view.toUpperCase()}</div>
            <div style={topTitle}>{view === "overview" ? "Command center" : navItems.find(([key]) => key === view)?.[1]}</div>
          </div>
          <div style={topActions}>
            <button type="button" onClick={() => void loadAssets()} style={iconButton} title="Refresh">↻</button>
            <Link to="/dashboard" style={quietLink}>Exit admin</Link>
          </div>
        </header>

        {error ? <div style={errorBox}>{error}</div> : null}

        {loading ? <div style={loadingBox}>Preparing QRE control center…</div> : (
          <>
            {view === "overview" && (
              <section style={contentStack}>
                <section style={hero}>
                  <div style={heroTop}>
                    <span style={statusPill}>{health}</span>
                    <span style={heroDate}>LIVE BUSINESS CONTROL</span>
                  </div>
                  <h1 style={heroTitle}>Everything QRE knows.<br />One place to run it.</h1>
                  <p style={heroText}>Choose a business, add knowledge, see what changed, and move straight into the next action.</p>
                  <div style={heroActions}>
                    <button type="button" onClick={() => setView("businesses")} style={primaryButton}>Open businesses</button>
                    <button type="button" onClick={() => setView("knowledge")} style={secondaryButton}>Teach QRE</button>
                  </div>
                </section>

                <section style={metricGrid}>
                  <Metric value={stats.businesses} label="Business worlds" />
                  <Metric value={stats.connected} label="Connected" />
                  <Metric value={stats.unassigned} label="Available" />
                  <Metric value={stats.scans} label="Scans" />
                  <Metric value={Number(knowledge?.counts?.patterns ?? 0)} label="Patterns · selected world" muted={!selected} />
                </section>

                <section style={dashboardGrid}>
                  <section style={panel}>
                    <PanelHeader eyebrow="YOUR WORLDS" title="Businesses" action={<button type="button" onClick={() => setView("businesses")} style={tinyButton}>View all</button>} />
                    <div style={compactList}>{assets.slice(0, 7).map((asset) => <button key={asset.id} type="button" onClick={() => selectBusiness(asset.id)} style={worldRow}><span><strong style={worldRowStrong}>{asset.displayName || asset.slug}</strong><small style={worldRowSmall}>{asset.category || "QRE world"}</small></span><span style={worldStatus}>{asset.accountId ? "Connected" : "Available"}</span></button>)}</div>
                  </section>

                  <section style={panel}>
                    <PanelHeader eyebrow="SELECTED WORLD" title={selected?.displayName || "Nothing selected"} />
                    {selected ? (
                      <div style={selectedCard}>
                        <div style={selectedIdentity}><span>{selected.category || "Business"}</span><b style={selectedIdentityB}>{selected.slug}</b></div>
                        <div style={worldMetrics}>
                          <MiniStat value={Number(knowledge?.counts?.catalog ?? 0)} label="catalog" />
                          <MiniStat value={Number(knowledge?.counts?.observations ?? 0)} label="observations" />
                          <MiniStat value={Number(knowledge?.counts?.patterns ?? 0)} label="patterns" />
                          <MiniStat value={Number(knowledge?.counts?.jobs ?? 0)} label="jobs" />
                        </div>
                        <div style={heroActions}>
                          <button type="button" onClick={() => setView("knowledge")} style={primaryButton}>{knowledgeLoading ? "Loading…" : "Give QRE anything"}</button>
                          <Link to={`/dashboard/assets/${encodeURIComponent(selected.slug)}/knowledge`} style={secondaryButton}>Open memory</Link>
                        </div>
                      </div>
                    ) : <div style={emptyText}>Choose a business world to see its intelligence.</div>}
                  </section>
                </section>
              </section>
            )}

            {view === "businesses" && (
              <section style={businessLayout}>
                <aside style={businessListPanel}>
                  <div style={listHeader}><div><div style={panelKicker}>BUSINESS WORLDS</div><div style={listCount}>{assets.length} total</div></div><Link to="/admin/create" style={tinyButton}>+ New</Link></div>
                  <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search…" style={searchInput} />
                  <div style={filterBar}>{(["all", "connected", "unassigned", "attention"] as const).map((item) => <button key={item} type="button" onClick={() => setFilter(item)} style={{ ...filterButton, ...(filter === item ? filterButtonActive : {}) }}>{item}</button>)}</div>
                  <div style={assetList}>{visibleAssets.map((asset) => { const active = asset.id === selected?.id; return <button key={asset.id} type="button" onClick={() => setSelectedId(asset.id)} style={{ ...assetButton, ...(active ? assetButtonActive : {}) }}><div style={assetButtonTop}><span style={assetName}>{asset.displayName || asset.slug}</span><span style={statusPill}>{asset.accountId ? "CONNECTED" : "AVAILABLE"}</span></div><div style={assetMeta}>{asset.category || "Business"} · {asset.slug}</div></button>; })}</div>
                </aside>

                <section style={workspace}>
                  {selected ? <>
                    <div style={workspaceHeader}>
                      <div><div style={selectedKicker}>BUSINESS WORLD</div><h1 style={selectedTitle}>{selected.displayName || selected.slug}</h1><div style={selectedMeta}>{selected.category || "Business"} · {selected.slug}</div></div>
                      <div style={selectedActions}>{!selected.accountId ? <button type="button" onClick={() => void claim(selected)} disabled={busyId === selected.id} style={claimButton}>{busyId === selected.id ? "Connecting…" : "Connect to my account"}</button> : <span style={connectedBadge}>Connected</span>}<Link to={`/dashboard/assets/${encodeURIComponent(selected.slug)}/knowledge`} style={secondaryButton}>Memory</Link><Link to={`/dashboard/assets/${encodeURIComponent(selected.slug)}`} style={secondaryButton}>Business</Link></div>
                    </div>
                    <section style={commandCard}><div><div style={panelKicker}>UNIVERSAL KNOWLEDGE</div><h2 style={commandTitle}>Give QRE anything.</h2><p style={commandText}>Photo · photos · PDF · spreadsheet · text · website. Everything becomes evidence for this world.</p></div><UniversalKnowledgeIntake slug={selected.slug} onLearned={() => loadAssets()} /></section>
                  </> : <section style={emptyBox}><div style={emptyTitle}>No business selected.</div></section>}
                </section>
              </section>
            )}

            {view === "knowledge" && (
              <section style={contentStack}>
                <section style={sectionHero}><div style={panelKicker}>KNOWLEDGE OPERATIONS</div><h1 style={sectionTitle}>Teach QRE once.<br />Build the world over time.</h1><p style={sectionText}>Different sources do not create different worlds. They add evidence, observations and patterns to the selected business.</p></section>
                <div style={worldPickerBar}>{selected ? <><span style={worldPickerBarSpan}>WORLD</span><strong>{selected.displayName || selected.slug}</strong><button type="button" onClick={() => setView("businesses")} style={tinyButton}>Change</button></> : <button type="button" onClick={() => setView("businesses")} style={primaryButton}>Choose business</button>}</div>
                {selected ? <UniversalKnowledgeIntake slug={selected.slug} onLearned={() => loadAssets()} /> : null}
                {selected && knowledge?.jobs?.length ? <section style={panel}><PanelHeader eyebrow="RECENT LEARNING" title="What QRE just processed" /><div style={compactList}>{knowledge.jobs.slice(0, 12).map((job) => <div key={job.id} style={jobRow}><span><strong>{job.originalName || job.sourceType}</strong><small>{job.sourceType}</small></span><span style={jobStatus}>{job.status}</span></div>)}</div></section> : null}
              </section>
            )}

            {view === "operations" && (
              <section style={contentStack}>
                <section style={sectionHero}><div style={panelKicker}>OPERATIONS</div><h1 style={sectionTitle}>See what needs attention.</h1><p style={sectionText}>A good control plane turns hidden system state into obvious operator decisions.</p></section>
                <section style={metricGrid}><Metric value={stats.businesses} label="Worlds" /><Metric value={stats.connected} label="Connected" /><Metric value={stats.unassigned} label="Available" /><Metric value={stats.scans} label="Total scans" /><Metric value={stats.unlocks} label="Total unlocks" /></section>
                <section style={panel}><PanelHeader eyebrow="BUSINESS ACTIVITY" title="Current inventory state" action={<button type="button" onClick={() => void loadAssets()} style={tinyButton}>Refresh</button>} /><div style={compactList}>{assets.map((asset) => <button key={asset.id} type="button" onClick={() => selectBusiness(asset.id)} style={compactRow}><span><strong>{asset.displayName || asset.slug}</strong><small>{asset.accountId ? "Connected" : "Available"} · {asset.status || "active"}</small></span><span style={compactMeta}>{asset.totalScans ?? 0} scans</span></button>)}</div></section>
              </section>
            )}

            {view === "system" && (
              <section style={contentStack}>
                <section style={sectionHero}><div style={panelKicker}>SYSTEM</div><h1 style={sectionTitle}>Everything a serious business platform eventually needs.</h1><p style={sectionText}>QRE should expose capabilities as one operating system: worlds, data, workflows, intelligence, permissions and evidence.</p></section>
                {capabilityGroups.map((group) => <section key={group.title} style={capabilitySection}><div style={panelKicker}>{group.title.toUpperCase()}</div><div style={capabilityGrid}>{group.items.map(([name, description]) => <article key={name} style={capabilityCard}><div style={capabilityTitle}>{name}</div><p style={capabilityText}>{description}</p><span style={capabilityState}>{["Businesses", "Knowledge", "Catalog", "Observations", "Jobs"].includes(name) ? "AVAILABLE NOW" : "CONTROL SURFACE TO BUILD"}</span></article>)}</div></section>)}
              </section>
            )}
          </>
        )}
      </section>
    </main>
  );
}

function Metric({ value, label, muted = false }: { value: number; label: string; muted?: boolean }) {
  return <div style={{ ...metricCard, opacity: muted ? .5 : 1 }}><div style={metricValue}>{value.toLocaleString()}</div><div style={metricLabel}>{label}</div></div>;
}

function MiniStat({ value, label }: { value: number; label: string }) {
  return <div><div style={miniValue}>{value.toLocaleString()}</div><div style={miniLabel}>{label}</div></div>;
}

function PanelHeader({ eyebrow, title, action }: { eyebrow: string; title: string; action?: ReactNode }) {
  return <div style={panelHeader}><div><div style={panelKicker}>{eyebrow}</div><div style={panelTitle}>{title}</div></div>{action}</div>;
}

const page = { minHeight: "100vh", display: "grid", gridTemplateColumns: "230px minmax(0,1fr)", background: "#f5f5f2", color: "#111" };
const sidebar = { display: "flex", flexDirection: "column" as const, position: "sticky" as const, top: 0, height: "100vh", padding: "24px 16px", boxSizing: "border-box" as const, borderRight: "1px solid rgba(0,0,0,.065)", background: "rgba(250,250,248,.9)", backdropFilter: "blur(20px)" };
const logoButton = { border: 0, background: "transparent", textAlign: "left" as const, padding: "2px 8px", fontSize: 18, fontWeight: 800, letterSpacing: "-.04em", cursor: "pointer" };
const sidebarLabel = { margin: "34px 8px 10px", fontSize: 8, letterSpacing: 2.4, color: "#aaa" };
const sideNav = { display: "grid", gap: 3 };
const sideNavButton = { display: "grid", gap: 2, border: 0, borderRadius: 12, padding: "11px 10px", background: "transparent", color: "#555", textAlign: "left" as const, font: "inherit", cursor: "pointer" };
const sideNavActive = { background: "#fff", color: "#111", boxShadow: "0 4px 18px rgba(0,0,0,.05)" };
const sideNavSmall = { display: "block", marginTop: 3, fontSize: 9, color: "#999" };
const sidebarBottom = { marginTop: "auto", display: "grid", gap: 10 };
const healthDot = { display: "flex", alignItems: "center", gap: 7, padding: "10px 8px", color: "#6f6f6a", fontSize: 9, letterSpacing: 1.4, textTransform: "uppercase" as const };
const healthDotSpan = { width: 6, height: 6, borderRadius: "50%", background: "#39a76a" };
const addBusiness = { display: "flex", justifyContent: "center", padding: "11px 12px", borderRadius: 12, background: "#111", color: "#fff", textDecoration: "none", fontSize: 11, fontWeight: 700 };
const mainArea = { minWidth: 0, padding: "0 clamp(18px, 4vw, 52px) 70px" };
const topBar = { height: 84, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(0,0,0,.065)", marginBottom: 30 };
const eyebrow = { fontSize: 8, letterSpacing: 2.3, color: "#aaa" };
const topTitle = { marginTop: 5, fontSize: 14, fontWeight: 650, letterSpacing: "-.01em" };
const topActions = { display: "flex", alignItems: "center", gap: 14 };
const iconButton = { width: 30, height: 30, border: "1px solid rgba(0,0,0,.08)", borderRadius: "50%", background: "#fff", color: "#555", cursor: "pointer", fontSize: 15 };
const quietLink = { color: "#999", textDecoration: "none", fontSize: 11 };
const errorBox = { marginBottom: 18, padding: "12px 14px", borderRadius: 12, background: "#fff2f0", border: "1px solid #f0d5d1", color: "#8b3128", fontSize: 12 };
const loadingBox = { minHeight: 320, display: "grid", placeItems: "center", color: "#999", fontSize: 12 };
const contentStack = { display: "grid", gap: 16 };
const hero = { padding: "38px 40px 34px", borderRadius: 28, background: "#111", color: "#fff", boxShadow: "0 22px 70px rgba(0,0,0,.1)" };
const heroTop = { display: "flex", justifyContent: "space-between", alignItems: "center" };
const statusPill = { display: "inline-flex", alignItems: "center", borderRadius: 999, padding: "7px 10px", background: "rgba(255,255,255,.08)", color: "rgba(255,255,255,.66)", fontSize: 8, letterSpacing: 1.5 };
const heroDate = { fontSize: 8, letterSpacing: 2, color: "rgba(255,255,255,.3)" };
const heroTitle = { margin: "55px 0 0", maxWidth: 830, fontSize: "clamp(42px, 6.4vw, 82px)", lineHeight: .92, letterSpacing: "-5px", fontWeight: 600 };
const heroText = { maxWidth: 670, margin: "22px 0 0", color: "rgba(255,255,255,.52)", fontSize: 15, lineHeight: 1.55 };
const heroActions = { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" as const, marginTop: 24 };
const primaryButton = { display: "inline-flex", alignItems: "center", justifyContent: "center", border: 0, borderRadius: 999, padding: "11px 16px", background: "#fff", color: "#111", textDecoration: "none", font: "inherit", fontSize: 11, fontWeight: 800, cursor: "pointer" };
const secondaryButton = { display: "inline-flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(0,0,0,.09)", borderRadius: 999, padding: "10px 14px", background: "#fff", color: "#333", textDecoration: "none", font: "inherit", fontSize: 10, fontWeight: 700, cursor: "pointer" };
const metricGrid = { display: "grid", gridTemplateColumns: "repeat(5, minmax(0,1fr))", gap: 9 };
const metricCard = { padding: "19px 18px 16px", borderRadius: 18, background: "#fff", border: "1px solid rgba(0,0,0,.06)" };
const metricValue = { fontSize: 28, letterSpacing: "-1.4px", fontWeight: 650 };
const metricLabel = { marginTop: 7, color: "#a1a19d", fontSize: 8, letterSpacing: 1.5, textTransform: "uppercase" as const };
const dashboardGrid = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 };
const panel = { background: "#fff", border: "1px solid rgba(0,0,0,.06)", borderRadius: 22, overflow: "hidden" };
const panelHeader = { minHeight: 74, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, padding: "16px 20px", borderBottom: "1px solid rgba(0,0,0,.055)" };
const panelKicker = { fontSize: 8, letterSpacing: 2.2, color: "#aaa" };
const panelTitle = { marginTop: 5, fontSize: 19, fontWeight: 650, letterSpacing: "-.5px" };
const tinyButton = { display: "inline-flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(0,0,0,.09)", borderRadius: 999, padding: "7px 10px", background: "#fff", color: "#555", font: "inherit", fontSize: 9, cursor: "pointer", textDecoration: "none" };
const compactList = { display: "grid" };
const worldRow = { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, width: "100%", padding: "14px 20px", border: 0, borderTop: "1px solid rgba(0,0,0,.05)", background: "#fff", textAlign: "left" as const, cursor: "pointer" };
const worldRowStrong = { display: "block", fontSize: 12, fontWeight: 700 };
const worldRowSmall = { display: "block", marginTop: 4, color: "#999", fontSize: 9 };
const worldStatus = { flexShrink: 0, color: "#7b7b76", fontSize: 9 };
const selectedCard = { padding: 20 };
const selectedIdentity = { display: "flex", justifyContent: "space-between", gap: 10, color: "#999", fontSize: 10 };
const selectedIdentityB = { color: "#555", fontWeight: 500 };
const worldMetrics = { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, margin: "26px 0" };
const miniValue = { fontSize: 22, fontWeight: 650, letterSpacing: "-1px" };
const miniLabel = { marginTop: 3, color: "#aaa", fontSize: 8, letterSpacing: 1.2, textTransform: "uppercase" as const };
const emptyText = { padding: 24, color: "#999", fontSize: 12 };
const businessLayout = { display: "grid", gridTemplateColumns: "minmax(280px,340px) minmax(0,1fr)", gap: 18, alignItems: "start" };
const businessListPanel = { background: "#fff", border: "1px solid rgba(0,0,0,.06)", borderRadius: 22, overflow: "hidden", position: "sticky" as const, top: 20, maxHeight: "calc(100vh - 120px)", display: "flex", flexDirection: "column" as const };
const listHeader = { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "17px 16px 12px" };
const listCount = { marginTop: 5, fontSize: 13, fontWeight: 600 };
const searchInput = { margin: "0 12px 10px", width: "calc(100% - 24px)", boxSizing: "border-box" as const, border: "1px solid rgba(0,0,0,.09)", borderRadius: 12, padding: "10px 12px", background: "#fafaf8", outline: 0, font: "inherit", fontSize: 12 };
const filterBar = { display: "flex", gap: 5, padding: "0 12px 11px", flexWrap: "wrap" as const };
const filterButton = { border: 0, borderRadius: 999, padding: "6px 9px", background: "#f2f2ee", color: "#888", font: "inherit", fontSize: 8, cursor: "pointer" };
const filterButtonActive = { background: "#111", color: "#fff" };
const assetList = { overflowY: "auto" as const, flex: 1, borderTop: "1px solid rgba(0,0,0,.05)" };
const assetButton = { width: "100%", padding: "14px 16px", border: 0, borderBottom: "1px solid rgba(0,0,0,.045)", background: "#fff", textAlign: "left" as const, cursor: "pointer" };
const assetButtonActive = { background: "#f4f4f1" };
const assetButtonTop = { display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" };
const assetName = { fontSize: 12, fontWeight: 700 };
const assetMeta = { marginTop: 5, color: "#a0a09b", fontSize: 8, overflow: "hidden", textOverflow: "ellipsis" as const, whiteSpace: "nowrap" as const };
const workspace = { minWidth: 0 };
const workspaceHeader = { display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 18, marginBottom: 18 };
const selectedKicker = { fontSize: 8, letterSpacing: 2.4, color: "#aaa" };
const selectedTitle = { margin: "7px 0 4px", fontSize: "clamp(34px, 5vw, 58px)", lineHeight: .95, letterSpacing: "-3px", fontWeight: 600 };
const selectedMeta = { color: "#999", fontSize: 10 };
const selectedActions = { display: "flex", flexWrap: "wrap" as const, justifyContent: "flex-end", gap: 7 };
const claimButton = { border: 0, borderRadius: 999, padding: "10px 14px", background: "#111", color: "#fff", fontSize: 10, fontWeight: 800, cursor: "pointer" };
const connectedBadge = { display: "inline-flex", alignItems: "center", borderRadius: 999, padding: "10px 13px", background: "#eaf5ee", color: "#2e7b4f", fontSize: 9, fontWeight: 700 };
const commandCard = { display: "grid", gap: 18, padding: 24, background: "#fff", border: "1px solid rgba(0,0,0,.06)", borderRadius: 22 };
const commandTitle = { margin: "5px 0 0", fontSize: 30, letterSpacing: "-1.3px" };
const commandText = { maxWidth: 680, margin: "7px 0 0", color: "#8e8e89", fontSize: 12, lineHeight: 1.55 };
const sectionHero = { padding: "12px 0 10px" };
const sectionTitle = { margin: "10px 0 0", fontSize: "clamp(38px, 6vw, 70px)", lineHeight: .95, letterSpacing: "-4px", fontWeight: 600 };
const sectionText = { maxWidth: 740, margin: "16px 0 0", color: "#858580", fontSize: 14, lineHeight: 1.55 };
const worldPickerBar = { display: "flex", alignItems: "center", gap: 12, minHeight: 48, padding: "0 14px", background: "#fff", border: "1px solid rgba(0,0,0,.06)", borderRadius: 14, fontSize: 11 };
const worldPickerBarSpan = { color: "#aaa", fontSize: 8, letterSpacing: 1.8 };
const jobRow = { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "14px 20px", borderTop: "1px solid rgba(0,0,0,.05)", fontSize: 11 };
const jobStatus = { color: "#777", fontSize: 8, textTransform: "uppercase" as const, letterSpacing: 1.1 };
const compactRow = { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, width: "100%", textAlign: "left" as const, border: 0, borderTop: "1px solid rgba(0,0,0,.05)", padding: "14px 20px", background: "#fff", cursor: "pointer" };
const compactMeta = { color: "#aaa", fontSize: 8, letterSpacing: 1.2, textTransform: "uppercase" as const };
const emptyBox = { padding: 50, borderRadius: 22, background: "#fff", border: "1px solid rgba(0,0,0,.06)", textAlign: "center" as const };
const emptyTitle = { fontSize: 25, marginBottom: 8 };
const capabilitySection = { display: "grid", gap: 11 };
const capabilityGrid = { display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 10 };
const capabilityCard = { minHeight: 165, padding: 18, borderRadius: 18, background: "#fff", border: "1px solid rgba(0,0,0,.06)" };
const capabilityTitle = { fontSize: 17, fontWeight: 700, letterSpacing: "-.4px" };
const capabilityText = { margin: "8px 0 0", color: "#8b8b86", fontSize: 11, lineHeight: 1.5 };
const capabilityState = { display: "inline-block", marginTop: 17, color: "#aaa", fontSize: 7, letterSpacing: 1.3, textTransform: "uppercase" as const };
