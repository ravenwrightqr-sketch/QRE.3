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

type KnowledgeState = {
  counts?: {
    catalog?: number;
    observations?: number;
    patterns?: number;
    jobs?: number;
  };
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

type AdminView = "overview" | "businesses" | "knowledge" | "activity" | "capabilities";

const capabilityGroups = [
  {
    title: "Business control",
    items: [
      ["Businesses", "Create, connect, search, inspect and manage every QRE business world."],
      ["Knowledge", "Feed photos, PDFs, spreadsheets, text and websites into one durable world."],
      ["Catalog", "See the products, services, objects and attributes QRE has learned."],
      ["Observations", "Inspect what QRE has seen and when it was observed."],
    ],
  },
  {
    title: "Operations",
    items: [
      ["Activity", "See intake jobs, learning status, failures and recent system work."],
      ["Patterns", "Surface repeated observations, changes and relationships across the business world."],
      ["Automations", "Turn conditions and learned changes into repeatable actions."],
      ["Alerts", "Show operators what needs attention instead of making them hunt for it."],
    ],
  },
  {
    title: "Enterprise control",
    items: [
      ["Analytics", "Measure scans, learning, engagement, assets and business performance."],
      ["Integrations", "Connect QRE to websites, commerce, calendars, storage, CRM and external systems."],
      ["Team & Access", "Control who can see and change business worlds and operational surfaces."],
      ["Audit", "Keep a durable record of important administrative and data-changing actions."],
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

  useEffect(() => {
    void loadAssets(true);
  }, []);

  const selected = useMemo(
    () => assets.find((asset) => asset.id === selectedId) ?? assets[0] ?? null,
    [assets, selectedId],
  );

  const visibleAssets = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return assets.filter((asset) => {
      const unassigned = !asset.accountId;
      const attention = asset.status && asset.status !== "active";
      if (filter === "connected" && unassigned) return false;
      if (filter === "unassigned" && !unassigned) return false;
      if (filter === "attention" && !attention) return false;
      if (!normalized) return true;
      return [asset.displayName, asset.slug, asset.category]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalized));
    });
  }, [assets, query, filter]);

  const stats = useMemo(() => ({
    businesses: assets.length,
    connected: assets.filter((asset) => Boolean(asset.accountId)).length,
    unassigned: assets.filter((asset) => !asset.accountId).length,
    scans: assets.reduce((sum, asset) => sum + Number(asset.totalScans ?? 0), 0),
    unlocks: assets.reduce((sum, asset) => sum + Number(asset.totalUnlocks ?? 0), 0),
  }), [assets]);

  useEffect(() => {
    if (!selected?.slug) {
      setKnowledge(null);
      return;
    }

    let cancelled = false;
    setKnowledgeLoading(true);
    void apiGet(`/api/knowledge/${encodeURIComponent(selected.slug)}/state`)
      .then((result) => {
        if (!cancelled) setKnowledge(result as KnowledgeState);
      })
      .catch(() => {
        if (!cancelled) setKnowledge(null);
      })
      .finally(() => {
        if (!cancelled) setKnowledgeLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selected?.slug]);

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
      <header style={header}>
        <div>
          <div style={kicker}>QRE ADMIN / CONTROL PLANE</div>
          <h1 style={title}>Run QRE.</h1>
          <p style={subtitle}>One place to manage businesses, knowledge, operations, intelligence and the systems around them.</p>
        </div>
        <div style={headerActions}>
          <Link to="/admin/create" style={primaryButton}>+ Add business</Link>
          <button type="button" onClick={() => navigate("/dashboard")} style={secondaryButton}>Back to QRE</button>
        </div>
      </header>

      <nav style={navBar} aria-label="QRE admin sections">
        {(["overview", "businesses", "knowledge", "activity", "capabilities"] as AdminView[]).map((item) => (
          <button key={item} type="button" onClick={() => setView(item)} style={{ ...navButton, ...(view === item ? navButtonActive : {}) }}>
            {item === "businesses" ? "Businesses" : item.charAt(0).toUpperCase() + item.slice(1)}
          </button>
        ))}
      </nav>

      {error ? <div style={errorBox}>{error}</div> : null}

      {loading ? (
        <div style={loadingBox}>LOADING QRE CONTROL PLANE…</div>
      ) : (
        <>
          {view === "overview" ? (
            <section style={overviewStack}>
              <div style={metricGrid}>
                <Metric value={stats.businesses} label="Business worlds" />
                <Metric value={stats.connected} label="Connected" />
                <Metric value={stats.unassigned} label="Available" />
                <Metric value={stats.scans} label="Scans" />
                <Metric value={stats.unlocks} label="Unlocks" />
              </div>

              <section style={heroCard}>
                <div style={heroEyebrow}>UNIVERSAL CONTROL</div>
                <div style={heroTitle}>Choose a world. QRE handles the complexity.</div>
                <div style={heroText}>Find a business, see what QRE knows, add new evidence, inspect what changed, and move directly into creation.</div>
                <div style={heroActions}>
                  <button type="button" onClick={() => setView("businesses")} style={primaryButton}>Open businesses</button>
                  <button type="button" onClick={() => setView("capabilities")} style={secondaryButton}>See capabilities</button>
                </div>
              </section>

              <section style={splitGrid}>
                <section style={panel}>
                  <div style={panelHeader}>
                    <div>
                      <div style={panelKicker}>RECENT WORLDS</div>
                      <div style={panelTitle}>Businesses</div>
                    </div>
                    <button type="button" onClick={() => setView("businesses")} style={tinyButton}>View all</button>
                  </div>
                  <div style={compactList}>
                    {assets.slice(0, 6).map((asset) => (
                      <button key={asset.id} type="button" onClick={() => selectBusiness(asset.id)} style={compactRow}>
                        <span style={compactName}>{asset.displayName || asset.slug}</span>
                        <span style={compactMeta}>{asset.accountId ? "CONNECTED" : "UNASSIGNED"}</span>
                      </button>
                    ))}
                  </div>
                </section>

                <section style={panel}>
                  <div style={panelHeader}>
                    <div>
                      <div style={panelKicker}>SELECTED WORLD</div>
                      <div style={panelTitle}>{selected?.displayName || "None selected"}</div>
                    </div>
                  </div>
                  {selected ? (
                    <div style={worldSummary}>
                      <div style={summaryLine}><span>Knowledge</span><strong>{knowledgeLoading ? "…" : Number(knowledge?.counts?.catalog ?? 0) + Number(knowledge?.counts?.observations ?? 0)}</strong></div>
                      <div style={summaryLine}><span>Patterns</span><strong>{Number(knowledge?.counts?.patterns ?? 0)}</strong></div>
                      <div style={summaryLine}><span>Jobs</span><strong>{Number(knowledge?.counts?.jobs ?? 0)}</strong></div>
                      <div style={heroActions}>
                        <button type="button" onClick={() => setView("knowledge")} style={primaryButton}>Give QRE anything</button>
                        <Link to={`/dashboard/assets/${encodeURIComponent(selected.slug)}/knowledge`} style={secondaryButton}>Open memory</Link>
                      </div>
                    </div>
                  ) : <div style={muted}>Create or connect a business to begin.</div>}
                </section>
              </section>
            </section>
          ) : null}

          {view === "businesses" ? (
            <section style={layout}>
              <aside style={listPanel}>
                <div style={panelLabel}>BUSINESS INVENTORY · {assets.length}</div>
                <div style={searchWrap}>
                  <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search businesses…" style={searchInput} />
                </div>
                <div style={filterBar}>
                  {(["all", "connected", "unassigned", "attention"] as const).map((item) => (
                    <button key={item} type="button" onClick={() => setFilter(item)} style={{ ...filterButton, ...(filter === item ? filterButtonActive : {}) }}>{item}</button>
                  ))}
                </div>
                <div style={assetList}>
                  {visibleAssets.map((asset) => {
                    const active = asset.id === selected?.id;
                    const unassigned = !asset.accountId;
                    return (
                      <button key={asset.id} type="button" onClick={() => setSelectedId(asset.id)} style={{ ...assetButton, ...(active ? assetButtonActive : {}) }}>
                        <div style={assetButtonTop}>
                          <span style={assetName}>{asset.displayName || asset.slug}</span>
                          <span style={statusPill}>{unassigned ? "UNASSIGNED" : "CONNECTED"}</span>
                        </div>
                        <div style={assetMeta}>{asset.category || "QRE world"} · {asset.slug}</div>
                      </button>
                    );
                  })}
                  {!visibleAssets.length ? <div style={emptyList}>No businesses match that filter.</div> : null}
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
                        {!selected.accountId ? <button type="button" onClick={() => void claim(selected)} disabled={busyId === selected.id} style={claimButton}>{busyId === selected.id ? "Connecting…" : "Connect to my account"}</button> : null}
                        <Link to={`/dashboard/assets/${encodeURIComponent(selected.slug)}/knowledge`} style={secondaryButton}>Open memory</Link>
                        <Link to={`/dashboard/assets/${encodeURIComponent(selected.slug)}`} style={secondaryButton}>Open business</Link>
                      </div>
                    </div>

                    <section style={knowledgeCommand}>
                      <div style={instructionKicker}>UNIVERSAL KNOWLEDGE INBOX</div>
                      <div style={instructionTitle}>Give QRE anything.</div>
                      <div style={instructionText}>Photo, photos, PDF, spreadsheet, text or website. Everything lands in this business world.</div>
                      <UniversalKnowledgeIntake slug={selected.slug} onLearned={() => loadAssets()} />
                    </section>
                  </>
                ) : <section style={emptyBox}><div style={emptyTitle}>No business selected.</div></section>}
              </section>
            </section>
          ) : null}

          {view === "knowledge" ? (
            <section style={knowledgePage}>
              <div style={sectionIntro}>
                <div style={panelKicker}>KNOWLEDGE OPERATIONS</div>
                <h2 style={sectionTitle}>Teach QRE without thinking about the database.</h2>
                <p style={sectionText}>Pick the world once. Every source becomes evidence for that same business world.</p>
              </div>
              <div style={businessStrip}>
                {selected ? <><span style={businessStripLabel}>WORLD</span><strong>{selected.displayName || selected.slug}</strong><button type="button" onClick={() => setView("businesses")} style={tinyButton}>Change</button></> : <button type="button" onClick={() => setView("businesses")} style={primaryButton}>Choose a business</button>}
              </div>
              {selected ? <UniversalKnowledgeIntake slug={selected.slug} onLearned={() => loadAssets()} /> : null}
              {selected && knowledge?.jobs?.length ? (
                <section style={panel}>
                  <div style={panelHeader}><div><div style={panelKicker}>RECENT JOBS</div><div style={panelTitle}>Learning activity</div></div></div>
                  <div style={compactList}>{knowledge.jobs.slice(0, 12).map((job) => <div key={job.id} style={jobRow}><span><strong>{job.originalName || job.sourceType}</strong><small>{job.sourceType}</small></span><span style={jobStatus}>{job.status}</span></div>)}</div>
                </section>
              ) : null}
            </section>
          ) : null}

          {view === "activity" ? (
            <section style={knowledgePage}>
              <div style={sectionIntro}><div style={panelKicker}>OPERATIONS</div><h2 style={sectionTitle}>What is happening in QRE?</h2><p style={sectionText}>A unified operator surface for learning jobs and business state. This is where failures become visible instead of hidden.</p></div>
              <section style={panel}>
                <div style={panelHeader}><div><div style={panelKicker}>GLOBAL ACTIVITY</div><div style={panelTitle}>Recent business activity</div></div><button type="button" onClick={() => void loadAssets()} style={tinyButton}>Refresh</button></div>
                <div style={compactList}>
                  {assets.slice(0, 20).map((asset) => <button key={asset.id} type="button" onClick={() => selectBusiness(asset.id)} style={compactRow}><span><span style={compactName}>{asset.displayName || asset.slug}</span><span style={compactMeta}>{asset.status || "unknown"} · {asset.accountId ? "connected" : "unassigned"}</span></span><span style={compactMeta}>{asset.totalScans ?? 0} scans</span></button>)}
                </div>
              </section>
            </section>
          ) : null}

          {view === "capabilities" ? (
            <section style={knowledgePage}>
              <div style={sectionIntro}><div style={panelKicker}>QRE ADMIN CAPABILITY MAP</div><h2 style={sectionTitle}>The control plane is bigger than the asset list.</h2><p style={sectionText}>These are the recurring capabilities mature business platforms expose. QRE should make them feel like one connected system instead of separate products.</p></div>
              <div style={capabilityGrid}>{capabilityGroups.flatMap((group) => group.items.map(([name, description]) => <article key={name} style={capabilityCard}><div style={capabilityGroup}>{group.title}</div><h3 style={capabilityTitle}>{name}</h3><p style={capabilityText}>{description}</p><span style={capabilityState}>{["Businesses", "Knowledge", "Catalog", "Observations", "Activity"].includes(name) ? "LIVE IN QRE" : "NEXT CONTROL SURFACE"}</span></article>))}</div>
            </section>
          ) : null}
        </>
      )}
    </main>
  );
}

