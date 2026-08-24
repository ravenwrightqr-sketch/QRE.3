import { buildAuthorRealityGraph } from "./authorRealityGraph.js";

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
  return process.env.QRE_AUTHOR_FAST_MODEL || process.env.QRE_LOCAL_MODEL || "qwen2.5vl:7b";
}

/** Backward-compatible runtime configuration surface used by aiProvider.ts. */
export const localModelConfig = {
  get url(): string {
    return baseUrl();
  },
  get model(): string {
    return modelName();
  },
};

function timeoutMs() {
  const raw = Number(process.env.QRE_LOCAL_MODEL_TIMEOUT_MS || 600000);
  return Number.isFinite(raw) && raw > 0 ? raw : 600000;
}

function stripDataUrl(value: string) {
  const match = /^data:[^;]+;base64,(.+)$/s.exec(value);
  return match ? match[1] : value;
}
