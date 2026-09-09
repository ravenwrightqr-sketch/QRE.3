import { useEffect, useRef, useState, type ChangeEvent, type CSSProperties, type DragEvent } from "react";
import { apiGet, apiPost } from "../../lib/api";

export type UniversalIntakeJob = {
  id: string;
  status: string;
  stage?: string | null;
  sourceType: string;
  originalName?: string | null;
  result?: { factCount?: number; catalogIds?: string[]; observationIds?: string[]; evidenceId?: string } | null;
  error?: string | null;
};

type Props = { slug: string; onLearned?: () => Promise<void> | void };
type Payload = { sourceType: string; originalName?: string; mimeType?: string; imageDataUrl?: string; content?: string; text?: string };

const panel: CSSProperties = { border: "1px solid rgba(255,255,255,.12)", borderRadius: 24, background: "rgba(9,12,16,.72)", backdropFilter: "blur(26px)", boxShadow: "0 28px 100px rgba(0,0,0,.32)" };
const button: CSSProperties = { border: "1px solid rgba(255,255,255,.12)", borderRadius: 14, background: "rgba(255,255,255,.045)", color: "#fff", padding: "12px 14px", cursor: "pointer", font: "inherit", fontSize: 11, letterSpacing: 1.3 };

export default function UniversalKnowledgeIntake({ slug, onLearned }: Props) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const photoRef = useRef<HTMLInputElement | null>(null);
  const [jobs, setJobs] = useState<UniversalIntakeJob[]>([]);
  const [dragging, setDragging] = useState(false);
  const [textOpen, setTextOpen] = useState(false);
  const [text, setText] = useState("");
  const [website, setWebsite] = useState("");
  const [websiteOpen, setWebsiteOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { setJobs([]); setText(""); setWebsite(""); setTextOpen(false); setWebsiteOpen(false); setError(""); }, [slug]);

  async function submitFiles(files: File[]) {
    if (!slug || !files.length) return;
    setBusy(true); setError("");
    try {
      const created: UniversalIntakeJob[] = [];
      for (const file of files) {
        const payload = await fileToPayload(file);
        const response = await apiPost(`/api/knowledge/${encodeURIComponent(slug)}/intake`, payload);
        created.push({ id: String(response.jobId), status: String(response.status ?? "queued"), stage: response.stage ?? null, sourceType: payload.sourceType, originalName: file.name });
      }
      setJobs((current) => [...created, ...current]);
      for (const job of created) void watchJob(job.id);
    } catch (err) { setError(err instanceof Error ? err.message : "QRE could not accept the upload."); }
    finally { setBusy(false); }
  }

  async function submitText() {
    const value = text.trim(); if (!value || !slug) return;
    setBusy(true); setError("");
    try {
      const response = await apiPost(`/api/knowledge/${encodeURIComponent(slug)}/intake`, { sourceType: "text", text: value, content: value, originalName: "Pasted text" });
      const job = { id: String(response.jobId), status: String(response.status ?? "queued"), stage: response.stage ?? null, sourceType: "text", originalName: "Pasted text" } satisfies UniversalIntakeJob;
      setJobs((current) => [job, ...current]); setText(""); setTextOpen(false); void watchJob(job.id);
    } catch (err) { setError(err instanceof Error ? err.message : "QRE could not accept the text."); }
    finally { setBusy(false); }
  }

  async function submitWebsite() {
    const value = website.trim(); if (!value || !slug) return;
    setBusy(true); setError("");
    try {
      const response = await apiPost(`/api/knowledge/${encodeURIComponent(slug)}/intake`, { sourceType: "website", originalName: value, mimeType: "text/uri-list", content: value, text: value });
      const job = { id: String(response.jobId), status: String(response.status ?? "queued"), stage: response.stage ?? null, sourceType: "website", originalName: value } satisfies UniversalIntakeJob;
      setJobs((current) => [job, ...current]); setWebsite(""); setWebsiteOpen(false); void watchJob(job.id);
    } catch (err) { setError(err instanceof Error ? err.message : "QRE could not learn that website."); }
    finally { setBusy(false); }
  }

  async function watchJob(jobId: string) {
    try {
      for (;;) {
        const response = await apiGet(`/api/knowledge/${encodeURIComponent(slug)}/intake/${encodeURIComponent(jobId)}`);
        const next = response.job as UniversalIntakeJob;
        setJobs((current) => current.map((job) => job.id === jobId ? { ...job, ...next } : job));
        if (next.status === "completed" || next.status === "failed") { if (next.status === "completed") await onLearned?.(); return; }
        await wait(1200);
      }
    } catch (err) {
      setJobs((current) => current.map((job) => job.id === jobId ? { ...job, status: "failed", stage: "status", error: err instanceof Error ? err.message : "Processing failed." } : job));
    }
  }

  function onDrop(event: DragEvent<HTMLDivElement>) { event.preventDefault(); setDragging(false); const files = Array.from(event.dataTransfer.files); if (files.length) void submitFiles(files); }
  function onPick(event: ChangeEvent<HTMLInputElement>) { const files = Array.from(event.target.files ?? []); if (files.length) void submitFiles(files); event.target.value = ""; }
  const activeJobs = jobs.filter((job) => job.status === "queued" || job.status === "processing");

  return (
    <section style={{ display: "grid", gap: 18 }}>
      <div onDragEnter={(event) => { event.preventDefault(); setDragging(true); }} onDragOver={(event) => event.preventDefault()} onDragLeave={(event) => { if (event.currentTarget === event.target) setDragging(false); }} onDrop={onDrop} style={{ ...panel, padding: "clamp(24px, 5vw, 54px)", textAlign: "center", borderColor: dragging ? "rgba(185,255,241,.62)" : "rgba(255,255,255,.12)" }}>
        <div style={{ fontSize: 10, letterSpacing: 4, opacity: .38, marginBottom: 14 }}>SHOW QRE WHAT EXISTS</div>
        <h2 style={{ margin: 0, fontSize: "clamp(34px, 7vw, 70px)", fontWeight: 500, letterSpacing: "-3px" }}>GIVE QRE ANYTHING</h2>
        <p style={{ margin: "16px auto 30px", maxWidth: 620, opacity: .5, fontSize: 15, lineHeight: 1.6 }}>Drop anything here. QRE keeps the original evidence, analyzes it, and adds what it can prove to your world.</p>
        <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 10 }}>
          <label style={button}>📷 Take photo<input ref={photoRef} type="file" accept="image/*" capture="environment" hidden onChange={onPick} /></label>
          <label style={button}>🖼 Upload photos<input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={onPick} /></label>
          <label style={button}>📄 Upload PDF<input type="file" accept="application/pdf,.pdf" multiple hidden onChange={onPick} /></label>
          <label style={button}>📊 Upload spreadsheet<input type="file" accept=".csv,.xls,.xlsx,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" multiple hidden onChange={onPick} /></label>
          <button type="button" style={button} onClick={() => setTextOpen((value) => !value)}>✎ Paste text</button>
          <button type="button" style={button} onClick={() => setWebsiteOpen((value) => !value)}>🌐 Learn website</button>
        </div>
        <div style={{ margin: "28px auto 0", maxWidth: 760, minHeight: 110, display: "grid", placeItems: "center", borderRadius: 18, border: "1px dashed rgba(255,255,255,.13)", background: "rgba(255,255,255,.018)", color: "rgba(255,255,255,.36)", letterSpacing: 1.8, fontSize: 11 }}>DROP FILES HERE</div>
        {textOpen && <div style={subPanel}><textarea value={text} onChange={(event) => setText(event.target.value)} placeholder="Paste anything. Notes, product lists, policies, descriptions, conversations..." style={textareaStyle} autoFocus /><button type="button" onClick={() => void submitText()} disabled={busy || !text.trim()} style={primaryButton}>{busy ? "QUEUING…" : "SEND TO QRE"}</button></div>}
        {websiteOpen && <div style={subPanel}><input value={website} onChange={(event) => setWebsite(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); void submitWebsite(); } }} placeholder="https://yourbusiness.com" style={textareaStyle} autoFocus /><button type="button" onClick={() => void submitWebsite()} disabled={busy || !website.trim()} style={primaryButton}>{busy ? "QUEUING…" : "LEARN WEBSITE"}</button></div>}
      </div>
      {(activeJobs.length > 0 || jobs.length > 0) && <div style={{ ...panel, padding: 20 }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}><div style={{ fontSize: 10, letterSpacing: 3, opacity: .4 }}>QRE LEARNING</div>{activeJobs.length > 0 && <div style={{ fontSize: 10, letterSpacing: 1, opacity: .45 }}>{activeJobs.length} active</div>}</div><div style={{ display: "grid", gap: 8 }}>{jobs.slice(0, 10).map((job) => <div key={job.id} style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: 16, alignItems: "center", padding: "12px 0", borderTop: "1px solid rgba(255,255,255,.06)" }}><div><div style={{ fontSize: 12 }}>{job.originalName || job.sourceType}</div><div style={{ marginTop: 4, fontSize: 10, opacity: .38 }}>{job.sourceType}{job.stage ? ` · ${job.stage}` : ""}</div>{job.error ? <div style={{ marginTop: 5, fontSize: 10, color: "rgba(255,170,170,.9)", maxWidth: 720 }}>{job.error}</div> : null}</div><div style={{ fontSize: 10, letterSpacing: 1.4, opacity: .65 }}>{job.status === "queued" && "UPLOADED"}{job.status === "processing" && `PROCESSING${job.stage ? ` · ${job.stage}` : ""}`}{job.status === "completed" && `LEARNED${job.result?.factCount ? ` · ${job.result.factCount} facts` : ""}`}{job.status === "failed" && `FAILED${job.stage ? ` · ${job.stage}` : ""}`}</div></div>)}</div></div>}
      {error && <div style={{ border: "1px solid rgba(255,100,100,.18)", borderRadius: 14, padding: 14, background: "rgba(255,80,80,.08)", fontSize: 12 }}>{error}</div>}
    </section>
  );
}

