import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { AdaptiveAnswer, AdaptiveExperienceBrief, AdaptiveStep } from "@qre/contracts";
import { apiPost, getUserAssets } from "../lib/api";
import DashboardLayout from "../components/layout/DashboardLayout";
import IdeaParticles from "../components/effects/IdeaParticles";

type Asset = { id: string; slug: string; displayName?: string | null; category?: string | null };

type AdaptiveStateResponse = {
  brief: AdaptiveExperienceBrief;
  step: AdaptiveStep;
  suggestedCapabilities: string[];
  learning?: string[];
};

export default function AdaptiveDashboard() {
  const navigate = useNavigate();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [assetId, setAssetId] = useState("");
  const [intent, setIntent] = useState("");
  const [state, setState] = useState<AdaptiveStateResponse | null>(null);
  const [answerText, setAnswerText] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [authoring, setAuthoring] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    void (async () => {
      try {
        const response = await getUserAssets();
        const next = (Array.isArray(response) ? response : response.assets ?? []) as Asset[];
        setAssets(next);
        if (next[0]) setAssetId(next[0].id);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not load your QRE objects.");
      }
    })();
  }, []);

  const activeAsset = useMemo(() => assets.find((asset) => asset.id === assetId) ?? null, [assets, assetId]);

  async function start() {
    if (!intent.trim() || !assetId || loading) return;
    setLoading(true);
    setError("");
    try {
      const result = await apiPost("/api/adaptive/start", { assetId, intent: intent.trim() });
      setState(result);
      setAnswerText("");
      setSelected([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start adaptive setup.");
    } finally {
      setLoading(false);
    }
  }

  async function advance(answer: AdaptiveAnswer) {
    if (!state || loading) return;
    setLoading(true);
    setError("");
    try {
      const result = await apiPost("/api/adaptive/next", {
        brief: state.brief,
        answer,
        previousStep: state.step,
      });
      setState(result);
      setAnswerText("");
      setSelected([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not continue setup.");
    } finally {
      setLoading(false);
    }
  }

  async function makeIt() {
    if (!state || !state.brief.readyForAuthor || authoring) return;
    setAuthoring(true);
    setError("");
    try {
      const result = await apiPost("/api/adaptive/author", { brief: state.brief });
      sessionStorage.setItem("adaptivePreview", JSON.stringify(result.compiled));
      sessionStorage.setItem("adaptiveDraft", JSON.stringify({
        experienceId: result.experienceId,
        flowId: result.flowId,
        assetId: state.brief.assetId,
        prompt: state.brief.originalIntent,
        brief: state.brief,
      }));
      navigate("/adaptive/preview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Author could not make the experience.");
    } finally {
      setAuthoring(false);
    }
  }

  function reset() {
    setState(null);
    setAnswerText("");
    setSelected([]);
    setError("");
  }

  const step = state?.step;

  return (
    <DashboardLayout>
      <IdeaParticles />
      <main style={shell}>
        <div style={topbar}>
          <div style={brand}>QRE</div>
          {assets.length > 0 && (
            <select value={assetId} onChange={(event) => { setAssetId(event.target.value); reset(); }} style={assetSelect} aria-label="QRE object">
              {assets.map((asset) => <option key={asset.id} value={asset.id}>{asset.displayName || asset.slug}</option>)}
            </select>
          )}
        </div>

        {!state ? (
          <section style={hero}>
            <div style={eyebrow}>ADAPTIVE CREATOR</div>
            <h1 style={title}>What do you want to make?</h1>
            <p style={subtitle}>Tell QRE normally. It will learn what you mean, know which capabilities fit, and ask only for what it still needs.</p>

            <div style={intentCard}>
              <textarea
                value={intent}
                onChange={(event) => setIntent(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void start();
                  }
                }}
                placeholder="Make a living dog tag for Coco…"
                rows={4}
                maxLength={12000}
                style={intentInput}
              />
              <div style={intentFooter}>
                <span style={muted}>{activeAsset ? `for ${activeAsset.displayName || activeAsset.slug}` : "No QRE object selected"}</span>
                <button type="button" onClick={() => void start()} disabled={loading || !intent.trim() || !assetId} style={primaryButton}>{loading ? "UNDERSTANDING…" : "START"}</button>
              </div>
            </div>

            <div style={exampleRow}>
              {[
                "Make a living dog tag for a puppy for sale.",
                "Make a wedding memory that guests can contribute to.",
                "Make videos and live memories for my company.",
                "Create a permanent identity for this property.",
              ].map((example) => (
                <button key={example} type="button" onClick={() => setIntent(example)} style={exampleButton}>{example}</button>
              ))}
            </div>

            <p style={finePrint}>QRE keeps facts separate from creative choices. The Author creates from the supplied reality; you approve before anything becomes the active QR experience.</p>
            {assets.length === 0 && <Link to="/admin/create" style={secondaryLink}>CREATE / CONNECT A QRE OBJECT</Link>}
          </section>
        ) : (
          <section style={workspace}>
            <div style={workspaceHeader}>
              <button type="button" onClick={reset} style={backButton}>← NEW</button>
              <div>
                <div style={eyebrow}>{state.brief.domain ? state.brief.domain.toUpperCase() : "QRE"}</div>
                <div style={smallTitle}>{state.brief.originalIntent}</div>
              </div>
              <div style={progress}>{Math.round(state.brief.completeness * 100)}%</div>
            </div>

            <div style={contentGrid}>
              <section style={stepCard}>
                <div style={eyebrow}>NEXT</div>
                <h2 style={stepTitle}>{step.title}</h2>
                {step.explanation && <p style={stepExplanation}>{step.explanation}</p>}

                {step.options && step.options.length > 0 && (
                  <div style={options}>
                    {step.options.map((option) => {
                      const active = selected.includes(option.id);
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => {
                            if (step.kind === "capability" || step.field === "tone") {
                              setSelected([option.id]);
                              return;
                            }
                            setSelected([option.id]);
                          }}
                          style={{ ...optionButton, ...(active ? optionButtonActive : {}) }}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                )}

                {(step.kind === "question" || step.kind === "media") && (
                  <textarea
                    value={answerText}
                    onChange={(event) => setAnswerText(event.target.value)}
                    placeholder={step.placeholder ?? "Add a real detail…"}
                    rows={5}
                    style={answerInput}
                  />
                )}

                {step.kind === "media" && <div style={mediaNote}>Media choices are recorded now; the existing media pipeline can supply the actual files. The Author will treat them as source material, not invented facts.</div>}

                <div style={actionRow}>
                  {step.optional && <button type="button" onClick={() => void advance({ stepId: step.id, action: "skip" })} disabled={loading} style={secondaryButton}>SKIP</button>}
                  {step.kind === "create" || step.readyForAuthor ? (
                    <button type="button" onClick={() => void makeIt()} disabled={authoring} style={primaryButton}>{authoring ? "AUTHORING…" : "MAKE IT"}</button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        const optionIds = selected;
                        const selectedOption = step.options?.find((option) => optionIds.includes(option.id));
                        const answer: AdaptiveAnswer = {
                          stepId: step.id,
                          action: step.kind === "choice" || step.kind === "capability" || step.kind === "media" ? "select" : "submit",
                          value: selectedOption?.value ?? answerText.trim(),
                          values: answerText.trim() ? [answerText.trim()] : selectedOption ? [selectedOption.value] : [],
                          selectedOptionIds: optionIds,
                        };
                        void advance(answer);
                      }}
                      disabled={loading || (!answerText.trim() && selected.length === 0)}
                      style={primaryButton}
                    >
                      {loading ? "UPDATING…" : "CONTINUE"}
                    </button>
                  )}
                </div>
              </section>

              <aside style={briefCard}>
                <div style={eyebrow}>QRE UNDERSTANDS</div>
                {state.brief.subject && <div style={fact}><span>SUBJECT</span><strong>{state.brief.subject}</strong></div>}
                {state.brief.subjectType && <div style={fact}><span>TYPE</span><strong>{state.brief.subjectType}</strong></div>}
                {state.brief.goal && <div style={fact}><span>GOAL</span><strong>{state.brief.goal}</strong></div>}
                {state.brief.output && <div style={fact}><span>OUTPUT</span><strong>{state.brief.output}</strong></div>}
                {state.brief.tone.length > 0 && <div style={fact}><span>TONE</span><strong>{state.brief.tone.join(" · ")}</strong></div>}
                {state.brief.facts.length > 0 && <div style={fact}><span>REAL FACTS</span><div style={factList}>{state.brief.facts.slice(-8).map((item, index) => <div key={`${item}-${index}`}>{item}</div>)}</div></div>}
                {state.suggestedCapabilities.length > 0 && <div style={fact}><span>AVAILABLE NEXT</span><div style={tagList}>{state.suggestedCapabilities.slice(0, 6).map((item) => <span key={item} style={tag}>{item.replace(/_/g, " ")}</span>)}</div></div>}
                {state.learning && state.learning.length > 0 && <div style={learningBox}><span>LEARNED</span><div>{state.learning.slice(0, 3).join(" · ")}</div></div>}
              </aside>
            </div>
          </section>
        )}

        {error && <div style={errorBox}>{error}</div>}
      </main>
    </DashboardLayout>
  );
}

const shell: React.CSSProperties = { minHeight: "100vh", color: "#fff", background: "radial-gradient(circle at 50% 15%, rgba(100,255,225,.06), transparent 36%), #050608", padding: "0 20px 80px" };
const topbar: React.CSSProperties = { minHeight: 72, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, maxWidth: 1180, margin: "0 auto" };
const brand: React.CSSProperties = { fontSize: 11, letterSpacing: 9, opacity: .4 };
const assetSelect: React.CSSProperties = { minWidth: 220, maxWidth: "50vw", background: "rgba(255,255,255,.04)", color: "#fff", border: "1px solid rgba(255,255,255,.12)", borderRadius: 999, padding: "10px 14px" };
const hero: React.CSSProperties = { minHeight: "calc(100vh - 72px)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", maxWidth: 900, margin: "0 auto", textAlign: "center" };
const eyebrow: React.CSSProperties = { fontSize: 9, letterSpacing: 4, opacity: .34, marginBottom: 12, textTransform: "uppercase" };
const title: React.CSSProperties = { fontSize: "clamp(44px, 8vw, 82px)", lineHeight: .94, letterSpacing: "-4px", fontWeight: 500, margin: 0 };
const subtitle: React.CSSProperties = { maxWidth: 680, fontSize: 16, lineHeight: 1.7, opacity: .5, margin: "20px auto 30px" };
const intentCard: React.CSSProperties = { width: "min(780px, 100%)", padding: 18, borderRadius: 26, background: "rgba(255,255,255,.035)", border: "1px solid rgba(255,255,255,.1)", boxSizing: "border-box" };
const intentInput: React.CSSProperties = { width: "100%", minHeight: 150, boxSizing: "border-box", resize: "vertical", border: 0, outline: 0, background: "transparent", color: "#fff", font: "inherit", fontSize: 19, lineHeight: 1.6 };
const intentFooter: React.CSSProperties = { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,.06)" };
const muted: React.CSSProperties = { opacity: .3, fontSize: 10, letterSpacing: 1 };
const primaryButton: React.CSSProperties = { border: "1px solid rgba(130,255,235,.4)", background: "rgba(130,255,235,.1)", color: "#e5fff9", borderRadius: 999, padding: "12px 20px", cursor: "pointer", letterSpacing: 1.6, fontSize: 10, fontWeight: 800 };
const secondaryButton: React.CSSProperties = { border: "1px solid rgba(255,255,255,.12)", background: "transparent", color: "rgba(255,255,255,.6)", borderRadius: 999, padding: "11px 18px", cursor: "pointer", letterSpacing: 1.4, fontSize: 10 };
const exampleRow: React.CSSProperties = { display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", marginTop: 16 };
const exampleButton: React.CSSProperties = { border: "1px solid rgba(255,255,255,.08)", background: "rgba(255,255,255,.025)", color: "rgba(255,255,255,.46)", borderRadius: 999, padding: "9px 12px", cursor: "pointer", fontSize: 10 };
const finePrint: React.CSSProperties = { maxWidth: 720, marginTop: 24, opacity: .28, fontSize: 11, lineHeight: 1.6 };
const secondaryLink: React.CSSProperties = { marginTop: 20, color: "rgba(255,255,255,.6)", fontSize: 10, letterSpacing: 2 };
const workspace: React.CSSProperties = { maxWidth: 1180, margin: "0 auto", padding: "32px 0 80px" };
const workspaceHeader: React.CSSProperties = { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, marginBottom: 28 };
const backButton: React.CSSProperties = { border: 0, background: "transparent", color: "rgba(255,255,255,.42)", cursor: "pointer", letterSpacing: 1.5, fontSize: 10 };
const smallTitle: React.CSSProperties = { maxWidth: 700, fontSize: 18, lineHeight: 1.4, color: "rgba(255,255,255,.78)" };
const progress: React.CSSProperties = { fontSize: 28, fontWeight: 500, opacity: .7 };
const contentGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "minmax(0, 1.6fr) minmax(260px, .7fr)", gap: 16 };
const stepCard: React.CSSProperties = { border: "1px solid rgba(255,255,255,.08)", borderRadius: 28, background: "rgba(255,255,255,.03)", padding: "clamp(24px, 4vw, 44px)" };
const stepTitle: React.CSSProperties = { margin: "0 0 12px", fontSize: "clamp(34px, 5vw, 58px)", fontWeight: 500, letterSpacing: "-2.5px", lineHeight: 1 };
const stepExplanation: React.CSSProperties = { opacity: .5, lineHeight: 1.7, maxWidth: 680 };
const options: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 10, marginTop: 26 };
const optionButton: React.CSSProperties = { minHeight: 60, borderRadius: 18, border: "1px solid rgba(255,255,255,.1)", background: "rgba(255,255,255,.025)", color: "rgba(255,255,255,.75)", cursor: "pointer", padding: 12, fontSize: 13, textAlign: "left" };
const optionButtonActive: React.CSSProperties = { borderColor: "rgba(130,255,235,.45)", background: "rgba(130,255,235,.1)", color: "#eafff9" };
const answerInput: React.CSSProperties = { width: "100%", minHeight: 150, boxSizing: "border-box", marginTop: 16, padding: 16, borderRadius: 18, border: "1px solid rgba(255,255,255,.1)", background: "rgba(0,0,0,.18)", color: "#fff", outline: 0, font: "inherit", lineHeight: 1.6 };
const mediaNote: React.CSSProperties = { marginTop: 14, opacity: .35, fontSize: 11, lineHeight: 1.6 };
const actionRow: React.CSSProperties = { display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 24 };
const briefCard: React.CSSProperties = { border: "1px solid rgba(255,255,255,.08)", borderRadius: 28, background: "rgba(255,255,255,.02)", padding: 22, alignSelf: "start" };
const fact: React.CSSProperties = { padding: "13px 0", borderBottom: "1px solid rgba(255,255,255,.06)" };
const factList: React.CSSProperties = { marginTop: 8, display: "grid", gap: 6, color: "rgba(255,255,255,.64)", fontSize: 12, lineHeight: 1.5 };
const factLabelStyle: React.CSSProperties = { fontSize: 9, letterSpacing: 2, opacity: .35 };
const tagList: React.CSSProperties = { display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 };
const tag: React.CSSProperties = { padding: "6px 8px", borderRadius: 999, background: "rgba(255,255,255,.045)", color: "rgba(255,255,255,.55)", fontSize: 9 };
const learningBox: React.CSSProperties = { marginTop: 14, padding: 12, borderRadius: 14, background: "rgba(130,255,235,.045)", color: "rgba(220,255,248,.55)", fontSize: 10, lineHeight: 1.5 };
const errorBox: React.CSSProperties = { position: "fixed", bottom: 18, left: "50%", transform: "translateX(-50%)", maxWidth: "min(720px,90vw)", zIndex: 50, padding: "13px 16px", borderRadius: 14, background: "rgba(255,70,90,.11)", border: "1px solid rgba(255,70,90,.22)", color: "#ffdfe3", fontSize: 12 };
