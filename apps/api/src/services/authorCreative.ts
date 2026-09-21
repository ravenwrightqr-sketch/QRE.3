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
    "When multiple stable preferences are supplied together, synthesize their combination into character. Do not output one dressed-up line per preference. Let the viewer infer something about the subject that was not literally typed.",
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


function replayTokens(value: string): string[] {
  return clean(value)
    .toLowerCase()
    .split(/[^a-z0-9'’-]+/i)
    .map((token) => {
      if (token === "tried" || token === "tries" || token === "attempted" || token === "attempt") return "try";
      if (token === "removal" || token === "removed" || token === "removing") return "remove";
      if (token.length > 5 && token.endsWith("ing")) return token.slice(0, -3);
      if (token.length > 4 && token.endsWith("ed")) return token.slice(0, -2);
      if (token.length > 4 && token.endsWith("es")) return token.slice(0, -2);
      if (token.length > 3 && token.endsWith("s")) return token.slice(0, -1);
      return token;
    })
    .filter((token) =>
      token.length >= 3 &&
      !new Set(["the", "and", "for", "with", "from", "that", "this", "just", "was", "were", "got", "had", "has"]).has(token)
    );
}

function sourceReplayPenalty(text: string, beatFacts: readonly string[]): number {
  const candidate = replayTokens(text);
  if (!candidate.length) return 0;

  const source = new Set(replayTokens(beatFacts.join(" ")));
  const overlap = candidate.filter((token) => source.has(token)).length / candidate.length;

  if (overlap >= 0.8) return 0.18;
  if (overlap >= 0.6) return 0.12;
  if (overlap >= 0.4) return 0.06;
  return 0;
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
  const replayPenalty = sourceReplayPenalty(text, beatFacts);
  const score = Math.max(
    0,
    policy.score -
      (repeated ? 0.35 : 0) -
      replayPenalty,
  );

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
  const allowEvidenceCallback = discovery.experienceShape.some((hint) =>
    /callback|recurrence|repetition|echo/i.test(clean(hint)),
  );
  const seenEventIds = new Set<string>();
  const uniquePlanBeats = plan.beats
    .map((beat) => ({
      ...beat,
      eventIds: beat.eventIds.filter((id) => {
        const key = clean(id);
        if (allowEvidenceCallback) return true;
        if (seenEventIds.has(key)) return false;
        seenEventIds.add(key);
        return true;
      }),
    }))
    .filter((beat) => beat.eventIds.length > 0);
  const planWithUniqueEvidence = {
    ...plan,
    beats: uniquePlanBeats,
  };
  const approvedMeaning = clean(selected.perception || selected.relationship);
  const approvedRelation = clean(selected.relationship);
  const realityDirect = clean(selected.id).toLowerCase() === "reality-direct";

  if (realityDirect) {
    return {
      thesis: "Use supplied reality directly.",
      beats: planWithUniqueEvidence.beats.map((beat) => ({
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
    (
      discovery.playableEventIds.length
        ? discovery.playableEventIds
        : selected.evidenceEventIds
    ).map(clean).filter(Boolean),
  );

  const scopedBeats = planWithUniqueEvidence.beats
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

function memoryPayoffReplayPenalty(
  text: string,
  beatFacts: readonly string[],
  isMemoryMode: boolean,
  isFinalBeat: boolean,
  semanticMove: string,
): number {
  if (!isMemoryMode || !isFinalBeat || !clean(semanticMove)) return 0;
  const candidate = replayTokens(text);
  if (!candidate.length) return 0;
  const source = new Set(replayTokens(beatFacts.join(" ")));
  const overlap = candidate.filter((token) => source.has(token)).length / candidate.length;
  if (overlap >= 0.8) return 0.24;
  if (overlap >= 0.6) return 0.16;
  return 0;
}

type MemorySequenceCandidate = {
  variantIndex: number;
  lines: Array<{
    beat: AuthorSemanticBeat;
    beatFacts: string[];
    text: string;
    accepted: boolean;
    score: number;
    reasons: string[];
  }>;
  accepted: boolean;
  score: number;
  reasons: string[];
};

function scoreMemorySequence(
  variantIndex: number,
  plan: AuthorSemanticPlan,
  variantsByOrder: Map<number, string[]>,
  suppliedReality: readonly AuthorCreativeEvent[],
  subject: string,
): MemorySequenceCandidate {
  const prior: string[] = [];
  const lines = plan.beats.map((beat, index) => {
    const beatFacts = beat.eventIds
      .map((id) => suppliedReality.find((event) => event.id === id)?.text ?? "")
      .map(clean)
      .filter(Boolean);
    const text = clean(variantsByOrder.get(beat.order)?.[variantIndex] ?? "");
    const base = variantScore(
      text,
      beatFacts,
      [beat.change].map(clean).filter(Boolean),
      subject,
      prior,
    );
    const payoffPenalty = memoryPayoffReplayPenalty(
      text,
      beatFacts,
      true,
      index === plan.beats.length - 1,
      beat.change,
    );
    const line = {
      beat,
      beatFacts,
      text,
      ...base,
      score: Math.max(0, base.score - payoffPenalty),
      reasons: payoffPenalty > 0
        ? [...base.reasons, "memory-payoff-replay"]
        : base.reasons,
    };
    if (text) prior.push(text);
    return line;
  });

  const acceptedLines = lines.filter((line) => line.accepted && line.text);
  const completeness = plan.beats.length
    ? acceptedLines.length / plan.beats.length
    : 0;
  const meanScore = acceptedLines.length
    ? acceptedLines.reduce((sum, line) => sum + line.score, 0) / acceptedLines.length
    : 0;
  const normalizedLines = lines
    .map((line) => clean(line.text).toLowerCase())
    .filter(Boolean);
  const uniqueRatio = normalizedLines.length
    ? new Set(normalizedLines).size / normalizedLines.length
    : 0;
  const payoff = lines.length ? lines[lines.length - 1] : undefined;
  const payoffStrength = payoff?.accepted ? payoff.score : 0;
  const rejected = lines.length - acceptedLines.length;

  const score = Math.max(
    0,
    meanScore * 0.5 +
      completeness * 0.25 +
      payoffStrength * 0.2 +
      uniqueRatio * 0.05 -
      rejected * 0.2,
  );

  const reasons: string[] = [];
  if (completeness < 1) reasons.push("incomplete-sequence");
  if (uniqueRatio < 1) reasons.push("repeated-line");
  if ((payoff?.reasons ?? []).includes("memory-payoff-replay")) {
    reasons.push("weak-payoff-replay");
  }

  return {
    variantIndex,
    lines,
    accepted: completeness === 1,
    score: Number(score.toFixed(3)),
    reasons,
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
  const selected = input.creativeDiscovery.selected;
  const contextRecord = (input.domainContext ?? {}) as Record<string, unknown>;
  const experienceMode = clean(contextRecord.experienceMode).toUpperCase();
  const playableIds = new Set(
    (
      input.creativeDiscovery.playableEventIds.length
        ? input.creativeDiscovery.playableEventIds
        : selected.evidenceEventIds
    ).map(clean).filter(Boolean),
  );
  const selectedEvidence = input.suppliedReality.filter((event) =>
    playableIds.has(clean(event.id)),
  );
  const useDeterministicSparsePlan =
    selectedEvidence.length > 0 && selectedEvidence.length <= 3;
  const useIdentityClusterPlan =
    useDeterministicSparsePlan &&
    experienceMode === "IDENTITY" &&
    selectedEvidence.length > 1;
  const isMemoryMode = experienceMode === "MEMORY";

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
          "You are QRE Bare Author Structure Planner.",
          "Discovery already owns meaning. You own ONLY evidence grouping and sequence shape.",
          "Return 2 to 5 beats using only supplied authorized event IDs.",
          "You may fuse adjacent or tightly related evidence into one beat or omit evidence that does not need screen time.",
          "Do not write a thesis, interpretation, psychology, causality, motive, emotional explanation, or viewer-facing language.",
          "Do not invent or rename events. Output structure only.",
          "Use each evidence event ID at most once unless EXPERIENCE_SHAPE explicitly calls for callback, recurrence, repetition, or echo.",
          ...(presentationContext ? [presentationContext] : []),
        ].join("\n"),
      },
      {
        role: "user",
        content: JSON.stringify({
          SUBJECT: input.subject,
          AUTHORIZED_EVIDENCE: selectedEvidence,
          EXPERIENCE_SHAPE: input.creativeDiscovery.experienceShape,
          instruction:
            "Return only the structural beat sequence. Use authorized evidence IDs only. Group evidence when useful; do not explain meaning.",
        }),
      },
    ],
    "json",
    {
      numPredict: 260,
      temperature: 0.18,
      jsonSchema: {
        type: "object",
        additionalProperties: false,
        required: ["beats"],
        properties: {
          beats: {
            type: "array",
            minItems: 1,
            maxItems: 6,
            items: {
              type: "object",
              additionalProperties: false,
              required: ["order", "role", "eventIds"],
              properties: {
                order: { type: "integer", minimum: 1, maximum: 6 },
                role: { type: "string", enum: ["HOOK", "BUILD", "TURN", "PAYOFF"] },
                eventIds: {
                  type: "array",
                  minItems: 1,
                  maxItems: 32,
                  items: { type: "string", maxLength: 64 },
                },

              },
            },
          },
        },
      },
    },
  );

  const rawPlan = useIdentityClusterPlan
    ? {
        thesis: selected.perception || selected.relationship,
        beats: [{
          order: 1,
          role: "PAYOFF" as AuthorBeatRole,
          eventIds: selectedEvidence.map((event) => event.id),
          attention: selectedEvidence.map((event) => event.text).join(" | "),
          change: selected.perception || selected.relationship,
        }],
      }
    : useDeterministicSparsePlan
      ? fallbackPlan(selectedEvidence, input.creativeDiscovery)
      : normalizePlan(parseJson(planResult.text), allowedEventIds) ??
      fallbackPlan(input.suppliedReality, input.creativeDiscovery);

  const plan = lockPlanToApprovedMeaning(
    rawPlan,
    input.suppliedReality,
    input.creativeDiscovery,
  );

  debug("BARE-AUTHOR-PLAN", {
    mode: useIdentityClusterPlan
      ? "DETERMINISTIC_IDENTITY_CLUSTER"
      : useDeterministicSparsePlan
        ? "DETERMINISTIC_SPARSE"
        : "MODEL_STRUCTURE",
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
          "Do not add comparative duration or temporal compression unless supplied. Avoid words like brief, briefly, long, quickly, suddenly, promptly, instantly, finally, or still when the beat facts do not establish that timing relation.",
          "A stated duration is not a countdown or deadline. Do not say 'time's up', 'clock ran out', 'deadline', or imply a timer merely because a duration is supplied.",
          "Do not invent manner of movement. A supplied walk does not authorize ambled, trotted, bounded, dragged, hurried, strolled, or another gait/manner unless supplied.",
          "An emotion/state does not authorize wagging, smiling, trembling, shaking, jumping, posture, heartbeat, or another bodily manifestation.",
          "Creative freedom is high for phrasing: implication, attitude, metaphor, personification, status, understatement, absurd seriousness, compressed voice, callback, and recontextualization.",
          "Use the supplied material as the cast. Do not replace it with generic atmosphere.",
          "Prefer source-specific cleverness over prettiness.",
          ...(isMemoryMode ? [
            "MEMORY REALIZATION: these beats are parts of ONE remembered experience, not independent caption slots. Make the sequence accumulate meaning across cuts.",
            "Neutral encounters may become juxtaposition, texture, density, oddity, accumulation, contrast, or title-like framing, but do not turn that framing into a literal claim about the subject's internal state or behavior.",
            "TITLE-LIKE FRAMING VS MATERIAL CLAIM: 'Squirrelly distraction.' can function as playful framing of a supplied squirrel encounter; 'Milo was distracted by the squirrels.' asserts a real attentional state and requires support. Prefer the first kind of freedom when it helps.",
            "When a supplied fact is explicitly positive, negative, praised, criticized, liked, feared, or otherwise valenced, do not flatten away that valence merely to sound clever.",
            "The final beat is a payoff for the whole approved memory. If its local fact is a timestamp, duration, count, or other measurement, use it as material for the payoff rather than merely restating the measurement.",
            "Do not produce a final-beat candidate that is only a literal replay of the local fact when semanticMove asks you to land a broader approved relation.",
            "Across the whole sequence, prefer progression: establish -> enrich -> land. Do not make three interchangeable labels.",
            "WRITE FOUR COMPLETE PRODUCTIONS IN PARALLEL. Variant position is persistent across beats: variant 1 of every beat belongs to Production A; variant 2 belongs to Production B; variant 3 belongs to Production C; variant 4 belongs to Production D. Each production must read coherently from first cut to payoff.",
            "Give the four productions genuinely different creative approaches: A can lean bold figurative framing, B compressed attitude/voice, C recontextualization/status shift, D another strong sequence-aware conception. Do not make four near-synonymous productions.",
            "Within each production, later cuts should feel aware of what earlier cuts established. Build progression, contrast, callback, accumulation, or recontextualization instead of isolated labels.",
            "POSITIVE CREATIVE PATTERNS:",
            "SUPPLIED: saw a pigeon. STRONG TITLE-LIKE FRAMING: 'Unexpected management.' The phrase changes perception without claiming the pigeon literally managed anything.",
            "SUPPLIED: three friends arrived, then one brought cake. STRONG PROGRESSION: early cuts can establish the arrivals; the later cake cut can make the gathering feel newly significant without inventing why the cake came.",
            "SUPPLIED: a task lasted 42 minutes. WEAK PAYOFF: '42 minutes.' STRONGER PAYOFF BEHAVIOR: use the duration as weight, punctuation, scale, or recontextualization of what the earlier cuts already established without labeling it objectively long or short.",
            "SUPPLIED: someone was explicitly praised. Preserve the praise as positive evidence; do not flatten it into a neutral 'opinion'.",
            "Aim for the transformation pattern, not these exact words.",
            "Do not play safe merely because a fact is neutral. Neutral facts may still become funny, strange, ceremonial, suspicious, grand, tiny, absurdly official, or otherwise perceptually transformed as long as the transformation is clearly nonliteral and does not rewrite material reality.",
          ] : []),
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
          instruction: useIdentityClusterPlan
            ? "This is one IDENTITY character cluster, not a checklist. Return four short candidate realizations that synthesize the combination into character. Do not enumerate every supplied preference or simply restate them. The viewer should infer personality from the combination. Do not invent an event."
            : isMemoryMode
              ? "Return four complete candidate productions encoded as four variants per beat. Keep variant index aligned across every beat: all first variants form Production A, all second variants form Production B, all third variants form Production C, all fourth variants form Production D. Each production should establish -> enrich -> land. The final cut must land the approved memory relation using its local evidence plus already-established prior evidence. Keep factual reality inside supplied event IDs, but make each production feel authored rather than enumerated."
              : "Return four candidate lines per beat. The semantic plan controls meaning; the supplied event IDs control factual reality.",
        }),
      },
    ],
    "json",
    {
      numPredict: 1050,
      temperature: isMemoryMode ? 0.9 : 0.78,
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

  const scenes: Array<AuthorScene & { sourceEventIds: string[] }> = [];
  const choices: Array<{
    order: number;
    beat: AuthorSemanticBeat;
    beatFacts: string[];
    candidates: Array<{ text: string; accepted: boolean; score: number; reasons: string[] }>;
    selected: string;
  }> = [];

  if (isMemoryMode && plan.beats.length > 1) {
    const productions = [0, 1, 2, 3]
      .map((variantIndex) =>
        scoreMemorySequence(
          variantIndex,
          plan,
          variantsByOrder,
          input.suppliedReality,
          input.subject,
        ),
      )
      .sort((a, b) => {
        if (a.accepted !== b.accepted) return a.accepted ? -1 : 1;
        return b.score - a.score;
      });

    const winner = productions[0];

    debug("MEMORY-PRODUCTIONS", productions.map((production) => ({
      production: String.fromCharCode(65 + production.variantIndex),
      accepted: production.accepted,
      score: production.score,
      reasons: production.reasons,
      lines: production.lines.map((line) => line.text),
    })));

    for (const [index, beat] of plan.beats.entries()) {
      const beatFacts = beat.eventIds
        .map((id) => input.suppliedReality.find((event) => event.id === id)?.text ?? "")
        .map(clean)
        .filter(Boolean);

      const alternatives = productions.map((production) => {
        const line = production.lines[index];
        return {
          text: line?.text ?? "",
          accepted: line?.accepted ?? false,
          score: line?.score ?? 0,
          reasons: line?.reasons ?? ["missing-production-line"],
        };
      });

      const winnerLine = winner?.lines[index];
      const selectedText = winnerLine?.accepted && winnerLine.text
        ? winnerLine.text
        : alternatives
            .filter((candidate) => candidate.accepted)
            .sort((a, b) => b.score - a.score)[0]?.text ??
          safeFallbackText(beat, input.suppliedReality);

      debug(`MOUTH-BEAT-${beat.order}-CHOICE`, {
        beat,
        beatFacts,
        candidates: alternatives,
        selectedProduction: winner
          ? String.fromCharCode(65 + winner.variantIndex)
          : "NONE",
        selected: selectedText || "FACT-FALLBACK",
      });

      choices.push({
        order: beat.order,
        beat,
        beatFacts,
        candidates: alternatives,
        selected: selectedText,
      });

      if (!selectedText) continue;
      scenes.push({
        text: selectedText,
        kind: beatKind(beat.role, index, plan.beats.length),
        sourceEventIds: beat.eventIds,
      });
    }
  } else {
    const prior: string[] = [];

    for (const [index, beat] of plan.beats.entries()) {
      const beatFacts = beat.eventIds
        .map((id) => input.suppliedReality.find((event) => event.id === id)?.text ?? "")
        .map(clean)
        .filter(Boolean);

      const evaluated = (variantsByOrder.get(beat.order) ?? [])
        .map((text) => {
          const base = variantScore(
            text,
            beatFacts,
            [beat.change].map(clean).filter(Boolean),
            input.subject,
            prior,
          );
          const payoffPenalty = memoryPayoffReplayPenalty(
            text,
            beatFacts,
            isMemoryMode,
            index === plan.beats.length - 1,
            beat.change,
          );
          return {
            text,
            ...base,
            score: Math.max(0, base.score - payoffPenalty),
            reasons: payoffPenalty > 0
              ? [...base.reasons, "memory-payoff-replay"]
              : base.reasons,
          };
        });

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

      if (!selectedText) continue;

      scenes.push({
        text: selectedText,
        kind: beatKind(beat.role, index, plan.beats.length),
        sourceEventIds: beat.eventIds,
      });
      prior.push(selectedText);
    }
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
