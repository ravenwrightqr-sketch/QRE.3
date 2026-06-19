import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { renderTeaser } from "../lib/teaserRenderer";

type ScanResponse = {
  access: "UNCLAIMED" | "LOCKED" | "UNLOCKED";
  sessionId: string;
  flowId: string | null;
  teaserId: any;
  preview: boolean;
};

export default function Scan() {
  const { slug } = useParams();
  const [data, setData] = useState<ScanResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function run() {
      try {
        const res = await axios.get(`/api/scan/${slug}`);
        setData(res.data);
      } catch (err) {
        console.error("Scan error:", err);
      } finally {
        setLoading(false);
      }
    }

    run();
  }, [slug]);

  if (loading) return <div>Scanning QR...</div>;
  if (!data) return <div>Asset not found</div>;

  const teaser = renderTeaser(data.teaserId, slug!);

  /**
   * =========================
   * STATE: UNCLAIMED
   * =========================
   */
  if (data.access === "UNCLAIMED") {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        <h1>✨ Unclaimed Asset</h1>
        <p>This QR experience has not been activated yet.</p>

        <button
          style={{ marginTop: 16 }}
          onClick={() => (window.location.href = "/store")}
        >
          Claim Experience
        </button>
      </div>
    );
  }

  /**
   * =========================
   * STATE: LOCKED
   * =========================
   */
  if (data.access === "LOCKED") {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        <h1>🔒 Locked Content</h1>
        <p>Preview available. Unlock to continue.</p>

        <button
          style={{ marginTop: 16 }}
          onClick={() => (window.location.href = "/store")}
        >
          Unlock Now
        </button>
      </div>
    );
  }

  /**
   * =========================
   * STATE: UNLOCKED
   * =========================
   */
  return (
    <div style={{ padding: 20 }}>
      <h2>✨ Unlocked Experience</h2>

      <div style={{ marginTop: 20 }}>
        {teaser?.map((block: any, i: number) => {
          if (!block) return null;

          if (block.type === "story")
            return (
              <p key={i} style={{ fontSize: 16 }}>
                {block.text}
              </p>
            );

          if (block.type === "hint")
            return (
              <small key={i} style={{ opacity: 0.7 }}>
                {block.text}
              </small>
            );

          if (block.type === "divider")
            return <hr key={i} style={{ margin: "12px 0" }} />;

          if (block.type === "cta")
            return (
              <button
                key={i}
                style={{ marginTop: 10 }}
                onClick={() => (window.location.href = block.url)}
              >
                {block.text}
              </button>
            );

          return null;
        })}
      </div>
    </div>
  );
}