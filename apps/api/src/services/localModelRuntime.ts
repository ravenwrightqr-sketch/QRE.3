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
  const timer = setTimeout(() => {
    console.log("QRE LOCAL MODEL TIMEOUT FIRING");
    controller.abort();
  }, timeoutMs());

  const url = `${baseUrl()}${path}`;
  const serializedBody = JSON.stringify(body);

  console.log("QRE REQUEST START");
  console.log("QRE REQUEST URL:", url);
  console.log("QRE REQUEST MODEL:", (body as any)?.model);
  console.log("QRE REQUEST FORMAT:", (body as any)?.format);
  console.log(
    "QRE REQUEST MESSAGE COUNT:",
    Array.isArray((body as any)?.messages)
      ? (body as any).messages.length
      : "none",
  );
  console.log("QRE REQUEST BODY BYTES:", Buffer.byteLength(serializedBody, "utf8"));
  console.log(
    "QRE REQUEST CONTENT CHARS:",
    Array.isArray((body as any)?.messages)
      ? (body as any).messages.reduce(
          (total: number, message: any) => total + String(message?.content ?? "").length,
          0,
        )
      : "none",
  );

  try {
    console.log("QRE FETCH ENTER");

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: serializedBody,
      signal: controller.signal,
    });

    console.log("QRE FETCH RETURNED");
    console.log("QRE RESPONSE STATUS:", response.status);

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.log("QRE RESPONSE ERROR BODY:", detail);
      throw new Error(`Local model failed (${response.status}): ${detail.slice(0, 300)}`);
    }

    console.log("QRE READING RESPONSE JSON");
    const json = await response.json();
    console.log("QRE RESPONSE JSON RECEIVED");
    return json;
  } catch (error) {
    console.log("QRE LOCAL REQUEST ERROR:", error);
    throw error;
  } finally {
    clearTimeout(timer);
    console.log("QRE REQUEST FINISHED");
  }
}

function outputText(data: any): string {
  return String(data?.message?.content ?? data?.response ?? data?.choices?.[0]?.message?.content ?? "").trim();
}

const UNIVERSAL_AUTHOR_COGNITION = [
  "QRE AUTHOR COGNITIVE DISCIPLINE · hidden planning, finished output only:",
  "Treat supplied facts as world memory, not a checklist of sentences.",
  "Search relationships among facts before choosing a sequence: contradiction, recurrence, recontextualization, implication, callback, status shift, convergence, mismatch, unresolved object, sensory fingerprint, and detail hierarchy.",
  "Select the strongest latent movie, not the easiest story template.",
  "A sequence is a chain of sentence cuts. Each cut is a tiny film moment, not a paragraph, scene summary, or explanation.",
  "Every cut must create a new viewer state: see something, notice something, suspect something, realize something, feel a reversal, or receive a payoff.",
  "Use novelty, uncertainty, prediction shift, information value, and consequence together. Engagement is the interaction of those forces, not a pile of adjectives.",
  "Identity and established facts belong to baseline world state; do not spend cuts repeating them unless the repetition itself changes meaning.",
  "For memories, preserve the supplied sensory/social/personal fingerprint. Do not replace it with category shorthand or generic biography.",
  "Creative lenses change framing, rhythm, metaphor, implication, and escalation; they do not authorize invented facts.",
  "Never expose planning vocabulary, strategy labels, operator names, beat metadata, or author instructions in viewer-facing text.",
  "Do not explain the joke, emotion, meaning, or cinematic intent when a concrete short line can imply it.",
].join("\n");

const FILM_CUT_PLANNER = [
  "QRE FILM-CUT PLANNER:",
  "Think of each beat as the next moving message in a film.",
  "Beat 1: hook the eye or mind with the strongest concrete detail.",
  "Beat 2: jolt the expectation with a different meaningful detail.",
  "Beat 3: jolt again through contrast, consequence, reversal, callback, or escalation.",
  "Beat 4+: escalate only when the source has enough material; otherwise stop cleanly at payoff.",
  "The beats must not narrate the same fact repeatedly.",
  "The beats must not enumerate every task in order merely because the prompt lists them.",
  "For service receipts, preserve factual work order but convert each useful change into a watchable cut.",
  "For comedy, exploit personality/status contradiction already present in the facts.",
  "For horror, keep ordinary behavior intact while reality becomes increasingly wrong.",
  "For romance, use private details, recurrence, restraint, and emotional consequence.",
  "For demented/chaotic styles, increase unpredictability and juxtaposition without inventing concrete events.",
  "Every beat needs a compact `change`, a compact `frontier`, and a compact `necessity`.",
  "Target 3-6 beats. Keep `change` and `frontier` short enough to realize as a single sentence cut.",
  "Do not put strategy names or cognitive language into change/frontier/next/necessity.",
].join("\n");

