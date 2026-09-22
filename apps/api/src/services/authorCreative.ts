import type { AuthorDomainContext, AuthorScene } from "@qre/contracts";
import { localModelGenerate } from "./localModelRuntime.js";
import type { AuthorCreativeDiscovery } from "./authorCreativeDiscovery.js";
import { evaluateAuthorCut } from "./authorCutFloor.js";

const clean = (value: unknown): string =>
  String(value ?? "").replace(/\s+/g, " ").trim();

const stripProductionLabel = (value: unknown): string =>
  clean(value).replace(/^[A-D]\s*:\s*/i, "").trim();

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

function enforceMemoryStructure(
  plan: AuthorSemanticPlan,
  selectedEvidence: readonly AuthorCreativeEvent[],
): AuthorSemanticPlan {
  if (
    selectedEvidence.length === 4 &&
    plan.beats.length === 3
  ) {
    const plannedIds = plan.beats.flatMap((beat) => beat.eventIds);
    const selectedIds = selectedEvidence.map((event) => event.id);
    const sameEvidenceSet =
      plannedIds.length === selectedIds.length &&
      new Set(plannedIds).size === selectedIds.length &&
      selectedIds.every((id) => plannedIds.includes(id));

    if (sameEvidenceSet) {
      return {
        ...plan,
        beats: selectedEvidence.map((event, index) => ({
          order: index + 1,
          role:
            index === 0
              ? "HOOK"
              : index === selectedEvidence.length - 1
                ? "PAYOFF"
                : index === selectedEvidence.length - 2
                  ? "TURN"
                  : "BUILD",
          eventIds: [event.id],
          attention: "",
          change: "",
        })),
      };
    }
  }

  if (selectedEvidence.length < 4) {
    return {
      ...plan,
      beats: plan.beats.map((beat, index) => ({
        ...beat,
        order: index + 1,
        role:
          index === 0
            ? "HOOK"
            : index === plan.beats.length - 1
              ? "PAYOFF"
              : beat.role === "TURN"
                ? "TURN"
                : "BUILD",
      })),
    };
  }

  const targetBeatCount = Math.min(
    4,
    Math.max(3, Math.ceil(selectedEvidence.length / 2)),
  );

  if (plan.beats.length >= 3) {
    return {
      ...plan,
      beats: plan.beats.map((beat, index) => ({
        ...beat,
        order: index + 1,
        role:
          index === 0
            ? "HOOK"
            : index === plan.beats.length - 1
              ? "PAYOFF"
              : beat.role === "TURN"
                ? "TURN"
                : "BUILD",
      })),
    };
  }

  const groups: string[][] = Array.from(
    { length: targetBeatCount },
    () => [],
  );

  selectedEvidence.forEach((event, index) => {
    const groupIndex = Math.min(
      targetBeatCount - 1,
      Math.floor(index * targetBeatCount / selectedEvidence.length),
    );
    groups[groupIndex].push(event.id);
  });

  return {
    ...plan,
    beats: groups
      .filter((eventIds) => eventIds.length > 0)
      .map((eventIds, index, all) => ({
        order: index + 1,
        role:
          index === 0
            ? "HOOK"
            : index === all.length - 1
              ? "PAYOFF"
              : "BUILD",
        eventIds,
        attention: "",
        change: "",
      })),
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

function temporalAnchorTokens(value: string): string[] {
  const text = clean(value).toLowerCase();
  const tokens = new Set<string>();

  for (const match of text.matchAll(/\b\d+(?:\.\d+)?\b/g)) {
    tokens.add(match[0]);
  }

  for (const match of text.matchAll(
    /\b(?:second|seconds|minute|minutes|hour|hours|day|days|week|weeks|month|months|year|years|morning|afternoon|evening|night|today|tomorrow|yesterday|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/g,
  )) {
    tokens.add(match[0]);
  }

  if (/\bnext\s+(?:day|week|month|year|morning|afternoon|evening|night)\b/.test(text)) {
    tokens.add("next");
  }
  if (/\b(?:again|returned|return|revisit|revisited|back)\b/.test(text)) {
    tokens.add("recurrence");
  }

  return [...tokens];
}

function quantitativeAnchorTokens(value: string): string[] {
  const text = clean(value).toLowerCase();
  const tokens = new Set<string>();
  const wordValues: Record<string, string> = {
    zero: "0",
    one: "1",
    two: "2",
    three: "3",
    four: "4",
    five: "5",
    six: "6",
    seven: "7",
    eight: "8",
    nine: "9",
    ten: "10",
    eleven: "11",
    twelve: "12",
    thirteen: "13",
    fourteen: "14",
    fifteen: "15",
    sixteen: "16",
    seventeen: "17",
    eighteen: "18",
    nineteen: "19",
    twenty: "20",
    pair: "2",
    couple: "2",
    double: "2",
    triple: "3",
    dozen: "12",
  };

  for (const match of text.matchAll(/\b\d+(?:\.\d+)?\b/g)) {
    tokens.add(match[0]);
  }

  for (const match of text.matchAll(
    /\b(?:zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|pair|couple|double|triple|dozen)\b/g,
  )) {
    const normalized = wordValues[match[0]];
    if (normalized) tokens.add(normalized);
  }

  return [...tokens];
}

function preservesSpecificQuantitativeAnchors(
  text: string,
  beatFacts: readonly string[],
): boolean {
  const sourceAnchors = quantitativeAnchorTokens(beatFacts.join(" "));
  if (!sourceAnchors.length) return true;

  const candidateAnchors = new Set(quantitativeAnchorTokens(text));
  return sourceAnchors.every((anchor) => candidateAnchors.has(anchor));
}

function temporalAnchorAdjustment(text: string, beatFacts: readonly string[]): number {
  const sourceAnchors = temporalAnchorTokens(beatFacts.join(" "));
  if (!sourceAnchors.length) return 0;

  const candidateAnchors = new Set(temporalAnchorTokens(text));
  const preserved = sourceAnchors.filter((anchor) => candidateAnchors.has(anchor));

  if (preserved.length === sourceAnchors.length) return 0.14;
  if (preserved.length > 0) return 0.04;
  return -0.22;
}

function hasSpecificTemporalAnchor(value: string): boolean {
  const text = clean(value).toLowerCase();
  return (
    /\b\d+(?:\.\d+)?\b/.test(text) ||
    /\b(?:second|seconds|minute|minutes|hour|hours|day|days|week|weeks|month|months|year|years|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/.test(text) ||
    /\bnext\s+(?:day|week|month|year|morning|afternoon|evening|night)\b/.test(text)
  );
}

function preservesSpecificTemporalAnchor(
  text: string,
  beatFacts: readonly string[],
): boolean {
  const sourceText = beatFacts.join(" ");
  if (!hasSpecificTemporalAnchor(sourceText)) return true;

  const sourceAnchors = temporalAnchorTokens(sourceText)
    .filter((anchor) => anchor !== "recurrence");
  const candidateAnchors = new Set(temporalAnchorTokens(text));

  return sourceAnchors.some((anchor) => candidateAnchors.has(anchor));
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
  const anchorAdjustment = temporalAnchorAdjustment(text, beatFacts);
  const score = Math.max(
    0,
    policy.score -
      (repeated ? 0.35 : 0) -
      replayPenalty +
      anchorAdjustment,
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

function ensurePostLockMemoryCanvas(
  plan: AuthorSemanticPlan,
  selectedEvidence: readonly AuthorCreativeEvent[],
): AuthorSemanticPlan {
  if (selectedEvidence.length < 4 || plan.beats.length >= 3) {
    return {
      ...plan,
      beats: plan.beats.map((beat, index, all) => ({
        ...beat,
        order: index + 1,
        role:
          index === 0
            ? "HOOK"
            : index === all.length - 1
              ? "PAYOFF"
              : beat.role === "TURN"
                ? "TURN"
                : "BUILD",
      })),
    };
  }

  const targetBeatCount = Math.min(
    4,
    Math.max(3, Math.ceil(selectedEvidence.length / 2)),
  );
  const groups: string[][] = Array.from({ length: targetBeatCount }, () => []);

  selectedEvidence.forEach((event, index) => {
    const groupIndex = Math.min(
      targetBeatCount - 1,
      Math.floor(index * targetBeatCount / selectedEvidence.length),
    );
    groups[groupIndex].push(event.id);
  });

  return {
    ...plan,
    beats: groups
      .filter((eventIds) => eventIds.length > 0)
      .map((eventIds, index, all) => ({
        order: index + 1,
        role:
          index === 0
            ? "HOOK"
            : index === all.length - 1
              ? "PAYOFF"
              : "BUILD",
        eventIds,
        attention: "",
        change: "",
      })),
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
    const dropsSpecificTimeAnchor =
      !preservesSpecificTemporalAnchor(text, beatFacts);
    const dropsSpecificQuantityAnchor =
      !preservesSpecificQuantitativeAnchors(text, beatFacts);
    const line = {
      beat,
      beatFacts,
      text,
      ...base,
      accepted:
        base.accepted &&
        !dropsSpecificTimeAnchor &&
        !dropsSpecificQuantityAnchor,
      score: Math.max(0, base.score - payoffPenalty),
      reasons: [
        ...base.reasons,
        ...(payoffPenalty > 0 ? ["memory-payoff-replay"] : []),
        ...(dropsSpecificTimeAnchor ? ["drops-specific-time-anchor"] : []),
        ...(dropsSpecificQuantityAnchor ? ["drops-specific-quantity-anchor"] : []),
      ],
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
  const payoffDropsSpecificTime = Boolean(
    payoff &&
    !preservesSpecificTemporalAnchor(payoff.text, payoff.beatFacts),
  );
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
  if (payoffDropsSpecificTime) {
    reasons.push("payoff-drops-specific-time-anchor");
  }

  return {
    variantIndex,
    lines,
    accepted: completeness === 1 && !payoffDropsSpecificTime,
    score: Number(score.toFixed(3)),
    reasons,
  };
}

async function repairNominatedMemoryProduction(input: {
  production: MemorySequenceCandidate;
  plan: AuthorSemanticPlan;
  suppliedReality: readonly AuthorCreativeEvent[];
  subject: string;
  thesis: string;
}): Promise<{
  replacements: Map<number, string>;
  model: string;
  modelCalls: number;
}> {
  const failed = input.production.lines
    .map((line, index) => ({ line, index }))
    .filter(({ line }) => !line.accepted || !clean(line.text));

  if (!failed.length) {
    return {
      replacements: new Map<number, string>(),
      model: "none",
      modelCalls: 0,
    };
  }

  const result = await localModelGenerate(
    [
      {
        role: "system",
        content: [
          "You are QRE Memory Production Repair.",
          "The creative conception has already been chosen. Preserve it.",
          "Repair ONLY the failed cuts. Do not rewrite successful cuts.",
          "Stay inside each failed beat's supplied evidence plus meaning already established by earlier successful cuts.",
          "Keep the production's voice, rhythm, attitude, and trajectory.",
          "Prefer a bold grounded transformation over literal replay.",
          "Preserve distinctive source anchors when useful.",
          "Exact supplied quantities are load-bearing anchors. Preserve every distinct supplied quantity recognizably; do not replace counts with generic plurality.",
          "Nonliteral title-like framing, metaphor, status, attitude, compression, and recontextualization are welcome.",
          "Do not add new actors, body parts, sensory details, scenery, actions, motives, causes, outcomes, or chronology.",
          "Do not carry an earlier emotional or physical state forward into a later event unless supplied reality explicitly establishes continuity. Use callback/recontextualization instead of asserting persistence.",
          "A repair should feel like the line the original production was trying to write, only grounded.",
          "Return one replacement for every failed beat and nothing else.",
        ].join("\n"),
      },
      {
        role: "user",
        content: JSON.stringify({
          SUBJECT: input.subject,
          APPROVED_THESIS: input.thesis,
          FULL_PRODUCTION: input.production.lines.map((line, index) => ({
            order: line.beat.order,
            text: line.text,
            accepted: line.accepted,
            reasons: line.reasons,
            suppliedEvidence: line.beatFacts,
            semanticMove: line.beat.change,
            keepExactly: line.accepted,
            priorLines: input.production.lines
              .slice(0, index)
              .map((prior) => prior.text)
              .filter(Boolean),
          })),
          FAILED_BEATS: failed.map(({ line }) => ({
            order: line.beat.order,
            rejectedText: line.text,
            reasons: line.reasons,
            suppliedEvidence: line.beatFacts,
            semanticMove: line.beat.change,
          })),
          instruction:
            "Repair only FAILED_BEATS. Keep the same production conception and creative energy. Return short viewer-facing replacements, normally 2-7 words.",
        }),
      },
    ],
    "json",
    {
      numPredict: Math.max(220, failed.length * 90),
      temperature: 0.72,
      jsonSchema: {
        type: "object",
        additionalProperties: false,
        required: ["repairs"],
        properties: {
          repairs: {
            type: "array",
            minItems: failed.length,
            maxItems: failed.length,
            items: {
              type: "object",
              additionalProperties: false,
              required: ["order", "text"],
              properties: {
                order: { type: "integer", minimum: 1, maximum: 6 },
                text: { type: "string", maxLength: 120 },
              },
            },
          },
        },
      },
    },
  );

  const parsed = parseJson(result.text);
  const rawRepairs = Array.isArray(parsed?.repairs) ? parsed.repairs : [];
  const failedOrders = new Set(failed.map(({ line }) => line.beat.order));
  const replacements = new Map<number, string>();

  for (const raw of rawRepairs) {
    if (!raw || typeof raw !== "object") continue;
    const record = raw as Record<string, unknown>;
    const order = Number(record.order);
    const text = clean(record.text);
    if (!Number.isInteger(order) || !failedOrders.has(order) || !text) continue;
    replacements.set(order, text);
  }

  return {
    replacements,
    model: result.model,
    modelCalls: 1,
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
          ...(isMemoryMode ? [
            "MEMORY STRUCTURE: give a substantial lived memory enough screen space to feel remembered, not summarized.",
            "When 4 or more authorized evidence events carry the selected memory, usually prefer 3 to 4 beats. Compress only when the grouping creates a stronger experience.",
            "When exactly 4 authorized events form a temporal progression with a distinct before-state, lived middle, after-state, and later recurrence/return, prefer 4 beats. Do not fuse the lived middle into the before-state merely to shorten the sequence.",
            "A supplied duration or substantial activity between states can deserve its own beat because it gives the later contrast weight; preserve it structurally without claiming it caused the later state.",
            "When authorized evidence contains an explicit supplied state contrast, preserve both sides of that contrast in the plan. Do not omit the later state merely because the causal explanation is unknown.",
            "When supplied recurrence or return contributes to the approved perception, preserve that recurrence as available payoff material.",
            "Avoid stuffing 3 or more distinct moments into one beat merely to shorten the sequence. Preserve room for setup, development, turn, and payoff.",
          ] : []),
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

  const structurallySafePlan = isMemoryMode
    ? enforceMemoryStructure(rawPlan, selectedEvidence)
    : rawPlan;

  const initiallyLockedPlan = lockPlanToApprovedMeaning(
    structurallySafePlan,
    input.suppliedReality,
    input.creativeDiscovery,
  );

  const postLockPlan = isMemoryMode
    ? ensurePostLockMemoryCanvas(initiallyLockedPlan, selectedEvidence)
    : initiallyLockedPlan;

  const plan = postLockPlan === initiallyLockedPlan
    ? initiallyLockedPlan
    : lockPlanToApprovedMeaning(
        postLockPlan,
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
    memoryStructureAdjusted:
      isMemoryMode &&
      (
        JSON.stringify(structurallySafePlan.beats.map((beat) => beat.eventIds)) !==
          JSON.stringify(rawPlan.beats.map((beat) => beat.eventIds)) ||
        JSON.stringify(plan.beats.map((beat) => beat.eventIds)) !==
          JSON.stringify(initiallyLockedPlan.beats.map((beat) => beat.eventIds))
      ),
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
            "UNIVERSAL AUTHOR LAW: Identity synthesizes simultaneous truths into character. Memory synthesizes accumulated truths into experience. Same Author intelligence; different temporal shape.",
            "MEMORY REALIZATION: these beats are parts of ONE remembered experience, not independent caption slots. Make the sequence accumulate meaning across cuts.",
            "The accumulated facts already created ONE approved memory perception upstream. Your job is to reveal that one perception through time, not to invent a new interpretation for each cut.",
            "Think of the supplied events the same way Identity treats multiple traits: raw material may fuse. A fact may become setup, texture, contrast, callback, or disappear from direct wording while still supporting the whole.",
            "Do not make each cut correspond mechanically to one input fact. Follow the approved production shape and let facts combine when that strengthens the whole experience.",
            "THINK PRODUCT, NOT LINES. The finished sequence is the product. Every cut is one component of that product and must earn its place by setting up, deepening, turning, or landing the SAME experience.",
            "A cut does not need to be impressive alone. It needs to make the surrounding cuts stronger. Prefer a sequence whose parts depend on each other over a stack of individually clever captions.",
            "Read each production vertically before choosing it: CUT 1 changes what CUT 2 means; CUT 2 changes what CUT 3 means; the last cut should make the earlier cuts feel more intentional in retrospect.",
            "Use restraint strategically. One cut may be simple so another can hit harder. Do not make every cut compete for attention.",
            "The viewer should feel one authored object unfolding through time, not several captions placed next to each other.",
            "OPERATIONAL/SERVICE MEMORIES: do not default to a ledger, checklist, work log, or receipt voice merely because the facts are tasks, counts, and timestamps. Exact anchors may remain visible, but the sequence still needs one perceptual treatment that accumulates across cuts.",
            "Avoid solving every beat as FACT + punctuation + completion label. At least some cuts should transform the supplied action, count, or timing rhetorically while staying materially true; preserve anchors without making the whole product read like status reporting.",
            "A service memory may feel precise, ceremonial, game-like, severe, playful, compact, or otherwise authored only when that treatment comes from the supplied sequence itself—not from invented worker psychology, unseen mess, difficulty, or client reaction.",
            "Neutral encounters may become juxtaposition, texture, density, oddity, accumulation, contrast, or title-like framing, but do not turn that framing into a literal claim about the subject's internal state or behavior.",
            "TITLE-LIKE FRAMING VS MATERIAL CLAIM: 'Squirrelly distraction.' can function as playful framing of a supplied squirrel encounter; 'Milo was distracted by the squirrels.' asserts a real attentional state and requires support. Prefer the first kind of freedom when it helps.",
            "When a supplied fact is explicitly positive, negative, praised, criticized, liked, feared, or otherwise valenced, do not flatten away that valence merely to sound clever.",
            "The final beat is a payoff for the whole approved memory. If its local fact is a timestamp, duration, count, or other measurement, use it as material for the payoff rather than merely restating the measurement.",
            "Do not produce a final-beat candidate that is only a literal replay of the local fact when semanticMove asks you to land a broader approved relation.",
            "Across the whole sequence, prefer progression: establish -> enrich -> land. Do not make three interchangeable labels.",
            "WRITE FOUR COMPLETE PRODUCTIONS IN PARALLEL. Variant position is persistent across beats: variant 1 of every beat belongs to Production A; variant 2 belongs to Production B; variant 3 belongs to Production C; variant 4 belongs to Production D. Each production must read coherently from first cut to payoff.",
            "Give the four productions genuinely different creative approaches: A can lean bold figurative framing, B compressed attitude/voice, C recontextualization/status shift, D another strong sequence-aware conception. Do not make four near-synonymous productions.",
            "Within each production, later cuts should feel aware of what earlier cuts established. Build progression, contrast, callback, accumulation, or recontextualization instead of isolated labels.",
            "PRESERVE DISTINCTIVE ANCHORS. A multi-event beat should not dissolve into generic atmosphere. Keep recognizable source-specific anchors—an animal, object, number, quoted evaluation, action, time, or other distinctive detail—unless the production has already established that anchor strongly enough for a clear callback.",
            "QUANTITATIVE/TIME ANCHORS ARE EXPENSIVE TO LOSE. If a supplied beat contains a specific duration, count, clock time, day, week, or other numeric/time marker and that marker materially distinguishes the memory, preserve it directly or transform it recognizably somewhere in the production. Do not replace 'two hours' with generic atmosphere.",
            "When a beat contains more than one explicit supplied quantity, preserve every distinct quantity recognizably in that beat's realization. Quantity may be phrased naturally or through an unambiguous equivalent such as pair/double, but do not collapse multiple counts into generic plurality.",
            "RECURRENCE PAYOFF SHOULD LAND THE SUPPLIED RETURN. When the final evidence is 'again', 'next week', 'returned', another visit, or equivalent recurrence, make that recurrence itself legible. Prefer a concrete callback to the supplied return over generic labels like 'pattern', 'cycle', 'seamless', or 'predictable'.",
            "If the recurrence includes a specific time anchor such as next week, three days later, Friday, or another supplied interval/date, keep that time anchor recognizably alive in the payoff. 'Again' alone is weaker when the supplied WHEN is part of what makes the return hit.",
            "The later return may make the earlier encounter feel newly significant in retrospect, but do not explain why the return happened.",
            "Specificity is fuel. Transform it; do not erase it.",
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
              ? "Return four complete candidate productions encoded as four variants per beat. Apply the universal law: MEMORY = accumulated truths -> one experience perception. Keep variant index aligned across every beat: all first variants form Production A, all second variants form Production B, all third variants form Production C, all fourth variants form Production D. Treat each production as one finished QRE object unfolding cut by cut, not as separate lines. The accumulated facts are shared raw material for the whole production, not one-fact-per-line assignments. Each cut should perform a different job in the same experience: establish, deepen, turn, or land. When supplied reality contains a before-state / lived middle / after-state / recurrence shape, preserve the shape and make the contrast felt without claiming the middle caused the after-state or the earlier encounter caused the return. Preserve distinctive source anchors while transforming them. If the memory supplies a specific duration/count/time marker that gives the middle its identity, keep that marker legible somewhere in the production. If the payoff is a supplied recurrence such as again/next week/return, make the return itself legible and let it retrospectively recontextualize the earlier cuts without inventing motive. The final cut must land the approved memory relation using its local evidence plus already-established prior evidence. Then nominate the strongest complete production by number 1-4 based on whole-product coherence, specificity, progression, surprise, payoff, and how alive it feels—not on whether every individual line sounds impressive. Keep factual reality inside supplied event IDs, but make each production feel authored rather than enumerated."
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
        required: isMemoryMode
          ? ["variantsByBeat", "selectedProduction", "selectionReason"]
          : ["variantsByBeat"],
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
          selectedProduction: { type: "integer", minimum: 1, maximum: 4 },
          selectionReason: { type: "string", maxLength: 220 },
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
            .map(stripProductionLabel)
            .filter(Boolean),
        ).slice(0, 4)
      : [];

    if (Number.isInteger(order) && variants.length) {
      variantsByOrder.set(order, variants);
    }
  }

  const scenes: Array<AuthorScene & { sourceEventIds: string[] }> = [];
  let memoryRepairModelCalls = 0;
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

    const nominatedProductionNumber = Number(parsedMouth?.selectedProduction);
    const nominatedAny = Number.isInteger(nominatedProductionNumber)
      ? productions.find(
          (production) =>
            production.variantIndex === nominatedProductionNumber - 1,
        )
      : undefined;

    let repairedNomination: MemorySequenceCandidate | undefined;

    if (nominatedAny && !nominatedAny.accepted) {
      const repair = await repairNominatedMemoryProduction({
        production: nominatedAny,
        plan,
        suppliedReality: input.suppliedReality,
        subject: input.subject,
        thesis: plan.thesis,
      });
      memoryRepairModelCalls += repair.modelCalls;

      if (repair.replacements.size) {
        const repairedVariantsByOrder = new Map<number, string[]>(
          [...variantsByOrder.entries()].map(([order, variants]) => [
            order,
            [...variants],
          ]),
        );

        for (const [order, replacement] of repair.replacements.entries()) {
          const variants = [...(repairedVariantsByOrder.get(order) ?? [])];
          while (variants.length < 4) variants.push("");
          variants[nominatedAny.variantIndex] = replacement;
          repairedVariantsByOrder.set(order, variants);
        }

        const rescored = scoreMemorySequence(
          nominatedAny.variantIndex,
          plan,
          repairedVariantsByOrder,
          input.suppliedReality,
          input.subject,
        );

        debug("MEMORY-PRODUCTION-REPAIR", {
          production: String.fromCharCode(65 + nominatedAny.variantIndex),
          before: nominatedAny.lines.map((line) => ({
            text: line.text,
            accepted: line.accepted,
            reasons: line.reasons,
          })),
          replacements: [...repair.replacements.entries()].map(([order, text]) => ({
            order,
            text,
          })),
          after: rescored.lines.map((line) => ({
            text: line.text,
            accepted: line.accepted,
            reasons: line.reasons,
          })),
          accepted: rescored.accepted,
          score: rescored.score,
        });

        if (rescored.accepted) {
          repairedNomination = rescored;
        }
      }
    }

    const nominatedProduction = nominatedAny?.accepted
      ? nominatedAny
      : repairedNomination;
    const winner = nominatedProduction ?? productions[0];

    debug("MEMORY-PRODUCTIONS", {
      modelNomination: Number.isInteger(nominatedProductionNumber)
        ? String.fromCharCode(64 + nominatedProductionNumber)
        : "NONE",
      modelSelectionReason: clean(parsedMouth?.selectionReason),
      winner: winner
        ? String.fromCharCode(65 + winner.variantIndex)
        : "NONE",
      productions: productions.map((production) => ({
      production: String.fromCharCode(65 + production.variantIndex),
      accepted: production.accepted,
      score: production.score,
      reasons: production.reasons,
        lines: production.lines.map((line) => line.text),
      })),
    });

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
    modelCalls: (useDeterministicSparsePlan ? 1 : 2) + memoryRepairModelCalls,
    diagnostics: {
      plan,
      variantsByBeat: [...variantsByOrder.entries()]
        .sort(([a], [b]) => a - b)
        .map(([order, variants]) => ({ order, variants })),
      choices,
    },
  };
}
