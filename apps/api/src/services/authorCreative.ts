import type { AuthorDomainContext, AuthorScene } from "@qre/contracts";
import { localModelGenerate } from "./localModelRuntime.js";
import type { AuthorCreativeDiscovery } from "./authorCreativeDiscovery.js";
import { evaluateAuthorCut } from "./authorCutFloor.js";

const clean = (value: unknown): string =>
  String(value ?? "").replace(/\s+/g, " ").trim();

const unique = (values: readonly string[]): string[] =>
  [...new Set(values.map(clean).filter(Boolean))];

function debug(label: string, value: unknown): void {
  if (process.env.QRE_AUTHOR_DEBUG_RAW !== "true") return;
  const text = typeof value === "string"
    ? value
    : JSON.stringify(value, null, 2);
  console.log(`\n--- QRE ${label} ---\n${text}\n--- END QRE ${label} ---\n`);
}

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

export type AuthorCreativeEvent = {
  id: string;
  text: string;
};

type AuthorBeatRole = "HOOK" | "BUILD" | "TURN" | "PAYOFF";

type AuthorSemanticBeat = {
  order: number;
  role: AuthorBeatRole;
  eventIds: string[];
  attention: string;
  change: string;
};

type AuthorSemanticPlan = {
  thesis: string;
  beats: AuthorSemanticBeat[];
};

function presentationAffordance(domainContext?: AuthorDomainContext): string {
  const contextRecord = (domainContext ?? {}) as Record<string, unknown>;
  const contextText = clean(JSON.stringify(contextRecord)).toLowerCase();
  const isDogTag =
    /\bdog[\s_-]*tag\b/.test(contextText) ||
    /\bliving[\s_-]*dog[\s_-]*tag\b/.test(contextText);
  const experienceMode = clean(contextRecord.experienceMode).toUpperCase();
  const isIdentity = experienceMode === "IDENTITY";

  if (!isDogTag || !isIdentity) return "";

  return [
    "DOG TAG IDENTITY PRESENTATION:",
    "Preferences and stable character facts may become thought-like reactions, fixation, wanting, direct voice, tiny questions, callbacks, or playful self-presentation.",
    "Wanting is not happening. A love of walks does not mean a walk occurred. A love of bacon does not mean bacon is present.",
    "Do not add species clichés, body actions, associated settings, or stereotypical pet imagery.",
    "The viewer should meet the subject through supplied truths, not hear a profile summary.",
  ].join("\n");
}

function normalizeRole(value: unknown, index: number, total: number): AuthorBeatRole {
  const role = clean(value).toUpperCase();
  if (role === "HOOK" || role === "BUILD" || role === "TURN" || role === "PAYOFF") {
    return role;
  }
  if (index === 0) return "HOOK";
  if (index === total - 1) return "PAYOFF";
  return "BUILD";
}

function normalizePlan(
  value: Record<string, unknown> | undefined,
  allowedEventIds: Set<string>,
): AuthorSemanticPlan | undefined {
  const rawBeats = Array.isArray(value?.beats) ? value!.beats : [];
  const beats: AuthorSemanticBeat[] = [];

  for (const [index, raw] of rawBeats.entries()) {
    if (!raw || typeof raw !== "object") continue;
    const record = raw as Record<string, unknown>;
    const eventIds = Array.isArray(record.eventIds)
      ? unique(
          record.eventIds
            .filter((id): id is string => typeof id === "string")
            .filter((id) => allowedEventIds.has(id)),
        )
      : [];

    if (!eventIds.length) continue;

    beats.push({
      order: beats.length + 1,
      role: normalizeRole(record.role, index, rawBeats.length),
      eventIds,
      attention: clean(record.attention),
      change: clean(record.change),
    });
  }

  if (!beats.length) return undefined;

  return {
    thesis: clean(value?.thesis),
    beats: beats.slice(0, 6),
  };
}