const META_LANGUAGE = /\b(?:attention strategy|operator(?: mix|s)?|build from beat|cognitive(?: plan| language)?|preserve forward information|land the chosen meaning|find subtle tension|viewer momentum|information frontier|beat plan|writing process|author brief|necessity of this beat|strategy names?)\b/i;
const GENERIC_PROSE = /\b(?:beautiful transformation|magical moment|unforgettable experience|incredible journey|positive outcome|newfound confidence|happy-go-lucky|tale of transformation|a testament to|satisfaction is our priority)\b/i;
const META_PLANNER = /QRE's latent-movie planner|QRE FILM-CUT PLANNER|Output JSON only: \{premise:string/i;

function prepareMessages(messages: LocalModelMessage[]): LocalModelMessage[] {
  const firstSystem = messages.find((message) => message.role === "system");
  if (!firstSystem) return messages;
  if (!/QRE's universal creative author|QRE's universal latent-movie discovery brain|QRE's theatrical mouth|QRE's latent-movie planner/i.test(firstSystem.content)) {
    return messages;
  }
  return messages.map((message) =>
    message === firstSystem
      ? { ...message, content: `${UNIVERSAL_AUTHOR_COGNITION}\n\n${firstSystem.content}` }
      : message,
  );
}

function parseUserObject(messages: LocalModelMessage[]): Record<string, unknown> | null {
  const user = [...messages].reverse().find((message) => message.role === "user");
  if (!user) return null;
  try {
    const value = JSON.parse(user.content);
    return value && typeof value === "object" ? value as Record<string, unknown> : null;
  } catch {
    return null;
  }
}

function preparePlannerMessages(messages: LocalModelMessage[]): LocalModelMessage[] {
  const prepared = prepareMessages(messages);
  const system = prepared.find((message) => message.role === "system");
  if (!system || !META_PLANNER.test(system.content)) return prepared;

  const source = parseUserObject(prepared);
  const realityGraph = source
    ? buildAuthorRealityGraph({
        prompt: String(source.prompt ?? ""),
        subject: String(source.subject ?? ""),
        place: String(source.place ?? ""),
        facts: Array.isArray(source.facts) ? source.facts.map(String) : [],
        sourceMoments: Array.isArray(source.moments) ? source.moments.map(String) : [],
        memoryContext: Array.isArray(source.memory) ? source.memory.map(String) : [],
        trajectory: Array.isArray(source.trajectory) ? source.trajectory.map(String) : [],
      })
    : undefined;

  const graphContext = realityGraph
    ? [
        "\nQRE REALITY GRAPH · SOURCE-TRUTH CONTEXT:",
        "Use this graph to discover relationships before inventing narrative structure.",
        `events=${JSON.stringify(realityGraph.events.slice(0, 10))}`,
        `relations=${JSON.stringify(realityGraph.relations.slice(0, 16))}`,
        `tensions=${JSON.stringify(realityGraph.unresolvedTensions)}`,
        `recurring=${JSON.stringify(realityGraph.recurringSignals)}`,
        `sensory=${JSON.stringify(realityGraph.sensorySignals)}`,
        "Every grounded beat must be traceable to evidence/events or to a clearly marked creative interpretation of those events.",
        "Do not invent concrete objects, people, places, dates, actions, dialogue, or outcomes in reality-locked mode.",
      ].join("\n")
    : "";

  return prepared.map((message) => message === system
    ? {
        ...message,
        content: `${message.content}\n\n${FILM_CUT_PLANNER}${graphContext}\n\nPLANNER OUTPUT RULES:\n- 3 to 6 beats.\n- Each beat is one sentence-cut opportunity, not a paragraph.\n- ` +
          "`change`, `next`, `frontier`, and `necessity` must describe supplied reality or a safe interpretive relationship.\n" +
          "- `change` should normally be 3-12 words.\n" +
          "- `frontier` should normally be 2-10 words.\n" +
          "- `necessity` should be one compact reason, not an explanation of the writing process.\n" +
          "- Never output `ATTENTION STRATEGY:`, `OPERATOR MIX:`, `BUILD FROM BEAT`, `CONTRADICTIONS`, or similar internal language inside beat fields.\n" +
          "- A service sequence should feel like a receipt that became a tiny film, not a checklist.\n" +
          "- A successful sequence should read plausibly as separate short messages shown one after another.",
      }
    : message,
  );
}

