import type {
  AuthorBrainTruth,
  AuthorScene,
  SequencePlay,
} from "@qre/contracts";
import { localModelGenerate } from "./localModelRuntime.js";
import {
  mouthCraftSystem,
  mouthCraftUser,
  mouthQualityPenalty,
} from "./authorMouthCraft.js";
import { critiqueMouthCandidates } from "./authorMouthCritic.js";
import {
  groundAuthorBeat,
  type GroundedBeat,
} from "./authorBeatTruthGate.js";

const MAX_REVISION_ATTEMPTS = 1;

const clean = (value: unknown): string =>
  String(value ?? "").replace(/\s+/g, " ").trim();

function parseTexts(raw: string): string[] {
  const text = clean(raw)
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();

  if (!text) return [];

  try {
    const value = JSON.parse(text) as {
      texts?: unknown;
      text?: unknown;
      candidates?: unknown;
    };

    if (Array.isArray(value.texts)) {
      return value.texts
        .map(clean)
        .filter(Boolean)
        .slice(0, 2);
    }

    if (Array.isArray(value.candidates)) {
      return value.candidates
        .map(clean)
        .filter(Boolean)
        .slice(0, 2);
    }

    if (typeof value.text === "string") {
      return [clean(value.text)];
    }

    return [];
  } catch {
    return [];
  }
}

