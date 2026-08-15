export type AuthorCognitionInput = {
  prompt: string;
  lens?: string;
  subject?: string;
  place?: string;
  facts: string[];
  sourceMoments: string[];
  memoryContext?: string[];
  priorScenes?: string[];
  round?: number;
};

export type AttentionCandidate = {
  strategy: string;
  reason: string;
  score: number;
};

export type AuthorCognitivePlan = {
  round: number;
  mode: "grounded" | "concept" | "living_memory" | "service" | "voice_first";
  subjectIdentity: string;
  permanentTruths: string[];
  currentEvidence: string[];
  contradictions: string[];
  attentionCandidates: AttentionCandidate[];
  chosenAttentionStrategy: string;
  operatorMix: string[];
  callbackTargets: string[];
  antiRepetitionRules: string[];
  sceneRules: string[];
  authorBrief: string[];
};

const STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "to", "of", "in", "on", "for", "with", "is", "are", "was", "were", "this", "that", "it", "my", "your", "their", "our", "today", "one", "very", "just",
]);

const SIGNALS: Array<[RegExp, string]> = [
  [/\bnervous|scared|shy|fierce|sweet|wild|goofy|stubborn|obsessed|hates|loves\b/i, "personality_contrast"],
  [/\binherited|passed down|old|vintage|family|restored|years?\b/i, "provenance_and_history"],
  [/\bfirst|again|second|third|return|back|next|visit\b/i, "callback_and_continuity"],
  [/\bnight|9 pm|late|dark|moon\b/i, "night_contrast"],
  [/\bbeach|ocean|shore|water|yacht|sea\b/i, "scale_and_place"],
  [/\bhouse|home|room|kitchen|bathroom|property\b/i, "space_as_character"],
  [/\bskateboard|scratches|worn|beat-up|scarred\b/i, "wear_as_evidence"],
  [/\bservice|client|customer|appointment|grooming|repair|cleaning\b/i, "service_personality"],
  [/\bhorror|dark humor|knives|glass|doors|ceiling\b/i, "calm_reality_break"],
  [/\bcreator|artist|work|audience|follow|social\b/i, "voice_and_attention"],
];

