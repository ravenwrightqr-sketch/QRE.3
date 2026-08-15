export type CreativeCognitionInput = {
  prompt: string;
  subject?: string;
  place?: string;
  facts: string[];
  sourceMoments: string[];
  memoryContext?: string[];
  previousScenes?: string[];
  previousStrategies?: string[];
  round?: number;
};

export type CreativeCognitionPlan = {
  worldModel: string[];
  contradictions: string[];
  attentionCandidates: string[];
  selectedAttention: string;
  operatorMix: string[];
  roundStrategy: string;
  callbackOpportunities: string[];
  antiRepetition: string[];
  sceneDiscipline: string[];
  creativeLearningContext: string[];
};

const GENERIC = [
  "beautiful transformation",
  "unforgettable experience",
  "magical moment",
  "incredible journey",
  "luxury experience",
  "perfect day",
  "special moment",
];

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();
const uniq = (values: string[], limit = 20): string[] => [...new Set(values.map(clean).filter(Boolean))].slice(0, limit);

function contradictionPairs(input: CreativeCognitionInput): string[] {
  const text = [...input.facts, ...input.sourceMoments].join(" ").toLowerCase();
  const pairs: string[] = [];
  const add = (pattern: RegExp, value: string) => {
    if (pattern.test(text)) pairs.push(value);
  };

  add(/nervous.*happy|happy.*nervous/, "fear at the beginning versus confidence or joy afterward");
  add(/scared.*love|love.*scared/, "strong desire versus one specific fear");
  add(/sweet.*fierce|fierce.*sweet/, "tenderness versus attitude");
  add(/hates.*loves|loves.*hates/, "one strong preference versus one strong rejection");
  add(/old|vintage|worn|scratched|faded/, "visible wear versus continued value");
  add(/new|brand new|pristine/, "newness versus uncertainty about what comes next");
  add(/expensive|million|luxury|yacht/, "extreme value versus the human detail that makes it matter");
  add(/night|9 pm|10 pm|11 pm/, "darkness versus intimacy, calm, or expectation");
  add(/funny|comedy|humor/, "ordinary behavior versus an unexpectedly funny interpretation");
  add(/horror|knives|glass|chairs|doors/, "calm human behavior versus impossible environmental violence");
  return uniq(pairs, 8);
}

function inferAttentionCandidates(input: CreativeCognitionInput): string[] {
  const text = [...input.prompt, ...input.facts, ...input.sourceMoments].join(" ").toLowerCase();
  const candidates: string[] = [];
  if (/nervous|scared|fierce|hates|loves|bulldog|poodle|pet|dog/.test(text)) candidates.push("character comedy / personality contrast");
  if (/service|client|customer|groom|repair|clean|barber|salon|appointment/.test(text)) candidates.push("ordinary service becomes a character moment");
  if (/wedding|relationship|love|family|memory/.test(text)) candidates.push("small private detail becomes emotionally significant");
  if (/million|expensive|yacht|home|estate|luxury/.test(text)) candidates.push("status or value becomes secondary to provenance and human meaning");
  if (/vintage|old|inherited|heirloom|scratched|worn/.test(text)) candidates.push("wear or age becomes evidence of a life");
  if (/new|first day|pristine|beginning/.test(text)) candidates.push("newness becomes possibility rather than a fake future");
  if (/horror|knife|glass|door|chair|dark|dinner|wine/.test(text)) candidates.push("calm normal behavior while reality quietly violates itself");
  if (/creator|artist|social|follow|attention/.test(text)) candidates.push("voice / contradiction / point of view / pattern break");
  if (/qr|tag|keychain|wood|artifact|object|physical/.test(text)) candidates.push("tiny physical object implies a much larger hidden world");
  candidates.push("curiosity gap / withheld explanation");
  candidates.push("reframe a familiar thing so the viewer sees it differently");
  return uniq(candidates, 10);
}

function selectAttention(candidates: string[], input: CreativeCognitionInput): string {
  const text = [...input.prompt, ...input.facts, ...input.sourceMoments].join(" ").toLowerCase();
  if (/horror|knives|glass|chairs|doors|dinner|wine/.test(text)) return candidates.find((x) => x.includes("reality quietly")) ?? candidates[0] ?? "curiosity gap";
  if (/nervous|scared|fierce|hates|loves|dog|poodle|bulldog/.test(text)) return candidates.find((x) => x.includes("character comedy")) ?? candidates[0] ?? "curiosity gap";
  if (/million|yacht|home|estate|luxury/.test(text)) return candidates.find((x) => x.includes("provenance")) ?? candidates[0] ?? "curiosity gap";
  if (/vintage|old|inherited|heirloom|scratched|worn/.test(text)) return candidates.find((x) => x.includes("wear or age")) ?? candidates[0] ?? "curiosity gap";
  if (/wedding|relationship|love|family|memory/.test(text)) return candidates.find((x) => x.includes("private detail")) ?? candidates[0] ?? "curiosity gap";
  if (/service|client|customer|groom|repair|clean|barber|salon/.test(text)) return candidates.find((x) => x.includes("ordinary service")) ?? candidates[0] ?? "curiosity gap";
  if (/qr|tag|keychain|wood|artifact/.test(text)) return candidates.find((x) => x.includes("tiny physical")) ?? candidates[0] ?? "curiosity gap";
  return candidates[0] ?? "curiosity gap";
}

