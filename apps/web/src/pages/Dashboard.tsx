import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { getUserAssets, apiPost } from "../lib/api";
import DashboardLayout from "../components/layout/DashboardLayout";
import IdeaParticles from "../components/effects/IdeaParticles";

type QREObject = {
  id: string;
  slug: string;
  status: string;
  tier: string;
  flowId: string | null;
  displayName?: string | null;
  category?: string | null;
};

const orbit = [
  { top: "17%", left: "12%", size: 10, delay: "0s" },
  { top: "26%", left: "79%", size: 7, delay: "-2s" },
  { top: "69%", left: "73%", size: 9, delay: "-4s" },
  { top: "76%", left: "19%", size: 13, delay: "-6s" },
  { top: "44%", left: "89%", size: 6, delay: "-1s" },
];

export default function Dashboard() {
  const [objects, setObjects] = useState<QREObject[]>([]);
  const [loading, setLoading] = useState(true);
  const [prompt, setPrompt] = useState("");
  const [creating, setCreating] = useState(false);
  const [activeAsset, setActiveAsset] = useState("");

  const promptRef = useRef<HTMLTextAreaElement | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    void (async () => {
      try {
        const response = await getUserAssets();

        const assets: QREObject[] = Array.isArray(response)
          ? response
          : Array.isArray(response.assets)
            ? response.assets
            : [];

        setObjects(assets);
        setActiveAsset(assets[0]?.id ?? "");
      } catch (error) {
        console.error("QRE dashboard load failed", error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const activeObject = useMemo(
    () =>
      objects.find((object) => object.id === activeAsset) ??
      objects[0] ??
      null,
    [objects, activeAsset],
  );

  function resizePrompt() {
    const node = promptRef.current;
    if (!node) return;

    node.style.height = "0px";
    node.style.height = `${Math.min(Math.max(node.scrollHeight, 110), 360)}px`;
  }

  async function create() {
    const text = prompt.trim();

    if (!text || creating) return;

    if (!activeObject?.id) {
      console.error("QRE creation requires an active QRE object.");
      return;
    }

    setCreating(true);

    try {
      const result = (await apiPost("/experience/create", {
        assetId: activeObject.id,
        prompt: text,
      })) as {
        success?: boolean;
        experienceId?: string;
        flowId?: string;
        experience?: unknown;
        error?: string;
      };

      if (!result.success || !result.experienceId) {
        throw new Error(
          result.error || "QRE could not create the experience.",
        );
      }

      navigate("/experience/preview", {
        state: {
          experience: result.experience,
          experienceId: result.experienceId,
          flowId: result.flowId ?? null,
          assetId: activeObject.id,
          sourcePrompt: text,
        },
      });
    } catch (error) {
      console.error("QRE experience creation failed", error);
    } finally {
      setCreating(false);
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <IdeaParticles />
        <main style={loadingStyle}>QRE AWAKENING...</main>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <IdeaParticles />

      <main style={pageStyle}>
        <div style={brand}>QRE</div>

        <section style={heroStyle}>
          <div style={eyebrow}>
            {activeObject?.displayName || "YOUR WORLD"}
          </div>

          <h1 style={titleStyle}>What happened?</h1>

          <p style={subStyle}>
            Tell QRE. QRE figures out what it means.
          </p>

          <div style={promptShell}>
            <textarea
              ref={promptRef}
              value={prompt}
              autoFocus
              maxLength={30000}
              rows={4}
              spellCheck
              disabled={creating}
              placeholder="Tell QRE what happened..."
              onChange={(event) => {
                setPrompt(event.target.value);
                requestAnimationFrame(resizePrompt);
              }}
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" &&
                  !event.shiftKey
                ) {
                  event.preventDefault();
                  void create();
                }
              }}
              style={promptStyle}
            />

            <div style={promptFooter}>
              <span style={counterStyle}>
                {prompt.length.toLocaleString()} / 30,000
              </span>

              <button
                type="button"
                onClick={() => void create()}
                disabled={creating || !prompt.trim() || !activeObject}
                style={{
                  ...createButton,
                  opacity:
                    creating || !prompt.trim() || !activeObject
                      ? 0.4
                      : 1,
                }}
              >
                {creating ? "CREATING…" : "MAKE IT"}
              </button>
            </div>
          </div>

          {!activeObject && (
            <div style={emptyObject}>
              Create or select a QRE object before creating an experience.
            </div>
          )}
        </section>

        <section style={orbitLayer} aria-label="QRE objects">
          {objects.map((object, index) => {
            const point = orbit[index % orbit.length]!;
            const selected = activeObject?.id === object.id;

            return (
              <div
                key={object.id}
                style={{
                  position: "absolute",
                  top: point.top,
                  left: point.left,
                  animation: `qreFloat ${8 + index}s ease-in-out infinite`,
                  animationDelay: point.delay,
                  pointerEvents: "auto",
                }}
              >
                <button
                  type="button"
                  aria-label={`Use ${object.displayName || object.slug}`}
                  onClick={() => setActiveAsset(object.id)}
                  style={{
                    ...orbButton,
                    width: point.size * 2 + 26,
                    height: point.size * 2 + 26,
                    boxShadow: selected
                      ? "0 0 40px rgba(120,255,230,.35)"
                      : "none",
                  }}
                >
                  <span
                    style={{
                      width: point.size,
                      height: point.size,
                      borderRadius: 50,
                      background: selected ? "#b9fff1" : "#fff",
                      boxShadow:
                        "0 0 24px rgba(255,255,255,.95)",
                    }}
                  />
                </button>

                <div
                  style={{
                    marginTop: 6,
                    fontSize: 10,
                    letterSpacing: 2,
                    opacity: selected ? 0.85 : 0.32,
                    textAlign: "center",
                    whiteSpace: "nowrap",
                  }}
                >
                  {object.displayName || object.slug}
                </div>

                {selected && (
                  <div style={orbitActions}>
                    <Link
                      to={`/dashboard/assets/${object.slug}`}
                      style={miniLink}
                    >
                      DETAIL
                    </Link>

                    <Link
                      to={`/dashboard/assets/${object.slug}/knowledge`}
                      style={miniLink}
                    >
                      MEMORY
                    </Link>

                    <Link
                      to={`/dashboard/assets/${object.slug}/learning`}
                      style={miniLink}
                    >
                      LEARNING
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </section>
      </main>
    </DashboardLayout>
  );
}

const loadingStyle = {
  minHeight: "100vh",
  display: "grid",
  placeItems: "center",
  color: "rgba(255,255,255,.5)",
  letterSpacing: 4,
};

const pageStyle = {
  position: "relative" as const,
  minHeight: "100vh",
  overflow: "hidden" as const,
  color: "#f7f7f7",
  background:
    "radial-gradient(circle at 50% 42%, rgba(80,255,220,.055), transparent 32%), #050608",
};

const brand = {
  position: "absolute" as const,
  top: 22,
  left: 26,
  fontSize: 11,
  letterSpacing: 10,
  opacity: 0.42,
  zIndex: 10,
};

const heroStyle = {
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column" as const,
  alignItems: "center",
  justifyContent: "center",
  padding: "90px 20px 120px",
  position: "relative" as const,
  zIndex: 4,
};

const eyebrow = {
  fontSize: 10,
  letterSpacing: 5,
  opacity: 0.35,
  marginBottom: 16,
  textTransform: "uppercase" as const,
};

const titleStyle = {
  fontSize: "clamp(44px, 9vw, 82px)",
  fontWeight: 500,
  letterSpacing: "-4px",
  lineHeight: 0.95,
  textAlign: "center" as const,
  margin: 0,
};

const subStyle = {
  margin: "18px 0 34px",
  opacity: 0.46,
  textAlign: "center" as const,
  maxWidth: 560,
  fontSize: 15,
};

const promptShell = {
  width: "min(900px, 92vw)",
  border: "1px solid rgba(255,255,255,.12)",
  background: "rgba(8,10,13,.72)",
  backdropFilter: "blur(24px)",
  borderRadius: 26,
  padding: "16px 18px 14px",
  boxShadow: "0 25px 100px rgba(0,0,0,.35)",
};

const promptStyle = {
  width: "100%",
  boxSizing: "border-box" as const,
  minHeight: 110,
  maxHeight: 360,
  resize: "none" as const,
  overflowY: "auto" as const,
  background: "transparent",
  border: 0,
  outline: 0,
  color: "#fff",
  fontFamily: "inherit",
  fontSize: "clamp(19px, 2.3vw, 25px)",
  lineHeight: 1.45,
  padding: "8px 8px 4px",
};

const promptFooter = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "10px 6px 2px",
};

const counterStyle = {
  fontSize: 10,
  letterSpacing: 1.2,
  opacity: 0.28,
};

const createButton = {
  border: "1px solid rgba(255,255,255,.22)",
  background: "#fff",
  color: "#000",
  borderRadius: 999,
  padding: "11px 18px",
  cursor: "pointer",
  letterSpacing: 1.5,
  fontSize: 10,
  fontWeight: 700,
};

const emptyObject = {
  marginTop: 16,
  fontSize: 11,
  opacity: 0.35,
};

const orbitLayer = {
  position: "absolute" as const,
  inset: 0,
  zIndex: 3,
  pointerEvents: "none" as const,
};

const orbButton = {
  border: 0,
  borderRadius: 999,
  background: "transparent",
  display: "grid",
  placeItems: "center",
  cursor: "pointer",
  padding: 0,
};

const orbitActions = {
  display: "flex",
  gap: 6,
  justifyContent: "center",
  marginTop: 7,
};

const miniLink = {
  color: "rgba(255,255,255,.6)",
  textDecoration: "none",
  fontSize: 8,
  letterSpacing: 1.3,
  padding: "4px 6px",
  border: "1px solid rgba(255,255,255,.1)",
  borderRadius: 999,
};