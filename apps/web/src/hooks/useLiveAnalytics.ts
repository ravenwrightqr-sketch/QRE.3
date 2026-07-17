import { useEffect, useState } from "react";

type AnalyticsPayload = {
  metrics: any;
  funnel: any;
  activity: any[];
  timestamp: number;
};

export function useLiveAnalytics(assetId: string) {
  const [data, setData] = useState<AnalyticsPayload | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!assetId) return;

    const url = `${import.meta.env.VITE_API_URL}/api/analytics/live/${assetId}`;
    const es = new EventSource(url);

    es.onopen = () => setConnected(true);

    es.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        setData(parsed);
      } catch (err) {
        console.error("[SSE PARSE ERROR]", err);
      }
    };

    es.onerror = () => {
      setConnected(false);
    };

    return () => {
      es.close();
    };
  }, [assetId]);

  return {
    data,
    connected,
  };
}