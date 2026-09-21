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

type Verification = {
  grounded?: unknown;
  sourceEventIds?: unknown;
  literalClaims?: unknown;
  unsupportedClaims?: unknown;
  clauseAudits?: unknown;
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

  const system = [
    "You are QRE Semantic Grounding.",
    "Protect literal truth without flattening creative language.",
    "",
    "Read each finished beat in context.",
    "Separate the beat into its literal anchor and its figurative overlay.",
    "A figurative beat may be grounded even when its exact words never appear in reality, as long as its metaphor clearly transforms one or more supplied entities, actions, states, or relations and does not smuggle in a new concrete fact.",
    "The concrete carrier of a metaphor must come from supplied reality. Figurative freedom may personify or reframe supplied material; it may not introduce a new physical object, body part, actor, action, sensory detail, inhabitant, sound, smell, taste, or texture merely as decoration.",
    "If a beat contains any concrete noun, bodily action, or sensory event not established by supplied reality, treat that concrete content as a new claim even when the surrounding line is playful or metaphorical.",
    "A supplied object does not automatically supply every sensory property or interaction associated with it. Bacon being supplied does not establish its smell, taste, grease, crunch, or anyone sensing it; a dog being supplied does not establish wagging, sniffing, barking, paws, tail movement, bodily posture, or movement.",
    "Words that name a sensory property or bodily state/action are concrete claims even when written as shorthand. Examples: 'bacon smell', 'happy tail', 'tiny paws', 'sniffs', 'crunch' all require explicit support.",
    "Preserve metaphor, personification, idiom, status language, exaggeration, attitude, and playful framing when a reasonable viewer reads them as nonliteral.",
    "A beat is grounded only when every concrete real-world claim inside it is supported by SUPPLIED_REALITY.",
    "Relational claims are concrete too. Priority, ranking, first/last, always/never, temporal persistence such as still/already/yet, preference strength, exclusivity, deliberate choice, curation, ownership, and repeated selection require explicit support; they are not free figurative overlays merely because the underlying items are supplied.",
    "An associated place or setting is also a concrete claim. A walk does not establish a park, street, trail, yard, or any other setting unless supplied reality names it.",
    "Figurative framing does not excuse an embedded unsupported literal claim.",
    "A supplied action proves the action occurred; it does not by itself prove an unseen prior condition, cause, motive, history, sensory state, or aftermath.",
    "A beat may freely add figurative meaning around supplied facts.",
    "Mark grounded=false when any concrete claim in the beat goes beyond supplied reality, even if other words in the same beat are metaphorical.",
    "",
    "For every grounded beat, cite the supplied event IDs that carry its literal anchor or, for a purely figurative beat, the supplied events being transformed by the metaphor.",
    "Purely figurative lines do not need a literal noun or verb match; they do need a clear semantic anchor in supplied reality.",
    "The writer may provide groundingHint IDs. Treat them as clues, not authority; keep, replace, or expand them based on the actual words.",
    "Do not judge style, quality, humor, or taste.",
    "Do not rewrite the beat.",
    "For each beat, explicitly extract every literal or concrete real-world claim carried by the words, including implied state changes, body actions, objects, settings, sensory details, chronology, outcomes, and causal relations.",
    "Then list every extracted claim that is not directly established by SUPPLIED_REALITY in unsupportedClaims.",
    "A beat is grounded exactly when unsupportedClaims is empty.",
    "grounded is only a summary field. QRE will trust the explicit unsupportedClaims audit over the summary boolean if they disagree.",
    "Every beat arrives with CLAUSES. Audit every clause by clauseIndex. Do not merge away, skip, or forget a later clause. A compound beat survives only when every clause audit has zero unsupportedClaims.",
    "Emotion does not establish body behavior. Happy does not establish wagging, smiling, jumping, posture, movement, or any other bodily manifestation.",
    "Return exactly one verification entry per beat, in the same order as BEATS.",
  ].join("\n");

  const result = await localModelGenerate(
    [
      { role: "system", content: system },
      {
        role: "user",
        content: JSON.stringify({
          SUPPLIED_REALITY: input.suppliedReality,
          BEATS: input.scenes.map((scene) => ({
            text: scene.text,
            clauses: beatClauses(scene.text).map((clause, clauseIndex) => ({
              clauseIndex,
              text: clause,
            })),
            groundingHint: scene.sourceEventIds,
          })),
          instruction:
            "Verify every beat in the same order. groundingHint is only a clue from the writer; correct it when needed. Audit EVERY provided clause by clauseIndex before deciding the beat. For each clause, extract its concrete or relational claims and put any unsupported premise in that clause's unsupportedClaims. Then produce aggregate literalClaims and unsupportedClaims for the whole beat. Do not skip trailing fragments: 'Tail wags. Free.' requires separate audits for 'Tail wags' and 'Free'. A bath does not automatically establish water everywhere, stillness, soap, towels, shaking, or any surrounding scene. A dog or a happy emotional state does not establish tail wagging or other bodily behavior. A happy ending does not establish sunshine, freedom, release, acceptance, or why the happiness occurred. Preserve figurative language when its concrete carrier is supplied and every clause is clean. Set grounded to true exactly when the aggregate unsupportedClaims is empty.",
        }),
      },
    ],
    "json",
    {
      numPredict: 420,
      temperature: 0.12,
      jsonSchema: {
        type: "object",
        additionalProperties: false,
        required: ["verifications"],
        properties: {
          verifications: {
            type: "array",
            minItems: input.scenes.length,
            maxItems: input.scenes.length,
            items: {
              type: "object",
              additionalProperties: false,
              required: ["grounded", "sourceEventIds", "literalClaims", "unsupportedClaims", "clauseAudits"],
              properties: {
                grounded: { type: "boolean" },
                sourceEventIds: {
                  type: "array",
                  maxItems: 32,
                  items: { type: "string", maxLength: 64 },
                },
                literalClaims: {
                  type: "array",
                  maxItems: 16,
                  items: { type: "string", maxLength: 120 },
                },
                unsupportedClaims: {
                  type: "array",
                  maxItems: 16,
                  items: { type: "string", maxLength: 120 },
                },
                clauseAudits: {
                  type: "array",
                  minItems: 1,
                  maxItems: 12,
                  items: {
                    type: "object",
                    additionalProperties: false,
                    required: ["clauseIndex", "unsupportedClaims"],
                    properties: {
                      clauseIndex: { type: "integer", minimum: 0, maximum: 11 },
                      unsupportedClaims: {
                        type: "array",
                        maxItems: 8,
                        items: { type: "string", maxLength: 120 },
                      },
                    },
                  },
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
    ? parsed!.verifications
    : [];

  const allowedIds = new Set(input.suppliedReality.map((event) => event.id));
  const suppliedRealityText = input.suppliedReality
    .map((event) => event.text)
    .join(" ");
  const scenes = input.scenes.flatMap((scene, index) => {
    const value = raw[index];
    if (!value || typeof value !== "object") return [];

    const item = value as Verification;
    const unsupportedClaims = Array.isArray(item.unsupportedClaims)
      ? item.unsupportedClaims
          .filter((claim): claim is string => typeof claim === "string")
          .map(clean)
          .filter(Boolean)
      : [];

    const clauses = beatClauses(scene.text);
    const clauseAudits = Array.isArray(item.clauseAudits)
      ? item.clauseAudits.filter(
          (audit): audit is Record<string, unknown> =>
            Boolean(audit) && typeof audit === "object",
        )
      : [];

    const everyClauseAudited = clauses.every((_, clauseIndex) => {
      const audit = clauseAudits.find(
        (candidate) => Number(candidate.clauseIndex) === clauseIndex,
      );
      if (!audit) return false;

      const clauseUnsupported = Array.isArray(audit.unsupportedClaims)
        ? audit.unsupportedClaims
            .filter((claim): claim is string => typeof claim === "string")
            .map(clean)
            .filter(Boolean)
        : [];

      return clauseUnsupported.length === 0;
    });

    if (unsupportedClaims.length) return [];
    if (!everyClauseAudited) return [];
    if (hasUnsupportedAbsoluteClaim(scene.text, suppliedRealityText)) return [];
    if (hasUnsupportedTemporalStateClaim(scene.text, suppliedRealityText)) return [];
    if (hasUnsupportedSensoryClaim(scene.text, suppliedRealityText)) return [];

    const sourceEventIds = Array.isArray(item.sourceEventIds)
      ? unique(
          item.sourceEventIds
            .filter((id): id is string => typeof id === "string")
            .filter((id) => allowedIds.has(id)),
        )
      : [];

    if (!sourceEventIds.length) return [];

    return [{
      ...scene,
      sourceEventIds,
    }];
  });

  return {
    scenes,
    model: result.model,
    modelCalls: 1,
  };
}
