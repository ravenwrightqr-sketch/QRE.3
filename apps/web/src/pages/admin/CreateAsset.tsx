import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiPost } from "../../lib/api";

type StringFieldProps = {
  label: string;
  hint?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  rows?: number;
};

function StringField({
  label,
  hint,
  placeholder,
  value,
  onChange,
  multiline = false,
  rows = 4,
}: StringFieldProps) {
  const commonProps = {
    value,
    placeholder,
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onChange(event.target.value),
    style: styles.input,
  };

  return (
    <div style={styles.field}>
      <label style={styles.label}>{label}</label>
      {hint ? <div style={styles.hint}>{hint}</div> : null}

      {multiline ? (
        <textarea {...commonProps} rows={rows} />
      ) : (
        <input {...commonProps} />
      )}
    </div>
  );
}

function splitList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function makeSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/["'’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function cleanText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export default function CreateAsset() {
  const navigate = useNavigate();

  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [businessDescription, setBusinessDescription] = useState("");
  const [services, setServices] = useState("");
  const [capabilities, setCapabilities] = useState("");
  const [audience, setAudience] = useState("");
  const [objective, setObjective] = useState("");
  const [creativePreferences, setCreativePreferences] = useState("");

  const [slug, setSlug] = useState("");
  const [prompt, setPrompt] = useState("");
  const [priceCents, setPriceCents] = useState(999);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const suggestedSlug = useMemo(() => makeSlug(businessName), [businessName]);
  const finalSlug = useMemo(
    () => makeSlug(slug) || suggestedSlug,
    [slug, suggestedSlug],
  );

  function validate(): string | undefined {
    if (!cleanText(businessName)) return "Business name required.";
    if (!cleanText(businessType)) return "Tell us what kind of business this is.";
    if (!cleanText(businessDescription)) {
      return "Give QRE a short description of the business.";
    }
    if (!finalSlug) return "A valid business slug could not be created.";
    if (!Number.isFinite(priceCents) || priceCents < 0) {
      return "Unlock price must be zero or greater.";
    }
    return undefined;
  }

  async function create() {
    setError("");

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);

      const result = await apiPost("/api/admin/assets/create-experience", {
        displayName: cleanText(businessName),
        businessName: cleanText(businessName),
        businessType: cleanText(businessType),
        businessDescription: cleanText(businessDescription),
        services: splitList(services),
        capabilities: splitList(capabilities),
        audience: splitList(audience),
        objective: cleanText(objective),
        creativePreferences: splitList(creativePreferences),
        slug: finalSlug,
        priceCents: Math.round(priceCents),
        prompt: cleanText(prompt),
      });

      console.log("QRE BUSINESS CREATED", result);
      navigate("/admin");
    } catch (err: unknown) {
      console.error("QRE BUSINESS CREATION FAILED", err);
      const message =
        err instanceof Error
          ? err.message
          : "QRE could not create this business.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  const hasPrompt = Boolean(cleanText(prompt));

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.header}>
          <div style={styles.kicker}>QRE BUSINESS SETUP</div>
          <h1 style={styles.title}>Create your business</h1>
          <p style={styles.subtitle}>
            Tell QRE about the business once. QRE keeps that context and uses it
            whenever you create something new.
          </p>
        </div>

        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <div>
              <h2 style={styles.sectionTitle}>About the business</h2>
              <p style={styles.sectionDescription}>
                This becomes persistent business context in QRE.
              </p>
            </div>
          </div>

          <StringField
            label="Business name"
            placeholder="House of Vapes & Smoke"
            value={businessName}
            onChange={setBusinessName}
          />

          <StringField
            label="What kind of business is this?"
            hint="Use normal words. QRE will handle the structure."
            placeholder="Vape shop"
            value={businessType}
            onChange={setBusinessType}
          />

          <StringField
            label="Tell QRE about the business"
            hint="What do you do? What should QRE understand about you?"
            placeholder="Retail vape and smoke shop selling a wide range of products and flavors."
            value={businessDescription}
            onChange={setBusinessDescription}
            multiline
            rows={4}
          />

          <StringField
            label="Services"
            hint="Separate items with commas."
            placeholder="Vape products, smoke products, accessories"
            value={services}
            onChange={setServices}
          />

          <StringField
            label="What are you especially good at?"
            hint="Skills, capabilities, specialties, or things customers notice."
            placeholder="Product selection, flavor variety, customer guidance"
            value={capabilities}
            onChange={setCapabilities}
          />

          <StringField
            label="Who is this for?"
            hint="Separate audiences with commas."
            placeholder="Adult customers, repeat customers, flavor shoppers"
            value={audience}
            onChange={setAudience}
          />

          <StringField
            label="What should QRE help accomplish?"
            hint="The larger purpose behind the business's experiences."
            placeholder="Help customers find products they actually like and come back."
            value={objective}
            onChange={setObjective}
            multiline
            rows={3}
          />

          <StringField
            label="Creative personality"
            hint="Describe the feel you like. Separate preferences with commas."
            placeholder="Straightforward, bold, funny, distinctive"
            value={creativePreferences}
            onChange={setCreativePreferences}
          />
        </section>

        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <div>
              <h2 style={styles.sectionTitle}>
                First experience <span style={styles.optional}>(optional)</span>
              </h2>
              <p style={styles.sectionDescription}>
                Leave this empty. You can teach QRE what happened later, after the
                business exists.
              </p>
            </div>
          </div>

          <StringField
            label="What happened?"
            hint="Only use this when you intentionally want to create an experience now."
            placeholder="Leave blank for now."
            value={prompt}
            onChange={setPrompt}
            multiline
            rows={6}
          />
        </section>

        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <div>
              <h2 style={styles.sectionTitle}>Asset</h2>
              <p style={styles.sectionDescription}>
                The technical details stay simple.
              </p>
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Custom slug</label>
            <div style={styles.hint}>
              Optional. Leave it blank and QRE will use the business name.
            </div>
            <input
              placeholder={suggestedSlug || "house-of-vapes-smoke"}
              value={slug}
              onChange={(event) => setSlug(event.target.value)}
              style={styles.input}
            />
            {finalSlug ? (
              <div style={styles.slugPreview}>qre.com/{finalSlug}</div>
            ) : null}
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Unlock price</label>
            <div style={styles.hint}>Amount in cents.</div>
            <input
              type="number"
              min={0}
              step={1}
              value={priceCents}
              onChange={(event) => {
                const next = Number(event.target.value);
                setPriceCents(Number.isFinite(next) ? next : 0);
              }}
              style={styles.input}
            />
          </div>
        </section>

        {error ? <div style={styles.error}>{error}</div> : null}

        <div style={styles.footer}>
          <button
            type="button"
            onClick={create}
            disabled={loading}
            style={{
              ...styles.button,
              ...(loading ? styles.buttonDisabled : {}),
            }}
          >
            {loading
              ? hasPrompt
                ? "Building your experience..."
                : "Creating your business..."
              : hasPrompt
                ? "⚡ Create QRE Experience"
                : "Create QRE Business"}
          </button>

          <div style={styles.footerNote}>
            Your business context is saved with the asset and used for future
            creations.
          </div>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100%",
    padding: "48px 24px 80px",
    background: "#f7f7f5",
  },
  container: {
    maxWidth: 760,
    margin: "0 auto",
  },
  header: {
    marginBottom: 40,
  },
  kicker: {
    marginBottom: 10,
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    opacity: 0.5,
  },
  title: {
    margin: 0,
    fontSize: 40,
    lineHeight: 1.08,
    fontWeight: 800,
    letterSpacing: "-0.03em",
  },
  subtitle: {
    maxWidth: 660,
    margin: "14px 0 0",
    fontSize: 17,
    lineHeight: 1.55,
    opacity: 0.68,
  },
  section: {
    marginBottom: 24,
    padding: 28,
    background: "#ffffff",
    border: "1px solid rgba(0,0,0,0.08)",
    borderRadius: 20,
    boxShadow: "0 8px 30px rgba(0,0,0,0.04)",
  },
  sectionHeader: {
    marginBottom: 24,
  },
  sectionTitle: {
    margin: 0,
    fontSize: 22,
    fontWeight: 750,
    letterSpacing: "-0.02em",
  },
  optional: {
    fontSize: 13,
    fontWeight: 600,
    opacity: 0.45,
  },
  sectionDescription: {
    margin: "6px 0 0",
    fontSize: 14,
    lineHeight: 1.45,
    opacity: 0.58,
  },
  field: {
    marginBottom: 22,
  },
  label: {
    display: "block",
    marginBottom: 6,
    fontSize: 14,
    fontWeight: 700,
  },
  hint: {
    marginBottom: 8,
    fontSize: 12,
    lineHeight: 1.45,
    opacity: 0.55,
  },
  input: {
    boxSizing: "border-box",
    width: "100%",
    minHeight: 48,
    padding: "12px 14px",
    border: "1px solid rgba(0,0,0,0.14)",
    borderRadius: 12,
    background: "#fff",
    font: "inherit",
    fontSize: 15,
    lineHeight: 1.45,
    outline: "none",
    resize: "vertical",
  },
  slugPreview: {
    marginTop: 8,
    fontSize: 12,
    opacity: 0.5,
  },
  error: {
    marginBottom: 18,
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid rgba(180,0,0,0.18)",
    background: "rgba(180,0,0,0.06)",
    fontSize: 14,
    lineHeight: 1.45,
  },
  footer: {
    marginTop: 28,
  },
  button: {
    width: "100%",
    minHeight: 56,
    padding: "14px 20px",
    border: 0,
    borderRadius: 14,
    background: "#111111",
    color: "#ffffff",
    font: "inherit",
    fontSize: 16,
    fontWeight: 800,
    cursor: "pointer",
  },
  buttonDisabled: {
    opacity: 0.55,
    cursor: "wait",
  },
  footerNote: {
    marginTop: 10,
    textAlign: "center",
    fontSize: 12,
    lineHeight: 1.45,
    opacity: 0.5,
  },
};