function operatorMix(selected: string, round: number): string[] {
  const base = selected.includes("character comedy")
    ? ["sensory_hook", "personification", "status_inversion", "comic_turn", "callback", "payoff"]
    : selected.includes("reality quietly")
      ? ["understatement", "contrast", "environmental_violation", "escalation", "calm_reaction", "payoff"]
      : selected.includes("provenance") || selected.includes("wear or age")
        ? ["sensory_hook", "zoom_into_detail", "provenance", "callback", "reframe", "payoff"]
        : selected.includes("private detail")
          ? ["sensory_hook", "zoom_into_detail", "understatement", "callback", "tender_turn", "payoff"]
          : selected.includes("ordinary service")
            ? ["sensory_hook", "personification", "status_inversion", "micro_reveal", "comic_turn", "payoff"]
            : selected.includes("tiny physical")
              ? ["sensory_hook", "touch", "scale_contrast", "mystery_turn", "reveal", "payoff"]
              : ["pattern_break", "sensory_hook", "contrast", "micro_reveal", "reversal", "payoff"];

  if (round > 1) return [...base, "chapter_callback", "meaning_shift"].slice(0, 9);
  return base;
}

function attentionBeatGrammar(round: number): string[] {
  return [
    "UNIFIED MICRO-SEQUENCE: all beats belong to one causal thread.",
    "DEFAULT RHYTHM: JOLT → JOLT → JOLT → PAYOFF.",
    "Each jolt must change what the viewer expects, notices, or believes.",
    "Preferred beat length: 4–7 words; 8–12 only when genuinely earned.",
    "Very short beats are encouraged when they land harder.",
    "The payoff must resolve or sharply reframe the same thread.",
    round > 1
      ? "ROUND 2+: use one callback whose meaning changes; do not restart the story."
      : "ROUND 1: establish one distinctive trait, tension, or question worth remembering.",
  ];
}

export function buildCreativeCognition(input: CreativeCognitionInput): CreativeCognitionPlan {
  const round = Math.max(1, input.round ?? 1);
  const worldModel = uniq([
    input.subject ? `subject: ${input.subject}` : "",
    input.place ? `place: ${input.place}` : "",
    ...input.facts.map((x) => `known: ${x}`),
    ...input.sourceMoments.map((x) => `moment: ${x}`),
  ], 30);

  const contradictions = contradictionPairs(input);
  const attentionCandidates = inferAttentionCandidates(input);
  const selectedAttention = selectAttention(attentionCandidates, input);
  const operators = operatorMix(selectedAttention, round);

  const callbacks = round > 1
    ? uniq([
        ...(input.memoryContext ?? []).map((x) => `callback: ${x}`),
        ...(input.previousScenes ?? []).slice(-4).map((x) => `revisit prior image without repeating wording: ${x}`),
      ], 8)
    : [];

  const antiRepetition = round > 1
    ? [
        "Do not restart the character from zero.",
        "Treat prior chapters as history.",
        "Reuse a known detail only if its meaning changes.",
        "Avoid repeating the same emotional trajectory or punchline.",
      ]
    : [
        "Establish one distinctive trait or tension.",
        "Avoid generic introductions.",
      ];

  const sceneDiscipline = [
    ...attentionBeatGrammar(round),
    "ATOMIC BEATS: scenes are physically separate but causally unified.",
    "Never pack multiple beats into one scene with pipes, semicolons, or mini-paragraphs.",
    "Never emit internal labels such as hook, micro-reveal, status inversion, or afterglow in scene text.",
    "Avoid explaining a joke, emotion, metaphor, or payoff after it can already be inferred.",
    "In grounded/service/living-memory modes, do not invent concrete events as facts.",
    "Creative freedom applies to framing, implication, metaphor, attitude, and operator mixing—not invented factual history.",
  ];

  const learning = [
    `ROUND: ${round}`,
    `SELECTED ATTENTION ENGINE: ${selectedAttention}`,
    `ATTENTION CANDIDATES: ${attentionCandidates.join(" | ")}`,
    contradictions.length
      ? `CONTRADICTIONS: ${contradictions.join(" | ")}`
      : "CONTRADICTIONS: none explicit; find subtle tension without inventing facts",
    `OPERATOR MIX: ${operators.join(", ")}`,
    callbacks.length
      ? `CALLBACK OPPORTUNITIES: ${callbacks.join(" | ")}`
      : "CALLBACK OPPORTUNITIES: establish a detail worth remembering",
    ...antiRepetition.map((x) => `ANTI-REPETITION: ${x}`),
    ...sceneDiscipline.map((x) => `SCENE DISCIPLINE: ${x}`),
    "ATTENTION CIRCLE: DISCOVER → SCAN → JOLT → JOLT → JOLT → PAYOFF → SHARE/RETURN → NEW CHAPTER",
    "QUALITY GOAL: inevitable in hindsight, difficult to predict beforehand.",
    `GENERIC BAN: ${GENERIC.join(", ")}`,
  ];

  return {
    worldModel,
    contradictions,
    attentionCandidates,
    selectedAttention,
    operatorMix: operators,
    roundStrategy: round > 1
      ? "continuation chapter: callback + escalation or meaning shift"
      : "origin chapter: establish character/world + plant a memorable detail",
    callbackOpportunities: callbacks,
    antiRepetition,
    sceneDiscipline,
    creativeLearningContext: learning,
  };
}
