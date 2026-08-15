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
  "1. Treat supplied facts as world memory, not a checklist of sentences.",
  "2. Search relationships among facts before choosing a sequence: contradiction, recurrence, recontextualization, implication, callback, status shift, convergence, mismatch, unresolved object, and detail hierarchy.",
  "3. Select the strongest MAGNET, not the easiest story template. A magnet is valuable when the viewer knows enough to care but not enough to know what the relationship means next.",
  "4. Keep an information frontier: every cut should move the viewer's model, create a meaningful information need, or pay off a previously earned promise. Repeating known identity/state is a cost.",
  "5. For memory/living-memory inputs, prioritize re-entry into the actual memory: specific sensory, social, personal, temporal, object, or identity-bearing details supplied by the world. Do not substitute category shorthand for the memory and never invent sensory details.",
  "6. Reject generic category associations as the creative center: an event name is not its feeling; a rave is not automatically bass/neon/dancing; a grooming visit is not automatically fear/treat/happiness.",
  "7. Do not turn supplied emotional states into invented choreography. Emotion may be expressed through attitude, implication, contrast, or supplied action; do not manufacture physical behavior.",
  "8. When the subject is established, keep it in working memory and spend language on what is newly valuable. Use the name again only when the reference itself changes meaning or restores necessary clarity.",
  "9. Do not explain the feeling, lesson, joke, or significance when a sharper implication can make the viewer infer it.",
  "10. Prefer high information density over adjective density. The output should feel discovered, specific, and alive—not like a generic summary of the source.",
].join("\n");

function prepareMessages(messages: LocalModelMessage[]): LocalModelMessage[] {
  const firstSystem = messages.find((message) => message.role === "system");
  if (!firstSystem) return messages;
  if (!/QRE's universal creative author/i.test(firstSystem.content)) return messages;
  return messages.map((message) =>
    message === firstSystem
      ? { ...message, content: `${UNIVERSAL_AUTHOR_COGNITION}\n\n${message.content}` }
      : message,
  );
}

export async function localModelGenerate(messages: LocalModelMessage[], format?: "json"): Promise<LocalModelResult> {
  const fast = process.env.QRE_AUTHOR_FAST === "true";
  // Fast mode stays exploratory but leaves enough headroom to finish compact sequence metadata + cuts.
  const temperature = Number(process.env.QRE_LOCAL_MODEL_TEMPERATURE || (fast ? 0.75 : 0.8));
  const numPredict = Number(process.env.QRE_LOCAL_MODEL_NUM_PREDICT || (fast ? 512 : 512));
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