function Metric({ value, label }: { value: number; label: string }) {
  return <div style={metricCard}><div style={metricValue}>{value.toLocaleString()}</div><div style={metricLabel}>{label}</div></div>;
}

const page = { minHeight: "100vh", padding: "34px clamp(16px, 4vw, 52px) 80px", background: "radial-gradient(circle at 70% 10%, rgba(0,255,210,.08), transparent 30%), #050608", color: "#f4ffff", boxSizing: "border-box" as const, fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" };
const header = { display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 24, marginBottom: 18 };
const kicker = { fontSize: 9, letterSpacing: 4, opacity: .34 };
const title = { margin: "8px 0 0", fontSize: "clamp(46px, 8vw, 92px)", lineHeight: .9, fontWeight: 500, letterSpacing: "-5px" };
const subtitle = { maxWidth: 720, margin: "16px 0 0", fontSize: 15, lineHeight: 1.5, color: "rgba(255,255,255,.48)" };
const headerActions = { display: "flex", gap: 8, flexWrap: "wrap" as const };
const navBar = { display: "flex", gap: 6, padding: "6px 0 24px", flexWrap: "wrap" as const };
const navButton = { border: "1px solid transparent", borderRadius: 999, padding: "9px 14px", background: "transparent", color: "rgba(255,255,255,.4)", font: "inherit", fontSize: 10, cursor: "pointer" };
const navButtonActive = { borderColor: "rgba(255,255,255,.12)", background: "rgba(255,255,255,.05)", color: "#fff" };
const primaryButton = { display: "inline-flex", alignItems: "center", justifyContent: "center", textDecoration: "none", border: 0, borderRadius: 999, padding: "11px 16px", background: "#fff", color: "#050608", fontSize: 11, fontWeight: 800, cursor: "pointer" };
const secondaryButton = { display: "inline-flex", alignItems: "center", justifyContent: "center", textDecoration: "none", border: "1px solid rgba(255,255,255,.13)", borderRadius: 999, padding: "10px 14px", background: "rgba(255,255,255,.035)", color: "#fff", fontSize: 10, fontWeight: 700, cursor: "pointer" };
const tinyButton = { border: "1px solid rgba(255,255,255,.1)", borderRadius: 999, padding: "7px 10px", background: "transparent", color: "rgba(255,255,255,.6)", font: "inherit", fontSize: 9, cursor: "pointer" };
const errorBox = { marginBottom: 18, padding: "12px 14px", borderRadius: 14, background: "rgba(255,70,70,.08)", border: "1px solid rgba(255,90,90,.18)", fontSize: 12 };
const loadingBox = { padding: 34, borderRadius: 22, border: "1px solid rgba(255,255,255,.08)", color: "rgba(255,255,255,.5)", letterSpacing: 2, fontSize: 10 };
const overviewStack = { display: "grid", gap: 16 };
const metricGrid = { display: "grid", gridTemplateColumns: "repeat(5, minmax(0,1fr))", gap: 9 };
const metricCard = { padding: "18px 18px 16px", borderRadius: 18, border: "1px solid rgba(255,255,255,.08)", background: "rgba(255,255,255,.025)" };
const metricValue = { fontSize: 27, letterSpacing: "-1px" };
const metricLabel = { marginTop: 6, fontSize: 9, letterSpacing: 1.8, textTransform: "uppercase" as const, opacity: .3 };
const heroCard = { padding: 28, borderRadius: 24, border: "1px solid rgba(255,255,255,.09)", background: "linear-gradient(135deg, rgba(255,255,255,.045), rgba(0,255,210,.035))" };
const heroEyebrow = { fontSize: 8, letterSpacing: 3, opacity: .3 };
const heroTitle = { marginTop: 9, maxWidth: 850, fontSize: "clamp(27px, 4vw, 46px)", lineHeight: 1.04, letterSpacing: "-1.8px" };
const heroText = { maxWidth: 760, marginTop: 12, color: "rgba(255,255,255,.46)", fontSize: 13, lineHeight: 1.55 };
const heroActions = { display: "flex", gap: 8, flexWrap: "wrap" as const, marginTop: 18 };
const splitGrid = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 };
const panel = { border: "1px solid rgba(255,255,255,.08)", borderRadius: 22, background: "rgba(255,255,255,.025)", overflow: "hidden" };
const panelHeader = { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, padding: "18px 20px", borderBottom: "1px solid rgba(255,255,255,.06)" };
const panelKicker = { fontSize: 8, letterSpacing: 2.6, opacity: .3 };
const panelTitle = { marginTop: 6, fontSize: 20, letterSpacing: "-.5px" };
const compactList = { display: "grid" };
const compactRow = { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, width: "100%", textAlign: "left" as const, border: 0, borderTop: "1px solid rgba(255,255,255,.05)", padding: "13px 18px", background: "transparent", color: "#fff", font: "inherit", cursor: "pointer" };
const compactName = { display: "block", fontSize: 12, fontWeight: 700 };
const compactMeta = { display: "block", marginTop: 4, color: "rgba(255,255,255,.3)", fontSize: 8, letterSpacing: 1.2, textTransform: "uppercase" as const };
const worldSummary = { padding: 18 };
const summaryLine = { display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,.05)", color: "rgba(255,255,255,.46)", fontSize: 11 };
const muted = { padding: 20, color: "rgba(255,255,255,.35)", fontSize: 12 };
const layout = { display: "grid", gridTemplateColumns: "minmax(280px,350px) minmax(0,1fr)", gap: 18, alignItems: "start" };
const listPanel = { border: "1px solid rgba(255,255,255,.08)", borderRadius: 22, background: "rgba(255,255,255,.025)", overflow: "hidden", position: "sticky" as const, top: 20, maxHeight: "calc(100vh - 120px)", display: "flex", flexDirection: "column" as const };
const panelLabel = { padding: "14px 16px 10px", color: "rgba(255,255,255,.35)", fontSize: 9, letterSpacing: 2 };
const searchWrap = { padding: "0 12px 10px" };
const searchInput = { width: "100%", boxSizing: "border-box" as const, border: "1px solid rgba(255,255,255,.1)", borderRadius: 12, padding: "10px 12px", background: "rgba(255,255,255,.035)", color: "#fff", outline: "none", font: "inherit", fontSize: 12 };
const filterBar = { display: "flex", gap: 5, padding: "0 12px 12px", flexWrap: "wrap" as const };
const filterButton = { border: "1px solid rgba(255,255,255,.07)", borderRadius: 999, padding: "6px 9px", background: "transparent", color: "rgba(255,255,255,.34)", font: "inherit", fontSize: 8, cursor: "pointer" };
const filterButtonActive = { background: "rgba(0,255,210,.07)", borderColor: "rgba(0,255,210,.18)", color: "#cffff6" };
const assetList = { overflowY: "auto" as const, flex: 1 };
const assetButton = { width: "100%", textAlign: "left" as const, border: 0, borderTop: "1px solid rgba(255,255,255,.06)", padding: 16, background: "transparent", color: "#fff", cursor: "pointer" };
const assetButtonActive = { background: "rgba(0,255,210,.06)" };
const assetButtonTop = { display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" };
const assetName = { fontSize: 14, fontWeight: 700 };
const statusPill = { flexShrink: 0, borderRadius: 999, padding: "5px 7px", background: "rgba(255,255,255,.06)", color: "rgba(255,255,255,.42)", fontSize: 7, letterSpacing: 1 };
const assetMeta = { marginTop: 7, color: "rgba(255,255,255,.34)", fontSize: 10, overflow: "hidden", textOverflow: "ellipsis" as const };
const emptyList = { padding: 18, color: "rgba(255,255,255,.32)", fontSize: 11 };
const workspace = { minWidth: 0 };
const selectedHeader = { display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 18, marginBottom: 18 };
const selectedKicker = { fontSize: 8, letterSpacing: 2.8, opacity: .3 };
const selectedTitle = { margin: "7px 0 5px", fontSize: "clamp(28px, 4vw, 46px)", fontWeight: 520, letterSpacing: "-2px" };
const selectedMeta = { color: "rgba(255,255,255,.34)", fontSize: 11 };
const selectedActions = { display: "flex", flexWrap: "wrap" as const, justifyContent: "flex-end", gap: 7 };
const claimButton = { border: "1px solid rgba(0,255,210,.26)", borderRadius: 999, padding: "10px 14px", background: "rgba(0,255,210,.08)", color: "#cffff6", fontSize: 10, fontWeight: 800, cursor: "pointer" };
const knowledgeCommand = { display: "grid", gap: 12 };
const instructionKicker = { fontSize: 8, letterSpacing: 2.5, opacity: .3 };
const instructionTitle = { marginTop: 7, fontSize: 22, letterSpacing: "-.8px" };
const instructionText = { marginTop: 5, color: "rgba(255,255,255,.46)", fontSize: 12, lineHeight: 1.5 };
const emptyBox = { padding: 44, borderRadius: 26, border: "1px solid rgba(255,255,255,.09)", background: "rgba(255,255,255,.025)", textAlign: "center" as const };
const emptyTitle = { fontSize: 28, marginBottom: 10 };
const knowledgePage = { display: "grid", gap: 16 };
const sectionIntro = { padding: "8px 0 4px" };
const sectionTitle = { margin: "8px 0 0", maxWidth: 850, fontSize: "clamp(30px, 5vw, 56px)", lineHeight: 1, letterSpacing: "-2.5px", fontWeight: 520 };
const sectionText = { maxWidth: 760, margin: "12px 0 0", color: "rgba(255,255,255,.45)", lineHeight: 1.55, fontSize: 13 };
const businessStrip = { display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", border: "1px solid rgba(255,255,255,.09)", borderRadius: 16, background: "rgba(255,255,255,.025)" };
const businessStripLabel = { fontSize: 8, letterSpacing: 2, opacity: .3 };
const jobRow = { display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", padding: "14px 18px", borderTop: "1px solid rgba(255,255,255,.05)", fontSize: 11 };
const jobStatus = { color: "rgba(255,255,255,.42)", fontSize: 8, letterSpacing: 1.2, textTransform: "uppercase" as const };
const capabilityGrid = { display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 10 };
const capabilityCard = { minHeight: 185, padding: 20, borderRadius: 20, border: "1px solid rgba(255,255,255,.08)", background: "rgba(255,255,255,.025)" };
const capabilityGroup = { fontSize: 7, letterSpacing: 2, textTransform: "uppercase" as const, color: "rgba(0,255,210,.52)" };
const capabilityTitle = { margin: "13px 0 0", fontSize: 18, fontWeight: 650 };
const capabilityText = { margin: "8px 0 0", color: "rgba(255,255,255,.42)", fontSize: 11, lineHeight: 1.5 };
const capabilityState = { display: "inline-block", marginTop: 16, fontSize: 7, letterSpacing: 1.5, color: "rgba(255,255,255,.28)" };

