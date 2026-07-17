import { useState } from "react";

import PreviewPanel from "../components/dashboard/PreviewPanel";
import AnalyticsPanel from "../components/dashboard/AnalyticsPanel";
import AdminPanel from "../components/dashboard/AdminPanel";
import FlowDashboard from "../components/dashboard/FlowDashboard";
import FlowBuilder from "../components/dashboard/FlowBuilder";

import { getDashboardAsset } from "../lib/api";

type DashboardData = {
  access: string;
  sessionId: string;
  flowId: string | null;
  teaser: any[];

  asset?: {
    id: string;
    slug: string;
    status: string;
    paid: boolean;
    ownerId?: string | null;
    priceCents?: number;
  };

  analytics?: {
    totalScans: number;
    lastScan: string;
    eventCount: number;
  };
};

export default function Dashboard() {
  const [slug, setSlug] = useState("");
  const [data, setData] = useState<DashboardData | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * =========================
   * LOAD DASHBOARD
   * =========================
   */
  async function loadDashboard() {
    if (!slug.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await getDashboardAsset(slug);

      setData(res ?? null);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Unable to load asset");
    } finally {
      setLoading(false);
    }
  }

  const asset = data?.asset;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 20,
        padding: 20,
      }}
    >
      {/* =========================
          LEFT PANEL
      ========================= */}
      <div>
        <h2>⚡ QRE Dashboard</h2>

        <input
          placeholder="Asset slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          style={{
            padding: 10,
            width: "100%",
            marginBottom: 10,
          }}
        />

        <button onClick={loadDashboard} disabled={loading}>
          {loading ? "Loading..." : "Load Asset"}
        </button>

        {error && (
          <div style={{ color: "red", marginTop: 10 }}>
            {error}
          </div>
        )}

        {/* =========================
            ASSET STATE
        ========================= */}
        {asset && (
          <div
            style={{
              marginTop: 20,
              padding: 12,
              border: "1px solid #333",
              borderRadius: 10,
            }}
          >
            <h3>Asset State</h3>

            <div>Status: {asset.status}</div>
            <div>Paid: {String(asset.paid)}</div>
            <div>Access: {data?.access}</div>

            <div>
              Owner: {asset.ownerId ?? "Unclaimed"}
            </div>

            <div>
              Price: $
              {((asset.priceCents ?? 0) / 100).toFixed(2)}
            </div>

            <div style={{ opacity: 0.6, marginTop: 10 }}>
              Flow ID: {data?.flowId ?? "none"}
            </div>
          </div>
        )}

        {/* =========================
            FLOW BUILDER
        ========================= */}
        <div style={{ marginTop: 20 }}>
          <FlowBuilder />
        </div>

        {/* =========================
            FLOW MANAGEMENT
        ========================= */}
        <div style={{ marginTop: 20 }}>
          {/* FIX: only render when slug exists */}
          {slug ? (
            <FlowDashboard assetId={asset?.id ?? ""} slug={slug} />
          ) : (
            <div style={{ opacity: 0.6 }}>
              Enter a slug to manage flows
            </div>
          )}
        </div>

        {/* =========================
            ADMIN
        ========================= */}
        <div style={{ marginTop: 20 }}>
          <AdminPanel />
        </div>
      </div>

      {/* =========================
          RIGHT PANEL
      ========================= */}
      <div>
        <PreviewPanel data={data} />

        <AnalyticsPanel assetId={asset?.id ?? ""} />
      </div>
    </div>
  );
}