import { readFileSync } from "node:fs";
import { buildAuthorRealityGraph } from "./src/services/authorRealityGraph.js";
import {
  localModelConfig,
  localModelGenerate,
  type LocalModelJsonSchema,
  type LocalModelMessage,
} from "./src/services/localModelRuntime.js";

const SUBJECT = "Coco";
const PROMPT = "Create the customer-facing memory from this grooming visit.";
const CANONICAL_FACTS = [
  "Dropped off at 9:00 AM.",
  "Bath.",
  "Blue bows.",
  "Tried to remove the bows.",
  "Happy at pickup.",
];
const TARGET_PROVIDER = "openrouter";
const ALLOWED_MODELS = new Set([
  "openai/gpt-5.4-mini",
  "google/gemini-2.5-pro",
]);
type ExperimentMode = "SEMANTIC_SUBJECT" | "RELATIONAL_ABSTRACTION";

const clean = (value: unknown): string =>
  String(value ?? "").replace(/\s+/g, " ").trim();

const SEMANTIC_SUBJECT_INSTRUCTION = [
  "You are QRE Semantic Subject Discovery.",
  "Supplied reality is fixed; derive meaning without adding reality.",
  "Discover multiple distinct, concise candidate semantic subjects grounded in the supplied reality.",
  "A semantic subject is the conceptual subject about which a grounded interpretation of the supplied reality could make meaning.",
  "It is not necessarily a concrete participant, and it is not an event, proposition, viewer-facing sentence, treatment, lens, or semantic mechanic.",
  "For each candidate, provide a concise subject phrase, the supplied evidence event IDs that ground it, and a brief reason those events support it.",
  "Return candidate subjects only. Do not write final prose or propositions.",
  "Do not invent concrete occurrences, entities, actions, interactions, properties, causes, motives, or outcomes.",
  "Do not force a broader reading; include only subjects genuinely supported by the supplied reality.",
].join("\n");

const RELATIONAL_ABSTRACTION_INSTRUCTION = [
  "Examine only the supplied reality.",
  "Identify one or more meaningful relations among supplied facts.",
  "Ground every relation in the supplied event IDs.",
  "For each grounded relation, derive multiple distinct conceptual interpretations that the relation could support.",
  "Each interpretation must express meaning supported by the relation rather than rename an event, object, action, participant, or sequence.",
  "Do not write viewer-facing prose, jokes, scenes, slogans, captions, or generalized propositions.",
  "Do not add events, actions, participants, interactions, locations, objects, chronology, causal occurrences, observed occurrences, mental states, or outcomes.",
  "Do not force abstraction when the supplied evidence does not support it.",
].join("\n");

const CANDIDATE_SCHEMA: LocalModelJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["candidates"],
  properties: {
    candidates: {
      type: "array",
      minItems: 2,
      maxItems: 6,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["subject", "groundingEventIds", "reason"],
        properties: {
          subject: { type: "string", maxLength: 100 },
          groundingEventIds: {
            type: "array",
            minItems: 1,
            maxItems: 5,
            items: { type: "string", maxLength: 64 },
          },
          reason: { type: "string", maxLength: 180 },
        },
      },
    },
  },
};

const RELATIONAL_ABSTRACTION_SCHEMA: LocalModelJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["relations"],
  properties: {
    relations: {
      type: "array",
      maxItems: 6,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["relation", "groundingEventIds", "interpretations"],
        properties: {
          relation: { type: "string", maxLength: 160 },
          groundingEventIds: {
            type: "array",
            minItems: 1,
            maxItems: 5,
            items: { type: "string", maxLength: 64 },
          },
          interpretations: {
            type: "array",
            maxItems: 6,
            items: {
              type: "object",
              additionalProperties: false,
              required: ["interpretation", "derivation"],
              properties: {
                interpretation: { type: "string", maxLength: 120 },
                derivation: { type: "string", maxLength: 180 },
              },
            },
          },
        },
      },
    },
  },
};

