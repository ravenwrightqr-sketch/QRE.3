import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import DashboardLayout from "../components/layout/DashboardLayout";
import { apiGet } from "../lib/api";

type LearningResponse = {
  asset: { slug: string; displayName?: string | null };
  overview: Record<string, number>;
  eventCounts: Record<string, number>;
  learned: {
    signals: string[];
    acceptedPatterns: string[];
    rejectedPatterns: string[];
    recentFeedback: string[];
    lines: string[];
    autonomousSignals: string[];
    autonomousWinners: string[];
    autonomousWeaknesses: string[];
    autonomousConfidence: number;
  };
  knowledge: Array<{ id: string; type: string; message: string; impact?: string | null; createdAt: string }>;
  locations: Array<{ id: string; lat: number; lng: number; label?: string | null; city?: string | null; region?: string | null; country?: string | null; source: string; createdAt: string }>;
  recentEvents: Array<{ id: string; type: string; createdAt: string; meta?: unknown; sessionId?: string | null; flowId?: string | null }>;
  daily: Array<{ date: string; events: number; scans: number; completions: number; creative: number }>;
};

export default function LearningDashboard() {
  const { slug = "" } = useParams();
  const [data, setData] = useState<LearningResponse | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!slug) return;
    void apiGet(`/api/learning/${encodeURIComponent(slug)}`)
      .then(setData)
      .catch((cause) => setError(cause instanceof Error ? cause.message : "Learning data could not be loaded."));
  }, [slug]);

  const topEvents = useMemo(() => Object.entries(data?.eventCounts ?? {}).sort((a, b) => b[1] - a[1]).slice(0, 18), [data]);

  if (!data) return <DashboardLayout><main style={{ minHeight: "70vh", display: "grid", placeItems: "center", color: "#fff" }}>{error || "LOADING QRE COGNITION..."}</main></DashboardLayout>;

  const o = data.overview;
  const rate = Math.round((o.creativeAcceptanceRate ?? 0) * 100);
  const autoConfidence = Math.round((data.learned.autonomousConfidence ?? 0) * 100);

  return (
    <DashboardLayout>
      <main style={{ minHeight: "100vh", color: "#fff", padding: "42px 28px", maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 20, alignItems: "end", marginBottom: 30 }}>
          <div>
            <p style={{ opacity: .45, letterSpacing: 5, fontSize: 11, margin: 0 }}>QRE COGNITIVE LEARNING</p>
            <h1 style={{ margin: "8px 0 4px" }}>{data.asset.displayName || data.asset.slug}</h1>
            <div style={{ opacity: .55 }}>What QRE has learned, what it observed, what it remembers, and how the experience is behaving.</div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Link to={`/dashboard/assets/${encodeURIComponent(slug)}`} style={linkStyle}>← Asset</Link>
            <Link to={`/dashboard/assets/${encodeURIComponent(slug)}/knowledge`} style={linkStyle}>Knowledge</Link>
          </div>
        </div>

        <section style={gridStyle}>
          <Card title="Cognitive totals">
            <div style={metricGrid}>
              <Metric label="Events" value={o.eventCount ?? 0} />
              <Metric label="Event types" value={o.uniqueEventTypes ?? 0} />
              <Metric label="Knowledge" value={o.knowledgeCount ?? 0} />
              <Metric label="Locations" value={o.locationCount ?? 0} />
              <Metric label="Memory signals" value={o.memoryEventCount ?? 0} />
              <Metric label="Experience signals" value={o.experienceEventCount ?? 0} />
            </div>
          </Card>

          <Card title="Creative learning">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12 }}>
              <Metric label="Acceptance rate" value={`${rate}%`} />
              <Metric label="Accepted" value={o.creativeAccepted ?? 0} />
              <Metric label="Rejected" value={o.creativeRejected ?? 0} />
              <Metric label="Selected variations" value={o.creativeSelected ?? 0} />
            </div>
          </Card>
        </section>

        <section style={{ ...gridStyle, marginTop: 20 }}>
          <Card title="What you explicitly taught QRE">
            <TagList values={data.learned.acceptedPatterns} empty="No explicit creative preferences recorded yet." />
          </Card>
          <Card title="What real-world behavior taught QRE">
            <div style={{ marginBottom: 12, opacity: .6, fontSize: 12 }}>AUTONOMOUS CONFIDENCE · {autoConfidence}%</div>
            <TagList values={data.learned.autonomousWinners} empty="No behavioral winner is measurable yet. QRE needs real scans and outcomes." />
          </Card>
        </section>

        <section style={{ ...gridStyle, marginTop: 20 }}>
          <Card title="What you told QRE to avoid">
            <TagList values={data.learned.rejectedPatterns} empty="No explicit rejected patterns recorded yet." />
          </Card>
          <Card title="What behavior says to avoid">
            <TagList values={data.learned.autonomousWeaknesses} empty="No behavioral weakness is measurable yet." />
          </Card>
        </section>

        <section style={{ marginTop: 20 }}>
          <Card title="Recent autonomous signals">
            <TagList values={data.learned.autonomousSignals} empty="QRE is waiting for real-world usage signals." />
          </Card>
        </section>

        <section style={{ marginTop: 20 }}>
          <Card title="Recent human feedback">
            <TagList values={data.learned.recentFeedback} empty="No manual feedback recorded. That is okay — autonomous learning does not require it." />
          </Card>
        </section>

        <section style={{ ...gridStyle, marginTop: 20 }}>
          <Card title="Event intelligence">
            <div style={{ display: "grid", gap: 8 }}>{topEvents.map(([type, count]) => <div key={type} style={{ display: "flex", justifyContent: "space-between", gap: 10, padding: "8px 10px", background: "rgba(255,255,255,.035)", borderRadius: 10 }}><span style={{ opacity: .8 }}>{type}</span><strong>{count}</strong></div>)}</div>
          </Card>
          <Card title="Saved places">
            <div style={{ display: "grid", gap: 8 }}>{data.locations.length ? data.locations.map((location) => <div key={location.id} style={{ padding: 10, background: "rgba(255,255,255,.035)", borderRadius: 10 }}><strong>{location.label || "Unnamed place"}</strong><div style={{ opacity: .55, fontSize: 12, marginTop: 4 }}>{location.city || ""}{location.city && location.region ? ", " : ""}{location.region || ""} · {location.lat.toFixed(5)}, {location.lng.toFixed(5)}</div></div>) : <div style={{ opacity: .5 }}>No saved locations yet.</div>}</div>
          </Card>
        </section>

        <section style={{ marginTop: 20 }}>
          <Card title="Daily trajectory">
            <div style={{ display: "grid", gap: 8 }}>{data.daily.map((row) => <div key={row.date} style={{ display: "grid", gridTemplateColumns: "120px repeat(4,1fr)", gap: 10, padding: "8px 10px", background: "rgba(255,255,255,.03)", borderRadius: 10 }}><strong>{row.date}</strong><span>events {row.events}</span><span>scans {row.scans}</span><span>completions {row.completions}</span><span>creative {row.creative}</span></div>)}</div>
          </Card>
        </section>

        <section style={{ marginTop: 20 }}>
          <Card title="Recent cognitive telemetry">
            <div style={{ display: "grid", gap: 7 }}>{data.recentEvents.slice(0, 50).map((event) => <div key={event.id} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "8px 10px", background: "rgba(255,255,255,.025)", borderRadius: 8 }}><span>{event.type}</span><span style={{ opacity: .45, fontSize: 12 }}>{new Date(event.createdAt).toLocaleString()}</span></div>)}</div>
          </Card>
        </section>
      </main>
    </DashboardLayout>
  );
}

const linkStyle = { color: "#fff", textDecoration: "none", border: "1px solid rgba(255,255,255,.16)", borderRadius: 12, padding: "10px 14px", opacity: .8 };
const gridStyle = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 };
const metricGrid = { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 };

function Card({ title, children }: { title: string; children: ReactNode }) { return <section style={{ background: "rgba(255,255,255,.045)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 18, padding: 20 }}><h2 style={{ marginTop: 0 }}>{title}</h2>{children}</section>; }
function Metric({ label, value }: { label: string; value: ReactNode }) { return <div style={{ padding: 14, background: "rgba(255,255,255,.035)", borderRadius: 12 }}><div style={{ fontSize: 26, fontWeight: 700 }}>{value}</div><div style={{ opacity: .45, fontSize: 12 }}>{label}</div></div>; }
function TagList({ values, empty }: { values: string[]; empty: string }) { return values.length ? <div style={{ display: "grid", gap: 8 }}>{values.map((value) => <div key={value} style={{ padding: "10px 12px", background: "rgba(255,255,255,.035)", borderRadius: 10, lineHeight: 1.4 }}>{value}</div>)}</div> : <div style={{ opacity: .5 }}>{empty}</div>; }
