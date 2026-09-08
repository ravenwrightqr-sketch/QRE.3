import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ChangeEvent,
  type DragEvent,
} from "react";
import { useParams, Link } from "react-router-dom";
import DashboardLayout from "../components/layout/DashboardLayout";
import { apiGet, apiPost } from "../lib/api";

type IntakeJob = {
  id: string;
  status: "queued" | "processing" | "completed" | "failed" | string;
  sourceType: string;
  originalName?: string | null;
  result?: {
    factCount?: number;
    catalogIds?: string[];
    observationIds?: string[];
  } | null;
  error?: string | null;
};

type KnowledgeItem = {
  id: string;
  createdAt: string;
  label?: string;
  value?: string;
  category?: string;
  source?: string;
  notes?: string;
};

type KnowledgeResponse = {
  asset: {
    slug: string;
    displayName?: string | null;
  };
  knowledge: KnowledgeItem[];
  categories: string[];
  metrics?: Record<string, unknown> | null;
};

type IntakePayload = {
  sourceType: string;
  originalName?: string;
  mimeType?: string;
  imageDataUrl?: string;
  content?: string;
  text?: string;
};

const panel: CSSProperties = {
  border: "1px solid rgba(255,255,255,.11)",
  borderRadius: 20,
  background: "rgba(255,255,255,.035)",
};