const MODEL_FACING_TERMS: RegExp[] = [
  /\bhumans?\b/i,
  /\bpeople\b/i,
  /\bgroomers?\b/i,
  /\bowners?\b/i,
  /\bvisitors?\b/i,
  /\bagents?\b/i,
  /\bsociety\b/i,
  /\bcustomers?\b/i,
  /\bpets?\b/i,
  /\bdogs?\b/i,
  /\bdecoration\b/i,
  /\bfashion\b/i,
  /\brebellion\b/i,
  /\bpreferences?\b/i,
  /\bcontrol\b/i,
  /\bautonomy\b/i,
  /\badornment\b/i,
  /\bresistance\b/i,
  /\bsocial convention\b/i,
  /\bsocial observations?\b/i,
  /apparently\s*,?\s*humans\s+love\s+bows/i,
];

function canonicalFactsFromSource(): string[] {
  const source = readFileSync(
    new URL("./author-direct-creative-live-output.ts", import.meta.url),
    "utf8",
  );
  const factsBlock = /const FACTS = \[([\s\S]*?)\];/.exec(source)?.[1];
  if (!factsBlock) throw new Error("Could not locate canonical Coco FACTS.");
  return [...factsBlock.matchAll(/"((?:\\.|[^"\\])*)"/g)]
    .map((match) => JSON.parse(`"${match[1]}"`) as string);
}

function suppliedReality(): Array<{ id: string; text: string }> {
  const world = buildAuthorRealityGraph({
    prompt: PROMPT,
    subject: SUBJECT,
    facts: CANONICAL_FACTS,
    sourceMoments: [],
    memoryContext: [],
    trajectory: [],
  });

  return world.events.map((event) => ({
    id: clean(event.id),
    text: clean(event.label),
  })).filter((event) => event.text);
}

function creativeSearchEvidenceProjection(
  events: ReadonlyArray<{ id: string; text: string }>,
): Array<{ id: string; text: string }> {
  return events.map((event) => {
    const exact = clean(event.text);
    const semanticText = exact
      .replace(/\b(?:[01]?\d|2[0-3]):[0-5]\d\s*(?:am|pm)?\b/gi, " ")
      .replace(/\s+/g, " ")
      .replace(/\s+([,.;:!?])/g, "$1")
      .replace(/^[,.;:\-\s]+|[,;:\-\s]+$/g, "")
      .trim();
    return { id: clean(event.id), text: semanticText || exact };
  });
}

function modelMessages(
  events: ReadonlyArray<{ id: string; text: string }>,
  mode: ExperimentMode,
): LocalModelMessage[] {
  return [
    {
      role: "system",
      content: mode === "RELATIONAL_ABSTRACTION"
        ? RELATIONAL_ABSTRACTION_INSTRUCTION
        : SEMANTIC_SUBJECT_INSTRUCTION,
    },
    {
      role: "user",
      content: JSON.stringify({
        SUBJECT: SUBJECT,
        SUPPLIED_REALITY: mode === "RELATIONAL_ABSTRACTION"
          ? events
          : creativeSearchEvidenceProjection(events),
      }),
    },
  ];
}

function schemaForMode(mode: ExperimentMode): LocalModelJsonSchema {
  return mode === "RELATIONAL_ABSTRACTION"
    ? RELATIONAL_ABSTRACTION_SCHEMA
    : CANDIDATE_SCHEMA;
}

function assertModelFacingTextIsClean(
  messages: LocalModelMessage[],
  schema: LocalModelJsonSchema,
): void {
  const outboundText = `${messages.map((message) => message.content).join("\n")}\n${JSON.stringify(schema)}`;
  const contamination = MODEL_FACING_TERMS.filter((term) => term.test(outboundText));
  if (contamination.length) {
    throw new Error(`Model-facing contamination detected: ${contamination.map(String).join(", ")}`);
  }
}

function parseOptions(argv: string[]): {
  live: boolean;
  domain: string;
  runs: number;
  mode: ExperimentMode;
} {
  let live = false;
  let domain = "coco";
  let runs = 1;
  let mode: ExperimentMode = "SEMANTIC_SUBJECT";

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]!;
    if (arg === "--live") {
      live = true;
    } else if (arg === "--domain") {
      domain = argv[++index] ?? "";
    } else if (arg.startsWith("--domain=")) {
      domain = arg.slice("--domain=".length);
    } else if (arg === "--runs") {
      runs = Number(argv[++index]);
    } else if (arg.startsWith("--runs=")) {
      runs = Number(arg.slice("--runs=".length));
    } else if (arg === "--mode") {
      mode = normalizeMode(argv[++index] ?? "");
    } else if (arg.startsWith("--mode=")) {
      mode = normalizeMode(arg.slice("--mode=".length));
    } else if (arg !== "--dry-run") {
      throw new Error(`Unsupported argument: ${arg}`);
    }
  }

  if (domain.toLowerCase() !== "coco" || runs !== 1) {
    throw new Error("This harness is restricted to --domain coco --runs 1.");
  }
  return { live, domain: "COCO", runs, mode };
}