function extractOneText(raw: string): string {
  try {
    const value = JSON.parse(raw);
    if (value && typeof value === "object") {
      if (typeof value.text === "string") return value.text.trim();
      if (Array.isArray(value.texts) && typeof value.texts[0] === "string") return value.texts[0].trim();
      if (Array.isArray(value.scenes) && typeof value.scenes[0] === "string") return value.scenes[0].trim();
    }
  } catch {
    // Canonical mouth requests JSON; preserve raw text as a last-resort diagnostic value.
  }
  return String(raw ?? "").trim();
}

function wordCount(value: string): number {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

function isCanonicalMouth(messages: LocalModelMessage[], format?: "json") {
  if (format !== "json") return false;
  const system = messages.find((message) => message.role === "system")?.content ?? "";
  return /QRE's theatrical mouth/i.test(system);
}

function mouthAcceptable(text: string): boolean {
  const words = wordCount(text);
  if (!text || words < 2 || words > 7) return false;
  if (META_LANGUAGE.test(text)) return false;
  if (GENERIC_PROSE.test(text)) return false;
  if (/^[A-Z][A-Z _-]{5,}:/.test(text)) return false;
  if (/\b(?:what happens next|what will happen next|more to come|this beat|this scene|the viewer)\b/i.test(text)) return false;
  return true;
}

function mouthSourceTruth(base: Record<string, unknown>): string {
  const source = {
    prompt: typeof base.prompt === "string" ? base.prompt : "",
    subject: typeof base.subject === "string" ? base.subject : "",
    place: typeof base.place === "string" ? base.place : "",
    facts: Array.isArray(base.facts) ? base.facts.map(String).slice(0, 24) : [],
    moments: Array.isArray(base.moments) ? base.moments.map(String).slice(0, 18) : [],
    sourceMoments: Array.isArray(base.sourceMoments) ? base.sourceMoments.map(String).slice(0, 18) : [],
    memory: Array.isArray(base.memory) ? base.memory.map(String).slice(0, 14) : [],
    trajectory: Array.isArray(base.trajectory) ? base.trajectory.map(String).slice(0, 14) : [],
    subjectTruth: base.subjectTruth ?? null,
    realityGraph: base.realityGraph ?? null,
  };
  return JSON.stringify(source);
}

async function realizeMouthOneBeat(
  messages: LocalModelMessage[],
  beat: unknown,
  options: LocalModelOptions,
): Promise<string> {
  const system = messages.find((message) => message.role === "system");
  const user = [...messages].reverse().find((message) => message.role === "user");
  if (!system || !user) return "";

  const base = parseUserObject(messages) ?? {};
  const singleBeatPayload = { ...base, beats: [beat] };
  const sourceTruth = mouthSourceTruth(base);
  const fast = process.env.QRE_AUTHOR_FAST === "true";
  const temperature = options.temperature ?? Number(process.env.QRE_LOCAL_MODEL_TEMPERATURE || (fast ? 0.78 : 0.82));
  const numPredict = options.numPredict ?? Number(process.env.QRE_LOCAL_MODEL_NUM_PREDICT || (fast ? 192 : 256));
  const keepAlive = process.env.QRE_LOCAL_MODEL_KEEP_ALIVE || (fast ? "10m" : "5m");

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const retryInstruction = attempt === 0
      ? ""
      : `\nRETRY ${attempt}: Reject the previous line internally. Rewrite ONLY this beat. 2-7 words. Use only the source-truth details below. Make the next thing happen or become newly meaningful. No summary. No explanation. No invented object, place, action, person, date, outcome, weather, time-of-day, or sensory setting.`;
    const singleSystem: LocalModelMessage = {
      ...system,
      content: `${system.content}\n\nQRE MOUTH · SOURCE-LOCKED MOVING MESSAGE MODE:\nSOURCE TRUTH IS IMMUTABLE. The JSON source block below is the complete factual authority for this line.\nDo not import imagery, objects, settings, actions, weather, lighting, time-of-day, locations, people, or outcomes from general world knowledge.\nCreative language may change attitude, rhythm, metaphor, implication, or personification only when it remains grounded in supplied details.\nIf the source says bows, balls, or ties, those are available. If the source does not say sunset, golden light, a bath, a room, a door, or another concrete detail, do not introduce it.\nRealize the supplied beat from the source truth, not from a generic memory-story pattern.\nSOURCE TRUTH: ${sourceTruth}\n\nThis is one film cut. The viewer sees this line alone for a moment, then it cuts to the next line.\nWrite exactly ONE short viewer-facing sentence for the supplied beat.\nUse 2-7 words. Prefer 3-6.\nOne line = one hit: a concrete action, supplied sensory detail, social turn, implication, reversal, or payoff.\nDo not summarize the whole experience. Do not narrate a paragraph. Do not explain the emotion. Do not introduce unsupported facts.\nThe line must feel like it belongs between the previous and next cuts.\nFunny can be sly, absurd, deadpan, or status-based. Horror can stay calm while reality goes wrong. Romance can be intimate and restrained. Demented can be sharp and unpredictable.\nNo emojis. No headings. JSON exactly: {"text":"short line"}.${retryInstruction}`,
    };
    const singleUser: LocalModelMessage = { ...user, content: JSON.stringify(singleBeatPayload) };
    const prepared = prepareMessages([singleSystem, singleUser]);
    const data = await request("/api/chat", {
      model: modelName(),
      stream: false,
      keep_alive: keepAlive,
      format: "json",
      messages: prepared.map((message) => ({
        role: message.role,
        content: message.content,
        ...(message.images?.length ? { images: message.images.map(stripDataUrl) } : {}),
      })),
      options: { temperature, num_predict: numPredict },
    });
    const text = extractOneText(outputText(data));
    if (mouthAcceptable(text)) return text;
  }

  return "";
}

