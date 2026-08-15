export type AuthorCognitionInput = {
  prompt: string;
  lens?: string;
  subject?: string;
  place?: string;
  facts: string[];
  sourceMoments: string[];
  memoryContext?: string[];
  priorScenes?: string[];
  priorStrategies?: string[];
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
  [/\bfirst|again|second|third|return|back|next|visit|chapter\b/i, "callback_and_continuity"],
  [/\bnight|9 pm|late|dark|moon\b/i, "night_contrast"],
  [/\bbeach|ocean|shore|water|yacht|sea\b/i, "scale_and_place"],
  [/\bhouse|home|room|kitchen|bathroom|living room|estate|property\b/i, "space_as_character"],
  [/\bskateboard|scratches|worn|beat-up|scarred|faded\b/i, "wear_as_evidence"],
  [/\bservice|client|customer|appointment|grooming|repair|cleaning|barber|salon\b/i, "service_personality"],
  [/\bhorror|dark humor|knives|glass|doors|ceiling|wine\b/i, "calm_reality_break"],
  [/\bfunny|comedy|humor|laugh|joke|sarcastic|mischievous\b/i, "comic_status_inversion"],
  [/\bcreator|artist|work|audience|follow|social|attention\b/i, "voice_and_attention"],
  [/\bqr|tag|keychain|plaque|wood|artifact|object|physical\b/i, "object_to_world"],
  [/\bmillion|expensive|luxury|wealth|premium|high-end|valuable|price\b/i, "status_to_meaning"],
  [/\bnew|brand new|pristine|first use|beginning\b/i, "possibility_and_firstness"],
  [/\brelationship|love|wedding|anniversary|family|memory|inside joke|favorite\b/i, "private_meaning"],
];

const GENERIC_BANS = [
  "beautiful transformation",
  "magical moment",
  "unforgettable experience",
  "incredible journey",
  "luxury experience",
  "perfect day",
  "special moment",
  "living world",
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
  let score = 46;
  const lower = text.toLowerCase();
  const lens = `${input.lens ?? ""}`.toLowerCase();
  if (strategy === "personality_contrast" && /sweet|scared|fierce|hates|loves|goofy|stubborn/.test(lower)) score += 32;
  if (strategy === "provenance_and_history" && /inherited|vintage|family|restored|old/.test(lower)) score += 32;
  if (strategy === "callback_and_continuity" && (input.round ?? 1) > 1) score += 38;
  if (strategy === "night_contrast" && /night|9 pm|moon|dark/.test(lower)) score += 28;
  if (strategy === "scale_and_place" && /beach|ocean|yacht|sea|shore/.test(lower)) score += 22;
  if (strategy === "space_as_character" && /house|home|room|kitchen|bathroom|estate|property/.test(lower)) score += 24;
  if (strategy === "wear_as_evidence" && /scratches|worn|beat-up|scarred|faded/.test(lower)) score += 30;
  if (strategy === "service_personality" && /service|client|customer|groom|repair|clean/.test(lower)) score += 30;
  if (strategy === "calm_reality_break" && /horror|knives|glass|doors|ceiling|wine/.test(lower)) score += 42;
  if (strategy === "comic_status_inversion" && /funny|comedy|humor|laugh|sarcastic|mischievous/.test(`${lower} ${lens}`)) score += 36;
  if (strategy === "voice_and_attention" && /creator|artist|social|follow|attention/.test(lower)) score += 28;
  if (strategy === "object_to_world" && /qr|tag|keychain|plaque|wood|artifact|object|physical/.test(lower)) score += 28;
  if (strategy === "status_to_meaning" && /million|expensive|luxury|wealth|premium|high-end|valuable|price/.test(lower)) score += 32;
  if (strategy === "possibility_and_firstness" && /new|brand new|pristine|first use|beginning/.test(lower)) score += 24;
  if (strategy === "private_meaning" && /relationship|love|wedding|anniversary|family|memory|inside joke|favorite/.test(lower)) score += 30;
  if (input.round && input.round > 1) score += strategy === "callback_and_continuity" ? 12 : 0;
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
    [/service|client|customer|appointment/, /funny|fierce|quirky|hates|loves/, "routine service vs character personality"],
  ];
  for (const [a, b, label] of pairs) if (a.test(joined) && b.test(joined)) hits.push(label);
  return uniq(hits, 8);
}

