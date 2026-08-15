export type LocalModelMessage = {
  role: "system" | "user" | "assistant";
  content: string;
  images?: string[];
};

export type LocalModelResult = {
  text: string;
  model: string;
  provider: "local";
};

function baseUrl() {
  return (process.env.QRE_LOCAL_MODEL_URL || "http://127.0.0.1:11434").replace(/\/$/, "");
}

function modelName() {
  return process.env.QRE_LOCAL_MODEL || "qre-local";
}

function timeoutMs() {
  const raw = Number(process.env.QRE_LOCAL_MODEL_TIMEOUT_MS || 600000);
  return Number.isFinite(raw) && raw > 0 ? raw : 600000;
}

function outputLimit() {
  const raw = Number(process.env.QRE_LOCAL_MODEL_NUM_PREDICT || 256);
  return Number.isFinite(raw) && raw > 0 ? raw : 256;
}

function keepAlive() {
  return process.env.QRE_LOCAL_MODEL_KEEP_ALIVE || "10m";
}

function stripDataUrl(value: string) {
  const match = /^data:[^;]+;base64,(.+)$/s.exec(value);
  return match ? match[1] : value;
}

async function request(path: string, body: unknown) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs());
  try {
    const response = await fetch(`${baseUrl()}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(`Local model failed (${response.status}): ${detail.slice(0, 300)}`);
    }
    return response.json() as Promise<any>;
  } finally {
    clearTimeout(timer);
  }
}

function outputText(data: any): string {
  return String(data?.message?.content ?? data?.response ?? data?.choices?.[0]?.message?.content ?? "").trim();
}

export async function localModelGenerate(messages: LocalModelMessage[], format?: "json"): Promise<LocalModelResult> {
  const fast = process.env.QRE_AUTHOR_FAST === "true";
  const data = await request("/api/chat", {
    model: modelName(),
    stream: false,
    format,
    keep_alive: keepAlive(),
    messages: messages.map((message) => ({
      role: message.role,
      content: message.content,
      ...(message.images?.length ? { images: message.images.map(stripDataUrl) } : {}),
    })),
    options: {
      temperature: Number(process.env.QRE_LOCAL_MODEL_TEMPERATURE || (fast ? 0.75 : 0.8)),
      num_predict: Number(process.env.QRE_LOCAL_MODEL_NUM_PREDICT || (fast ? 192 : outputLimit())),
    },
  });
  return { text: outputText(data), model: modelName(), provider: "local" };
}

export async function localModelHealthy(): Promise<boolean> {
  try {
    const response = await fetch(`${baseUrl()}/api/tags`, { signal: AbortSignal.timeout(3000) });
    return response.ok;
  } catch {
    return false;
  }
}

export function localModelConfig() {
  return {
    provider: "local" as const,
    url: baseUrl(),
    model: modelName(),
    timeoutMs: timeoutMs(),
  };
}
