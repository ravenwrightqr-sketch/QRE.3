import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

type ContributionInfo = { enabled: boolean; inviteOnly?: boolean; asset?: { slug: string; displayName?: string | null } };

export default function Contribution() {
  const { slug } = useParams();
  const [info, setInfo] = useState<ContributionInfo | null>(null);
  const [prompt, setPrompt] = useState("");
  const [name, setName] = useState("");
  const [state, setState] = useState<"loading" | "ready" | "sent" | "error">("loading");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!slug) return;
    fetch(`${API_BASE}/experience/contribute/${encodeURIComponent(slug)}`)
      .then((response) => response.json())
      .then((data) => { setInfo(data); setState(data.enabled ? "ready" : "error"); })
      .catch(() => setState("error"));
  }, [slug]);

  async function submit() {
    if (!slug || !prompt.trim() || busy) return;
    setBusy(true);
    try {
      const response = await fetch(`${API_BASE}/experience/contribute/${encodeURIComponent(slug)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim(), contributorName: name.trim() || undefined }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save memory.");
      setState("sent");
    } catch (error) {
      console.error(error);
      setState("error");
    } finally { setBusy(false); }
  }

  if (state === "loading") return <main style={stage}>Opening memory…</main>;
  if (state === "error" || !info?.enabled) return <main style={stage}><section style={card}><div style={eyebrow}>MEMORY WORLD</div><h1 style={title}>This one is private.</h1><p style={body}>The owner has not opened contributions for this QRE object.</p></section></main>;
  if (state === "sent") return <main style={stage}><section style={card}><div style={eyebrow}>MEMORY RECEIVED</div><h1 style={title}>It’s in the queue.</h1><p style={body}>The owner can approve it, and then QRE can turn it into another cinematic moment in the world.</p></section></main>;

  return (
    <main style={stage}>
      <section style={card}>
        <div style={eyebrow}>{(info.asset?.displayName || info.asset?.slug || "QRE").toUpperCase()}</div>
        <h1 style={title}>Add a memory.</h1>
        <p style={body}>One small detail is enough. Make it yours.</p>
        <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="What do you remember?" style={textarea} rows={6} />
        <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name (optional)" style={input} />
        <button type="button" disabled={!prompt.trim() || busy} onClick={() => void submit()} style={button}>{busy ? "SENDING…" : "ADD MEMORY"}</button>
        <div style={fine}>Your memory stays pending until the owner approves it.</div>
      </section>
    </main>
  );
}

const stage = { minHeight: "100dvh", display: "grid", placeItems: "center", padding: 24, boxSizing: "border-box" as const, background: "radial-gradient(circle at 50% 35%, rgba(95,255,220,.08), transparent 35%), #030406", color: "#fff", fontFamily: "Inter, system-ui, sans-serif" };
const card = { width: "min(620px, 92vw)", padding: "34px 26px", borderRadius: 30, border: "1px solid rgba(255,255,255,.1)", background: "rgba(10,12,16,.76)", backdropFilter: "blur(26px)", boxShadow: "0 30px 120px rgba(0,0,0,.45)" };
const eyebrow = { fontSize: 9, letterSpacing: 5, opacity: .38 };
const title = { margin: "12px 0 8px", fontSize: "clamp(38px, 10vw, 64px)", lineHeight: .95, fontWeight: 500, letterSpacing: "-2px" };
const body = { maxWidth: 480, opacity: .55, lineHeight: 1.6, marginBottom: 24 };
const textarea = { width: "100%", boxSizing: "border-box" as const, borderRadius: 18, border: "1px solid rgba(255,255,255,.1)", background: "rgba(255,255,255,.035)", color: "#fff", outline: 0, padding: 16, font: "inherit", fontSize: 17, lineHeight: 1.5, resize: "vertical" as const };
const input = { width: "100%", boxSizing: "border-box" as const, marginTop: 10, borderRadius: 14, border: "1px solid rgba(255,255,255,.08)", background: "rgba(255,255,255,.025)", color: "#fff", outline: 0, padding: 13, font: "inherit" };
const button = { marginTop: 14, width: "100%", border: "1px solid rgba(185,255,241,.34)", background: "rgba(185,255,241,.12)", color: "#eafffb", borderRadius: 999, padding: "13px 18px", cursor: "pointer", letterSpacing: 2, fontSize: 10 };
const fine = { marginTop: 12, fontSize: 11, opacity: .32 };
