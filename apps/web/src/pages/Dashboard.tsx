import { useState } from "react";
import { scan } from "../lib/api";

import PreviewPanel from "../components/dashboard/PreviewPanel";
import AnalyticsPanel from "../components/dashboard/AnalyticsPanel";
import AdminPanel from "../components/dashboard/AdminPanel";
import FlowDashboard from "../components/dashboard/FlowDashboard";
type ScanResult = {
  access: string;
  sessionId: string;
  flowId: string | null;
  teaserId: string;
  preview: boolean;
  timestamp: string;
  teaser: any[];
};

export default function Dashboard() {
  const [slug, setSlug] = useState("");
  const [data, setData] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function runScan() {
    if (!slug) return;
    setLoading(true);

    try {
      const res = await scan(slug);
      setData(res);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 20,
        padding: 20,
      }}
    >
      {/* LEFT: CONTROL */}
      <div>
        <h2>⚡ QRE Dashboard Weapon</h2>

        <input
          placeholder="asset slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          style={{ padding: 10, width: "100%", marginBottom: 10 }}
        />

        <button onClick={runScan} disabled={loading}>
          {loading ? "Scanning..." : "Run Scan Preview"}
        </button>

        <FlowDashboard slug={slug} />

        <AdminPanel />
      </div>

      {/* RIGHT: LIVE VIEW */}
      <div>
        <PreviewPanel data={data} />
        <AnalyticsPanel assetId={slug} />
      </div>
    </div>
  );
}