function candidateReason(strategy: string): string {
  const reasons: Record<string, string> = {
    personality_contrast: "Make the subject's conflicting traits collide so the character feels specific.",
    provenance_and_history: "Use history and provenance as evidence of a life rather than exposition.",
    callback_and_continuity: "Make the current chapter remember earlier chapters and change their meaning.",
    night_contrast: "Exploit the difference between darkness and the emotional material instead of inventing daylight.",
    scale_and_place: "Let the place create cinematic scale while keeping the human subject central.",
    space_as_character: "Treat the built environment as an opponent, witness, archive, or participant.",
    wear_as_evidence: "Turn scratches, fading, scars, and wear into evidence rather than decoration.",
    service_personality: "Turn the routine job into a character-specific ritual or negotiation.",
    calm_reality_break: "Keep people calm while the environment becomes impossible; escalate spatial contradictions.",
    comic_status_inversion: "Reverse who seems to be in control and let the joke emerge from status.",
    voice_and_attention: "Use point of view, obsession, contradiction, and a pattern break instead of generic inspiration.",
    object_to_world: "Make a small physical object imply a much larger persistent world.",
    status_to_meaning: "Use price as context, then reveal the human reason the thing matters.",
    possibility_and_firstness: "Treat newness as an opening rather than inventing a future biography.",
    private_meaning: "Use small shared details that become more meaningful because they recur.",
  };
  return reasons[strategy] ?? "Reframe the subject so the viewer sees familiar material differently.";
}