async function fileToPayload(file: File): Promise<Payload> { const dataUrl = await fileToDataUrl(file); const sourceType = classifyFile(file); return { sourceType, originalName: file.name, mimeType: file.type || undefined, imageDataUrl: file.type.startsWith("image/") ? dataUrl : undefined, content: file.type.startsWith("image/") ? undefined : dataUrl }; }
function fileToDataUrl(file: File): Promise<string> { return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => { if (typeof reader.result !== "string") { reject(new Error("Could not read file.")); return; } resolve(reader.result); }; reader.onerror = () => reject(new Error("Could not read file.")); reader.readAsDataURL(file); }); }
function classifyFile(file: File): string { if (file.type.startsWith("image/")) return "photo"; if (file.type === "application/pdf" || /\.pdf$/i.test(file.name)) return "pdf"; if (file.type.includes("spreadsheet") || file.type.includes("excel") || /\.(xlsx|xls|csv)$/i.test(file.name)) return "spreadsheet"; return "file"; }
function wait(milliseconds: number): Promise<void> { return new Promise((resolve) => setTimeout(resolve, milliseconds)); }
const subPanel: CSSProperties = { margin: "18px auto 0", maxWidth: 760, padding: 16, borderRadius: 18, border: "1px solid rgba(255,255,255,.08)", background: "rgba(255,255,255,.025)", display: "grid", gap: 10 };
const textareaStyle: CSSProperties = { width: "100%", boxSizing: "border-box", minHeight: 110, resize: "vertical", border: "1px solid rgba(255,255,255,.1)", borderRadius: 14, background: "rgba(0,0,0,.25)", color: "#fff", padding: 14, font: "inherit" };
const primaryButton: CSSProperties = { border: 0, borderRadius: 14, background: "#fff", color: "#050608", padding: "12px 14px", cursor: "pointer", font: "inherit", fontSize: 11, fontWeight: 900, letterSpacing: 1.3 };