function sourceTokens(input: AuthorBrainTruth): Set<string> {
  const source = [
    input.subject ?? "",
    ...input.facts,
    ...(input.sourceMoments ?? []),
    ...(input.memoryContext ?? []),
  ].join(" ");

  return new Set(
    source
      .toLowerCase()
      .split(/[^a-z0-9'-]+/i)
      .filter((word) => word.length >= 4),
  );
}

function tokenSet(value: string): Set<string> {
  return new Set(
    value
      .toLowerCase()
      .split(/[^a-z0-9'-]+/i)
      .filter((word) => word.length >= 4),
  );
}

function unsupportedPronounPenalty(
  text: string,
  input: AuthorBrainTruth,
): number {
  const source = [
    input.subject ?? "",
    ...input.facts,
    ...(input.sourceMoments ?? []),
  ]
    .join(" ")
    .toLowerCase();

  if (
    /\bmale\b|\bman\b|\bhe\b|\bhis\b/.test(source) &&
    /\b(?:she|her|hers)\b/i.test(text)
  ) {
    return 0.5;
  }

  if (
    /\bfemale\b|\bwoman\b|\bshe\b|\bher\b/.test(source) &&
    /\b(?:he|him|his)\b/i.test(text)
  ) {
    return 0.5;
  }

  return 0;
}

function unsupportedConcretePenalty(
  text: string,
  input: AuthorBrainTruth,
): number {
  const valueTokens = tokenSet(text);
  const sourceTokensSet = sourceTokens(input);

  let penalty = 0;

  const unsupportedPhysical = new Set([
    "home",
    "room",
    "house",
    "door",
    "grandma",
    "grandmother",
    "clubhouse",
    "sunset",
    "sunrise",
    "golden",
    "light",
    "lights",
    "rain",
    "street",
    "car",
    "chair",
    "table",
    "floor",
    "garden",
    "park",
    "school",
    "suit",
    "fashion",
    "hair",
    "pocket",
    "feet",
    "foot",
    "hands",
    "eyes",
    "bed",
    "yard",
    "outside",
    "inside",
    "everyone",
    "nobody",
    "disco",
    "roar",
    "sparkle",
    "sparkles",
    "twirl",
    "twirls",
    "prance",
    "prances",
    "pranced",
    "shadow",
    "shadows",
    "moonlight",
    "moon",
    "sunlight",
    "fading",
    "glow",
    "glows",
    "glowing",
    "whisper",
    "whispers",
    "whispered",
    "sweat",
    "tears",
    "tear",
    "smile",
    "smiles",
    "grin",
    "grins",
    "laugh",
    "laughs",
    "laughter",
    "music",
    "melody",
    "sound",
    "sounds",
    "bubbled",
    "bubble",
    "ripples",
    "ripple",
    "towel",
    "brow",
    "secret",
    "secrets",
    "mystery",
    "clue",
    "clues",
    "ghostly",
    "ominous",
    "ominously",
    "boot",
    "boots",
    "footsteps",
    "steps",
    "audience",
    "crowd",
    "altar",
    "wedding",
    "ceremony",
    "camera",
    "shot",
    "focus",
    "slow-motion",
    "yellowed",
    "faded",
    "finger",
    "fingers",
    "record-scratch",
    "scratch",
    "scratchy",
    "dawn",
    "dusk",
  ]);

  for (const word of unsupportedPhysical) {
    if (
      valueTokens.has(word) &&
      !sourceTokensSet.has(word)
    ) {
      penalty += 0.25;
    }
  }

  if (
    /\b(?:boy|girl|man|woman|male|female|gender|gender reveal)\b/i.test(
      text,
    ) &&
    !/\b(?:male|female|man|woman|boy|girl)\b/i.test(
      [input.subject ?? "", ...input.facts].join(" "),
    )
  ) {
    penalty += 0.35;
  }

  if (
    /\b(?:caught|catching|surprised|surprise|shocked|stared|staring|watched|watching|laughed|laughing|clapped|cheered|cried|crying)\b/i.test(
      text,
    ) &&
    !/\b(?:caught|catching|surprised|surprise|shocked|stared|staring|watched|watching|laughed|laughing|clapped|cheered|cried|crying)\b/i.test(
      [
        input.subject ?? "",
        ...input.facts,
        ...(input.sourceMoments ?? []),
      ].join(" "),
    )
  ) {
    penalty += 0.35;
  }

  return Math.min(1, penalty);
}

function deterministicPenalty(
  text: string,
  input: AuthorBrainTruth,
): number {
  return (
    mouthQualityPenalty(text) +
    unsupportedPronounPenalty(text, input) +
    unsupportedConcretePenalty(text, input)
  );
}

function candidateDirective(
  index: number,
): string {
  return index === 0
    ? "Clean, sharp, source-specific. Concrete first, then a tiny clever turn."
    : "Stranger, funnier, more compressed. Use a collision, double meaning, reversal, or sly status turn from the supplied details. Do not invent a physical event.";
}

function safeFallback(
  beat: GroundedBeat,
  subject?: string,
): string {
  const evidence = beat.approvedEvidence
    .slice(0, 6)
    .filter(Boolean);

  if (subject && evidence.length) {
    const withoutSubject = evidence.filter(
      (item) =>
        item.toLowerCase() !== subject.toLowerCase(),
    );

    if (withoutSubject.length) {
      return `${subject}: ${withoutSubject[0]}.`;
    }
  }

  if (evidence.length) {
    return `${evidence[0]}.`;
  }

  return "The approved evidence holds.";
}

function buildCandidateUserContent(
  input: AuthorBrainTruth,
  beat: Record<string, unknown>,
): string {
  return mouthCraftUser({
    prompt: input.prompt,
    lens: input.lens,
    subject: input.subject,
    subjectTruth: input.subjectTruth,
    facts: input.facts,
    moments: input.sourceMoments ?? [],
    memory: input.memoryContext ?? [],
    trajectory: input.trajectory ?? [],
    beats: [beat],
  });
}

function buildCandidateSystem(
  risk: string,
): string {
  return `${mouthCraftSystem(risk)}
QRE'S THEATRICAL MOUTH.

The movie, sequence, and beat are already approved.
The beat has already passed through QRE's Truth Gate.

SOURCE BOUNDARY:
Only approvedEvidence may become a concrete factual claim.
creativeOpportunity is a relationship between supplied details, not a factual event.
forbiddenClaims must not be realized.

CREATIVE FREEDOM:
A line may use metaphor, implication, wordplay, status language, juxtaposition, personification, double meaning, understatement, or comic framing.
Those are allowed when they reinterpret supplied reality rather than inventing a new physical event.

HARD FACTUAL BAN:
Do not invent a new event, setting, action, person, dialogue, outcome, weather, lighting, time, location, body position, wardrobe placement, object, sound, crowd reaction, or camera direction.

SUBJECT CONTINUITY:
After the subject is established, omission is preferred unless repeating the name itself makes the line hit harder.

OUTPUT:
Return exactly two alternative lines for the same beat.
Each line must be 3-10 words.
The alternatives should be materially different.
Return JSON exactly:
{"texts":["line one","line two"]}`;
}

function buildRevisionSystem(
  risk: string,
): string {
  return `${mouthCraftSystem(risk)}
QRE'S THEATRICAL MOUTH — REVISION.

Take the supplied rejected candidate and repair it.
Keep its strongest creative idea.
Remove unsupported physical reality.
Do not turn it into a generic summary.
Do not merely paraphrase the evidence.

Return exactly one revised line, 3-10 words, as:
{"text":"revised line"}`;
}

function buildRevisionUserContent(
  input: AuthorBrainTruth,
  beat: Record<string, unknown>,
  candidate: string,
  repair: string,
): string {
  return JSON.stringify({
    subject: input.subject ?? "",
    suppliedEvidence: [
      ...input.facts,
      ...(input.sourceMoments ?? []),
      ...(input.memoryContext ?? []),
    ],
    groundedBeat: beat,
    rejectedCandidate: candidate,
    criticRepair: repair,
  });
}

/**
 * Evidence-first Monster Mouth.
 *
 * Brain chooses the movie and beats.
 * Truth Gate licenses the reality.
 * Mouth generates competing realizations.
 * Critic judges them.
 *
 * The important performance property is deliberate call bounding:
 *
 *   1 truth-gate call
 *   1 batched candidate call
 *   1 critic call
 *   max 1 revision call
 *
 * The model is never allowed to recursively explode into candidate x retry
 * fan-out.
 */
export async function polishAuthorScenes(
  input: AuthorBrainTruth,
  sequence: SequencePlay,
  risk = "playful",
): Promise<{
  scenes: AuthorScene[];
  texts: string[];
  rejected: number;
  retries: number;
  fallbacks: number;
}> {
  const chosenTexts: string[] = [];

  let totalRetries = 0;
  let fallbackCount = 0;

  for (const cut of sequence.cuts) {
    const rawBeat = {
      order: cut.order,
      role: cut.role,
      gainKind: cut.gainKind ?? "discovery",
      change: cut.informationGain,
      frontier:
        cut.momentum?.after.informationFrontier?.frontier ??
        "",
      nextNeed: cut.nextPromise ?? "",
      necessity: cut.necessity?.reason ?? "",
    };

    const grounded = await groundAuthorBeat({
      subject: input.subject,
      facts: input.facts,
      moments: input.sourceMoments ?? [],
      memory: input.memoryContext ?? [],
      beat: rawBeat,
    });

    const beat: Record<string, unknown> = {
      ...grounded,
      candidateBoundary:
        "Only approvedEvidence may be asserted as concrete reality.",
      candidateDirective:
        "Generate two materially different realizations.",
    };

    let candidates: string[] = [];

    // CALL 1: one batched generation containing two alternatives.
    const candidateResult = await localModelGenerate(
      [
        {
          role: "system",
          content: buildCandidateSystem(risk),
        },
        {
          role: "user",
          content: buildCandidateUserContent(
            input,
            {
              ...beat,
              candidateDirective: [
                candidateDirective(0),
                candidateDirective(1),
              ].join("\n"),
            },
          ),
        },
      ],
      "json",
      {
        numPredict: 256,
        temperature: 0.86,
      },
    );

    candidates = parseTexts(candidateResult.text);

    // If the model returned only one line, keep it and let the critic judge it.
    if (candidates.length === 0) {
      candidates = [];
    }

    // CALL 2: one critic.
    const critic = await critiqueMouthCandidates({
      prompt: input.prompt,
      lens: input.lens,
      subject: input.subject,
      facts: input.facts,
      moments: input.sourceMoments ?? [],
      memory: input.memoryContext ?? [],
      beat,
      candidates,
      previousFailure: "",
    });

    let chosen: string | null = null;

    if (
      critic.decision === "accept" &&
      critic.bestIndex >= 0 &&
      critic.bestIndex < candidates.length
    ) {
      const candidate = candidates[critic.bestIndex];

      if (
        deterministicPenalty(candidate, input) < 0.25
      ) {
        chosen = candidate;
      }
    }

    // CALL 3: at most one revision.
    if (!chosen && candidates.length > 0) {
      const revisionSource =
        critic.bestIndex >= 0 &&
        critic.bestIndex < candidates.length
          ? candidates[critic.bestIndex]
          : candidates[0];

      const revisionResult =
        await localModelGenerate(
          [
            {
              role: "system",
              content:
                buildRevisionSystem(risk),
            },
            {
              role: "user",
              content: buildRevisionUserContent(
                input,
                beat,
                revisionSource,
                critic.repairDirective ||
                  critic.reason ||
                  "Make it more specific, punchy, and source-grounded.",
              ),
            },
          ],
          "json",
          {
            numPredict: 128,
            temperature: 0.78,
          },
        );

      const revision =
        parseTexts(revisionResult.text)[0] ??
        "";

      totalRetries += 1;

      if (
        revision &&
        deterministicPenalty(revision, input) < 0.25
      ) {
        chosen = revision;
      }
    }

    if (!chosen) {
      chosen = safeFallback(
        grounded,
        input.subject,
      );
      fallbackCount += 1;
    }

    chosenTexts.push(chosen);
  }

  const scenes: AuthorScene[] = [];

  for (
    let i = 0;
    i < sequence.cuts.length;
    i += 1
  ) {
    const text =
      chosenTexts[i] ||
      safeFallback(
        {
          order: sequence.cuts[i].order,
          role: sequence.cuts[i].role,
          gainKind:
            sequence.cuts[i].gainKind ??
            "discovery",
          approvedEvidence: [
            input.subject ?? "",
            ...input.facts,
          ].filter(Boolean),
          creativeOpportunity: "",
          forbiddenClaims: [],
          sourceBoundary: "",
        },
        input.subject,
      );

    scenes.push({
      text,
      kind:
        sequence.cuts[i].role === "hook"
          ? "hook"
          : sequence.cuts[i].role === "payoff"
            ? "payoff"
            : "line",
    });
  }

  return {
    scenes,
    texts: scenes.map(
      (scene) => scene.text,
    ),
    rejected: 0,
    retries: totalRetries,
    fallbacks: fallbackCount,
  };
}