function normalizeMode(value: string): ExperimentMode {
  const normalized = value.replaceAll("-", "_").toUpperCase();
  if (normalized === "SEMANTIC_SUBJECT" || normalized === "RELATIONAL_ABSTRACTION") {
    return normalized;
  }
  throw new Error(`Unsupported experiment mode: ${value}`);
}

function verifyFixture(): void {
  const sourceFacts = canonicalFactsFromSource();
  if (JSON.stringify(sourceFacts) !== JSON.stringify(CANONICAL_FACTS)) {
    throw new Error("Harness facts differ from the canonical Coco supplied reality.");
  }
}

function verifyRelationalFixture(events: ReadonlyArray<{ id: string; text: string }>): void {
  if (JSON.stringify(events.map((event) => event.text)) !== JSON.stringify(CANONICAL_FACTS)) {
    throw new Error("Relational mode requires the exact canonical Coco event labels.");
  }
}

function verifyLiveConfiguration(): void {
  const config = localModelConfig();
  if (config.provider !== TARGET_PROVIDER || !ALLOWED_MODELS.has(config.model)) {
    throw new Error(
      `Live mode requires provider=${TARGET_PROVIDER} and model in [${[...ALLOWED_MODELS].join(", ")}].`,
    );
  }
  if (String(process.env.QRE_AUTHOR_FALLBACK_MODEL ?? "").trim() !== "") {
    throw new Error("Live mode requires QRE_AUTHOR_FALLBACK_MODEL to be empty.");
  }
}

async function main(): Promise<void> {
  const options = parseOptions(process.argv.slice(2));
  verifyFixture();
  const events = suppliedReality();
  if (options.mode === "RELATIONAL_ABSTRACTION") {
    verifyRelationalFixture(events);
  }
  const schema = schemaForMode(options.mode);
  const messages = modelMessages(events, options.mode);
  assertModelFacingTextIsClean(messages, schema);

  console.log(`experiment: ${options.mode}`);
  console.log(`mode: ${options.live ? "LIVE" : "DRY RUN"}`);
  console.log(`domain: ${options.domain}`);
  console.log(`runs: ${options.runs}`);
  console.log("canonical Coco supplied reality unchanged: true");
  console.log(`canonical events: ${JSON.stringify(CANONICAL_FACTS)}`);
  console.log(`model-facing contamination scan: PASS (${messages.length} messages and schema)`);
  const config = localModelConfig();
  const numPredict =
    options.mode === "RELATIONAL_ABSTRACTION" &&
    config.model === "google/gemini-2.5-pro"
      ? 1500
      : 520;
  if (options.mode === "RELATIONAL_ABSTRACTION" || options.live) {
    verifyLiveConfiguration();
  }
  console.log(`provider: ${config.provider}`);
  console.log(`model: ${config.model}`);
  console.log(`temperature: 0.98`);
  console.log(`token ceiling: ${numPredict}`);
  console.log("fallback: empty");
  console.log("eventual Creative Search/discovery provider calls: 1");
  console.log("Direct Author calls: 0");
  console.log("Claim Auditor calls: 0");
  console.log("Reality Editor calls: 0");
  console.log("Final Grounding calls: 0");
  console.log("scoring calls: 0");
  console.log("selection calls: 0");
  console.log("synthesizer calls: 0");

  if (!options.live) {
    console.log("provider calls in this dry run: 0");
    console.log("outbound candidates: not requested in dry mode");
    return;
  }

  verifyLiveConfiguration();
  let providerCalls = 0;
  providerCalls += 1;
  const result = await localModelGenerate(messages, "json", {
    numPredict,
    temperature: 0.98,
    jsonSchema: schema,
  });
  console.log(`provider calls in this live run: ${providerCalls}`);
  console.log(`RAW ${options.mode} OUTPUT`);
  console.log(result.text);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});