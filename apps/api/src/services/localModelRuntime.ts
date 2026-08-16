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

export type LocalModelOptions = {
  numPredict?: number;
  temperature?: number;
};

function baseUrl() {
  return (process.env.QRE_LOCAL_MODEL_URL || "http://127.0.0.1:11434").replace(/\/$/, "");
}

function modelName() {
  return process.env.QRE_AUTHOR_FAST_MODEL || process.env.QRE_LOCAL_MODEL || "qre-local";
}

function timeoutMs() {
  const raw = Number(process.env.QRE_LOCAL_MODEL_TIMEOUT_MS || 600000);
  return Number.isFinite(raw) && raw > 0 ? raw : 600000;
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

const UNIVERSAL_AUTHOR_COGNITION = [
  "QRE AUTHOR COGNITIVE DISCIPLINE · hidden planning, finished output only:",
  "Treat supplied facts as world memory, not a checklist of sentences.",
  "Search relationships among facts before choosing a sequence: contradiction, recurrence, recontextualization, implication, callback, status shift, convergence, mismatch, unresolved object, and detail hierarchy.",
  "Select the strongest MAGNET, not the easiest story template.",
  "Keep an information frontier: every cut should move the viewer's model, create meaningful information need, or pay off a promise.",
  "Identity and established facts belong to baseline world state; do not spend cuts repeating them unless meaning changes.",
  "For memory, restore the actual supplied sensory/social/personal fingerprint. Never replace it with category shorthand.",
  "Do not invent concrete facts, people, actions, locations, dates, dialogue, objects, or outcomes.",
  "Do not explain the feeling, joke, or significance when implication can carry it.",
].join("\n");

function prepareMessages(messages: LocalModelMessage[]): LocalModelMessage[] {
  const firstSystem = messages.find((message) => message.role === "system");
  if (!firstSystem) return messages;
  if (!/QRE's universal creative author|QRE's universal latent-movie discovery brain|QRE's theatrical mouth/i.test(firstSystem.content)) {
    return messages;
  }
  return messages.map((message) =>
    message === firstSystem
      ? { ...message, content: `${UNIVERSAL_AUTHOR_COGNITION}\n\n${message.content}` }
      : message,
  );
}

export async function localModelGenerate(
  messages: LocalModelMessage[],
  format?: "json",
  options: LocalModelOptions = {},
): Promise<LocalModelResult> {
  const fast = process.env.QRE_AUTHOR_FAST === "true";
  const temperature = options.temperature ?? Number(process.env.QRE_LOCAL_MODEL_TEMPERATURE || (fast ? 0.75 : 0.8));
  const numPredict = options.numPredict ?? Number(process.env.QRE_LOCAL_MODEL_NUM_PREDICT || (fast ? 512 : 512));
  const keepAlive = process.env.QRE_LOCAL_MODEL_KEEP_ALIVE || (fast ? "10m" : "5m");
  const preparedMessages = prepareMessages(messages);

  const data = await request("/api/chat", {
    model: modelName(),
    stream: false,
    keep_alive: keepAlive,
    format,
    messages: preparedMessages.map((message) => ({
      role: message.role,
      content: message.content,
      ...(message.images?.length ? { images: message.images.map(stripDataUrl) } : {}),
    })),
    options: {
      temperature,
      num_predict: numPredict,
    },
  });

  const text = outputText(data);
  if (process.env.QRE_AUTHOR_DEBUG_RAW === "true") {
    console.log("\n--- QRE RAW MODEL OUTPUT ---\n" + text + "\n--- END RAW MODEL OUTPUT ---\n");
  }

  return { text, model: modelName(), provider: "local" };
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
