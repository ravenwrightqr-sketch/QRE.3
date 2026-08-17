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

function baseUrl(): string {
  return (
    process.env.QRE_LOCAL_MODEL_URL ||
    "http://127.0.0.1:11434"
  ).replace(/\/$/, "");
}

function modelName(): string {
  return (
    process.env.QRE_AUTHOR_FAST_MODEL ||
    process.env.QRE_LOCAL_MODEL ||
    "qre-local"
  );
}

function timeoutMs(): number {
  const raw = Number(
    process.env.QRE_LOCAL_MODEL_TIMEOUT_MS ||
      600000,
  );
  return Number.isFinite(raw) && raw > 0
    ? raw
    : 600000;
}

function keepAlive(): string {
  return (
    process.env.QRE_LOCAL_MODEL_KEEP_ALIVE ||
    (process.env.QRE_AUTHOR_FAST === "true"
      ? "10m"
      : "5m")
  );
}

function stripDataUrl(value: string): string {
  const match = /^data:[^;]+;base64,(.+)$/s.exec(
    value,
  );
  return match ? match[1] : value;
}

async function request(
  path: string,
  body: unknown,
): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => {
    console.log(
      "QRE LOCAL MODEL TIMEOUT FIRING",
    );
    controller.abort();
  }, timeoutMs());

  const url = `${baseUrl()}${path}`;
  const serializedBody = JSON.stringify(body);

  console.log("QRE REQUEST START");
  console.log("QRE REQUEST URL:", url);
  console.log(
    "QRE REQUEST MODEL:",
    (body as any)?.model,
  );
  console.log(
    "QRE REQUEST FORMAT:",
    (body as any)?.format,
  );
  console.log(
    "QRE REQUEST MESSAGE COUNT:",
    Array.isArray((body as any)?.messages)
      ? (body as any).messages.length
      : "none",
  );
  console.log(
    "QRE REQUEST BODY BYTES:",
    Buffer.byteLength(serializedBody, "utf8"),
  );
  console.log(
    "QRE REQUEST CONTENT CHARS:",
    Array.isArray((body as any)?.messages)
      ? (body as any).messages.reduce(
          (total: number, message: any) =>
            total +
            String(
              message?.content ?? "",
            ).length,
          0,
        )
      : "none",
  );

  try {
    console.log("QRE FETCH ENTER");

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: serializedBody,
      signal: controller.signal,
    });

    console.log("QRE FETCH RETURNED");
    console.log(
      "QRE RESPONSE STATUS:",
      response.status,
    );

    if (!response.ok) {
      const detail = await response
        .text()
        .catch(() => "");
      console.log(
        "QRE RESPONSE ERROR BODY:",
        detail,
      );
      throw new Error(
        `Local model failed (${response.status}): ${detail.slice(0, 300)}`,
      );
    }

    console.log(
      "QRE READING RESPONSE JSON",
    );
    const json = await response.json();
    console.log(
      "QRE RESPONSE JSON RECEIVED",
    );
    return json;
  } catch (error) {
    console.log(
      "QRE LOCAL REQUEST ERROR:",
      error,
    );
    throw error;
  } finally {
    clearTimeout(timer);
    console.log("QRE REQUEST FINISHED");
  }
}

function outputText(data: any): string {
  return String(
    data?.message?.content ??
      data?.response ??
      data?.choices?.[0]?.message
        ?.content ??
      "",
  ).trim();
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
  "For memories, preserve the supplied sensory, social, and personal fingerprint. Do not replace it with category shorthand or generic biography.",
  "Creative lenses change framing, rhythm, metaphor, implication, and escalation; they do not authorize invented facts.",
  "Character interpretation is allowed: infer attitude, status posture, contradiction, and social meaning from supplied relationships. Treat that interpretation as a private authoring lens, never as a new concrete fact.",
  "Example of allowed interpretation: supplied nervous + fierce may support a guarded/defiant attitude. The line may express that attitude metaphorically without inventing a literal lawyer, negotiation, courtroom, or other event.",
  "After identity is established, let behavior and objects reveal the character. Do not keep saying the subject's name plus a fact.",
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
  "Every beat needs a compact change, compact frontier, and compact necessity.",
  "Target 3-6 beats. Keep change and frontier short enough to realize as a single sentence cut.",
  "Do not put strategy names or cognitive language into change, frontier, next, or necessity.",
].join("\n");

