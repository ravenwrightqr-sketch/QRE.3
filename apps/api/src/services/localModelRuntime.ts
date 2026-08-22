import { request as httpRequest } from "node:http";

export type LocalModelMessage = {
  role: "system" | "user" | "assistant";
  content: string;
  images?: string[];
};

export type LocalModelResult = { text: string; model: string; provider: "local" };
export type LocalModelOptions = { numPredict?: number; temperature?: number };

function baseUrl(): string { return (process.env.QRE_LOCAL_MODEL_URL || "http://127.0.0.1:11434").replace(/\/$/, ""); }
function modelName(): string { return process.env.QRE_LOCAL_MODEL || process.env.QRE_AUTHOR_MODEL || "qwen3:8b"; }
function timeoutMs(): number {
  const value = Number(process.env.QRE_LOCAL_MODEL_TIMEOUT_MS ?? "600000");
  return Number.isFinite(value) && value > 0 ? value : 600000;
}
export function localModelConfig(): { provider: "local"; model: string; baseUrl: string } {
  return { provider: "local", model: modelName(), baseUrl: baseUrl() };
}
function stripDataUrl(value: string): string {
  const match = /^data:[^;]+;base64,(.+)$/s.exec(value);
  return match ? match[1] : value;
}

/** MODEL BOUNDARY INVARIANT: exactly one canonical message crosses the local provider boundary. */
function canonicalModelMessage(messages: LocalModelMessage[]): LocalModelMessage {
  const normalized = messages
    .map((message) => ({ role: message.role, content: message.content.trim(), images: message.images ?? [] }))
    .filter((message) => message.content || message.images.length);
  return {
    role: "user",
    content: normalized.map((message) => message.content).filter(Boolean).join("\n\n"),
    ...(normalized.some((message) => message.images.length) ? { images: normalized.flatMap((message) => message.images) } : {}),
  };
}

async function postJson(path: string, body: unknown): Promise<unknown> {
  const url = new URL(`${baseUrl()}${path}`);
  const serialized = JSON.stringify(body);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs());
  try {
    const response = await new Promise<{ status: number; body: string }>((resolve, reject) => {
      let settled = false;
      const finish = (fn: () => void): void => { if (settled) return; settled = true; fn(); };
      const req = httpRequest({
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port ? Number(url.port) : 11434,
        path: `${url.pathname}${url.search}`,
        method: "POST",
        headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(serialized, "utf8") },
      }, (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk: Buffer | string) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
        res.on("end", () => finish(() => resolve({ status: res.statusCode ?? 0, body: Buffer.concat(chunks).toString("utf8") })));
        res.on("error", (error) => finish(() => reject(error)));
      });
      req.on("error", (error) => finish(() => reject(error)));
      const abort = (): void => { if (!settled) req.destroy(new Error("Local model request aborted.")); };
      if (controller.signal.aborted) { abort(); return; }
      controller.signal.addEventListener("abort", abort, { once: true });
      req.write(serialized); req.end();
    });
    if (response.status < 200 || response.status >= 300) throw new Error(`Local model failed (${response.status}): ${response.body.slice(0, 500)}`);
    return JSON.parse(response.body) as unknown;
  } finally { clearTimeout(timer); }
}

function responseText(value: unknown): string {
  if (!value || typeof value !== "object") return "";
  const data = value as Record<string, unknown>;
  const message = data.message;
  if (message && typeof message === "object") {
    const messageRecord = message as Record<string, unknown>;
    const content = messageRecord.content;
    if (typeof content === "string" && content.trim()) return content.trim();
    const thinking = messageRecord.thinking;
    if (typeof thinking === "string" && thinking.trim()) return thinking.trim();
  }
  if (typeof data.response === "string" && data.response.trim()) return data.response.trim();
  const choices = data.choices;
  if (Array.isArray(choices) && choices[0] && typeof choices[0] === "object") {
    const choice = choices[0] as Record<string, unknown>;
    const choiceMessage = choice.message;
    if (choiceMessage && typeof choiceMessage === "object") {
      const content = (choiceMessage as Record<string, unknown>).content;
      if (typeof content === "string" && content.trim()) return content.trim();
    }
  }
  return "";
}

export async function localModelGenerate(messages: LocalModelMessage[], format?: "json", options: LocalModelOptions = {}): Promise<LocalModelResult> {
  const canonical = canonicalModelMessage(messages);
  const payload = {
    model: modelName(),
    messages: [{ role: canonical.role, content: canonical.content, ...(canonical.images?.length ? { images: canonical.images.map(stripDataUrl) } : {}) }],
    stream: false,
    think: false,
    ...(format ? { format } : {}),
    options: {
      ...(options.numPredict !== undefined ? { num_predict: options.numPredict } : {}),
      ...(options.temperature !== undefined ? { temperature: options.temperature } : {}),
    },
  };
  const data = await postJson("/api/chat", payload);
  return { text: responseText(data), model: modelName(), provider: "local" };
}