export async function localModelGenerate(
  messages: LocalModelMessage[],
  format?: "json",
  options: LocalModelOptions = {},
): Promise<LocalModelResult> {
  const planner = messages.some((message) => message.role === "system" && META_PLANNER.test(message.content));
  const preparedMessages = planner ? preparePlannerMessages(messages) : prepareMessages(messages);

  if (isCanonicalMouth(messages, format)) {
    const payload = parseUserObject(messages);
    const beats = Array.isArray(payload?.beats) ? payload.beats : [];
    if (beats.length) {
      const texts: string[] = [];
      for (const beat of beats) {
        const text = await realizeMouthOneBeat(messages, beat, options);
        if (text) texts.push(text);
        if (process.env.QRE_AUTHOR_DEBUG_RAW === "true") {
          console.log(`\n--- QRE RAW MODEL OUTPUT · MOUTH-BEAT ---\n${text}\n--- END RAW MODEL OUTPUT · MOUTH-BEAT ---\n`);
        }
      }
      const combined = JSON.stringify({ texts });
      if (process.env.QRE_AUTHOR_DEBUG_RAW === "true") {
        console.log(`\n--- QRE RAW MODEL OUTPUT · MOUTH-REALIZATION-BATCH ---\n${combined}\n--- END RAW MODEL OUTPUT · MOUTH-REALIZATION-BATCH ---\n`);
      }
      return { text: combined, model: modelName(), provider: "local" };
    }
  }

  const fast = process.env.QRE_AUTHOR_FAST === "true";
  const temperature = options.temperature ?? Number(process.env.QRE_LOCAL_MODEL_TEMPERATURE || (fast ? 0.75 : 0.8));
  const numPredict = options.numPredict ?? Number(process.env.QRE_LOCAL_MODEL_NUM_PREDICT || (fast ? 512 : 512));
  const keepAlive = process.env.QRE_LOCAL_MODEL_KEEP_ALIVE || (fast ? "10m" : "5m");

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
    options: { temperature, num_predict: numPredict },
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
