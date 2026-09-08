import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { Link, useParams } from "react-router-dom";
import DashboardLayout from "../components/layout/DashboardLayout";
import { apiGet } from "../lib/api";
import UniversalKnowledgeIntake from "../components/knowledge/UniversalKnowledgeIntake";

type KnowledgeItem = {
  id: string;
  createdAt: string;
  label?: string;
  value?: string;
  category?: string;
  source?: string;
  notes?: string;
};

type MemoryState = {
  catalog: Array<{
    id: string;
    name: string;
    kind: string;
    category?: string | null;
    brand?: string | null;
    description?: string | null;
    updatedAt: string;
  }>;
  observations: Array<{
    id: string;
    type: string;
    value: unknown;
    source: string;
    confidence: number;
    observedAt: string;
  }>;
  patterns: Array<{
    id: string;
    type: string;
    statement: string;
    confidence: number;
    strength: number;
    firstObservedAt?: string | null;
    lastObservedAt?: string | null;
  }>;
  counts: {
    catalog: number;
    observations: number;
    patterns: number;
    jobs: number;
  };
};

type KnowledgeResponse = {
  asset: { slug: string; displayName?: string | null };
  knowledge: KnowledgeItem[];
  categories: string[];
  metrics?: Record<string, unknown> | null;
};

type Tab = "recent" | "catalog" | "observations" | "patterns";

