import { Agent } from "undici";
import { fallbackModelForCapability, modelForCapability, type ModelCapability } from "./modelCapabilities.js";

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

export type LocalModelJsonSchema = {
  type: "object";
  properties: Record<string, unknown>;
  required?: string[];
  additionalProperties?: boolean;
};

export type LocalModelOptions = {
  numPredict?: number;
  numCtx?: number;
  temperature?: number;
  jsonSchema?: LocalModelJsonSchema;
  capability?: ModelCapability;
};

function baseUrl(): string {
  return (process.env.QRE_LOCAL_MODEL_URL || "http://127.0.0.1:11434").replace(/\/$/, "");
}

function timeoutMs(): number {
  const raw = Number(process.env.QRE_LOCAL_MODEL_TIMEOUT_MS || 600000);
  return Number.isFinite(raw) && raw > 0 ? raw : 600000;
}

function headersTimeoutMs(): number {
  const raw = Number(process.env.QRE_LOCAL_MODEL_HEADERS_TIMEOUT_MS || timeoutMs());
  return Number.isFinite(raw) && raw > 0 ? raw : timeoutMs();
}

function bodyTimeoutMs(): number {
  const raw = Number(process.env.QRE_LOCAL_MODEL_BODY_TIMEOUT_MS || timeoutMs());
  return Number.isFinite(raw) && raw > 0 ? raw : timeoutMs();
}

function connectTimeoutMs(): number {
  const raw = Number(process.env.QRE_LOCAL_MODEL_CONNECT_TIMEOUT_MS || 15000);
  return Number.isFinite(raw) && raw > 0 ? raw : 15000;
}

function keepAlive(): string {
  const fast = process.env.QRE_AUTHOR_FAST === "true";
  return process.env.QRE_LOCAL_MODEL_KEEP_ALIVE || (fast ? "10m" : "5m");
}

function numPredict(options: LocalModelOptions): number {
  return options.numPredict ?? Number(process.env.QRE_LOCAL_MODEL_NUM_PREDICT || 768);
}

function numCtx(options: LocalModelOptions): number {
  return options.numCtx ?? Number(process.env.QRE_LOCAL_MODEL_NUM_CTX || 16384);
}

function temperature(options: LocalModelOptions): number {
  const fast = process.env.QRE_AUTHOR_FAST === "true";
  return options.temperature ?? Number(process.env.QRE_LOCAL_MODEL_TEMPERATURE || (fast ? 0.78 : 0.82));
}

function stripDataUrl(value: string): string {
  const match = /^data:[^;]+;base64,(.+)$/s.exec(value);
  return match ? match[1] : value;
}

function inferCapability(messages: LocalModelMessage[], explicit?: ModelCapability): ModelCapability {
  if (explicit) return explicit;
  return messages.some((message) => message.images?.length) ? "vision" : "author";
}

let dispatcher: Agent | undefined;

function getDispatcher(): Agent {
  if (!dispatcher) {
    dispatcher = new Agent({
      connect: { timeout: connectTimeoutMs() },
      headersTimeout: headersTimeoutMs(),
      bodyTimeout: bodyTimeoutMs(),
      keepAliveTimeout: 30000,
      keepAliveMaxTimeout: 120000,
      connections: 4,
      pipelining: 1,
    });
  }
  return dispatcher;
}

function resetDispatcher(): void {
  if (!dispatcher) return;
  const current = dispatcher;
  dispatcher = undefined;
  void current.close().catch(() => {});
}

function errorCode(error: unknown): string | undefined {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = (error as { code?: unknown }).code;
    if (typeof code === "string") return code;
  }
  const cause = typeof error === "object" && error !== null && "cause" in error
    ? (error as { cause?: unknown }).cause
    : undefined;
  if (typeof cause === "object" && cause !== null && "code" in cause) {
    const code = (cause as { code?: unknown }).code;
    if (typeof code === "string") return code;
  }
  return undefined;
}

function isTransportError(error: unknown): boolean {
  const name = typeof error === "object" && error !== null && "name" in error
    ? (error as { name?: unknown }).name
    : undefined;
  if (name === "AbortError") return true;
  const code = errorCode(error);
  return Boolean(code && [
    "UND_ERR_HEADERS_TIMEOUT", "UND_ERR_BODY_TIMEOUT", "UND_ERR_CONNECT_TIMEOUT",
    "UND_ERR_SOCKET", "UND_ERR_DESTROYED", "ECONNRESET", "ECONNREFUSED", "EPIPE", "ETIMEDOUT",
  ].includes(code)) || (error instanceof TypeError && /fetch failed/i.test(error.message));
}

