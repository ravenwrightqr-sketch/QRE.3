import { request as httpRequest } from "node:http";
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
    "qwen2.5vl:7b"
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
  const parsedUrl = new URL(url);
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

    const response = await new Promise<{
      statusCode: number;
      body: string;
    }>((resolve, reject) => {
      let settled = false;

      const finish = (
        callback: () => void,
      ): void => {
        if (settled) return;
        settled = true;
        callback();
      };

      const req = httpRequest(
        {
          protocol: parsedUrl.protocol,
          hostname: parsedUrl.hostname,
          port: parsedUrl.port
            ? Number(parsedUrl.port)
            : 11434,
          path: `${parsedUrl.pathname}${parsedUrl.search}`,
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(
              serializedBody,
              "utf8",
            ),
          },
        },
        (res) => {
          const chunks: Buffer[] = [];

          res.on("data", (chunk: Buffer | string) => {
            chunks.push(
              Buffer.isBuffer(chunk)
                ? chunk
                : Buffer.from(chunk),
            );
          });

          res.on("end", () => {
            finish(() => {
              resolve({
                statusCode: res.statusCode ?? 0,
                body: Buffer.concat(chunks).toString(
                  "utf8",
                ),
              });
            });
          });

          res.on("error", (error) => {
            finish(() => reject(error));
          });
        },
      );

      req.on("error", (error) => {
        finish(() => reject(error));
      });

      const abortRequest = (): void => {
        if (settled) return;

        req.destroy(
          new Error(
            "Local model request aborted.",
          ),
        );
      };

      if (controller.signal.aborted) {
        abortRequest();
        return;
      }

      controller.signal.addEventListener(
        "abort",
        abortRequest,
        { once: true },
      );

      req.write(serializedBody);
      req.end();
    });

    console.log("QRE FETCH RETURNED");
    console.log(
      "QRE RESPONSE STATUS:",
      response.statusCode,
    );

    if (
      response.statusCode < 200 ||
      response.statusCode >= 300
    ) {
      console.log(
        "QRE RESPONSE ERROR BODY:",
        response.body,
      );

      throw new Error(
        `Local model failed (${response.statusCode}): ${response.body.slice(0, 300)}`,
      );
    }

    console.log(
      "QRE READING RESPONSE JSON",
    );

    const json = JSON.parse(
      response.body,
    );

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
const META_PLANNER = /QRE's latent-movie planner|QRE FILM-CUT PLANNER/i;
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
        facts: Array.isArray(source.facts) ? source.facts.map(String) : [],
        sourceMoments: Array.isArray(source.moments) ? source.moments.map(String) : [],
        memoryContext: Array.isArray(source.memory) ? source.memory.map(String) : [],
        trajectory: Array.isArray(source.trajectory) ? source.trajectory.map(String) : [],
      })
    : undefined;

  const graphContext = realityGraph
    ? [
        "QRE REALITY GRAPH · SOURCE-TRUTH CONTEXT:",
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
  return value.trim().split(/\s+/).filter(Boolean).length;
}

function isCanonicalMouth(
  messages: LocalModelMessage[],
  format?: "json",
): boolean {
  if (format !== "json") return false;

  const system = messages.find((message) => message.role === "system")?.content ?? "";
  return /QRE's theatrical mouth/i.test(system);
}