function fallbackPlan(
  events: readonly AuthorCreativeEvent[],
  discovery: AuthorCreativeDiscovery,
): AuthorSemanticPlan {
  const selected = new Set(discovery.selected.evidenceEventIds);
  const preferred = events.filter((event) => selected.has(event.id));
  const source = preferred.length ? preferred : [...events];
  const limited = source.slice(0, Math.min(5, source.length));

  return {
    thesis:
      discovery.selected.id === "reality-direct"
        ? "Use supplied reality directly."
        : discovery.selected.perception || discovery.selected.relationship,
    beats: limited.map((event, index) => ({
      order: index + 1,
      role:
        index === 0
          ? "HOOK"
          : index === limited.length - 1
            ? "PAYOFF"
            : "BUILD",
      eventIds: [event.id],
      attention: "Make this supplied evidence felt without adding a new event.",
      change: event.text,
    })),
  };
}

function beatKind(role: AuthorBeatRole, index: number, total: number): AuthorScene["kind"] {
  if (role === "HOOK" || index === 0) return "hook";
  if (role === "PAYOFF" || index === total - 1) return "payoff";
  if (role === "TURN") return "turn";
  return "line";
}

function variantScore(
  text: string,
  beatFacts: readonly string[],
  semanticAuthority: readonly string[],
  subject: string,
  prior: readonly string[],
): { accepted: boolean; score: number; reasons: string[] } {
  const policy = evaluateAuthorCut(text, {
    subject,
    facts: beatFacts,
    semanticAuthority,
  });

  if (!policy.accepted) {
    return { accepted: false, score: 0, reasons: policy.reasons };
  }

  const normalized = clean(text).toLowerCase();
  const repeated = prior.some((value) => clean(value).toLowerCase() === normalized);
  const score = Math.max(0, policy.score - (repeated ? 0.35 : 0));

  return {
    accepted: !repeated,
    score,
    reasons: repeated ? ["repetition"] : [],
  };
}

function lockPlanToApprovedMeaning(
  plan: AuthorSemanticPlan,
  events: readonly AuthorCreativeEvent[],
  discovery: AuthorCreativeDiscovery,
): AuthorSemanticPlan {
  const selected = discovery.selected;
  const approvedMeaning = clean(selected.perception || selected.relationship);
  const approvedRelation = clean(selected.relationship);
  const realityDirect = clean(selected.id).toLowerCase() === "reality-direct";

  if (realityDirect) {
    return {
      thesis: "Use supplied reality directly.",
      beats: plan.beats.map((beat) => ({
        ...beat,
        attention: beat.eventIds
          .map((id) => events.find((event) => event.id === id)?.text ?? "")
          .map(clean)
          .filter(Boolean)
          .join(" | "),
        change: "Advance only supplied reality; do not add a hidden explanation.",
      })),
    };
  }

  const authorizedEventIds = new Set(
    selected.evidenceEventIds.map(clean).filter(Boolean),
  );

  const scopedBeats = plan.beats
    .map((beat) => ({
      ...beat,
      eventIds: beat.eventIds.filter((id) => authorizedEventIds.has(clean(id))),
    }))
    .filter((beat) => beat.eventIds.length > 0);

  const beats = scopedBeats.length
    ? scopedBeats
    : fallbackPlan(
        events.filter((event) => authorizedEventIds.has(clean(event.id))),
        discovery,
      ).beats;

  return {
    thesis: approvedMeaning || approvedRelation || "Approved grounded perception.",
    beats: beats.map((beat, index) => {
      const isFirst = index === 0;
      const isLast = index === beats.length - 1;
      const attention = beat.eventIds
        .map((id) => events.find((event) => event.id === id)?.text ?? "")
        .map(clean)
        .filter(Boolean)
        .join(" | ");

      const change = beats.length === 1
        ? approvedMeaning || approvedRelation || "Realize this supplied evidence."
        : isFirst
          ? "Establish only this beat's supplied evidence. Do not import later evidence or state the full relation yet."
          : isLast
            ? approvedMeaning || approvedRelation || "Land the approved relation using only this beat and prior established evidence."
            : "Advance the approved relation using only this beat and already-established prior evidence. Do not import later evidence.";

      return {
        ...beat,
        order: index + 1,
        attention,
        change,
      };
    }),
  };
}