const META_LANGUAGE = /\b(?:attention strategy|operator(?: mix|s)?|build from beat|cognitive(?: plan| language)?|preserve forward information|land the chosen meaning|find subtle tension|viewer momentum|information frontier|beat plan|writing process|author brief|necessity of this beat|strategy names?)\b/i;
const GENERIC_PROSE = /\b(?:beautiful transformation|magical moment|unforgettable experience|incredible journey|positive outcome|newfound confidence|happy-go-lucky|tale of transformation|a testament to|satisfaction is our priority)\b/i;
const META_PLANNER = /QRE's latent-movie planner|QRE FILM-CUT PLANNER|Output JSON only: \{premise:string/i;

function prepareMessages(
  messages: LocalModelMessage[],
): LocalModelMessage[] {
  const firstSystem = messages.find(
    (message) => message.role === "system",
  );

  if (!firstSystem) return messages;

  if (
    !/QRE's universal creative author|QRE's universal latent-movie discovery brain|QRE's theatrical mouth|QRE's latent-movie planner/i.test(
      firstSystem.content,
    )
  ) {
    return messages;
  }

  return messages.map((message) =>
    message === firstSystem
      ? {
          ...message,
          content: `${UNIVERSAL_AUTHOR_COGNITION}\n\n${firstSystem.content}`,
        }
      : message,
  );
}

