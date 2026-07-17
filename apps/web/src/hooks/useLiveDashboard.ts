import { useEffect, useRef, useState } from "react";

type LiveMetrics = {
  scans: number;
  errors: number;
  flows: number;
  completions: number;
  conversionRate: number;
};

export function useLiveDashboard(assetId: string) {
  const [data, setData] = useState<LiveMetrics | null>(null);
  const [connected, setConnected] = useState(false);

  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!assetId) return;

    /**
     * =========================
     * BUILD SSE CONNECTION
     * =========================
     */
    const es = new EventSource(
      `/api/dashboard/live/${assetId}`
    );

    esRef.current = es;

    es.onopen = () => {
      setConnected(true);
    };

    es.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        setData(parsed);
      } catch (err) {
        console.warn("[LIVE DASHBOARD] parse error", err);
      }
    };

    es.onerror = () => {
      setConnected(false);

      /**
       * AUTO RECONNECT (simple backoff)
       */
      setTimeout(() => {
        es.close();
      }, 2000);
    };

    return () => {
      es.close();
      esRef.current = null;
    };
  }, [assetId]);

  return {
    data,
    connected,
  };
}