function safeFallbackText(
  beat: AuthorSemanticBeat,
  events: readonly AuthorCreativeEvent[],
): string {
  return (
    beat.eventIds
      .map((id) => events.find((event) => event.id === id)?.text ?? "")
      .map(clean)
      .find(Boolean) ?? ""
  );
}

export async function createAuthorExperience(input: {
  subject: string;
  suppliedReality: readonly AuthorCreativeEvent[];
  creativeDiscovery: AuthorCreativeDiscovery;
  memory?: readonly string[];
  domainContext?: AuthorDomainContext;
}): Promise<{
  scenes: Array<AuthorScene & { sourceEventIds: string[] }>;
  model: string;
  modelCalls: number;
  diagnostics: {
    plan: AuthorSemanticPlan;
    variantsByBeat: Array<{ order: number; variants: string[] }>;
    choices: Array<{
      order: number;
      beat: AuthorSemanticBeat;
      beatFacts: string[];
      candidates: Array<{ text: string; accepted: boolean; score: number; reasons: string[] }>;
      selected: string;
    }>;
  };
}> {
  const allowedEventIds = new Set(input.suppliedReality.map((event) => event.id));
  const presentationContext = presentationAffordance(input.domainContext);
  const contextRecord = (input.domainContext ?? {}) as Record<string, unknown>;
  const experienceMode = clean(contextRecord.experienceMode).toUpperCase();
  const selected = input.creativeDiscovery.selected;
  const realityDirect = clean(selected.id).toLowerCase() === "reality-direct";
  const selectedEvidence = input.suppliedReality.filter((event) =>
    selected.evidenceEventIds.includes(event.id),
  );
  const useDeterministicSparsePlan =
    selectedEvidence.length > 0 && selectedEvidence.length <= 3;

  const planResult = useDeterministicSparsePlan
    ? {
        text: "",
        model: "deterministic-sparse-plan",
      }
    : await localModelGenerate(
    [
      {
        role: "system",
        content: [
          "You are QRE Bare Author.",
          "You sequence an already-approved semantic opportunity. You do NOT invent a second thesis and you do NOT write final viewer-facing copy.",
          "Reality is fixed. Interpretation is free.",
          "CREATIVE_DISCOVERY is an interpretive opportunity, never factual evidence.",
          "Build 2 to 5 useful beats from supplied reality. Facts may disappear, fuse, or support the same beat.",
          "Each beat must cite the event IDs that authorize it.",
          "attention should point at supplied evidence, not invent psychology.",
          "change must stay inside the approved CREATIVE_DISCOVERY perception/relationship. Do not introduce a new emotional state, motive, identity claim, acceptance, rebellion, autonomy, vulnerability, surrender, or causal explanation unless that exact meaning is already supplied or explicitly approved upstream.",
          "Do not turn chronology into causality, action into motive, attempt into success, emotion into body behavior, or context into hidden history.",
          "Do not add scenery, weather, lighting, body parts, sensory details, people, places, objects, dialogue, outcomes, or physical actions.",
          "A perceptual frame may create status, absurdity, ceremony, tension, intimacy, contrast, implication, or character without claiming that frame literally happened.",
          "Prefer the distinctive supplied object/action/tension over a generic before-and-after emotional arc.",
          "Do not write the final lines. Mouth will do that later.",
          ...(presentationContext ? [presentationContext] : []),
        ].join("\n"),
      },
      {
        role: "user",
        content: JSON.stringify({
          SUBJECT: input.subject,
          SUPPLIED_REALITY: input.suppliedReality,
          CREATIVE_DISCOVERY: {
            selected,
            experienceShape: input.creativeDiscovery.experienceShape,
          },
          EXPERIENCE_MODE: experienceMode || undefined,
          instruction: realityDirect
            ? "No hidden thesis has been approved. Build the strongest factual/perceptual movement available directly from the supplied events without inventing a hidden explanation."
            : "Use the selected perception as a framing opportunity, but make every beat depend on supplied event IDs. Preserve creative perception while removing any unsupported literal premise.",
        }),
      },
    ],
    "json",
    {
      numPredict: 620,
      temperature: 0.5,
      jsonSchema: {
        type: "object",
        additionalProperties: false,
        required: ["thesis", "beats"],
        properties: {
          thesis: { type: "string", maxLength: 180 },
          beats: {
            type: "array",
            minItems: 1,
            maxItems: 6,
            items: {
              type: "object",
              additionalProperties: false,
              required: ["order", "role", "eventIds", "attention", "change"],
              properties: {
                order: { type: "integer", minimum: 1, maximum: 6 },
                role: { type: "string", enum: ["HOOK", "BUILD", "TURN", "PAYOFF"] },
                eventIds: {
                  type: "array",
                  minItems: 1,
                  maxItems: 32,
                  items: { type: "string", maxLength: 64 },
                },
                attention: { type: "string", maxLength: 180 },
                change: { type: "string", maxLength: 180 },
              },
            },
          },
        },
      },
    },
  );

  const rawPlan = useDeterministicSparsePlan
    ? fallbackPlan(selectedEvidence, input.creativeDiscovery)
    : normalizePlan(parseJson(planResult.text), allowedEventIds) ??
      fallbackPlan(input.suppliedReality, input.creativeDiscovery);

  const plan = lockPlanToApprovedMeaning(
    rawPlan,
    input.suppliedReality,
    input.creativeDiscovery,
  );

  debug("BARE-AUTHOR-PLAN", {
    mode: useDeterministicSparsePlan ? "DETERMINISTIC_SPARSE" : "MODEL_STRUCTURE",
    raw: useDeterministicSparsePlan ? "SKIPPED_MODEL_PLAN" : planResult.text,
    selectedPlan: plan,
  });

  const mouthResult = await localModelGenerate(
    [
      {
        role: "system",
        content: [
          "You are QRE Mouth.",
          "The Author already chose the semantic beats. Do not re-plan the story and do not invent a second meaning.",
          "SEMANTIC AUTHORITY IS BEAT-SCOPED: a beat may use only its semanticMove plus evidence already established by earlier beats. Never pull a later beat's fact, reaction, payoff, or relation backward into an earlier cut.",
          "Generate four radically different short realizations for every approved beat.",
          "Most candidates should be 2 to 7 words. A tiny one-word attitude beat is allowed when it lands.",
          "Concrete reality comes ONLY from the beat's supplied event labels.",
          "Do not invent scenery, weather, light, temperature, body parts, gestures, sensory details, objects, people, places, causes, motives, outcomes, or successful completion.",
          "An attempt remains an attempt. Do not turn trying into freedom, escape, removal, victory, or success.",
          "An emotion/state does not authorize wagging, smiling, trembling, shaking, jumping, posture, heartbeat, or another bodily manifestation.",
          "Creative freedom is high for phrasing: implication, attitude, metaphor, personification, status, understatement, absurd seriousness, compressed voice, callback, and recontextualization.",
          "Use the supplied material as the cast. Do not replace it with generic atmosphere.",
          "Prefer source-specific cleverness over prettiness.",
          "Do not explain the joke or meaning.",
          "Do not mention receipts, prompts, models, beats, grounding, Author, Mouth, viewers, or internal process.",
          ...(presentationContext ? [presentationContext] : []),
        ].join("\n"),
      },
      {
        role: "user",
        content: JSON.stringify({
          SUBJECT: input.subject,
          SUPPLIED_REALITY: input.suppliedReality,
          APPROVED_THESIS: plan.thesis,
          APPROVED_BEATS: plan.beats.map((beat, index) => ({
            order: beat.order,
            role: beat.role,
            eventIds: beat.eventIds,
            attentionEvidence: beat.attention,
            semanticMove: beat.change,
            mayUseFullRelation: index === plan.beats.length - 1,
          })),
          CREATIVE_OPPORTUNITY: selected.perception,
          RELATION: selected.relationship,
          instruction:
            "Return four candidate lines per beat. The semantic plan controls meaning; the supplied event IDs control factual reality.",
        }),
      },
    ],
    "json",
    {
      numPredict: 1050,
      temperature: 0.78,
      jsonSchema: {
        type: "object",
        additionalProperties: false,
        required: ["variantsByBeat"],
        properties: {
          variantsByBeat: {
            type: "array",
            minItems: plan.beats.length,
            maxItems: plan.beats.length,
            items: {
              type: "object",
              additionalProperties: false,
              required: ["order", "variants"],
              properties: {
                order: { type: "integer", minimum: 1, maximum: 6 },
                variants: {
                  type: "array",
                  minItems: 4,
                  maxItems: 4,
                  items: { type: "string", maxLength: 120 },
                },
              },
            },
          },
        },
      },
    },
  );

  debug("MOUTH-CANDIDATES", mouthResult.text);

  const parsedMouth = parseJson(mouthResult.text);
  const rawVariants = Array.isArray(parsedMouth?.variantsByBeat)
    ? parsedMouth!.variantsByBeat
    : [];

  const variantsByOrder = new Map<number, string[]>();

  for (const raw of rawVariants) {
    if (!raw || typeof raw !== "object") continue;
    const record = raw as Record<string, unknown>;
    const order = Number(record.order);
    const variants = Array.isArray(record.variants)
      ? unique(
          record.variants
            .filter((value): value is string => typeof value === "string")
            .map(clean)
            .filter(Boolean),
        ).slice(0, 4)
      : [];

    if (Number.isInteger(order) && variants.length) {
      variantsByOrder.set(order, variants);
    }
  }

  const prior: string[] = [];
  const scenes: Array<AuthorScene & { sourceEventIds: string[] }> = [];
  const choices: Array<{
    order: number;
    beat: AuthorSemanticBeat;
    beatFacts: string[];
    candidates: Array<{ text: string; accepted: boolean; score: number; reasons: string[] }>;
    selected: string;
  }> = [];

  for (const [index, beat] of plan.beats.entries()) {
    const beatFacts = beat.eventIds
      .map((id) => input.suppliedReality.find((event) => event.id === id)?.text ?? "")
      .map(clean)
      .filter(Boolean);

    const evaluated = (variantsByOrder.get(beat.order) ?? [])
      .map((text) => ({
        text,
        ...variantScore(
          text,
          beatFacts,
          [beat.change].map(clean).filter(Boolean),
          input.subject,
          prior,
        ),
      }));

    const ranked = evaluated
      .filter((candidate) => candidate.accepted)
      .sort((a, b) => b.score - a.score);

    const selectedText = ranked[0]?.text ?? safeFallbackText(beat, input.suppliedReality);

    debug(`MOUTH-BEAT-${beat.order}-CHOICE`, {
      beat,
      beatFacts,
      candidates: evaluated,
      selected: selectedText || "FACT-FALLBACK",
    });

    choices.push({
      order: beat.order,
      beat,
      beatFacts,
      candidates: evaluated,
      selected: selectedText,
    });

    const text = selectedText;
    if (!text) continue;

    scenes.push({
      text,
      kind: beatKind(beat.role, index, plan.beats.length),
      sourceEventIds: beat.eventIds,
    });
    prior.push(text);
  }

  return {
    scenes,
    model: mouthResult.model || planResult.model,
    modelCalls: useDeterministicSparsePlan ? 1 : 2,
    diagnostics: {
      plan,
      variantsByBeat: [...variantsByOrder.entries()]
        .sort(([a], [b]) => a - b)
        .map(([order, variants]) => ({ order, variants })),
      choices,
    },
  };
}
