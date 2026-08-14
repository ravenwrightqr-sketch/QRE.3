import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useParams, Link } from "react-router-dom";
import DashboardLayout from "../components/layout/DashboardLayout";
import { apiDelete, apiGet, apiPost } from "../lib/api";

type KnowledgeItem = {
  id: string;
  createdAt: string;
  label?: string;
  value?: string;
  category?: string;
  unit?: string;
  source?: string;
  notes?: string;
  imageDataUrl?: string;
  confidence?: number;
};

type KnowledgeResponse = {
  asset: { slug: string; displayName?: string | null };
  knowledge: KnowledgeItem[];
  categories: string[];
  metrics?: Record<string, unknown> | null;
  activity?: unknown[];
};

const inputStyle: CSSProperties = { width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.12)", borderRadius: 12, color: "#fff", padding: "12px 14px" };

export default function KnowledgeDashboard() {
  const { slug = "" } = useParams();
  const [data, setData] = useState<KnowledgeResponse | null>(null);
  const [label, setLabel] = useState("");
  const [value, setValue] = useState("");
  const [category, setCategory] = useState("general");
  const [source, setSource] = useState("owner");
  const [notes, setNotes] = useState("");
  const [imageDataUrl, setImageDataUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    try { setError(""); setData(await apiGet(`/api/knowledge/${encodeURIComponent(slug)}`)); }
    catch (e) { setError(e instanceof Error ? e.message : "Knowledge could not be loaded."); }
  }
  useEffect(() => { if (slug) void load(); }, [slug]);

  const grouped = useMemo(() => {
    const groups = new Map<string, KnowledgeItem[]>();
    for (const item of data?.knowledge ?? []) { const key = item.category || "general"; groups.set(key, [...(groups.get(key) ?? []), item]); }
    return [...groups.entries()];
  }, [data]);

  async function analyzePhoto(dataUrl: string) {
    setAnalyzing(true);
    setError("");
    try {
      const response = await apiPost("/api/ai/vision", { imageDataUrl: dataUrl, category });
      const first = Array.isArray(response.facts) ? response.facts[0] : null;
      if (first) {
        setLabel(String(first.label ?? ""));
        setValue(String(first.value ?? ""));
        setCategory(String(first.category ?? category));
        setNotes(String(first.notes ?? ""));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Photo analysis is unavailable. You can still enter the fact manually.");
    } finally {
      setAnalyzing(false);
    }
  }

  async function save() {
    if (!label.trim() || !value.trim()) return;
    setSaving(true);
    try {
      await apiPost(`/api/knowledge/${encodeURIComponent(slug)}`, { label, value, category, source, notes, imageDataUrl: imageDataUrl || undefined });
      setLabel(""); setValue(""); setNotes(""); setImageDataUrl(""); await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Knowledge could not be saved."); }
    finally { setSaving(false); }
  }
  async function remove(id: string) { await apiDelete(`/api/knowledge/${encodeURIComponent(slug)}/${encodeURIComponent(id)}`); await load(); }
  function handlePhoto(file?: File) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      setImageDataUrl(result);
      if (result) void analyzePhoto(result);
    };
    reader.readAsDataURL(file);
  }

  if (!data) return <DashboardLayout><main style={{ padding: 40, color: "#fff" }}>{error || "LOADING KNOWLEDGE..."}</main></DashboardLayout>;
  const metrics = data.metrics ?? {};

  return (
    <DashboardLayout>
      <main style={{ minHeight: "100vh", color: "#fff", padding: "42px 28px", maxWidth: 1180, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 20, alignItems: "flex-end", marginBottom: 30 }}>
          <div><p style={{ opacity: .45, letterSpacing: 5, fontSize: 11, margin: 0 }}>QRE LIVING KNOWLEDGE</p><h1 style={{ margin: "8px 0 4px" }}>{data.asset.displayName || data.asset.slug}</h1><div style={{ opacity: .55 }}>Everything this QRE object knows, learns, and can accumulate.</div></div>
          <Link to={`/dashboard/assets/${encodeURIComponent(slug)}`} style={{ color: "#fff", opacity: .7 }}>← Asset</Link>
        </div>
        {error && <div style={{ marginBottom: 18, padding: 14, borderRadius: 12, background: "rgba(255,80,80,.12)" }}>{error}</div>}

        <section style={{ display: "grid", gridTemplateColumns: "1.1fr .9fr", gap: 20, marginBottom: 28 }}>
          <div style={{ background: "rgba(255,255,255,.045)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 18, padding: 22 }}>
            <h2 style={{ marginTop: 0 }}>Add anything</h2>
            <p style={{ opacity: .55 }}>Type a fact or photograph it. QRE can inspect the image, propose structured facts, and let you correct them before they become part of the object's memory.</p>
            <div style={{ display: "grid", gap: 12 }}>
              <input style={inputStyle} placeholder="What is this? e.g. Kitchen wall paint" value={label} onChange={(e) => setLabel(e.target.value)} />
              <input style={inputStyle} placeholder="Value e.g. Sherwin-Williams Alabaster SW 7008" value={value} onChange={(e) => setValue(e.target.value)} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}><input style={inputStyle} placeholder="Category e.g. materials" value={category} onChange={(e) => setCategory(e.target.value)} /><input style={inputStyle} placeholder="Source e.g. builder" value={source} onChange={(e) => setSource(e.target.value)} /></div>
              <textarea style={{ ...inputStyle, minHeight: 90, resize: "vertical" }} placeholder="Optional notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <label style={{ border: "1px solid rgba(255,255,255,.16)", borderRadius: 12, padding: "11px 14px", cursor: "pointer" }}>📷 Take / attach photo<input type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={(e) => handlePhoto(e.target.files?.[0])} /></label>
                {analyzing && <span style={{ opacity: .7 }}>Analyzing photo…</span>}
                {!analyzing && imageDataUrl && <span style={{ opacity: .65 }}>Photo analyzed — review the proposed fact.</span>}
                <button onClick={save} disabled={saving || analyzing || !label.trim() || !value.trim()} style={{ marginLeft: "auto", border: 0, borderRadius: 12, padding: "12px 18px", cursor: "pointer" }}>{saving ? "SAVING…" : "ADD TO MEMORY"}</button>
              </div>
            </div>
          </div>

          <div style={{ background: "rgba(255,255,255,.045)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 18, padding: 22 }}>
            <h2 style={{ marginTop: 0 }}>What is accumulating</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}><Stat label="Knowledge items" value={data.knowledge.length} /><Stat label="Categories" value={data.categories.length} /><Stat label="Scans" value={Number(metrics.scans ?? metrics.totalScans ?? 0)} /><Stat label="Completions" value={Number(metrics.completions ?? 0)} /></div>
            <p style={{ marginTop: 18, opacity: .55 }}>Analytics and knowledge accumulate beside the experience so the asset becomes more useful over time instead of resetting on every scan.</p>
          </div>
        </section>

        {grouped.map(([group, items]) => <section key={group} style={{ marginBottom: 24 }}><div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}><h2 style={{ margin: 0, textTransform: "capitalize" }}>{group}</h2><span style={{ opacity: .45 }}>{items.length}</span></div><div style={{ display: "grid", gap: 10 }}>{items.map((item) => <article key={item.id} style={{ display: "grid", gridTemplateColumns: item.imageDataUrl ? "92px 1fr auto" : "1fr auto", gap: 16, alignItems: "center", background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 14, padding: 14 }}>{item.imageDataUrl && <img src={item.imageDataUrl} alt="Captured reference" style={{ width: 92, height: 72, objectFit: "cover", borderRadius: 10 }} />}<div><strong>{item.label}</strong><div style={{ marginTop: 4 }}>{item.value}</div><div style={{ marginTop: 5, opacity: .45, fontSize: 12 }}>{item.source} · {new Date(item.createdAt).toLocaleString()}</div>{item.notes && <div style={{ marginTop: 6, opacity: .65 }}>{item.notes}</div>}</div><button onClick={() => remove(item.id)} style={{ opacity: .55, background: "transparent", border: 0, color: "#fff", cursor: "pointer" }}>Remove</button></article>)}</div></section>)}
      </main>
    </DashboardLayout>
  );
}

function Stat({ label, value }: { label: string; value: number }) { return <div style={{ padding: 14, background: "rgba(255,255,255,.035)", borderRadius: 12 }}><div style={{ fontSize: 28, fontWeight: 700 }}>{value}</div><div style={{ opacity: .45, fontSize: 12 }}>{label}</div></div>; }