function mouthAcceptable(text: string): boolean {
  const words = wordCount(text);

  if (
    !text ||
    words < 2 ||
    words > 7
  ) {
    return false;
  }
  if (/[?]/.test(text)) {
    return false;
  }
  if (META_LANGUAGE.test(text)) return false;
  if (GENERIC_PROSE.test(text)) return false;

  if (
    /^[A-Z][A-Z _-]{5,}:/.test(text)
  ) {
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
function mouthGrounded(
  text: string,
  suppliedText: string,
): boolean {
  const sourceTokens =
    new Set(
      suppliedText
        .toLowerCase()
        .split(/[^a-z0-9'-]+/i)
        .filter(
          (word) =>
            word.length >= 3,
        ),
    );

  const actionWords = [
    "bark",
    "barks",
    "barked",
    "growl",
    "growls",
    "growled",
    "snatch",
    "snatches",
    "snatched",
    "grab",
    "grabs",
    "grabbed",
    "run",
    "runs",
    "ran",
    "jump",
    "jumps",
    "jumped",
    "wag",
    "wags",
    "wagged",
    "smile",
    "smiles",
    "smiled",
    "stare",
    "stares",
    "stared",
    "blink",
    "blinks",
    "blinked",
    "lick",
    "licks",
    "licked",
    "sit",
    "sits",
    "sat",
    "stand",
    "stands",
    "stood",
  ];

  for (const action of actionWords) {
    if (
      new RegExp(
        `\\b${action}\\b`,
        "i",
      ).test(text) &&
      !sourceTokens.has(action)
    ) {
      return false;
    }
  }

  return true;
}

function realizationModeForBeat(
  beat: Record<string, unknown>,
): string {
  const creativeMove =
    String(
      beat.creativeMove ?? "",
    )
      .trim()
      .toLowerCase();

  const attentionFunction =
    String(
      beat.attentionFunction ?? "",
    )
      .trim()
      .toLowerCase();

  switch (creativeMove) {
    case "contrast":
      return "semantic_contrast";

    case "status_inversion":
      return "status_reversal";

    case "callback":
      return "callback_compression";

    case "recontextualization":
      return "meaning_reframe";

    case "understatement":
      return "understatement";

    case "double_meaning":
      return "double_meaning";

    case "personification":
      return "personification";

    case "implication":
      return "implication";

    default:
      switch (attentionFunction) {
        case "turn":
          return "meaning_turn";

        case "reframe":
          return "meaning_reframe";

        case "escalation":
          return "grounded_escalation";

        case "callback":
          return "callback_compression";

        case "payoff":
          return "payoff_compression";

        case "release":
          return "clean_release";

        default:
          return "direct_grounded_realization";
      }
  }
}
function canonicalMouthPrompt(
  messages: LocalModelMessage[],
  beatCount: number,
): LocalModelMessage[] {
  const system = messages.find((message) => message.role === "system");
  if (!system) return messages;

  const user = [...messages].reverse().find((message) => message.role === "user");
  if (!user) return messages;

  const source = parseUserObject(messages) ?? {};

  const compactTruth = {
    subject: typeof source.subject === "string" ? source.subject : "",
    prompt: typeof source.prompt === "string" ? source.prompt : "",
    facts: Array.isArray(source.facts) ? source.facts.map(String).slice(0, 24) : [],
    moments: Array.isArray(source.moments) ? source.moments.map(String).slice(0, 18) : [],
    sourceMoments: Array.isArray(source.sourceMoments) ? source.sourceMoments.map(String).slice(0, 18) : [],
    memory: Array.isArray(source.memory) ? source.memory.map(String).slice(0, 14) : [],
    trajectory: Array.isArray(source.trajectory) ? source.trajectory.map(String).slice(0, 14) : [],
    subjectTruth: source.subjectTruth ?? null,
  };

  const compactFacts = [
    ...compactTruth.facts,
    ...compactTruth.moments,
    ...compactTruth.sourceMoments,
    ...compactTruth.memory,
  ].filter(Boolean).join(" | ");

  const characterHint =
    /\bnervous\b/i.test(compactFacts) && /\bfierce\b/i.test(compactFacts)
      ? "Private character read: guarded but defiant. Use that as attitude, not literal fact."
      : /\bmissing\b|\blost\b|\bvanished\b/i.test(compactFacts) && /\bpacked\b|\bmoved\b|\bfinished\b/i.test(compactFacts)
      ? "Private character read: apparently complete, with an unresolved absence."
      : /\bsame\b|\bagain\b|\breturned\b|\bback\b/i.test(compactFacts) && /\bdifferent\b|\bchanged\b|\bnew\b/i.test(compactFacts)
      ? "Private character read: repetition now carries changed meaning."
      : "Private character read: make the strongest supplied contradiction or relationship affect the attitude of the line.";
  const approvedBeats =
    Array.isArray(source.beats)
      ? source.beats
          .map(
            (value): Record<string, unknown> | null =>
              value &&
              typeof value === "object"
                ? (value as Record<string, unknown>)
                : null,
          )
          .filter(
            (
              value,
            ): value is Record<string, unknown> =>
              Boolean(value),
          )
          .slice(0, beatCount)
      : [];
  const realizationPlan =
    approvedBeats.map(
      (beat, index) => ({
        order:
          Number(
            beat.order ??
              index + 1,
          ),
        eventIds:
          Array.isArray(
            beat.eventIds,
          )
            ? beat.eventIds
            : [],
        anchors:
          Array.from(
            new Set([
              ...(Array.isArray(
                beat.setsUp,
              )
                ? beat.setsUp
                : []),
              ...(Array.isArray(
                beat.paysOff,
              )
                ? beat.paysOff
                : []),
            ]),
          ),
        change:
          String(
            beat.informationGain ??
              beat.change ??
              "",
          ),
        setsUp:
          Array.isArray(
            beat.setsUp,
          )
            ? beat.setsUp
            : [],
        paysOff:
          Array.isArray(
            beat.paysOff,
          )
            ? beat.paysOff
            : [],
        attentionFunction:
          String(
            beat.attentionFunction ??
              "",
          ),
        creativeMove:
          String(
            beat.creativeMove ??
              "",
          ),
        realizationMode:
          realizationModeForBeat(
            beat,
          ),
        nextNeed:
          String(
            beat.nextNeed ??
              beat.next ??
              "",
          ),
      }),
    );
  const batchInstruction = [
    "QRE CANONICAL MOUTH BATCH.",
    `There are exactly ${beatCount} approved beats.`,
    "Return exactly one short viewer-facing line per beat.",
    "",
    "REALIZATION LAW:",
    "The movie is already chosen.",
    "The Meaning Spine is already chosen.",
    "The Beat Graph is already approved.",
    "Your job is language realization only.",
    "",
    "MEANING IS APPROVED. REALITY IS LOCKED.",
    "You may express approved meaning through implication, contrast, status language, understatement, callback, double meaning, metaphor, personification, recontextualization, or compression.",
    "You may NOT create a new concrete event.",
    "",
    "REALIZATION PRIORITY:",
    "1. Preserve the supplied anchor.",
    "2. Express the approved meaning shift.",
    "3. Add stylistic language only when it does not introduce new reality.",
    "Never sacrifice grounding for cleverness.",
    "Never use a metaphor that requires a new object, person, body action, reaction, or event.",
    "",
    "NEVER INVENT:",
    "body movement, facial expression, physical reaction, internal thought, new emotion, dialogue, object interaction, environment, sound, crowd reaction, outcome, or new action.",
    "Do not literalize a metaphorical frame.",
    "",
    "DOMAIN INFERENCE IS NOT FACT:",
    "Do not infer objects, tools, locations, staff, people, clothing, equipment, or standard industry actions merely because the prompt belongs to a known domain.",
    "A dog grooming prompt does NOT authorize scissors, salon, groomer, leash, kennel, table, dryer, clippers, shampoo, tail movement, or any other grooming detail unless explicitly supplied.",
    "Use only supplied domain details.",
    "Never fill missing reality with stereotypical domain knowledge.",
    "",
    "CONCRETE VERBS ARE EVIDENCE-SENSITIVE TOO:",
    "Do not invent an action merely because it is plausible for the subject.",
    "If the source does not say the dog barked, do not write barked.",
    "If the source does not say the dog growled, do not write growled.",
    "Use supplied state words and supplied actions before adding any concrete verb.",
    "",
    "ANCHOR RULE:",
    "Every line must contain or clearly transform at least one supplied detail.",
    "Prefer the strongest supplied anchor over inferred context.",
    "When a beat is a meaning shift, transform the supplied anchor instead of adding a new event.",
    "",
    "MINIMUM PAYOFF INFORMATION:",
    "The final line must be at least 2 words.",
    "The final line must contain or clearly transform a supplied ending detail.",
    "Never output a bare compliment such as Fabulous, Amazing, Perfect, or Beautiful.",
    "",
    "GOOD:",
    "Change the reading of supplied details.",
    "Make earlier details matter differently after later details.",
    "Let the approved carrier alter the meaning of the opening.",
    "Let the supplied endpoint pay off the accumulated meaning.",
    "",
    "BAD:",
    "Do not turn interpretation into invented action.",
    "Do not write eyes widened, tail wagged, squared shoulders, looked confident, became determined, snatched the bow, or similar unsupported events.",
    "",
    "LINE RULES:",
    "2-7 words required.",
    "Natural language.",
    "One clean thought.",
    "Never use a question mark.",
    "Never ask the viewer a literal question.",
    "Questions belong in the hidden planning layer, never in viewer-facing mouth text.",
    "No keyword collage.",
    "No headline fragments.",
    "No comma stacks.",
    "No planner vocabulary.",
    "No explanation of meaning.",
    "No strategy names.",
    "No generic cinematic filler.",
    "",
    "SEQUENCE RULE:",
    "Every line inherits meaning from earlier lines.",
    "Later beats must recontextualize earlier supplied details.",
    "For a turn or reframe, do not repeat the setup as a question.",
    "A turn must state or imply the changed relationship between the earlier anchor and the new supplied anchor.",
    "Use supplied state → changed reading, never supplied state → literal question.",
    "The final line must pay off the supplied ending.",
    "",
    characterHint,
  ].join("\n");

  return [
    {
      ...system,
      content:
        `${system.content}\n\n${batchInstruction}\n\n` +
        "FINAL OUTPUT CONTRACT:\n" +
        '{"texts":["line 1","line 2","line 3"]}.\n' +
        `The array MUST contain exactly ${beatCount} strings.\n` +
        "Do not output beatGraphs.\n" +
        "Do not output a MOUTH_QUALITY_CONTRACT.\n" +
        "Do not output beats.\n" +
        "Do not output analysis.\n" +
        "Do not output planning metadata.\n" +
        "Do not output keys other than texts.",
    },
    {
      role: "user",
      content: JSON.stringify({
        task: "realize_approved_beats",
        subject:
          compactTruth.subject,
        prompt:
          compactTruth.prompt,
        suppliedEvidence:
          compactTruth.facts,
        sourceMoments:
          compactTruth.moments,
        memory:
          compactTruth.memory,
        subjectTruth:
          compactTruth.subjectTruth,
        beatCount,
        realizationPlan,
      }),
    },
  ];
}

function parseMouthBatch(raw: string, expected: number): string[] {
  const text = raw
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();

  try {
    const value = JSON.parse(text) as { texts?: unknown };
    if (!Array.isArray(value.texts)) return [];

    const texts = value.texts
      .map((value) => String(value ?? "").trim())
      .filter(Boolean)
      .slice(0, expected);

    return texts.length === expected ? texts : [];
  } catch {
    return [];
  }
}
function isCanonicalMouthCandidateRequest(
  messages: LocalModelMessage[],
  format?: "json",
): boolean {
  if (format !== "json") return false;

  const system =
    messages.find(
      (message) =>
        message.role === "system",
    )?.content ?? "";

  return /QRE MOUTH CANDIDATE GENERATOR/i.test(
    system,
  );
}

function parseCanonicalMouthCandidateBatch(
  raw: string,
): {
  variantsByBeat: Array<{
    order: number;
    variants: string[];
  }>;
} {
  const text = raw
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();

  try {
    const value = JSON.parse(text) as {
      variantsByBeat?: unknown;
    };

    if (!Array.isArray(value.variantsByBeat)) {
      return { variantsByBeat: [] };
    }

    return {
      variantsByBeat: value.variantsByBeat
        .filter(
          (entry): entry is Record<string, unknown> =>
            Boolean(entry) && typeof entry === "object",
        )
        .map((entry) => {
          const variants = Array.isArray(entry.variants)
            ? entry.variants
                .map((value) => String(value ?? "").trim())
                .filter(Boolean)
                .slice(0, 8)
            : [];

          return {
            order: Number(entry.order ?? 0),
            variants,
          };
        })
        .filter(
          (entry) =>
            Number.isFinite(entry.order) &&
            entry.order > 0 &&
            entry.variants.length > 0,
        ),
    };
  } catch {
    return { variantsByBeat: [] };
  }
}

function normalizeCanonicalMouthCandidateBatch(
  parsed: {
    variantsByBeat: Array<{
      order: number;
      variants: string[];
    }>;
  },
  beatCount: number,
): {
  variantsByBeat: Array<{
    order: number;
    variants: string[];
  }>;
} {
  const byOrder = new Map(
    parsed.variantsByBeat.map((entry) => [entry.order, entry]),
  );

  return {
    variantsByBeat: Array.from(
      { length: beatCount },
      (_, index) => {
        const order = index + 1;
        const entry = byOrder.get(order);

        return {
          order,
          variants: entry?.variants ?? [],
        };
      },
    ),
  };
}

async function canonicalMouthCandidateRequest(
  messages: LocalModelMessage[],
  options: LocalModelOptions,
): Promise<LocalModelResult> {
  const payload =
    parseUserObject(messages);

  const beats = Array.isArray(
    payload?.beats,
  )
    ? payload.beats
    : [];

  const beatCount =
    beats.length;

  if (!beatCount) {
    return {
      text: JSON.stringify({
        variantsByBeat: [],
      }),
      model: modelName(),
      provider: "local",
    };
  }

  const temperature =
    options.temperature ??
    Number(
      process.env
        .QRE_LOCAL_MODEL_TEMPERATURE ??
        "0.72",
    );

  const numPredict =
    options.numPredict ??
    Number(
      process.env
        .QRE_LOCAL_MODEL_NUM_PREDICT ??
        "768",
    );

  const prepared =
    messages.map(
      (message) => ({
        role:
          message.role,
        content:
          message.content,
        ...(message.images?.length
          ? {
              images:
                message.images.map(
                  stripDataUrl,
                ),
            }
          : {}),
      }),
    );

  const system =
    prepared.find(
      (message) =>
        message.role ===
        "system",
    );

  const user =
    prepared.find(
      (message) =>
        message.role ===
        "user",
    );
      const sourceSubject =
    typeof payload?.subject === "string"
      ? payload.subject
      : "";

  const sourcePrompt =
    typeof payload?.prompt === "string"
      ? payload.prompt
      : "";

  const sourceFacts =
    Array.isArray(payload?.facts)
      ? payload.facts
          .map(String)
          .filter(Boolean)
          .slice(0, 24)
      : [];

  const sourceMoments =
    Array.isArray(payload?.moments)
      ? payload.moments
          .map(String)
          .filter(Boolean)
          .slice(0, 18)
      : [];

  const sourceMomentsExplicit =
    Array.isArray(payload?.sourceMoments)
      ? payload.sourceMoments
          .map(String)
          .filter(Boolean)
          .slice(0, 18)
      : [];

  const sourceMemory =
    Array.isArray(payload?.memory)
      ? payload.memory
          .map(String)
          .filter(Boolean)
          .slice(0, 12)
      : [];

  const creativeLock =
    typeof payload?.creativeLock === "string"
      ? payload.creativeLock
      : typeof payload?.lens === "string"
        ? payload.lens
        : "";

  const sourceBeats = beats.map(
    (value, index) => {
      const beat =
        value && typeof value === "object"
          ? (value as Record<string, unknown>)
          : {};

      return {
        order: Number(
          beat.order ?? index + 1,
        ),
        role: String(
          beat.role ?? "",
        ),
        attentionFunction: String(
          beat.attentionFunction ?? "",
        ),
        creativeMove: String(
          beat.creativeMove ?? "",
        ),
        realizationMode: String(
          beat.realizationMode ?? "",
        ),
        eventIds: Array.isArray(
          beat.eventIds,
        )
          ? beat.eventIds.map(String)
          : [],
        anchors: Array.from(
          new Set([
            ...(Array.isArray(beat.setsUp)
              ? beat.setsUp.map(String)
              : []),
            ...(Array.isArray(beat.paysOff)
              ? beat.paysOff.map(String)
              : []),
          ]),
        ),
        change: String(
          beat.change ??
            beat.informationGain ??
            "",
        ),
        next: String(
          beat.next ??
            beat.frontier ??
            beat.nextNeed ??
            "",
        ),
        obligations: Array.isArray(
          beat.obligations,
        )
          ? beat.obligations.map(String)
          : [],
        forbiddenMoves: Array.isArray(
          beat.forbiddenMoves,
        )
          ? beat.forbiddenMoves.map(String)
          : [],
        relationKinds: Array.isArray(
          beat.relationKinds,
        )
          ? beat.relationKinds.map(String)
          : [],
        relationStrength: Number(
          beat.relationStrength ?? 0,
        ),
      };
    },
  );

  const mouthSystem = [
    "QRE MOUTH · CREATIVE REALIZATION ENGINE.",
    "",
    "You create viewer-facing language only.",
    "Reality is locked.",
    "Meaning is locked.",
    "The movie is locked.",
    "The endpoint is locked.",
    "",
    "Generate materially different variants.",
    "Do not paraphrase the same line five times.",
    "Explore different readings of the approved relationship.",
    "",
    "You may change framing, rhythm, implication, attitude, metaphor, status, wordplay, and genre flavor.",
    "You may NOT invent concrete events, people, objects, places, chronology, physical actions, reactions, sounds, dialogue, or outcomes.",
    "",
    creativeLock
      ? `CREATIVE LOCK: ${creativeLock}. Use it as the expressive universe without changing reality.`
      : "CREATIVE LOCK: none. Choose the strongest expressive framing supported by the approved meaning.",
    "",
    "Each line is one cinematic cut.",
    "One dominant thought.",
    "Short.",
    "Clean.",
    "Make the next cut desirable.",
    "Avoid summary sentences that cram multiple beats together.",
    "",
    "For middle beats, prefer implication, contrast, callback, reversal, consequence, compression, or escalation when supported.",
    "Do not write analyst language.",
    "Do not explain the meaning.",
    "Do not name the operation.",
    "",
    `Return exactly ${beatCount} variantsByBeat entries.`,
    "Return 5 materially different variants for each non-payoff beat.",
    "Return JSON only.",
    '{"variantsByBeat":[{"order":1,"variants":["...","...","...","...","..."]}]}',
  ]
    .filter(Boolean)
    .join("\n");

  const mouthUser = JSON.stringify({
    task: "generate_creative_mouth_candidates",
    subject: sourceSubject,
    prompt: sourcePrompt,
    creativeLock,
    suppliedEvidence: {
      facts: sourceFacts,
      moments: sourceMoments,
      sourceMoments: sourceMomentsExplicit,
      memory: sourceMemory,
    },
    beats: sourceBeats,
  });

  const requestMessages = [
    {
      role: "system" as const,
      content: mouthSystem,
    },
    {
      role: "user" as const,
      content: mouthUser,
    },
  ];

  

  const data =
    await request(
      "/api/chat",
      {
        model:
          modelName(),
        stream: false,
        keep_alive:
          keepAlive(),
        format: "json",
        messages:
          requestMessages,
        options: {
          temperature,
          num_predict:
            numPredict,
        },
      },
    );

  const text =
    outputText(data);

  const parsed =
    normalizeCanonicalMouthCandidateBatch(
      parseCanonicalMouthCandidateBatch(text),
      beatCount,
    );

  const usableBeats =
    parsed.variantsByBeat.filter(
      (entry) => entry.variants.length > 0,
    ).length;

  console.log(
    "QRE CANDIDATE PARSE:",
    `${usableBeats}/${beatCount} beats usable`,
  );

  if (usableBeats >= Math.max(1, beatCount - 1)) {
    return {
      text: JSON.stringify(parsed),
      model: modelName(),
      provider: "local",
    };
  }

  if (
    process.env
      .QRE_AUTHOR_DEBUG_RAW ===
    "true"
  ) {
    console.log(
      "\n--- QRE CANDIDATE ROUTE RETRY ---\n" +
        text +
        "\n--- END QRE CANDIDATE ROUTE RETRY ---\n",
    );
  }

  const retryData =
    await request(
      "/api/chat",
      {
        model:
          modelName(),
        stream: false,
        keep_alive:
          keepAlive(),
        format: "json",
        messages: [
          {
            role:
              "system",
            content:
              `${system?.content ?? ""}\n\n` +
              "THIS IS A REPAIR REQUEST.\n" +
              "The previous response used the wrong schema.\n" +
              "Do NOT return beats.\n" +
              "Do NOT return texts.\n" +
              "Return ONLY variantsByBeat.\n" +
              `There are exactly ${beatCount} approved beats.\n` +
              "Each entry must contain 2-5 short language variants.\n" +
              "Each variant is one viewer-facing cinematic cut.\n" +
              "Prefer 2-7 words. One dominant thought.\n" +
              "No comma-heavy summaries. No subject-trait-then-action scaffolds.\n" +
              "Use supplied facts and approved relationships only.\n" +
              "Do not invent events, people, objects, places, movement, reactions, sounds, dialogue, or outcomes.\n" +
              "Return valid JSON even when a beat has no safe candidate.\n" +
              "Do not invent reality.",
          },
          {
            role:
              "user",
            content:
              user?.content ??
              JSON.stringify(
                payload,
              ),
          },
        ],
        options: {
          temperature:
            Math.max(
              0.45,
              temperature -
                0.15,
            ),
          num_predict:
            Math.min(
              numPredict,
              768,
            ),
        },
      },
    );

  const retryText =
    outputText(
      retryData,
    );

  const retryParsed =
    normalizeCanonicalMouthCandidateBatch(
      parseCanonicalMouthCandidateBatch(retryText),
      beatCount,
    );

  const retryUsableBeats =
    retryParsed.variantsByBeat.filter(
      (entry) => entry.variants.length > 0,
    ).length;

  console.log(
    "QRE CANDIDATE REPAIR PARSE:",
    `${retryUsableBeats}/${beatCount} beats usable`,
  );

  const result =
    retryUsableBeats > 0
      ? retryParsed
      : parsed;

  return {
    text: JSON.stringify(result),
    model: modelName(),
    provider: "local",
  };
}
async function canonicalMouthRequest(
  messages: LocalModelMessage[],
  options: LocalModelOptions,
): Promise<LocalModelResult> {
  const payload = parseUserObject(messages);
  const beats = Array.isArray(payload?.beats) ? payload.beats : [];
  const suppliedText = [
    ...(Array.isArray(payload?.facts)
      ? payload.facts.map(String)
      : []),
    ...(Array.isArray(payload?.moments)
      ? payload.moments.map(String)
      : []),
    ...(Array.isArray(payload?.sourceMoments)
      ? payload.sourceMoments.map(String)
      : []),
    ...(Array.isArray(payload?.memory)
      ? payload.memory.map(String)
      : []),
  ].join(" ");
  if (!beats.length) {
    return {
      text: JSON.stringify({ texts: [] }),
      model: modelName(),
      provider: "local",
    };
  }

  const temperature = options.temperature ?? Number(process.env.QRE_LOCAL_MODEL_TEMPERATURE || (process.env.QRE_AUTHOR_FAST === "true" ? 0.72 : 0.8));
  const numPredict = options.numPredict ?? Number(process.env.QRE_LOCAL_MODEL_NUM_PREDICT || 384);
  const prepared = canonicalMouthPrompt(messages, beats.length);

  const data = await request("/api/chat", {
    model: modelName(),
    stream: false,
    keep_alive: keepAlive(),
    format: "json",
    messages: prepared.map((message) => ({
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
    console.log("\n--- QRE RAW MODEL OUTPUT · MOUTH-BATCH ---\n" + text + "\n--- END RAW MODEL OUTPUT · MOUTH-BATCH ---\n");
  }

  const parsed = parseMouthBatch(text, beats.length);
  const valid =
    parsed.length === beats.length &&
    parsed.every(
      (line) =>
        mouthAcceptable(line) &&
        mouthGrounded(
          line,
          suppliedText,
        ),
    );

  if (valid) {
    return {
      text: JSON.stringify({ texts: parsed }),
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
          "RETRY: Rewrite every line to satisfy the canonical mouth contract. " +
          "Return exactly the required texts array. " +
          "Use 2-7 words per line. " +
          "Preserve the approved Meaning Spine. " +
          "Use supplied nouns, traits, and actions as anchors. " +
          "Do not invent body movement, facial expression, internal state, new action, new object interaction, or new outcome. " +
          "Do not add atmosphere. " +
          "Do not explain the meaning. " +
          "Compress the approved relationship into natural language.",
      },
    ],
    beats.length,
  );

  const retryData = await request("/api/chat", {
    model: modelName(),
    stream: false,
    keep_alive: keepAlive(),
    format: "json",
    messages: retryMessages.map((message) => ({
      role: message.role,
      content: message.content,
      ...(message.images?.length ? { images: message.images.map(stripDataUrl) } : {}),
    })),
    options: {
      temperature: Math.max(0.55, temperature - 0.12),
      num_predict: Math.min(numPredict, 256),
    },
  });

  const retryText = outputText(retryData);
  const retryParsed = parseMouthBatch(retryText, beats.length);
  const retryValid =
    retryParsed.length === beats.length &&
    retryParsed.every(
      (line) =>
        mouthAcceptable(line) &&
        mouthGrounded(
          line,
          suppliedText,
        ),
    );

  if (retryValid) {
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
      texts:
        retryParsed.length > 0
          ? retryParsed
          : parsed.length > 0
          ? parsed
          : [],
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
 if (
  isCanonicalMouthCandidateRequest(
    messages,
    format,
  )
) {
  return canonicalMouthCandidateRequest(
    messages,
    options,
  );
}

if (
  isCanonicalMouth(
    messages,
    format,
  )
) {
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

  const fast = process.env.QRE_AUTHOR_FAST === "true";
  const temperature = options.temperature ?? Number(process.env.QRE_LOCAL_MODEL_TEMPERATURE || (fast ? 0.75 : 0.8));
  const numPredict = options.numPredict ?? Number(process.env.QRE_LOCAL_MODEL_NUM_PREDICT || 512);

  const data = await request("/api/chat", {
    model: modelName(),
    stream: false,
    keep_alive: keepAlive(),
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

  return {
    text,
    model: modelName(),
    provider: "local",
  };
}

export async function localModelHealthy(): Promise<boolean> {
  try {
    const response = await fetch(`${baseUrl()}/api/tags`, {
      signal: AbortSignal.timeout(3000),
    });
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