function parseUserObject(
  messages: LocalModelMessage[],
): Record<string, unknown> | null {
  const user = [...messages]
    .reverse()
    .find((message) => message.role === "user");

  if (!user) return null;

  try {
    const value = JSON.parse(user.content);
    return value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

function preparePlannerMessages(
  messages: LocalModelMessage[],
): LocalModelMessage[] {
  const prepared = prepareMessages(messages);
  const system = prepared.find(
    (message) => message.role === "system",
  );

  if (!system || !META_PLANNER.test(system.content)) {
    return prepared;
  }

  const source = parseUserObject(prepared);

  const realityGraph = source
    ? buildAuthorRealityGraph({
        prompt: String(source.prompt ?? ""),
        subject: String(source.subject ?? ""),
        place: String(source.place ?? ""),
        facts: Array.isArray(source.facts)
          ? source.facts.map(String)
          : [],
        sourceMoments: Array.isArray(
          source.moments,
        )
          ? source.moments.map(String)
          : [],
        memoryContext: Array.isArray(
          source.memory,
        )
          ? source.memory.map(String)
          : [],
        trajectory: Array.isArray(
          source.trajectory,
        )
          ? source.trajectory.map(String)
          : [],
      })
    : undefined;

  const graphContext = realityGraph
    ? [
        "QRE REALITY GRAPH · SOURCE-TRUTH CONTEXT:",
        "Use this graph to discover relationships before inventing narrative structure.",
        `events=${JSON.stringify(
          realityGraph.events.slice(0, 10),
        )}`,
        `relations=${JSON.stringify(
          realityGraph.relations.slice(0, 16),
        )}`,
        `tensions=${JSON.stringify(
          realityGraph.unresolvedTensions,
        )}`,
        `recurring=${JSON.stringify(
          realityGraph.recurringSignals,
        )}`,
        `sensory=${JSON.stringify(
          realityGraph.sensorySignals,
        )}`,
        "Every grounded beat must be traceable to evidence/events or to a clearly marked creative interpretation of those events.",
        "Do not invent concrete objects, people, places, dates, actions, dialogue, or outcomes in reality-locked mode.",
      ].join("\n")
    : "";

  return prepared.map((message) =>
    message === system
      ? {
          ...message,
          content:
            `${message.content}\n\n${FILM_CUT_PLANNER}${graphContext}\n\n` +
            "PLANNER OUTPUT RULES:\n" +
            "- 3 to 6 beats.\n" +
            "- Each beat is one sentence-cut opportunity, not a paragraph.\n" +
            "- `change`, `next`, `frontier`, and `necessity` must describe supplied reality or a safe interpretive relationship.\n" +
            "- `change` should normally be 3-12 words.\n" +
            "- `frontier` should normally be 2-10 words.\n" +
            "- `necessity` should be one compact reason, not an explanation of the writing process.\n" +
            "- Never output internal planning labels inside beat fields.\n" +
            "- A service sequence should feel like a receipt that became a tiny film, not a checklist.\n" +
            "- A successful sequence should read plausibly as separate short messages shown one after another.",
        }
      : message,
  );
}

function wordCount(value: string): number {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function isCanonicalMouth(
  messages: LocalModelMessage[],
  format?: "json",
): boolean {
  if (format !== "json") return false;

  const system =
    messages.find(
      (message) => message.role === "system",
    )?.content ?? "";

  return /QRE's theatrical mouth/i.test(system);
}

function mouthAcceptable(text: string): boolean {
  const words = wordCount(text);

  if (!text || words < 2 || words > 9) {
    return false;
  }

  if (META_LANGUAGE.test(text)) return false;
  if (GENERIC_PROSE.test(text)) return false;
  if (/^[A-Z][A-Z _-]{5,}:/.test(text)) {
    return false;
  }

  if (
    /\b(?:what happens next|what will happen next|more to come|this beat|this scene|the viewer)\b/i.test(
      text,
    )
  ) {
    return false;
  }

  return true;
}

function canonicalMouthPrompt(
  messages: LocalModelMessage[],
  beatCount: number,
): LocalModelMessage[] {
  const system = messages.find(
    (message) => message.role === "system",
  );

  if (!system) return messages;

  const user = [...messages]
    .reverse()
    .find((message) => message.role === "user");

  if (!user) return messages;

  const source = parseUserObject(messages) ?? {};

  const compactTruth = {
    subject:
      typeof source.subject === "string"
        ? source.subject
        : "",
    prompt:
      typeof source.prompt === "string"
        ? source.prompt
        : "",
    facts: Array.isArray(source.facts)
      ? source.facts.map(String).slice(0, 24)
      : [],
    moments: Array.isArray(source.moments)
      ? source.moments.map(String).slice(0, 18)
      : [],
    sourceMoments: Array.isArray(
      source.sourceMoments,
    )
      ? source.sourceMoments.map(String).slice(0, 18)
      : [],
    memory: Array.isArray(source.memory)
      ? source.memory.map(String).slice(0, 14)
      : [],
    trajectory: Array.isArray(source.trajectory)
      ? source.trajectory.map(String).slice(0, 14)
      : [],
    subjectTruth: source.subjectTruth ?? null,
  };

  const compactFacts = [
    ...compactTruth.facts,
    ...compactTruth.moments,
    ...compactTruth.sourceMoments,
    ...compactTruth.memory,
  ]
    .filter(Boolean)
    .join(" | ");

  const characterHint =
    /\bnervous\b/i.test(compactFacts) &&
    /\bfierce\b/i.test(compactFacts)
      ? "Private character read: guarded but defiant. Use that as attitude, not literal fact."
      : /\bmissing\b|\blost\b|\bvanished\b/i.test(
          compactFacts,
        ) &&
        /\bpacked\b|\bmoved\b|\bfinished\b/i.test(
          compactFacts,
        )
      ? "Private character read: apparently complete, with an unresolved absence."
      : /\bsame\b|\bagain\b|\breturned\b|\bback\b/i.test(
          compactFacts,
        ) &&
        /\bdifferent\b|\bchanged\b|\bnew\b/i.test(
          compactFacts,
        )
      ? "Private character read: repetition now carries changed meaning."
      : "Private character read: make the strongest supplied contradiction or relationship affect the attitude of the line.";

  const batchInstruction = [
    "QRE CANONICAL MOUTH BATCH MODE.",
    `There are exactly ${beatCount} approved beats. Return exactly ${beatCount} viewer-facing lines in order.`,
    'Ignore any earlier singular-output wording and use exactly: {"texts":["line 1","line 2",...]}',
    "Each line is one film cut. 2-9 words, preferably 3-7.",
    "Do not repeat subject + identity fact. Identity belongs to baseline unless it is the discovery.",
    "Use the supplied beat and the nextNeed/frontier to make the viewer want the next cut.",
    "Interpret supplied relationships instead of merely paraphrasing them.",
    "Status language, metaphor, personification, double meaning, sly exaggeration, and character-specific absurdity are allowed.",
    "A metaphorical frame is not a factual event. Do not literalize a lawyer, negotiation, heist, spy, case, mission, rebellion, or similar lens unless the source explicitly says it happened.",
    "Never invent a new person, object, location, dialogue, weather, lighting, time-of-day, body position, physical reaction, sound, crowd reaction, or outcome.",
    "Every line must be grounded in the supplied source details and approved beat.",
    "Prefer a line that changes the social or emotional reading of the detail.",
    "Avoid generic words such as beautiful, magical, special, meaningful, unforgettable, journey, transformation, or cinematic.",
    characterHint,
    `SOURCE TRUTH: ${JSON.stringify(compactTruth)}`,
    "PRIVATE GUIDANCE: strategy names, contradictions, candidate lenses, and planning vocabulary are authoring controls only. Never print them.",
  ].join("\n");

  return [
    {
      ...system,
      content: `${system.content}\n\n${batchInstruction}`,
    },
    {
      ...user,
      content: JSON.stringify({
        ...source,
        canonicalMouthBeatCount: beatCount,
        canonicalMouthTruth: compactTruth,
      }),
    },
  ];
}

function parseMouthBatch(
  raw: string,
  expected: number,
): string[] {
  const text = raw
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();

  try {
    const value = JSON.parse(text) as {
      texts?: unknown;
    };

    if (!Array.isArray(value.texts)) {
      return [];
    }

    const texts = value.texts
      .map((value) => String(value ?? "").trim())
      .slice(0, expected);

    if (texts.length !== expected) {
      return [];
    }

    return texts;
  } catch {
    return [];
  }
}

async function canonicalMouthRequest(
  messages: LocalModelMessage[],
  options: LocalModelOptions,
): Promise<LocalModelResult> {
  const payload = parseUserObject(messages);
  const beats = Array.isArray(payload?.beats)
    ? payload.beats
    : [];

  if (!beats.length) {
    return {
      text: JSON.stringify({
        texts: [],
      }),
      model: modelName(),
      provider: "local",
    };
  }

  const temperature =
    options.temperature ??
    Number(
      process.env.QRE_LOCAL_MODEL_TEMPERATURE ||
        (process.env.QRE_AUTHOR_FAST === "true"
          ? 0.72
          : 0.8),
    );

  const numPredict =
    options.numPredict ??
    Number(
      process.env.QRE_LOCAL_MODEL_NUM_PREDICT ||
        384,
    );

  const prepared = canonicalMouthPrompt(
    messages,
    beats.length,
  );

  const data = await request("/api/chat", {
    model: modelName(),
    stream: false,
    keep_alive: keepAlive(),
    format: "json",
    messages: prepared.map((message) => ({
      role: message.role,
      content: message.content,
      ...(message.images?.length
        ? {
            images: message.images.map(
              stripDataUrl,
            ),
          }
        : {}),
    })),
    options: {
      temperature,
      num_predict: numPredict,
    },
  });

  const text = outputText(data);

  if (
    process.env.QRE_AUTHOR_DEBUG_RAW === "true"
  ) {
    console.log(
      "\n--- QRE RAW MODEL OUTPUT · MOUTH-BATCH ---\n" +
        text +
        "\n--- END RAW MODEL OUTPUT · MOUTH-BATCH ---\n",
    );
  }

  const parsed = parseMouthBatch(
    text,
    beats.length,
  );

  const valid = parsed.every(mouthAcceptable);

  if (valid) {
    return {
      text: JSON.stringify({
        texts: parsed,
      }),
      model: modelName(),
      provider: "local",
    };
  }

  const retryMessages = canonicalMouthPrompt(
    [
      ...messages,
      {
        role: "system",
        content:
          "RETRY: Previous mouth batch failed structural or style validation. Rewrite every beat. Preserve facts, improve character-specific interpretation, remove generic prose, and return exactly the required texts array.",
      },
    ],
    beats.length,
  );

  const retryData = await request(
    "/api/chat",
    {
      model: modelName(),
      stream: false,
      keep_alive: keepAlive(),
      format: "json",
      messages: retryMessages.map((message) => ({
        role: message.role,
        content: message.content,
        ...(message.images?.length
          ? {
              images: message.images.map(
                stripDataUrl,
              ),
            }
          : {}),
      })),
      options: {
        temperature: Math.max(
          0.55,
          temperature - 0.12,
        ),
        num_predict: Math.min(
          numPredict,
          256,
        ),
      },
    },
  );

  const retryText = outputText(retryData);
  const retryParsed = parseMouthBatch(
    retryText,
    beats.length,
  );

  if (
    retryParsed.length === beats.length
  ) {
    return {
      text: JSON.stringify({
        texts: retryParsed,
      }),
      model: modelName(),
      provider: "local",
    };
  }

  return {
    text: JSON.stringify({
      texts: Array.from(
        { length: beats.length },
        () => "",
      ),
    }),
    model: modelName(),
    provider: "local",
  };
}

export async function localModelGenerate(
  messages: LocalModelMessage[],
  format?: "json",
  options: LocalModelOptions = {},
): Promise<LocalModelResult> {
  if (isCanonicalMouth(messages, format)) {
    return canonicalMouthRequest(
      messages,
      options,
    );
  }

  const planner = messages.some(
    (message) =>
      message.role === "system" &&
      META_PLANNER.test(message.content),
  );

  const preparedMessages = planner
    ? preparePlannerMessages(messages)
    : prepareMessages(messages);

  const fast =
    process.env.QRE_AUTHOR_FAST ===
    "true";

  const temperature =
    options.temperature ??
    Number(
      process.env.QRE_LOCAL_MODEL_TEMPERATURE ||
        (fast ? 0.75 : 0.8),
    );

  const numPredict =
    options.numPredict ??
    Number(
      process.env.QRE_LOCAL_MODEL_NUM_PREDICT ||
        512,
    );

  const data = await request("/api/chat", {
    model: modelName(),
    stream: false,
    keep_alive: keepAlive(),
    format,
    messages: preparedMessages.map(
      (message) => ({
        role: message.role,
        content: message.content,
        ...(message.images?.length
          ? {
              images: message.images.map(
                stripDataUrl,
              ),
            }
          : {}),
      }),
    ),
    options: {
      temperature,
      num_predict: numPredict,
    },
  });

  const text = outputText(data);

  if (
    process.env.QRE_AUTHOR_DEBUG_RAW === "true"
  ) {
    console.log(
      "\n--- QRE RAW MODEL OUTPUT ---\n" +
        text +
        "\n--- END RAW MODEL OUTPUT ---\n",
    );
  }

  return {
    text,
    model: modelName(),
    provider: "local",
  };
}

export async function localModelHealthy(): Promise<boolean> {
  try {
    const response = await fetch(
      `${baseUrl()}/api/tags`,
      {
        signal: AbortSignal.timeout(3000),
      },
    );
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
