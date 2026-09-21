import type { AuthorScene } from "@qre/contracts";
import { localModelGenerate } from "./localModelRuntime.js";

const clean = (value: unknown): string =>
  String(value ?? "").replace(/\s+/g, " ").trim();

const unique = (values: readonly string[]): string[] =>
  [...new Set(values.map(clean).filter(Boolean))];

function parseJson(text: string): Record<string, unknown> | undefined {
  const source = clean(text)
    .replace(/^\`\`\`(?:json)?/i, "")
    .replace(/\`\`\`$/i, "")
    .trim();

  if (!source) return undefined;

  try {
    const value = JSON.parse(source);
    return value && typeof value === "object"
      ? value as Record<string, unknown>
      : undefined;
  } catch {
    const start = source.indexOf("{");
    const end = source.lastIndexOf("}");
    if (start < 0 || end <= start) return undefined;
    try {
      const value = JSON.parse(source.slice(start, end + 1));
      return value && typeof value === "object"
        ? value as Record<string, unknown>
        : undefined;
    } catch {
      return undefined;
    }
  }
}

type AtomicVerification = {
  sceneIndex?: unknown;
  clauseIndex?: unknown;
  supported?: unknown;
  sourceEventIds?: unknown;
  concreteClaims?: unknown;
  unsupportedClaims?: unknown;
};

function beatClauses(text: string): string[] {
  const clauses = clean(text)
    .split(/(?<=[.!?])\s+|\s*[;|]\s*/g)
    .map((part) => clean(part.replace(/[.!?]+$/g, "")))
    .filter(Boolean);

  return clauses.length ? clauses.slice(0, 12) : [clean(text)].filter(Boolean);
}

const ABSOLUTE_RELATION_LANGUAGE = /\b(always|never|first|last)\b/i;
const TEMPORAL_STATE_LANGUAGE = /\b(still|already|yet)\b/i;
const SENSORY_CLAIM_LANGUAGE =
  /\b(smell|smells|smelled|scent|scents|scented|taste|tastes|tasted|flavor|flavors|sound|sounds|sounded|noise|noises|texture|textures|touch|touches|touched|feel|feels|felt)\b/i;

function hasUnsupportedAbsoluteClaim(
  sceneText: string,
  suppliedRealityText: string,
): boolean {
  const sceneMatches = clean(sceneText).match(
    new RegExp(ABSOLUTE_RELATION_LANGUAGE.source, "ig"),
  );
  if (!sceneMatches?.length) return false;

  const reality = clean(suppliedRealityText).toLowerCase();
  return sceneMatches.some((claim) => !reality.includes(claim.toLowerCase()));
}

function hasUnsupportedTemporalStateClaim(
  sceneText: string,
  suppliedRealityText: string,
): boolean {
  const sceneMatches = clean(sceneText).match(
    new RegExp(TEMPORAL_STATE_LANGUAGE.source, "ig"),
  );
  if (!sceneMatches?.length) return false;

  const reality = clean(suppliedRealityText).toLowerCase();
  return sceneMatches.some((claim) => !reality.includes(claim.toLowerCase()));
}

function hasUnsupportedSensoryClaim(
  sceneText: string,
  suppliedRealityText: string,
): boolean {
  const sceneMatches = clean(sceneText).match(
    new RegExp(SENSORY_CLAIM_LANGUAGE.source, "ig"),
  );
  if (!sceneMatches?.length) return false;

  const reality = clean(suppliedRealityText).toLowerCase();
  return sceneMatches.some((claim) => !reality.includes(claim.toLowerCase()));
}

export async function verifyAuthorCreativeGrounding(input: {
  scenes: Array<AuthorScene & { sourceEventIds: string[] }>;
  suppliedReality: readonly { id: string; text: string }[];
}): Promise<{
  scenes: Array<AuthorScene & { sourceEventIds: string[] }>;
  model: string;
  modelCalls: number;
}> {
  if (!input.scenes.length) {
    return {
      scenes: [],
      model: "none",
      modelCalls: 0,
    };
  }

  const atomicClauses = input.scenes.flatMap((scene, sceneIndex) =>
    beatClauses(scene.text).map((text, clauseIndex) => ({
      sceneIndex,
      clauseIndex,
      text,
      groundingHint: scene.sourceEventIds,
    })),
  );

  const system = [
    "You are QRE Atomic Semantic Grounding.",
    "Reality is authority.",
    "",
    "You receive ATOMIC_CLAUSES. Judge every clause independently.",
    "Support means the clause is directly established by SUPPLIED_REALITY or is an unavoidable semantic paraphrase of an explicitly supplied fact.",
    "Typicality, common sense association, world knowledge, likely ingredients, likely body behavior, likely setting, and plausible aftermath are NOT support.",
    "Do not unpack an event into conventional ingredients that were not stated. A bath does not establish water, soap, towels, wetness, shaking, a tub, or a grooming room.",
    "Do not convert emotion into body behavior. Happy does not establish wagging, smiling, jumping, posture, movement, or excitement.",
    "Do not convert an attempted action into motive, ownership, success, completion, release, freedom, rebellion, resistance, or preference unless reality explicitly establishes that claim.",
    "Do not convert chronology or an ending into causality, resolution, finally, freedom, relief, acceptance, or a reason for the later state unless reality explicitly establishes it.",
    "An associated place, object, body part, sensory property, actor, or physical consequence is a new concrete claim unless supplied.",
    "",
    "Creative figurative language may survive when a reasonable viewer reads it as nonliteral framing of supplied reality and it carries no unsupported concrete or relational premise.",
    "Questions, reactions, fragments, attitude, metaphor, understatement, and exaggeration are allowed only when they do not assert hidden reality.",
    "",
    "For each atomic clause:",
    "1. extract concreteClaims: every real-world claim or relational premise actually carried by the clause;",
    "2. list unsupportedClaims: every such claim not established by SUPPLIED_REALITY;",
    "3. cite sourceEventIds that support the clause when it is supported;",
    "4. set supported=true exactly when unsupportedClaims is empty AND at least one supplied event semantically anchors the clause.",
    "",
    "groundingHint is only a clue from the writer. Never treat it as evidence by itself.",
    "Return exactly one verification for every atomic clause, preserving sceneIndex and clauseIndex.",
  ].join("\n");

  const result = await localModelGenerate(
    [
      { role: "system", content: system },
      {
        role: "user",
        content: JSON.stringify({
          SUPPLIED_REALITY: input.suppliedReality,
          ATOMIC_CLAUSES: atomicClauses,
          instruction:
            "Audit every atomic clause independently. Explicit fact or unavoidable paraphrase is support; typical association is not. Examples: 'nerves' may paraphrase explicitly supplied nervousness; 'joy' may paraphrase explicitly supplied happiness. But bath does not supply water, a bow does not supply prettiness or a crown, trying to remove does not supply ownership or rebellion, and leaving happy does not supply freedom, relief, tail wagging, sunshine, or the cause of happiness.",
        }),
      },
    ],
    "json",
    {
      numPredict: Math.max(420, atomicClauses.length * 90),
      temperature: 0.06,
      jsonSchema: {
        type: "object",
        additionalProperties: false,
        required: ["verifications"],
        properties: {
          verifications: {
            type: "array",
            minItems: atomicClauses.length,
            maxItems: atomicClauses.length,
            items: {
              type: "object",
              additionalProperties: false,
              required: [
                "sceneIndex",
                "clauseIndex",
                "supported",
                "sourceEventIds",
                "concreteClaims",
                "unsupportedClaims",
              ],
              properties: {
                sceneIndex: {
                  type: "integer",
                  minimum: 0,
                  maximum: Math.max(0, input.scenes.length - 1),
                },
                clauseIndex: {
                  type: "integer",
                  minimum: 0,
                  maximum: 11,
                },
                supported: { type: "boolean" },
                sourceEventIds: {
                  type: "array",
                  maxItems: 32,
                  items: { type: "string", maxLength: 64 },
                },
                concreteClaims: {
                  type: "array",
                  maxItems: 12,
                  items: { type: "string", maxLength: 120 },
                },
                unsupportedClaims: {
                  type: "array",
                  maxItems: 12,
                  items: { type: "string", maxLength: 120 },
                },
              },
            },
          },
        },
      },
    },
  );

  const parsed = parseJson(result.text);
  const raw = Array.isArray(parsed?.verifications)
    ? parsed.verifications
    : [];

  const allowedIds = new Set(input.suppliedReality.map((event) => event.id));
  const suppliedRealityText = input.suppliedReality
    .map((event) => event.text)
    .join(" ");

  const verificationByClause = new Map<string, AtomicVerification>();

  for (const value of raw) {
    if (!value || typeof value !== "object") continue;
    const item = value as AtomicVerification;
    const sceneIndex = Number(item.sceneIndex);
    const clauseIndex = Number(item.clauseIndex);
    if (!Number.isInteger(sceneIndex) || !Number.isInteger(clauseIndex)) continue;
    verificationByClause.set(`${sceneIndex}:${clauseIndex}`, item);
  }

  const scenes = input.scenes.flatMap((scene, sceneIndex) => {
    const clauses = beatClauses(scene.text);
    const supportedIds = new Set<string>();

    for (let clauseIndex = 0; clauseIndex < clauses.length; clauseIndex += 1) {
      const item = verificationByClause.get(`${sceneIndex}:${clauseIndex}`);
      if (!item) return [];

      const unsupportedClaims = Array.isArray(item.unsupportedClaims)
        ? item.unsupportedClaims
            .filter((claim): claim is string => typeof claim === "string")
            .map(clean)
            .filter(Boolean)
        : [];

      if (item.supported !== true || unsupportedClaims.length) return [];

      const sourceEventIds = Array.isArray(item.sourceEventIds)
        ? unique(
            item.sourceEventIds
              .filter((id): id is string => typeof id === "string")
              .filter((id) => allowedIds.has(id)),
          )
        : [];

      if (!sourceEventIds.length) return [];
      sourceEventIds.forEach((id) => supportedIds.add(id));
    }

    if (hasUnsupportedAbsoluteClaim(scene.text, suppliedRealityText)) return [];
    if (hasUnsupportedTemporalStateClaim(scene.text, suppliedRealityText)) return [];
    if (hasUnsupportedSensoryClaim(scene.text, suppliedRealityText)) return [];

    return [{
      ...scene,
      sourceEventIds: [...supportedIds],
    }];
  });

  return {
    scenes,
    model: result.model,
    modelCalls: 1,
  };
}

