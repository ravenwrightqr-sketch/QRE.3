import React, { useEffect, useState } from "react";
import { getAdminDashboard } from "../../lib/api";

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await getAdminDashboard();

        console.log("ADMIN DASHBOARD:", res);

        setData(res);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  if (loading) {
    return (
      <div style={{ color: "white", padding: 40 }}>
        Loading Empire QR...
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ color: "white", padding: 40 }}>
        Dashboard unavailable.
      </div>
    );
  }

  return (
    <div
      style={{
        color: "white",
        padding: 30,
        maxWidth: 1400,
        margin: "0 auto",
      }}
    >
      <h1>⚡ Empire QR Control Center</h1>

      <p style={{ opacity: 0.7 }}>
        Global platform analytics and business health.
      </p>

      {/* SUMMARY CARDS */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(240px,1fr))",
          gap: 20,
          marginTop: 30,
        }}
      >
        <Card
          title="Scans Today"
          value={data.summary?.scansToday ?? 0}
        />

        <Card
          title="Active Sessions"
          value={data.summary?.activeSessions ?? 0}
        />

        <Card
          title="Assets"
          value={data.summary?.totalAssets ?? 0}
        />

        <Card
          title="Flows"
          value={data.summary?.totalFlows ?? 0}
        />
      </div>

      {/* TOP ASSETS */}

      <section style={{ marginTop: 50 }}>
        <h2>🔥 Top Assets</h2>

        <pre>
          {JSON.stringify(
            data.topAssets,
            null,
            2
          )}
        </pre>
      </section>

      {/* RECENT ACTIVITY */}

      <section style={{ marginTop: 50 }}>
        <h2>📈 Recent Activity</h2>

        <pre>
          {JSON.stringify(
            data.recentActivity,
            null,
            2
          )}
        </pre>
      </section>

      {/* PLATFORM STATUS */}

      <section style={{ marginTop: 50 }}>
        <h2>🚀 Platform Status</h2>

        <div>Status: {data.status}</div>

        <div>
          Revenue Model:
          {" "}
          {data.revenue?.model}
        </div>

        <div>
          Timestamp:
          {" "}
          {data.timestamp}
        </div>
      </section>
    </div>
  );
}

function Card({
  title,
  value,
}: {
  title: string;
  value: any;
}) {
  return (
    <div
      style={{
        padding: 24,
        borderRadius: 16,
        background: "#111",
        border: "1px solid #333",
      }}
    >
      <div
        style={{
          opacity: 0.6,
          marginBottom: 12,
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontSize: 40,
          fontWeight: 800,
        }}
      >
        {value}
      </div>
    </div>
  );
}