export default function KnowledgeDashboard() {
  const { slug = "" } = useParams();
  const pickerRef = useRef<HTMLInputElement | null>(null);

  const [data, setData] = useState<KnowledgeResponse | null>(null);
  const [jobs, setJobs] = useState<IntakeJob[]>([]);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pasteMode, setPasteMode] = useState(false);
  const [text, setText] = useState("");
  const [error, setError] = useState("");

  async function load() {
    if (!slug) return;

    try {
      setError("");

      const result = await apiGet(
        `/api/knowledge/${encodeURIComponent(slug)}`,
      );

      setData(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not load QRE knowledge.",
      );
    }
  }

  useEffect(() => {
    void load();
  }, [slug]);

  async function addFiles(files: File[]) {
    if (!files.length || !slug) return;

    setBusy(true);
    setError("");

    try {
      const created: IntakeJob[] = [];

      for (const file of files) {
        const payload = await buildFilePayload(file);

        const response = await apiPost(
          `/api/knowledge/${encodeURIComponent(slug)}/intake`,
          payload,
        );

        created.push({
          id: String(response.jobId),
          status: String(response.status ?? "queued"),
          sourceType: payload.sourceType,
          originalName: file.name,
        });
      }

      setJobs((current) => [...created, ...current]);

      for (const job of created) {
        void watchJob(job.id);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "QRE could not accept the upload.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function addText() {
    const value = text.trim();

    if (!value || !slug) return;

    setBusy(true);
    setError("");

    try {
      const response = await apiPost(
        `/api/knowledge/${encodeURIComponent(slug)}/intake`,
        {
          sourceType: "text",
          text: value,
          content: value,
        },
      );

      const job: IntakeJob = {
        id: String(response.jobId),
        status: String(response.status ?? "queued"),
        sourceType: "text",
        originalName: "Pasted text",
      };

      setJobs((current) => [job, ...current]);
      setText("");
      setPasteMode(false);

      void watchJob(job.id);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "QRE could not accept the text.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function watchJob(jobId: string) {
    try {
      for (;;) {
        const response = await apiGet(
          `/api/knowledge/${encodeURIComponent(slug)}/intake/${encodeURIComponent(jobId)}`,
        );

        const next = response.job as IntakeJob;

        setJobs((current) =>
          current.map((job) =>
            job.id === jobId
              ? { ...job, ...next }
              : job,
          ),
        );

        if (
          next.status === "completed" ||
          next.status === "failed"
        ) {
          if (next.status === "completed") {
            await load();
          }

          return;
        }

        await wait(1000);
      }
    } catch (err) {
      setJobs((current) =>
        current.map((job) =>
          job.id === jobId
            ? {
                ...job,
                status: "failed",
                error:
                  err instanceof Error
                    ? err.message
                    : "Processing failed.",
              }
            : job,
        ),
      );
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);

    const files = Array.from(event.dataTransfer.files);

    if (files.length) {
      void addFiles(files);
    }
  }

  function handlePicker(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);

    if (files.length) {
      void addFiles(files);
    }

    event.target.value = "";
  }

  const activeJobs = jobs.filter(
    (job) =>
      job.status === "queued" ||
      job.status === "processing",
  );

  return (
    <DashboardLayout>
      <main
        style={{
          minHeight: "100vh",
          color: "#fff",
          maxWidth: 1080,
          margin: "0 auto",
          padding: "44px 28px 80px",
        }}
      >
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            marginBottom: 30,
            gap: 20,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 10,
                letterSpacing: 5,
                opacity: 0.42,
              }}
            >
              QRE WORLD MEMORY
            </div>

            <h1
              style={{
                margin: "8px 0 5px",
                fontSize: 36,
                letterSpacing: -1,
              }}
            >
              {data?.asset.displayName || slug}
            </h1>

            <div style={{ opacity: 0.5 }}>
              Give QRE information. QRE organizes it.
            </div>
          </div>

          <Link
            to={`/dashboard/assets/${encodeURIComponent(slug)}`}
            style={{
              color: "#fff",
              opacity: 0.6,
            }}
          >
            ← Asset
          </Link>
        </header>

        {error && (
          <div
            style={{
              ...panel,
              marginBottom: 18,
              padding: 16,
              background: "rgba(255,60,60,.10)",
            }}
          >
            {error}
          </div>
        )}

        <section style={{ marginBottom: 18 }}>
          <div
            onClick={() => pickerRef.current?.click()}
            onDragEnter={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={(event) => {
              event.preventDefault();
              setDragging(false);
            }}
            onDrop={handleDrop}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                pickerRef.current?.click();
              }
            }}
            style={{
              ...panel,
              minHeight: 330,
              padding: 35,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              textAlign: "center",
              cursor: "pointer",
              borderColor: dragging
                ? "rgba(0,255,204,.7)"
                : "rgba(255,255,255,.11)",
              background: dragging
                ? "rgba(0,255,204,.08)"
                : "rgba(255,255,255,.035)",
              transition: "all .18s ease",
            }}
          >
            <input
              ref={pickerRef}
              type="file"
              multiple
              accept={[
                "image/*",
                "application/pdf",
                "text/plain",
                ".csv",
                ".xls",
                ".xlsx",
              ].join(",")}
              onChange={handlePicker}
              style={{ display: "none" }}
            />

            <div
              style={{
                width: 76,
                height: 76,
                borderRadius: 22,
                display: "grid",
                placeItems: "center",
                fontSize: 44,
                background: "rgba(255,255,255,.06)",
                border: "1px solid rgba(255,255,255,.10)",
                marginBottom: 20,
              }}
            >
              +
            </div>

            <div
              style={{
                fontSize: 28,
                fontWeight: 800,
                letterSpacing: -0.8,
              }}
            >
              {busy ? "ADDING TO QRE…" : "GIVE QRE ANYTHING"}
            </div>

            <div
              style={{
                marginTop: 11,
                opacity: 0.52,
                fontSize: 15,
                maxWidth: 620,
                lineHeight: 1.5,
              }}
            >
              Drop photos, PDFs, spreadsheets, CSVs, or files.
              QRE identifies what they contain and organizes the
              information automatically.
            </div>

            <div
              style={{
                marginTop: 22,
                padding: "10px 17px",
                borderRadius: 11,
                background: "rgba(255,255,255,.07)",
                border: "1px solid rgba(255,255,255,.11)",
                fontSize: 13,
              }}
            >
              Click to choose files
            </div>
          </div>
        </section>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: 28,
          }}
        >
          <button
            onClick={() => setPasteMode((value) => !value)}
            style={{
              border: 0,
              background: "transparent",
              color: "#fff",
              opacity: 0.6,
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            {pasteMode
              ? "Close text input"
              : "or paste information directly"}
          </button>
        </div>

        {pasteMode && (
          <section
            style={{
              ...panel,
              padding: 20,
              marginBottom: 28,
            }}
          >
            <textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Paste anything about the person, business, product, place, event, service, project, or whatever QRE should learn…"
              style={{
                width: "100%",
                minHeight: 150,
                boxSizing: "border-box",
                resize: "vertical",
                borderRadius: 13,
                border: "1px solid rgba(255,255,255,.10)",
                background: "rgba(255,255,255,.035)",
                color: "#fff",
                padding: 15,
                outline: "none",
              }}
            />

            <button
              onClick={() => void addText()}
              disabled={busy || !text.trim()}
              style={{
                marginTop: 11,
                border: 0,
                borderRadius: 11,
                padding: "11px 17px",
                cursor: busy ? "default" : "pointer",
                fontWeight: 700,
              }}
            >
              {busy ? "ADDING…" : "GIVE TO QRE"}
            </button>
          </section>
        )}

        {jobs.length > 0 && (
          <section
            style={{
              ...panel,
              padding: 21,
              marginBottom: 24,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 13,
              }}
            >
              <h2 style={{ margin: 0 }}>
                {activeJobs.length
                  ? "QRE IS LEARNING"
                  : "RECENTLY LEARNED"}
              </h2>

              {activeJobs.length > 0 && (
                <span
                  style={{
                    opacity: 0.45,
                    fontSize: 12,
                  }}
                >
                  {activeJobs.length} active
                </span>
              )}
            </div>

            <div
              style={{
                display: "grid",
                gap: 8,
              }}
            >
              {jobs.slice(0, 15).map((job) => (
                <div
                  key={job.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 15,
                    padding: "12px 14px",
                    borderRadius: 11,
                    background: "rgba(255,255,255,.035)",
                  }}
                >
                  <div
                    style={{
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {job.originalName || job.sourceType}
                    </div>

                    {job.status === "completed" &&
                      job.result?.factCount !== undefined && (
                        <div
                          style={{
                            opacity: 0.42,
                            fontSize: 11,
                            marginTop: 3,
                          }}
                        >
                          {job.result.factCount} facts extracted
                        </div>
                      )}

                    {job.status === "failed" && (
                      <div
                        style={{
                          opacity: 0.55,
                          fontSize: 11,
                          marginTop: 3,
                        }}
                      >
                        {job.error || "Processing failed"}
                      </div>
                    )}
                  </div>

                  <div
                    style={{
                      opacity: 0.55,
                      fontSize: 11,
                      textTransform: "uppercase",
                      flexShrink: 0,
                    }}
                  >
                    {job.status}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(3, minmax(0, 1fr))",
            gap: 12,
          }}
        >
          <Stat
            label="Knowledge"
            value={data?.knowledge.length ?? 0}
          />

          <Stat
            label="Categories"
            value={data?.categories.length ?? 0}
          />

          <Stat
            label="Learning"
            value={activeJobs.length}
          />
        </section>
      </main>
    </DashboardLayout>
  );
}

function Stat({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div style={{ ...panel, padding: 18 }}>
      <div
        style={{
          fontSize: 30,
          fontWeight: 800,
        }}
      >
        {value}
      </div>

      <div
        style={{
          opacity: 0.42,
          fontSize: 11,
          marginTop: 3,
        }}
      >
        {label}
      </div>
    </div>
  );
}

async function buildFilePayload(
  file: File,
): Promise<IntakePayload> {
  const dataUrl = await readAsDataUrl(file);

  if (file.type.startsWith("image/")) {
    return {
      sourceType: "photo",
      originalName: file.name,
      mimeType: file.type,
      imageDataUrl: dataUrl,
    };
  }

  if (file.type === "application/pdf") {
    return {
      sourceType: "pdf",
      originalName: file.name,
      mimeType: file.type,
      content: dataUrl,
    };
  }

  if (
    file.type.includes("spreadsheet") ||
    file.type.includes("excel") ||
    /\.(xlsx|xls|csv)$/i.test(file.name)
  ) {
    return {
      sourceType: "spreadsheet",
      originalName: file.name,
      mimeType: file.type,
      content: dataUrl,
    };
  }

  return {
    sourceType: "file",
    originalName: file.name,
    mimeType: file.type,
    content: dataUrl,
  };
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error("Could not read file."));
        return;
      }

      resolve(reader.result);
    };

    reader.onerror = () => {
      reject(new Error("Could not read file."));
    };

    reader.readAsDataURL(file);
  });
}

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}