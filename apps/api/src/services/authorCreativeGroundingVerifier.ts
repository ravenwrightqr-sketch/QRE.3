import type { AuthorDomainContext, AuthorScene } from "@qre/contracts";
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
  supportKind?: unknown;
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
  domainContext?: AuthorDomainContext;
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
    "Distinguish MATERIAL REALITY from STORY TEXTURE.",
    "MATERIAL REALITY includes actors, deliberate actions, body actions, objects materially introduced into the event, ownership, motive, causality, chronology, success/failure, completed outcomes, relational status, and physical state changes. Material reality must be directly established by SUPPLIED_REALITY or be an unavoidable semantic paraphrase.",
    "STORY TEXTURE may be allowed when a clause is clearly a nonliteral or hyperbolic rendering of the physical envelope, atmosphere, or dramatic feel of an explicitly supplied event AND WORLD_CONTEXT makes that rendering natural.",
    "Story texture must not change what happened. It cannot add a new actor, deliberate action, body action, ownership, motive, causal relation, successful outcome, chronology, or consequential state.",
    "Typicality alone is not enough for material reality, but ordinary event texture can support non-material creative language. Example: in a supplied bath inside grooming context, 'Water. Everywhere.' can function as hyperbolic texture around the bath; it does not mean QRE knows a literal flood occurred.",
    "By contrast, a supplied bath does not establish that the subject shook, wagged, escaped, resisted, liked it, hated it, or became free.",
    "Do not convert emotion into body behavior. Happy does not establish wagging, smiling, jumping, posture, movement, or excitement.",
    "PARAPHRASE must preserve predicate type. An emotion/state may paraphrase to another emotion/state word, but never to a physical action. A physical action may paraphrase to another description of that same action, but not to a merely associated action.",
    "Do not convert an attempted action into motive, ownership, success, completion, release, freedom, rebellion, resistance, or preference unless reality explicitly establishes that claim.",
    "Do not convert chronology or an ending into causality, resolution, finally, freedom, relief, acceptance, or a reason for the later state unless reality explicitly establishes it.",
    "An associated place, object, body part, sensory property, actor, or physical consequence is a new concrete claim unless supplied.",
    "",
    "Creative figurative language may survive when a reasonable viewer reads it as nonliteral framing of supplied reality and it carries no unsupported concrete or relational premise.",
    "Questions, reactions, fragments, attitude, metaphor, understatement, and exaggeration are allowed only when they do not assert hidden reality.",
    "",
    "For each atomic clause:",
    "1. extract concreteClaims: every material real-world claim or relational premise carried by the clause;",
    "2. choose supportKind: DIRECT, PARAPHRASE, FIGURATIVE, CONTEXTUAL_TEXTURE, or UNSUPPORTED;",
    "3. list unsupportedClaims: every material claim not established by SUPPLIED_REALITY;",
    "4. cite sourceEventIds that anchor the clause;",
    "5. set supported=true only when supportKind is not UNSUPPORTED, unsupportedClaims is empty, and at least one supplied event semantically anchors the clause.",
    "Your fields must agree. If supported=true, unsupportedClaims MUST be []. If any unsupported material claim exists, set supported=false and supportKind=UNSUPPORTED.",
    "Do not put the clause itself into unsupportedClaims merely because it is compressed, figurative, or contextual texture. unsupportedClaims is only for material claims that exceed reality.",
    "CONTEXTUAL_TEXTURE is allowed only for non-material scene texture. Never use it to excuse a new action, body behavior, outcome, motive, ownership, cause, chronology, or state change.",
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
          WORLD_CONTEXT: input.domainContext,
          ATOMIC_CLAUSES: atomicClauses,
          instruction:
            "Audit every atomic clause independently. Protect material truth while preserving imaginative story texture. Keep your own fields logically consistent: supported=true requires unsupportedClaims=[]. 'Nerves' is a clean PARAPHRASE of supplied nervousness and therefore has no unsupported claim. 'Joy' or 'content' may paraphrase supplied happiness when the wording does not add a cause or new event. PARAPHRASE must preserve predicate type: a supplied emotion/state can become another state-word, but it cannot become an unsupplied bodily action. Therefore 'Tail wags' is UNSUPPORTED when the only anchor is 'left happy'. In a grooming-memory context, 'Water. Everywhere.' may be CONTEXTUAL_TEXTURE around a supplied bath because it heightens physical atmosphere without changing material history; do not list 'Everywhere' as unsupported if you classify the line as allowed contextual texture. A playful aesthetic reaction to a supplied bow can be FIGURATIVE. But an attempted action does not establish ownership, motive, rebellion, successful completion, or freedom. WORLD_CONTEXT helps interpret texture and vocabulary but never becomes historical evidence.",
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
                "supportKind",
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
                supportKind: {
                  type: "string",
                  enum: ["DIRECT", "PARAPHRASE", "FIGURATIVE", "CONTEXTUAL_TEXTURE", "UNSUPPORTED"],
                },
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

      const supportKind = clean(item.supportKind).toUpperCase();
      const allowedSupportKind =
        supportKind === "DIRECT" ||
        supportKind === "PARAPHRASE" ||
        supportKind === "FIGURATIVE" ||
        supportKind === "CONTEXTUAL_TEXTURE";

      if (item.supported !== true || !allowedSupportKind || unsupportedClaims.length) return [];

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