function outputText(data: unknown): string {
  if (typeof data !== "object" || data === null) return "";
  const record = data as Record<string, unknown>;
  const message = record.message;
  if (typeof message === "object" && message !== null) {
    const content = (message as { content?: unknown }).content;
    if (typeof content === "string") return content.trim();
  }
  const response = record.response;
  if (typeof response === "string") return response.trim();
  const choices = record.choices;
  if (Array.isArray(choices) && choices.length) {
    const first = choices[0];
    if (typeof first === "object" && first !== null) {
      const choiceMessage = (first as Record<string, unknown>).message;
      if (typeof choiceMessage === "object" && choiceMessage !== null) {
        const content = (choiceMessage as { content?: unknown }).content;
        if (typeof content === "string") return content.trim();
      }
    }
  }
  return "";
}

type RequestBody = {
  model: string;
  stream: false;
  keep_alive: string;
  format?: "json" | LocalModelJsonSchema;
  messages: LocalModelMessage[];
  options: { temperature: number; num_predict: number; num_ctx: number };
};

async function request(body: RequestBody): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs());
  const started = Date.now();
  try {
    const response = await fetch(`${baseUrl()}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
      dispatcher: getDispatcher(),
    } as RequestInit & { dispatcher?: unknown });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(`Local model failed (${response.status})${detail ? `: ${detail.slice(0, 300)}` : ""}`);
    }
    console.log("QRE MODEL REQUEST", { model: body.model, ms: Date.now() - started });
    return await response.json();
  } catch (error) {
    if (isTransportError(error) && ["UND_ERR_SOCKET", "UND_ERR_DESTROYED", "ECONNRESET", "EPIPE"].includes(errorCode(error) ?? "")) resetDispatcher();
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export async function localModelGenerate(
  messages: LocalModelMessage[],
  format?: "json",
  options: LocalModelOptions = {},
): Promise<LocalModelResult> {
  const capability = inferCapability(messages, options.capability);
  const primaryModel = modelForCapability(capability);
  const fallbackModel = fallbackModelForCapability(capability, primaryModel);
  const predict = numPredict(options);
  const context = numCtx(options);

  if (!Number.isFinite(predict) || predict <= 0) throw new Error(`Invalid local model num_predict: ${predict}`);
  if (!Number.isFinite(context) || context <= 0) throw new Error(`Invalid local model context size: ${context}`);

  const requestBody: RequestBody = {
    model: primaryModel,
    stream: false,
    keep_alive: keepAlive(),
    format: options.jsonSchema ?? format,
    messages: messages.map((message) => ({
      role: message.role,
      content: message.content,
      ...(message.images?.length ? { images: message.images.map(stripDataUrl) } : {}),
    })),
    options: { temperature: temperature(options), num_predict: predict, num_ctx: context },
  };

  try {
    const data = await request(requestBody);
    return { text: outputText(data), model: primaryModel, provider: "local" };
  } catch (error) {
    if (!isTransportError(error) || !fallbackModel) throw error;
    console.log("QRE MODEL FALLBACK", { capability, primaryModel, fallbackModel, code: errorCode(error) ?? "unknown" });
    const data = await request({ ...requestBody, model: fallbackModel });
    return { text: outputText(data), model: fallbackModel, provider: "local" };
  }
}

export async function localModelHealthy(): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3000);
  try {
    const response = await fetch(`${baseUrl()}/api/tags`, { signal: controller.signal, dispatcher: getDispatcher() } as RequestInit & { dispatcher?: unknown });
    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export function localModelConfig(capability: ModelCapability = "author") {
  const model = modelForCapability(capability);
  return {
    provider: "local" as const,
    capability,
    url: baseUrl(),
    model,
    fallbackModel: fallbackModelForCapability(capability, model),
    timeoutMs: timeoutMs(),
    headersTimeoutMs: headersTimeoutMs(),
    bodyTimeoutMs: bodyTimeoutMs(),
    connectTimeoutMs: connectTimeoutMs(),
    keepAlive: keepAlive(),
    numCtx: numCtx({}),
    numPredict: numPredict({}),
    temperature: temperature({}),
  };
}