function clean(value: unknown): string {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function uniq(values: string[], limit = 20): string[] {
  return [...new Set(values.map(clean).filter(Boolean))].slice(0, limit);
}

function tokens(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9'\- ]+/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .filter((x) => !STOP_WORDS.has(x));
}

function inferMode(input: AuthorCognitionInput): AuthorCognitivePlan["mode"] {
  const text = `${input.prompt} ${input.lens ?? ""} ${input.subject ?? ""}`.toLowerCase();
  const evidence = input.facts.length + input.sourceMoments.length + (input.memoryContext?.length ?? 0);
  if (/service|client|customer|groom|grooming|clean|repair|barber|salon|mechanic|tattoo/.test(text)) return evidence ? "service" : "concept";
  if (/wedding|memory|anniversary|family|remember/.test(text)) return evidence ? "living_memory" : "concept";
  if (/creator|social|artist|portrait/.test(text)) return evidence ? "grounded" : "voice_first";
  return evidence ? "grounded" : "concept";
}

function scoreCandidate(strategy: string, input: AuthorCognitionInput, text: string): number {
  let score = 50;
  const lower = text.toLowerCase();
  if (strategy === "personality_contrast" && /sweet|scared|fierce|hates|loves|goofy|stubborn/.test(lower)) score += 28;
  if (strategy === "provenance_and_history" && /inherited|vintage|family|restored|old/.test(lower)) score += 28;
  if (strategy === "callback_and_continuity" && (input.round ?? 1) > 1) score += 32;
  if (strategy === "night_contrast" && /night|9 pm|moon|dark/.test(lower)) score += 26;
  if (strategy === "scale_and_place" && /beach|ocean|yacht|sea|shore/.test(lower)) score += 20;
  if (strategy === "space_as_character" && /house|home|room|kitchen|bathroom/.test(lower)) score += 20;
  if (strategy === "wear_as_evidence" && /scratches|worn|beat-up|scarred/.test(lower)) score += 24;
  if (strategy === "service_personality" && /service|client|customer|groom|repair|clean/.test(lower)) score += 24;
  if (strategy === "calm_reality_break" && /horror|knives|glass|doors|ceiling/.test(lower)) score += 35;
  if (strategy === "voice_and_attention" && /creator|artist|social|follow/.test(lower)) score += 24;
  return Math.min(score, 100);
}

function findContradictions(values: string[]): string[] {
  const joined = values.join(" ").toLowerCase();
  const hits: string[] = [];
  const pairs: Array<[RegExp, RegExp, string]> = [
    [/scared|nervous|shy/, /fierce|wild|confident/, "vulnerability vs attitude"],
    [/sweet|gentle/, /hates|fierce|stubborn/, "tenderness vs resistance"],
    [/old|vintage|inherited/, /still|new|first/, "age vs present life"],
    [/luxury|million|expensive/, /family|ordinary|ritual|memory/, "status vs intimacy"],
    [/night|dark|9 pm/, /wedding|romantic|love/, "darkness vs tenderness"],
    [/calm|conversation|wine/, /knives|glass|doors|ceiling|horror/, "social normality vs environmental violence"],
  ];
  for (const [a, b, label] of pairs) if (a.test(joined) && b.test(joined)) hits.push(label);
  return uniq(hits, 8);
}

export function buildAuthorCognitivePlan(input: AuthorCognitionInput): AuthorCognitivePlan {
  const round = Math.max(1, input.round ?? 1);
  const all = uniq([...input.facts, ...input.sourceMoments, ...(input.memoryContext ?? []), ...(input.priorScenes ?? [])], 80);
  const combined = `${input.prompt} ${input.lens ?? ""} ${input.subject ?? ""} ${input.place ?? ""} ${all.join(" ")}`;
  const mode = inferMode(input);
  const permanentTruths = uniq([...input.facts, ...(input.memoryContext ?? [])], 30);
  const currentEvidence = uniq(input.sourceMoments, 20);
  const contradictions = findContradictions([...permanentTruths, ...currentEvidence, input.prompt]);

  const matchedSignals = uniq(
    SIGNALS.filter(([pattern]) => pattern.test(combined)).map(([, signal]) => signal),
    12,
  );

  const candidates = matchedSignals.length
    ? matchedSignals.map((strategy) => ({
        strategy,
        reason: `This strategy is supported by the supplied material: ${strategy.replace(/_/g, " ")}.`,
        score: scoreCandidate(strategy, input, combined),
      }))
    : [
        {
          strategy: "meaning_reframe",
          reason: "Sparse material: create significance without inventing biography or facts.",
          score: 62,
        },
        {
          strategy: "pattern_break",
          reason: "Sparse material can become interesting through a justified expectation shift.",
          score: 60,
        },
        {
          strategy: "sensory_specificity",
          reason: "Concrete sensory detail gives the subject an identity before escalation.",
          score: 58,
        },
      ];

  candidates.sort((a, b) => b.score - a.score);
  const chosen = candidates[0]?.strategy ?? "meaning_reframe";

  const operatorMix = uniq(
    [
      "sensory_hook",
      chosen === "personality_contrast" ? "status_inversion" : "contrast",
      chosen === "callback_and_continuity" ? "callback" : "micro_reveal",
      chosen === "calm_reality_break" ? "escalation" : "reversal",
      round > 1 ? "callback" : "personification",
      "payoff",
      "afterglow",
    ],
    8,
  );

  const callbackTargets = round > 1
    ? uniq([...(input.priorScenes ?? []), ...permanentTruths], 10)
    : permanentTruths.slice(0, 5);

  const antiRepetitionRules = [
    "Do not repeat the previous chapter's emotional trajectory if one exists.",
    "Prefer a new operator mix each round unless a callback is intentionally paying something off.",
    "A callback must change meaning, not merely repeat wording.",
    "Do not restart the subject's biography on every chapter.",
    "Do not use the same opening image twice unless the repetition itself is the point.",
  ];

  const sceneRules = [
    "One scene = one perceivable beat = one thought.",
    "4–14 words is the preferred range; exceed it only when earned.",
    "Never pack multiple mini-scenes into one scene field.",
    "Never emit internal labels such as hook, micro-reveal, status inversion, or afterglow as viewer-facing prose.",
    "In grounded/service/living-memory modes, never invent concrete events, people, dates, locations, actions, outcomes, or objects.",
    "Conceptual novelty is welcome; factual hallucination is not.",
  ];

  const authorBrief = [
    `ROUND ${round}: create a chapter that belongs to the same world but does not feel like a reset.`,
    `ATTENTION STRATEGY: ${chosen}.`,
    `CONTRADICTIONS: ${contradictions.join(" | ") || "none detected; invent no biography."}`,
    `OPERATOR MIX: ${operatorMix.join(", ")}.`,
    `CALLBACK TARGETS: ${callbackTargets.join(" | ") || "none"}.`,
    `SIGNALS: ${matchedSignals.join(", ") || "sparse concept"}.`,
    `NEVER OPTIMIZE FOR "PRETTY" ALONE: optimize for recognition → surprise → curiosity → payoff.`,
  ];

  // Keep this importable as deterministic cognition. The scene model remains responsible for prose.
  void tokens;

  return {
    round,
    mode,
    subjectIdentity: clean(input.subject) || "unknown subject",
    permanentTruths,
    currentEvidence,
    contradictions,
    attentionCandidates: candidates.slice(0, 5),
    chosenAttentionStrategy: chosen,
    operatorMix,
    callbackTargets,
    antiRepetitionRules,
    sceneRules,
    authorBrief,
  };
}
