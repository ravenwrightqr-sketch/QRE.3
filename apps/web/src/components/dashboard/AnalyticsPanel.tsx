import { useEffect, useState } from "react";
import { apiGet } from "../../lib/api";

type Tier = "BASIC" | "PRO" | "BUSINESS";

export default function AnalyticsPanel({
  assetId,
  tier = "BASIC",
}: {
  assetId: string;
  tier?: Tier;
}) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
  if (!assetId) return;

  setLoading(true);

  apiGet(`/api/analytics/${assetId}?tier=${tier}`)
    .then(setData)
    .finally(() => setLoading(false));
}, [assetId, tier]);

  if (!assetId) return <div>Select an asset</div>;
  if (loading) return <div>Loading analytics...</div>;
  if (!data) return <div>No analytics yet</div>;

  /**
   * =========================
   * BASIC VIEW
   * =========================
   */
  if (tier === "BASIC") {
    return (
      <div style={{ marginTop: 20 }}>
        <h3>📊 Analytics (Basic)</h3>

        <div>Total Scans: {data.totalScans ?? 0}</div>
        <div>Event Count: {data.eventCount ?? 0}</div>
        <div>
          Last Scan:{" "}
          {data.lastScan ? new Date(data.lastScan).toLocaleString() : "—"}
        </div>
      </div>
    );
  }

  /**
   * =========================
   * PRO VIEW
   * =========================
   */
  if (tier === "PRO") {
    return (
      <div style={{ marginTop: 20 }}>
        <h3>📊 Analytics (Pro)</h3>

        <div>Total Scans: {data.totalScans ?? 0}</div>

        <h4>Sessions</h4>
        {data.sessions?.length ? (
          data.sessions.map((s: any) => (
            <div key={s.id}>
              #{s.id.slice(0, 6)} — step {s.stepIndex} — {s.status}
            </div>
          ))
        ) : (
          <div>No sessions yet</div>
        )}

        <h4>Drop-off Map</h4>
        <pre>{JSON.stringify(data.dropOffMap ?? {}, null, 2)}</pre>
      </div>
    );
  }

  /**
   * =========================
   * BUSINESS VIEW
   * =========================
   */
  return (
    <div style={{ marginTop: 20 }}>
      <h3>📊 Analytics (Business)</h3>

      <h4>Funnel</h4>
      <div>Scans: {data.funnel?.scans ?? 0}</div>
      <div>Completed Flows: {data.funnel?.completedFlows ?? 0}</div>
      <div>
        Payments Triggered: {data.funnel?.paymentsTriggered ?? 0}
      </div>

      <h4>Sessions</h4>
      <div>{data.sessions?.length ?? 0} sessions</div>

      <h4>Raw Events</h4>
      <div>{data.events?.length ?? 0} events</div>
    </div>
  );
}