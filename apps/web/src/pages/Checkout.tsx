import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { checkout } from "../lib/api";
import { useAuth } from "../components/auth/authContext";

export default function Checkout() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { isAuthed, loading: authLoading } = useAuth();
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthed) {
      navigate(`/login?next=${encodeURIComponent(`/checkout/${slug ?? ""}`)}`, { replace: true });
      return;
    }

    let cancelled = false;

    async function startCheckout() {
      if (!slug) {
        setError("Missing product.");
        return;
      }

      try {
        const data = await checkout(slug);
        if (cancelled) return;
        if (data?.url) {
          window.location.href = data.url;
          return;
        }
        setError(data?.message ?? "Checkout did not return a payment URL.");
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
        }
      }
    }

    void startCheckout();
    return () => {
      cancelled = true;
    };
  }, [slug, isAuthed, authLoading, navigate]);

  return (
    <div style={stage}>
      <div style={card}>
        <div style={eyebrow}>QRE</div>
        <h1 style={title}>{error ? "Checkout unavailable" : "Preparing secure checkout…"}</h1>
        {error && <p style={message}>{error}</p>}
        {!error && <p style={message}>Your QRE piece is reserved for your account while payment is prepared.</p>}
      </div>
    </div>
  );
}

const stage = {
  minHeight: "100vh",
  display: "grid",
  placeItems: "center",
  background: "#050505",
  color: "white",
  padding: 24,
};
const card = {
  width: "min(520px, 100%)",
  padding: 32,
  borderRadius: 24,
  border: "1px solid rgba(255,255,255,.1)",
  background: "rgba(255,255,255,.03)",
};
const eyebrow = { fontSize: 10, letterSpacing: 5, opacity: 0.4 };
const title = { margin: "12px 0 0", fontWeight: 500, fontSize: "clamp(30px, 7vw, 54px)", letterSpacing: -2 };
const message = { color: "rgba(255,255,255,.6)", lineHeight: 1.5 };