function inferCandidates(input: AuthorCognitionInput, combined: string): AttentionCandidate[] {
  const matched = uniq(
    SIGNALS.filter(([pattern]) => pattern.test(combined)).map(([, signal]) => signal),
    16,
  );
  const pool = matched.length
    ? matched
    : ["meaning_reframe", "pattern_break", "sensory_specificity", "curiosity_gap"];

  return pool
    .map((strategy) => ({
      strategy,
      reason: candidateReason(strategy),
      score: scoreCandidate(strategy, input, combined),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 7);
}

function chooseAttention(candidates: AttentionCandidate[], input: AuthorCognitionInput): string {
  const text = `${input.prompt} ${input.lens ?? ""} ${input.facts.join(" ")} ${input.sourceMoments.join(" ")}`.toLowerCase();

  // Hard preferences for highly distinctive material.
  if (/horror|knives|glass|doors|ceiling|wine/.test(text)) return "calm_reality_break";
  if (input.round && input.round > 1 && candidates.some((x) => x.strategy === "callback_and_continuity")) return "callback_and_continuity";
  if (/nervous|scared|fierce|hates|loves|dog|poodle|bulldog/.test(text)) return "personality_contrast";
  if (/million|expensive|luxury|wealth|yacht|estate/.test(text)) return candidates.find((x) => x.strategy === "status_to_meaning" || x.strategy === "provenance_and_history")?.strategy ?? candidates[0]?.strategy ?? "meaning_reframe";
  if (/vintage|old|inherited|scratched|worn|faded/.test(text)) return candidates.find((x) => x.strategy === "wear_as_evidence" || x.strategy === "provenance_and_history")?.strategy ?? candidates[0]?.strategy ?? "meaning_reframe";
  if (/wedding|relationship|love|family|memory|inside joke/.test(text)) return candidates.find((x) => x.strategy === "private_meaning")?.strategy ?? candidates[0]?.strategy ?? "meaning_reframe";
  return candidates[0]?.strategy ?? "meaning_reframe";
}

function makeOperatorMix(chosen: string, round: number, candidates: AttentionCandidate[]): string[] {
  const secondary = candidates.find((x) => x.strategy !== chosen && x.score >= 68)?.strategy;
  const mixes: Record<string, string[]> = {
    personality_contrast: ["sensory_hook", "personification", "contrast", "status_inversion", "comic_turn", "callback", "payoff"],
    provenance_and_history: ["sensory_hook", "zoom_into_detail", "provenance", "callback", "reframe", "afterglow"],
    callback_and_continuity: ["callback", "meaning_shift", "escalation", "contrast", "payoff", "afterglow"],
    night_contrast: ["sensory_hook", "night_contrast", "understatement", "micro_reveal", "tender_turn", "afterglow"],
    scale_and_place: ["sensory_hook", "scale_contrast", "physical_move", "zoom_into_detail", "reframe", "afterglow"],
    space_as_character: ["sensory_hook", "personification", "resistance", "escalation", "status_inversion", "payoff"],
    wear_as_evidence: ["sensory_hook", "zoom_into_detail", "contrast", "callback", "meaning_shift", "afterglow"],
    service_personality: ["sensory_hook", "ritual", "personification", "status_inversion", "comic_turn", "payoff"],
    calm_reality_break: ["ordinary_behavior", "understatement", "spatial_violation", "calm_reaction", "escalation", "reality_reframe"],
    comic_status_inversion: ["ordinary_setup", "status_inversion", "understatement", "escalation", "comic_turn", "payoff"],
    voice_and_attention: ["voice", "contradiction", "pattern_break", "zoom_into_detail", "reframe", "signature"],
    object_to_world: ["sensory_hook", "touch", "scale_contrast", "mystery_turn", "reveal", "afterglow"],
    status_to_meaning: ["status_hint", "human_detail", "contrast", "provenance", "reframe", "payoff"],
    possibility_and_firstness: ["sensory_hook", "anticipation", "contrast", "micro_reveal", "open_loop", "afterglow"],
    private_meaning: ["sensory_hook", "specific_detail", "understatement", "callback", "tender_turn", "afterglow"],
  };

  const base = mixes[chosen] ?? ["pattern_break", "sensory_hook", "contrast", "micro_reveal", "reversal", "payoff"];
  const merged = secondary && round > 1 ? [...base, `secondary_${secondary}`] : base;
  return [...new Set(merged)].slice(0, 8);
}

export function buildAuthorCognitivePlan(input: AuthorCognitionInput): AuthorCognitivePlan {
  const round = Math.max(1, input.round ?? 1);
  const all = uniq([...input.facts, ...input.sourceMoments, ...(input.memoryContext ?? []), ...(input.priorScenes ?? [])], 80);
  const combined = `${input.prompt} ${input.lens ?? ""} ${input.subject ?? ""} ${input.place ?? ""} ${all.join(" ")}`;
  const mode = inferMode(input);
  const permanentTruths = uniq([...input.facts, ...(input.memoryContext ?? [])], 30);
  const currentEvidence = uniq(input.sourceMoments, 20);
  const contradictions = findContradictions([...permanentTruths, ...currentEvidence, input.prompt]);

  const attentionCandidates = inferCandidates(input, combined);
  const chosen = chooseAttention(attentionCandidates, input);
  const operatorMix = makeOperatorMix(chosen, round, attentionCandidates);

  const callbackTargets = round > 1
    ? uniq([...(input.priorScenes ?? []), ...permanentTruths], 10)
    : permanentTruths.slice(0, 5);

  const antiRepetitionRules = [
    "Do not repeat the previous chapter's emotional trajectory if one exists.",
    "Prefer a new operator mix each round unless a callback is intentionally paying something off.",
    "A callback must change meaning, not merely repeat wording.",
    "Do not restart the subject's biography on every chapter.",
    "Do not use the same opening image twice unless the repetition itself is the point.",
    "If the subject already had a joke, escalate or invert it rather than retelling it.",
  ];

  const sceneRules = [
    "One scene = one perceivable beat = one thought.",
    "4–14 words is the preferred range; exceed it only when earned.",
    "Never pack multiple mini-scenes into one scene.",
    "Never emit labels such as hook, micro-reveal, status inversion, or afterglow as viewer-facing prose.",
    "Never use pipes, semicolon chains, or colon-led mini-lists to fake a single scene.",
    "In grounded/service/living-memory modes, never invent concrete events, people, dates, locations, actions, outcomes, or objects.",
    "Invent metaphor, attitude, framing, implication, and juxtaposition instead of unsupported factual events.",
    "The final scene must pay off the chosen attention strategy, not merely conclude the plot.",
  ];

  const authorBrief = [
    `ROUND ${round}: ${round > 1 ? "continuation chapter; remember the world and change the meaning" : "origin chapter; establish identity and plant a memorable detail"}.`,
    `ATTENTION STRATEGY: ${chosen}. ${candidateReason(chosen)}`,
    `CONTRADICTIONS: ${contradictions.join(" | ") || "none detected; find subtle tension without inventing facts"}`,
    `OPERATOR MIX: ${operatorMix.join(", ")}. Mix operators when justified; do not use them mechanically in sequence.`,
    `CALLBACK TARGETS: ${callbackTargets.join(" | ") || "none"}.`,
    `ATTENTION LADDER: recognition → pattern break → curiosity → escalation/meaning shift → payoff.`,
    `TASTE RULE: prefer specific, mischievous, emotionally intelligent, visually concrete language over generic prettiness.`,
    `HUMOR RULE: use humor when it emerges from personality, status, contradiction, or circumstance; do not force jokes into every world.`,
    `DARK-HUMOR RULE: when darkness is requested, favor absurd calm, contradiction, and understatement before gore or stock horror.`,
    `VALUE RULE: monetary value is context, never the story by itself; find ownership, provenance, craft, ritual, history, or meaning.`,
    `GENERIC BANS: ${GENERIC_BANS.join(", ")}.`,
  ];

  void tokens;

  return {
    round,
    mode,
    subjectIdentity: clean(input.subject) || "unknown subject",
    permanentTruths,
    currentEvidence,
    contradictions,
    attentionCandidates,
    chosenAttentionStrategy: chosen,
    operatorMix,
    callbackTargets,
    antiRepetitionRules,
    sceneRules,
    authorBrief,
  };
}
