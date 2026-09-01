import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createServiceReceipt } from "../lib/api";
import { getUserAssets } from "../lib/api";
import { useEffect } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";

type Asset = {
  id: string;
  slug: string;
  displayName?: string | null;
  category?: string | null;
};

function clean(value: unknown): string {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

export default function ServiceReceipt() {
  const navigate = useNavigate();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [assetId, setAssetId] = useState("");
  const [recipient, setRecipient] = useState("");
  const [service, setService] = useState("");
  const [facts, setFacts] = useState("");
  const [funny, setFunny] = useState("");
  const [odd, setOdd] = useState("");
  const [different, setDifferent] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [creating, setCreating] = useState(false);
  const [result, setResult] = useState<Awaited<ReturnType<typeof createServiceReceipt>> | null>(null);
  const [error, setError] = useState("");
  const [photoPreview, setPhotoPreview] = useState("");

  useEffect(() => {
    void getUserAssets().then((response) => {
      const next = Array.isArray(response) ? response : response.assets ?? [];
      setAssets(next);
      setAssetId((current) => current || next[0]?.id || "");
    }).catch((err) => setError(err instanceof Error ? err.message : String(err)));
  }, []);

  const selectedAsset = useMemo(
    () => assets.find((asset) => asset.id === assetId) ?? assets[0],
    [assets, assetId],
  );

  function capturePhoto(file: File | undefined) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(typeof reader.result === "string" ? reader.result : "");
    reader.readAsDataURL(file);
  }

  async function create() {
    if (!assetId || !recipient.trim() || creating) return;
    setCreating(true);
    setError("");
    try {
      const response = await createServiceReceipt({
        assetId,
        recipient: recipient.trim(),
        service: service.trim(),
        facts: facts.split(/\n|,/).map(clean).filter(Boolean),
        funny: funny.trim(),
        odd: odd.trim(),
        different: different.trim(),
        mediaUrls: mediaUrl.trim() ? [mediaUrl.trim()] : [],
      });
      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setCreating(false);
    }
  }

  async function share() {
    const shareUrl = result?.shareUrl;
    if (!shareUrl) return;
    const absolute = `${window.location.origin}${shareUrl}`;
    if (navigator.share) {
      await navigator.share({
        title: result?.experience?.title ?? "QRE Service Receipt",
        text: "Your QRE service experience is ready.",
        url: absolute,
      });
      return;
    }
    await navigator.clipboard.writeText(absolute);
    window.alert("Receipt link copied.");
  }

  if (result) {
    return (
      <DashboardLayout>
        <main style={page}>
          <section style={card}>
            <div style={eyebrow}>SERVICE RECEIPT READY</div>
            <h1 style={title}>{result.experience?.title ?? "Your experience is ready."}</h1>
            <p style={sub}>{result.delivered ? "Delivery target captured." : "Ready to share."}</p>
            <div style={film}>
              {(result.experience?.moments ?? []).map((moment: any, index: number) => (
                <div key={`${index}-${clean(moment?.payload?.text)}`} style={line}>
                  {clean(moment?.payload?.text ?? moment?.text)}
                </div>
              ))}
            </div>
            {photoPreview && <img src={photoPreview} alt="Service attachment" style={photo} />}
            <div style={actions}>
              <button type="button" onClick={() => void share()} style={primary}>SEND RECEIPT</button>
              <button type="button" onClick={() => navigate("/dashboard")} style={secondary}>DONE</button>
            </div>
          </section>
        </main>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <main style={page}>
        <section style={card}>
          <div style={eyebrow}>60-SECOND SERVICE CAPTURE</div>
          <h1 style={title}>Send a service receipt.</h1>
          <p style={sub}>Tell QRE only what mattered. It does the rest.</p>

          <label style={label}>CLIENT / RECIPIENT<input value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="11Q Fuck You / email / phone" style={input} /></label>
          <label style={label}>QRE OBJECT<select value={assetId} onChange={(e) => setAssetId(e.target.value)} style={input}>{assets.map((asset) => <option key={asset.id} value={asset.id}>{asset.displayName || asset.slug}</option>)}</select></label>
          <label style={label}>SERVICE<input value={service} onChange={(e) => setService(e.target.value)} placeholder="Cleaning" style={input} /></label>
          <label style={label}>WHAT HAPPENED<textarea value={facts} onChange={(e) => setFacts(e.target.value)} placeholder={selectedAsset ? "Kitchen clean\nTwo bathrooms clean\n11:01–12:12" : "What actually happened?"} style={textarea} /></label>

          <div style={promptGrid}>
            <label style={label}>ANYTHING FUNNY?<input value={funny} onChange={(e) => setFunny(e.target.value)} placeholder="55 shampoos" style={input} /></label>
            <label style={label}>ANYTHING ODD?<input value={odd} onChange={(e) => setOdd(e.target.value)} placeholder="666 knives out" style={input} /></label>
            <label style={label}>ANYTHING DIFFERENT?<input value={different} onChange={(e) => setDifferent(e.target.value)} placeholder="Cats everywhere" style={input} /></label>
          </div>

          <label style={label}>PHOTO / MEDIA
            <input type="file" accept="image/*" onChange={(e) => capturePhoto(e.target.files?.[0])} style={fileInput} />
          </label>
          <label style={label}>OPTIONAL MEDIA URL<input value={mediaUrl} onChange={(e) => setMediaUrl(e.target.value)} placeholder="Paste a hosted photo/video URL" style={input} /></label>

          {photoPreview && <img src={photoPreview} alt="Preview" style={photo} />}
          {error && <div style={errorBox}>{error}</div>}

          <button type="button" onClick={() => void create()} disabled={!assetId || !recipient.trim() || creating} style={primary}>
            {creating ? "CREATING FILM…" : "CREATE + SEND"}
          </button>
        </section>
      </main>
    </DashboardLayout>
  );
}

const page = { minHeight: "100vh", display: "grid", placeItems: "center", padding: "36px 18px", background: "#050608", color: "#fff" };
const card = { width: "min(900px, 100%)", padding: "clamp(24px, 5vw, 54px)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 28, background: "rgba(255,255,255,.035)", boxSizing: "border-box" as const };
const eyebrow = { fontSize: 10, letterSpacing: 5, opacity: .45, marginBottom: 14 };
const title = { fontSize: "clamp(38px, 7vw, 70px)", fontWeight: 500, letterSpacing: "-3px", lineHeight: .95, margin: 0 };
const sub = { color: "rgba(255,255,255,.55)", margin: "16px 0 34px", fontSize: 15 };
const label = { display: "grid", gap: 8, marginBottom: 18, fontSize: 10, letterSpacing: 2, opacity: .65 };
const input = { width: "100%", boxSizing: "border-box" as const, padding: "14px 15px", borderRadius: 14, border: "1px solid rgba(255,255,255,.12)", background: "rgba(0,0,0,.22)", color: "#fff", font: "inherit", fontSize: 15, letterSpacing: 0, opacity: 1 };
const textarea = { ...input, minHeight: 110, resize: "vertical" as const, lineHeight: 1.5 };
const fileInput = { ...input, padding: 12 };
const promptGrid = { display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 14 };
const film = { margin: "20px 0", padding: 24, borderRadius: 20, background: "#020203", border: "1px solid rgba(255,255,255,.08)" };
const line = { fontSize: "clamp(20px, 4vw, 34px)", lineHeight: 1.15, marginBottom: 18 };
const actions = { display: "flex", gap: 12, marginTop: 24 };
const primary = { border: 0, borderRadius: 999, padding: "15px 24px", background: "#fff", color: "#000", fontWeight: 700, letterSpacing: 1, cursor: "pointer" };
const secondary = { border: "1px solid rgba(255,255,255,.18)", borderRadius: 999, padding: "15px 24px", background: "transparent", color: "#fff", fontWeight: 600, letterSpacing: 1, cursor: "pointer" };
const photo = { width: "100%", maxHeight: 420, objectFit: "cover" as const, borderRadius: 18, marginTop: 12 };
const errorBox = { padding: 14, borderRadius: 12, background: "rgba(255,80,100,.12)", border: "1px solid rgba(255,80,100,.25)", marginBottom: 18, color: "#ffdfe4" };