export default function KnowledgeDashboard() {
  const { slug = "" } = useParams();
  const [data, setData] = useState<KnowledgeResponse | null>(null);
  const [memory, setMemory] = useState<MemoryState | null>(null);
  const [tab, setTab] = useState<Tab>("recent");
  const [error, setError] = useState("");

  async function load() {
    if (!slug) return;

    try {
      setError("");
      const [knowledge, state] = await Promise.all([
        apiGet(`/api/knowledge/${encodeURIComponent(slug)}`),
        apiGet(`/api/knowledge/${encodeURIComponent(slug)}/state`),
      ]);
      setData(knowledge);
      setMemory(state);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load QRE memory.");
    }
  }

  useEffect(() => {
    void load();
  }, [slug]);

  const grouped = useMemo(() => {
    const groups = new Map<string, KnowledgeItem[]>();
    for (const item of data?.knowledge ?? []) {
      const key = item.category || "general";
      groups.set(key, [...(groups.get(key) ?? []), item]);
    }
    return [...groups.entries()];
  }, [data]);

  if (!data || !memory) {
    return <DashboardLayout><main style={loadingStyle}>{error || "LOADING QRE MEMORY…"}</main></DashboardLayout>;
  }

  const metricScans = Number(data.metrics?.scans ?? data.metrics?.totalScans ?? 0);

  return (
    <DashboardLayout>
      <main style={pageStyle}>
        <header style={headerStyle}>
          <div>
            <div style={eyebrow}>BUSINESS MEMORY</div>
            <h1 style={titleStyle}>{data.asset.displayName || data.asset.slug}</h1>
            <p style={subStyle}>Give QRE anything. This is where what it learns accumulates.</p>
          </div>
          <Link to="/dashboard" style={backLink}>← GIVE QRE SOMETHING</Link>
        </header>

        <UniversalKnowledgeIntake slug={slug} onLearned={load} />

        {error && <div style={errorStyle}>{error}</div>}

        <section style={statsGrid} aria-label="Knowledge totals">
          <Stat label="Catalog" value={memory.counts.catalog} />
          <Stat label="Observations" value={memory.counts.observations} />
          <Stat label="Patterns" value={memory.counts.patterns} />
          <Stat label="Scans" value={metricScans} />
        </section>

        <section style={{ marginTop: 34 }}>
          <nav style={tabs} aria-label="Business memory">
            {(["recent", "catalog", "observations", "patterns"] as Tab[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setTab(item)}
                style={{ ...tabButton, ...(tab === item ? activeTabButton : {}) }}
              >
                {item === "recent" ? "Recent Knowledge" : item[0].toUpperCase() + item.slice(1)}
              </button>
            ))}
          </nav>

          {tab === "recent" && (
            <div style={sectionStack}>
              {grouped.length === 0 && <Empty text="QRE has not learned anything here yet." />}
              {grouped.map(([group, items]) => (
                <section key={group} style={sectionPanel}>
                  <div style={sectionHeading}>
                    <h2 style={sectionTitle}>{group.replace(/_/g, " ")}</h2>
                    <span style={muted}>{items.length}</span>
                  </div>
                  <div style={itemStack}>
                    {items.slice(0, 12).map((item) => (
                      <article key={item.id} style={memoryRow}>
                        <div>
                          <strong>{item.label || "Knowledge"}</strong>
                          <div style={valueText}>{item.value || "—"}</div>
                          <div style={metaText}>{item.source || "source"} · {new Date(item.createdAt).toLocaleString()}</div>
                          {item.notes && <div style={notesText}>{item.notes}</div>}
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}

          {tab === "catalog" && (
            <section style={sectionPanel}>
              <div style={sectionHeading}>
                <h2 style={sectionTitle}>Catalog</h2>
                <span style={muted}>{memory.counts.catalog}</span>
              </div>
              <div style={itemStack}>
                {memory.catalog.length === 0 && <Empty text="Catalog items will appear as QRE identifies things in what you provide." />}
                {memory.catalog.map((item) => (
                  <article key={item.id} style={memoryRow}>
                    <div style={{ minWidth: 0 }}>
                      <strong>{item.name}</strong>
                      <div style={valueText}>{[item.brand, item.category, item.kind].filter(Boolean).join(" · ") || "item"}</div>
                      {item.description && <div style={notesText}>{item.description}</div>}
                    </div>
                    <div style={metaText}>{new Date(item.updatedAt).toLocaleString()}</div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {tab === "observations" && (
            <section style={sectionPanel}>
              <div style={sectionHeading}>
                <h2 style={sectionTitle}>Observations</h2>
                <span style={muted}>{memory.counts.observations}</span>
              </div>
              <div style={itemStack}>
                {memory.observations.length === 0 && <Empty text="Observations appear here as QRE sees and records reality." />}
                {memory.observations.map((observation) => (
                  <article key={observation.id} style={memoryRow}>
                    <div>
                      <strong>{observation.type}</strong>
                      <div style={valueText}>{formatValue(observation.value)}</div>
                      <div style={metaText}>{observation.source} · confidence {Math.round(observation.confidence * 100)}% · {new Date(observation.observedAt).toLocaleString()}</div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {tab === "patterns" && (
            <section style={sectionPanel}>
              <div style={sectionHeading}>
                <h2 style={sectionTitle}>Patterns</h2>
                <span style={muted}>{memory.counts.patterns}</span>
              </div>
              <div style={itemStack}>
                {memory.patterns.length === 0 && <Empty text="Patterns emerge as observations repeat over time." />}
                {memory.patterns.map((pattern) => (
                  <article key={pattern.id} style={memoryRow}>
                    <div>
                      <strong>{pattern.statement}</strong>
                      <div style={valueText}>{pattern.type}</div>
                      <div style={metaText}>strength {Math.round(pattern.strength * 100)}% · confidence {Math.round(pattern.confidence * 100)}%</div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}
        </section>
      </main>
    </DashboardLayout>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div style={statStyle}>
      <div style={statValue}>{value.toLocaleString()}</div>
      <div style={statLabel}>{label}</div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <div style={{ padding: 20, opacity: .38, fontSize: 12 }}>{text}</div>;
}

function formatValue(value: unknown): string {
  if (typeof value === "string") return value;
  try { return JSON.stringify(value); } catch { return String(value); }
}

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
const sectionStack: CSSProperties = { display: "grid", gap: 14, marginTop: 16 };
const sectionPanel: CSSProperties = { border: "1px solid rgba(255,255,255,.08)", borderRadius: 18, background: "rgba(255,255,255,.025)", padding: 18 };
const sectionHeading: CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 10 };
const sectionTitle: CSSProperties = { margin: 0, fontSize: 17, fontWeight: 500, textTransform: "capitalize" };
const muted: CSSProperties = { opacity: .32, fontSize: 10 };
const itemStack: CSSProperties = { display: "grid", gap: 8 };
const memoryRow: CSSProperties = { display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center", padding: "13px 0", borderTop: "1px solid rgba(255,255,255,.055)" };
const valueText: CSSProperties = { marginTop: 4, opacity: .76, fontSize: 13, lineHeight: 1.45 };
const metaText: CSSProperties = { marginTop: 5, opacity: .34, fontSize: 10 };
const notesText: CSSProperties = { marginTop: 7, opacity: .52, fontSize: 11, lineHeight: 1.5 };
const errorStyle: CSSProperties = { marginTop: 18, borderRadius: 12, padding: 14, background: "rgba(255,80,80,.08)", border: "1px solid rgba(255,100,100,.16)", fontSize: 12 };
const loadingStyle: CSSProperties = { minHeight: "70vh", display: "grid", placeItems: "center", color: "rgba(255,255,255,.45)", letterSpacing: 3 };
