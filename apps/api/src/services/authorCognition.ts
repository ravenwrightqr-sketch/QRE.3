import type { LatentMovieCandidate, RealityGraph } from "@qre/contracts";
import { searchLatentMovieCandidates } from "./authorLatentMovieSearch.js";

export type AuthorCognitionInput = {
  prompt: string;
  lens?: string;
  subject?: string;
  place?: string;
  facts: string[];
  sourceMoments: string[];
  realityGraph?: RealityGraph;
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

export type CharacterFrameCandidate = {
  frame: string;
  reason: string;
  confidence: number;
};

export type CharacterRead = {
  coreTraits: string[];
  contradictions: string[];
  statusPosture: string;
  emotionalPosture: string;
  objectRelationships: string[];
  creativeFrames: CharacterFrameCandidate[];
  allowedMoves: string[];
  avoidedMoves: string[];
};

export type AuthorCognitivePlan = {
  round: number;
  mode:
    | "grounded"
    | "concept"
    | "living_memory"
    | "service"
    | "voice_first";
  subjectIdentity: string;
  permanentTruths: string[];
  currentEvidence: string[];
  contradictions: string[];
  characterRead: CharacterRead;
  attentionCandidates: AttentionCandidate[];
  latentMovieCandidates: LatentMovieCandidate[];
  chosenAttentionStrategy: string;
  operatorMix: string[];
  callbackTargets: string[];
  antiRepetitionRules: string[];
  sceneRules: string[];
  authorBrief: string[];
  realityGraph?: RealityGraph;
};

const SIGNALS: Array<[RegExp, string]> = [
  [
    /\bnervous|scared|shy|fierce|sweet|wild|goofy|stubborn|obsessed|hates|loves\b/i,
    "personality_contrast",
  ],
  [
    /\binherited|passed down|old|vintage|family|restored|years?\b/i,
    "provenance_and_history",
  ],
  [
    /\bfirst|again|second|third|return|back|next|visit|chapter\b/i,
    "callback_and_continuity",
  ],
  [
    /\bnight|9 pm|late|dark|moon\b/i,
    "night_contrast",
  ],
  [
    /\bbeach|ocean|shore|water|yacht|sea\b/i,
    "scale_and_place",
  ],
  [
    /\bhouse|home|room|kitchen|bathroom|living room|estate|property\b/i,
    "space_as_character",
  ],
  [
    /\bskateboard|scratches|worn|beat-up|scarred|faded\b/i,
    "wear_as_evidence",
  ],
  [
    /\bservice|client|customer|appointment|grooming|repair|cleaning|barber|salon\b/i,
    "service_personality",
  ],
  [
    /\bhorror|dark humor|knives|glass|doors|ceiling|wine\b/i,
    "calm_reality_break",
  ],
  [
    /\bfunny|comedy|humor|laugh|joke|sarcastic|mischievous\b/i,
    "comic_status_inversion",
  ],
  [
    /\bcreator|artist|work|audience|follow|social|attention\b/i,
    "voice_and_attention",
  ],
  [
    /\bqr|tag|keychain|plaque|wood|artifact|object|physical\b/i,
    "object_to_world",
  ],
  [
    /\bmillion|expensive|luxury|wealth|premium|high-end|valuable|price\b/i,
    "status_to_meaning",
  ],
  [
    /\bnew|brand new|pristine|first use|beginning\b/i,
    "possibility_and_firstness",
  ],
  [
    /\brelationship|love|wedding|anniversary|family|memory|inside joke|favorite\b/i,
    "private_meaning",
  ],
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

function inferMode(
  input: AuthorCognitionInput,
): AuthorCognitivePlan["mode"] {
  const text = `${input.prompt} ${input.lens ?? ""} ${
    input.subject ?? ""
  }`.toLowerCase();

  const evidence =
    input.facts.length +
    input.sourceMoments.length +
    (input.memoryContext?.length ?? 0);

  if (
    /service|client|customer|groom|grooming|clean|repair|barber|salon|mechanic|tattoo/.test(
      text,
    )
  ) {
    return evidence ? "service" : "concept";
  }

  if (
    /wedding|memory|anniversary|family|remember|memorial/.test(
      text,
    )
  ) {
    return evidence ? "living_memory" : "concept";
  }

  if (
    /creator|social|artist|portrait/.test(text)
  ) {
    return evidence ? "grounded" : "voice_first";
  }

  return evidence ? "grounded" : "concept";
}

function scoreCandidate(
  strategy: string,
  input: AuthorCognitionInput,
  text: string,
): number {
  let score = 46;

  const lower = text.toLowerCase();
  const lens = `${input.lens ?? ""}`.toLowerCase();
  const graph = input.realityGraph;

  if (
    strategy === "personality_contrast" &&
    /sweet|scared|fierce|hates|loves|goofy|stubborn/.test(
      lower,
    )
  ) {
    score += 32;
  }

  if (
    strategy === "provenance_and_history" &&
    /inherited|vintage|family|restored|old/.test(lower)
  ) {
    score += 32;
  }

  if (
    strategy === "callback_and_continuity" &&
    ((input.round ?? 1) > 1 ||
      Boolean(graph?.recurringSignals.length))
  ) {
    score += 38;
  }

  if (
    strategy === "night_contrast" &&
    /night|9 pm|moon|dark/.test(lower)
  ) {
    score += 28;
  }

  if (
    strategy === "scale_and_place" &&
    /beach|ocean|yacht|sea|shore/.test(lower)
  ) {
    score += 22;
  }

  if (
    strategy === "space_as_character" &&
    /house|home|room|kitchen|bathroom|estate|property/.test(
      lower,
    )
  ) {
    score += 24;
  }

  if (
    strategy === "wear_as_evidence" &&
    /scratches|worn|beat-up|scarred|faded/.test(lower)
  ) {
    score += 30;
  }

  if (
    strategy === "service_personality" &&
    /service|client|customer|groom|repair|clean/.test(lower)
  ) {
    score += 30;
  }

  if (
    strategy === "calm_reality_break" &&
    /horror|knives|glass|doors|ceiling|wine/.test(lower)
  ) {
    score += 42;
  }

  if (
    strategy === "comic_status_inversion" &&
    /funny|comedy|humor|laugh|sarcastic|mischievous/.test(
      `${lower} ${lens}`,
    )
  ) {
    score += 36;
  }

  if (
    strategy === "voice_and_attention" &&
    /creator|artist|social|follow|attention/.test(lower)
  ) {
    score += 28;
  }

  if (
    strategy === "object_to_world" &&
    /qr|tag|keychain|plaque|wood|artifact|object|physical/.test(
      lower,
    )
  ) {
    score += 28;
  }

  if (
    strategy === "status_to_meaning" &&
    /million|expensive|luxury|wealth|premium|high-end|valuable|price/.test(
      lower,
    )
  ) {
    score += 32;
  }

  if (
    strategy === "possibility_and_firstness" &&
    /new|brand new|pristine|first use|beginning/.test(lower)
  ) {
    score += 24;
  }

  if (
    strategy === "private_meaning" &&
    /relationship|love|wedding|anniversary|family|memory|inside joke|favorite/.test(
      lower,
    )
  ) {
    score += 30;
  }

  if (
    graph &&
    strategy === "private_meaning" &&
    graph.relations.some(
      (relation) =>
        relation.kind === "involves" ||
        relation.kind === "converges",
    )
  ) {
    score += 12;
  }

  if (
    graph &&
    strategy === "object_to_world" &&
    graph.events.some(
      (event) => event.entities.length > 1,
    )
  ) {
    score += 8;
  }

  if (
    input.round &&
    input.round > 1 &&
    strategy === "callback_and_continuity"
  ) {
    score += 12;
  }

  return Math.min(score, 100);
}

function findContradictions(
  values: string[],
  graph?: RealityGraph,
): string[] {
  const joined = values.join(" ").toLowerCase();
  const hits: string[] = [];

  const pairs: Array<
    [RegExp, RegExp, string]
  > = [
    [
      /scared|nervous|shy/,
      /fierce|wild|confident/,
      "vulnerability vs attitude",
    ],
    [
      /sweet|gentle/,
      /hates|fierce|stubborn/,
      "tenderness vs resistance",
    ],
    [
      /old|vintage|inherited/,
      /still|new|first/,
      "age vs present life",
    ],
    [
      /luxury|million|expensive/,
      /family|ordinary|ritual|memory/,
      "status vs intimacy",
    ],
    [
      /night|dark|9 pm/,
      /wedding|romantic|love/,
      "darkness vs tenderness",
    ],
    [
      /calm|conversation|wine/,
      /knives|glass|doors|ceiling|horror/,
      "social normality vs environmental violence",
    ],
    [
      /service|client|customer|appointment/,
      /funny|fierce|quirky|hates|loves/,
      "routine service vs character personality",
    ],
    [
      /missing|lost|vanished|gone/,
      /packed|moved|loaded|finished/,
      "completion vs unresolved absence",
    ],
    [
      /same|again|returned|back/,
      /different|changed|new/,
      "repetition vs change",
    ],
  ];

  for (const [a, b, label] of pairs) {
    if (a.test(joined) && b.test(joined)) {
      hits.push(label);
    }
  }

  hits.push(
    ...(graph?.unresolvedTensions ?? []),
  );

  return uniq(hits, 10);
}

function deriveCoreTraits(
  input: AuthorCognitionInput,
): string[] {
  const all = [
    ...input.facts,
    ...input.sourceMoments,
  ];

  const traits = all.filter((value) =>
    /\b(?:nervous|scared|shy|fierce|sweet|gentle|wild|goofy|stubborn|obsessed|proud|confident|quiet|loud|funny|mischievous|tired|calm|excited)\b/i.test(
      value,
    ),
  );

  return uniq(traits, 8);
}

function deriveObjectRelationships(
  input: AuthorCognitionInput,
): string[] {
  const all = [
    ...input.facts,
    ...input.sourceMoments,
  ];

  const objects = all.filter((value) =>
    /\b(?:bow|bows|ball|balls|tie|ties|bath|bathroom|kitchen|box|bag|car|tag|keychain|record|records|card|cards|song|pier|manual|paint|hvac|mirror)\b/i.test(
      value,
    ),
  );

  return uniq(objects, 10);
}

function deriveStatusPosture(
  traits: string[],
  contradictions: string[],
): string {
  const joined = `${traits.join(" ")} ${contradictions.join(
    " ",
  )}`.toLowerCase();

  if (
    /nervous|scared/.test(joined) &&
    /fierce|wild|confident|stubborn/.test(joined)
  ) {
    return "guarded but defiant; resists looking powerless";
  }

  if (
    /quiet|silent/.test(joined) &&
    /mirror|appearance|fade|reveal/.test(joined)
  ) {
    return "controlled and observant; lets the result speak";
  }

  if (
    /missing|lost|vanished/.test(joined) &&
    /packed|moved|finished/.test(joined)
  ) {
    return "apparently complete while carrying an unresolved problem";
  }

  if (
    /happy|proud|excited/.test(joined) &&
    /nervous|scared|shy/.test(joined)
  ) {
    return "emotionally mixed; outward state is ahead of inner certainty";
  }

  if (
    /old|vintage|inherited|family/.test(joined)
  ) {
    return "custodian of continuity; meaning lives in small details";
  }

  return "defined by the strongest supplied contradiction";
}

function deriveEmotionalPosture(
  traits: string[],
  contradictions: string[],
): string {
  if (contradictions.length) {
    return `emotion sits inside ${contradictions[0]}`;
  }

  if (traits.length >= 2) {
    return `emotion emerges from ${traits[0]} meeting ${traits[1]}`;
  }

  if (traits.length === 1) {
    return `emotion is carried by ${traits[0]}`;
  }

  return "emotion should be inferred from behavior, not named";
}

function deriveCreativeFrames(
  input: AuthorCognitionInput,
  contradictions: string[],
): CharacterFrameCandidate[] {
  const text = `${input.prompt} ${input.lens ?? ""} ${
    input.subject ?? ""
  } ${input.facts.join(" ")} ${
    input.sourceMoments.join(" ")
  }`.toLowerCase();

  const frames: CharacterFrameCandidate[] = [];

  const add = (
    frame: string,
    reason: string,
    confidence: number,
  ) => {
    frames.push({
      frame,
      reason,
      confidence,
    });
  };

  if (
    /nervous|fierce|hates|steals|stole|rebellion/.test(
      text,
    )
  ) {
    add(
      "negotiation",
      "character attitude makes an ordinary interaction feel like a status contest",
      0.92,
    );

    add(
      "rebellion",
      "the supplied resistance or stealing can be framed as a tiny act of defiance",
      0.88,
    );
  }

  if (
    /groom|grooming|barber|salon|cleaning|repair|service/.test(
      text,
    )
  ) {
    add(
      "operation",
      "the routine service can be experienced as a focused operation when the facts create pressure or personality",
      0.78,
    );

    add(
      "transformation",
      "before/after state change can carry the experience without becoming a template",
      0.74,
    );
  }

  if (
    /moving|packed|missing|lost|vanished|box/.test(
      text,
    )
  ) {
    add(
      "investigation",
      "an unresolved missing object naturally creates a question worth following",
      0.94,
    );

    add(
      "spy extraction",
      "the move can acquire extraction energy when the missing item creates an unresolved thread",
      0.86,
    );
  }

  if (
    /wedding|vows|ceremony|love|romantic/.test(
      text,
    )
  ) {
    add(
      "romantic tension",
      "the supplied emotional contrast can create anticipation without inventing events",
      0.9,
    );

    add(
      "release",
      "a supplied pre/post emotional shift can carry the payoff",
      0.86,
    );
  }

  if (
    /same|again|returned|return|different year|back/.test(
      text,
    )
  ) {
    add(
      "return",
      "revisiting a supplied place or ritual can change its meaning",
      0.92,
    );

    add(
      "memory loop",
      "repetition with changed context creates a natural callback",
      0.88,
    );
  }

  if (
    /record|records|birthday card|same song|sundays|memorial|remember/.test(
      text,
    )
  ) {
    add(
      "refrain",
      "a recurring supplied detail can become the emotional anchor",
      0.94,
    );

    add(
      "portrait",
      "small recurring details can imply a person without inventing biography",
      0.9,
    );

    add(
      "quiet observation",
      "the material is stronger when observed than dramatized",
      0.92,
    );
  }

  if (
    /filthy|dirty|brand new|before|after|clean|restored/.test(
      text,
    )
  ) {
    add(
      "reveal",
      "a visible supplied state change can create a compact reveal",
      0.8,
    );
  }

  const safeFrames = frames.filter(
    (frame) =>
      !(
        /memorial/.test(text) &&
        /spy|heist|mission|game|boss/.test(
          frame.frame,
        )
      ),
  );

  if (contradictions.length) {
    add(
      "status inversion",
      `the strongest contradiction is ${contradictions[0]}`,
      0.84,
    );
  }

  const seen = new Set<string>();

  return safeFrames
    .concat(frames)
    .filter((frame) => {
      if (seen.has(frame.frame)) return false;
      seen.add(frame.frame);
      return true;
    })
    .sort(
      (a, b) => b.confidence - a.confidence,
    )
    .slice(0, 6);
}

function deriveCharacterRead(
  input: AuthorCognitionInput,
  contradictions: string[],
): CharacterRead {
  const coreTraits = deriveCoreTraits(input);
  const objectRelationships =
    deriveObjectRelationships(input);
  const creativeFrames = deriveCreativeFrames(
    input,
    contradictions,
  );

  return {
    coreTraits,
    contradictions,
    statusPosture: deriveStatusPosture(
      coreTraits,
      contradictions,
    ),
    emotionalPosture: deriveEmotionalPosture(
      coreTraits,
      contradictions,
    ),
    objectRelationships,
    creativeFrames,
    allowedMoves: [
      "metaphor",
      "personification",
      "status language",
      "double meaning",
      "character-specific exaggeration",
      "comic framing",
      "understatement",
      "callback",
      "recontextualization",
      "rhetorical game language when the frame genuinely increases the experience",
    ],
    avoidedMoves: [
      "invented concrete events",
      "invented dialogue",
      "invented reactions",
      "invented people",
      "invented locations",
      "invented physical props",
      "literalizing a metaphorical frame",
      "forced game mechanics when the evidence does not support them",
      "generic emotional summary",
    ],
  };
}

function candidateReason(strategy: string): string {
  const reasons: Record<string, string> = {
    personality_contrast:
      "Make the subject's conflicting traits collide so the character feels specific.",
    provenance_and_history:
      "Use history and provenance as evidence of a life rather than exposition.",
    callback_and_continuity:
      "Make the current chapter remember earlier chapters and change their meaning.",
    night_contrast:
      "Exploit darkness and emotional material without inventing scenery.",
    scale_and_place:
      "Let the place create scale while keeping the human subject central.",
    space_as_character:
      "Treat the built environment as an opponent, witness, archive, or participant.",
    wear_as_evidence:
      "Turn scratches, fading, scars, and wear into evidence rather than decoration.",
    service_personality:
      "Turn the routine job into a character-specific ritual or negotiation.",
    calm_reality_break:
      "Keep people calm while the environment becomes impossible.",
    comic_status_inversion:
      "Reverse who seems to be in control and let the joke emerge from status.",
    voice_and_attention:
      "Use point of view, obsession, contradiction, and a pattern break.",
    object_to_world:
      "Make a small physical object imply a larger persistent world.",
    status_to_meaning:
      "Use price as context, then reveal why the thing matters.",
    possibility_and_firstness:
      "Treat newness as an opening, not a fake future biography.",
    private_meaning:
      "Use small shared details that become more meaningful when they recur.",
  };

  return (
    reasons[strategy] ??
    "Reframe the subject so familiar material feels newly alive."
  );
}



function inferCandidates(
  input: AuthorCognitionInput,
  combined: string,
): AttentionCandidate[] {
  const matched = uniq(
    SIGNALS
      .filter(([pattern]) => pattern.test(combined))
      .map(([, signal]) => signal),
    16,
  );

  const pool = matched.length
    ? matched
    : [
        "meaning_reframe",
        "pattern_break",
        "sensory_specificity",
        "curiosity_gap",
      ];

  return pool
    .map((strategy) => ({
      strategy,
      reason: candidateReason(strategy),
      score: scoreCandidate(
        strategy,
        input,
        combined,
      ),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 7);
}

function chooseAttention(
  candidates: AttentionCandidate[],
  input: AuthorCognitionInput,
): string {
  const text =
    `${input.prompt} ${input.lens ?? ""} ${input.facts.join(
      " ",
    )} ${input.sourceMoments.join(" ")}`.toLowerCase();

  if (
    /horror|knives|glass|doors|ceiling|wine/.test(
      text,
    )
  ) {
    return "calm_reality_break";
  }

  if (
    input.round &&
    input.round > 1 &&
    candidates.some(
      (candidate) =>
        candidate.strategy ===
        "callback_and_continuity",
    )
  ) {
    return "callback_and_continuity";
  }

  if (
    /nervous|scared|fierce|hates|loves|dog|poodle|bulldog/.test(
      text,
    )
  ) {
    return "personality_contrast";
  }

  if (
    /million|expensive|luxury|wealth|yacht|estate/.test(
      text,
    )
  ) {
    return (
      candidates.find(
        (candidate) =>
          candidate.strategy ===
            "status_to_meaning" ||
          candidate.strategy ===
            "provenance_and_history",
      )?.strategy ??
      candidates[0]?.strategy ??
      "meaning_reframe"
    );
  }

  if (
    /wedding|relationship|love|family|memory|inside joke/.test(
      text,
    )
  ) {
    return (
      candidates.find(
        (candidate) =>
          candidate.strategy ===
          "private_meaning",
      )?.strategy ??
      candidates[0]?.strategy ??
      "meaning_reframe"
    );
  }

  return (
    candidates[0]?.strategy ??
    "meaning_reframe"
  );
}

function makeOperatorMix(
  chosen: string,
  round: number,
  candidates: AttentionCandidate[],
): string[] {
  const secondary = candidates.find(
    (candidate) =>
      candidate.strategy !== chosen &&
      candidate.score >= 68,
  )?.strategy;

  const mixes: Record<
    string,
    string[]
  > = {
    personality_contrast: [
      "sensory_hook",
      "personification",
      "contrast",
      "status_inversion",
      "comic_turn",
      "callback",
      "payoff",
    ],
    provenance_and_history: [
      "sensory_hook",
      "zoom_into_detail",
      "provenance",
      "callback",
      "reframe",
      "afterglow",
    ],
    callback_and_continuity: [
      "callback",
      "meaning_shift",
      "escalation",
      "contrast",
      "payoff",
      "afterglow",
    ],
    service_personality: [
      "sensory_hook",
      "ritual",
      "personification",
      "status_inversion",
      "comic_turn",
      "payoff",
    ],
    calm_reality_break: [
      "ordinary_behavior",
      "understatement",
      "spatial_violation",
      "calm_reaction",
      "escalation",
      "reality_reframe",
    ],
    comic_status_inversion: [
      "ordinary_setup",
      "status_inversion",
      "understatement",
      "escalation",
      "comic_turn",
      "payoff",
    ],
    private_meaning: [
      "sensory_hook",
      "specific_detail",
      "understatement",
      "callback",
      "tender_turn",
      "afterglow",
    ],
    object_to_world: [
      "sensory_hook",
      "touch",
      "scale_contrast",
      "mystery_turn",
      "reveal",
      "afterglow",
    ],
    status_to_meaning: [
      "status_hint",
      "human_detail",
      "contrast",
      "provenance",
      "reframe",
      "payoff",
    ],
  };

  const base =
    mixes[chosen] ??
    [
      "pattern_break",
      "sensory_hook",
      "contrast",
      "micro_reveal",
      "reversal",
      "payoff",
    ];

  const merged =
    secondary && round > 1
      ? [...base, `secondary_${secondary}`]
      : base;

  return [...new Set(merged)].slice(0, 8);
}

export function buildAuthorCognitivePlan(
  input: AuthorCognitionInput,
): AuthorCognitivePlan {
  const round = Math.max(
    1,
    input.round ?? 1,
  );

  const graphText = input.realityGraph
    ? [
        ...input.realityGraph.events.map(
          (event) => event.label,
        ),
        ...input.realityGraph.unresolvedTensions,
        ...input.realityGraph.recurringSignals,
        ...input.realityGraph.sensorySignals,
      ]
    : [];

  const all = uniq(
    [
      ...input.facts,
      ...input.sourceMoments,
      ...graphText,
      ...(input.memoryContext ?? []),
      ...(input.priorScenes ?? []),
    ],
    100,
  );

  const combined =
    `${input.prompt} ${input.lens ?? ""} ${
      input.subject ?? ""
    } ${input.place ?? ""} ${all.join(" ")}`;

  const mode = inferMode(input);

  const permanentTruths = uniq(
    [
      ...input.facts,
      ...(input.memoryContext ?? []),
    ],
    30,
  );

  const currentEvidence = uniq(
    [
      ...input.sourceMoments,
      ...(input.realityGraph?.events.map(
        (event) => event.label,
      ) ?? []),
    ],
    30,
  );

  const contradictions = findContradictions(
    [
      ...permanentTruths,
      ...currentEvidence,
      input.prompt,
    ],
    input.realityGraph,
  );

  const characterRead =
    deriveCharacterRead(
      input,
      contradictions,
    );

  const attentionCandidates =
    inferCandidates(input, combined);

  const latentMovieCandidates =
    input.realityGraph
      ? searchLatentMovieCandidates({
          graph: input.realityGraph,
          subject: input.subject,
          lens: input.lens,
          limit: 6,
        })
      : [];

  if (input.realityGraph) {
    input.realityGraph.latentMovieCandidates =
      latentMovieCandidates;
  }

  const chosen = chooseAttention(
    attentionCandidates,
    input,
  );

  const operatorMix = makeOperatorMix(
    chosen,
    round,
    attentionCandidates,
  );

  const callbackTargets =
    round > 1
      ? uniq(
          [
            ...(input.priorScenes ?? []),
            ...(input.realityGraph
              ?.recurringSignals ?? []),
            ...permanentTruths,
          ],
          14,
        )
      : uniq(
          [
            ...(input.realityGraph
              ?.recurringSignals ?? []),
            ...permanentTruths,
          ],
          10,
        );

  const antiRepetitionRules = [
    "Do not repeat the previous chapter's emotional trajectory if one exists.",
    "Every new cut must earn a fresh viewer reaction or a meaningful callback.",
    "A callback must change meaning, not merely repeat wording.",
    "Do not restart the subject's biography on every chapter.",
    "Do not use the same opening image twice unless repetition itself is the point.",
    "If the subject already had a joke, escalate, invert, or mutate it rather than retelling it.",
    "Prefer the strongest two or three concrete details over complete coverage of the prompt.",
    "Prefer events and relationships from the reality graph over isolated fact repetition.",
    "Never spend a cut on stable identity metadata unless identity itself is the discovery.",
  ];

  const sceneRules = [
    "A beat is a sentence cut: one perceivable movement of the film, then an immediate cut.",
    "Viewer-facing text is normally 2-7 words; 3-6 is the sweet spot.",
    "One beat carries one cognitive hit. Do not pack setup, reaction, explanation, and payoff together.",
    "The image, when present, is a parallel layer. Text does not need to describe the image.",
    "Do not enumerate every task in a service job. Select the moments that make the work feel alive.",
    "Never emit labels such as hook, micro-reveal, status inversion, strategy, operator, or afterglow as viewer prose.",
    "Never use paragraph-length text, stacked clauses, or mini-lists inside one cut.",
    "Grounded modes preserve sourced reality; creativity may change framing, implication, juxtaposition, and attitude without inventing facts.",
    "Funny should feel character-specific. Horror should make normality increasingly wrong. Romance should use private meaning.",
    "Rhetorical game language is allowed only when a supplied contradiction, object, unresolved problem, or status shift genuinely supports it.",
    "Do not force game or spy framing onto memorials, quiet memories, or realities without a meaningful tension.",
    "Finish as soon as the payoff lands. Do not explain the lesson afterward.",
  ];

  const graphSummary = input.realityGraph
    ? `REALITY GRAPH: ${input.realityGraph.events.length} events, ${input.realityGraph.relations.length} relations, tensions=${input.realityGraph.unresolvedTensions.join(" | ") || "none"}.`
    : "REALITY GRAPH: unavailable; rely on direct source evidence.";

  const movieSummary =
    latentMovieCandidates.length
      ? `LATENT MOVIES: ${latentMovieCandidates
          .slice(0, 4)
          .map(
            (candidate) =>
              `${candidate.lens}=${candidate.score} [${candidate.evidence
                .slice(0, 2)
                .join(" + ")}]`,
          )
          .join(" | ")}. Treat these as competing hypotheses, never facts.`
      : "LATENT MOVIES: none; do not invent a movie.";

  const frameSummary =
    characterRead.creativeFrames.length
      ? `FRAME CANDIDATES: ${characterRead.creativeFrames
          .slice(0, 5)
          .map(
            (frame) =>
              `${frame.frame}=${frame.confidence}`,
          )
          .join(" | ")}. A frame is a lens, never the story.`
      : "FRAME CANDIDATES: none; stay natural.";

  const authorBrief = [
    `ROUND ${round}: ${
      round > 1
        ? "continuation chapter; remember the world and change the meaning"
        : "origin chapter; establish identity and plant a memorable detail"
    }.`,
    `ATTENTION STRATEGY: ${chosen}. ${candidateReason(
      chosen,
    )}`,
    graphSummary,
    movieSummary,
    frameSummary,
    `CHARACTER READ: ${characterRead.statusPosture}. ${characterRead.emotionalPosture}.`,
    `CHARACTER TRAITS: ${
      characterRead.coreTraits.join(" | ") ||
      "derive from observed behavior"
    }.`,
    `OBJECT RELATIONSHIPS: ${
      characterRead.objectRelationships.join(
        " | ",
      ) || "none explicit"
    }.`,
    `CONTRADICTIONS: ${
      contradictions.join(" | ") ||
      "none detected; use tension from supplied relationships without inventing facts"
    }`,
    `OPERATOR MIX: ${operatorMix.join(
      ", ",
    )}. Treat these as private options, never as a forced sequence.`,
    `CALLBACK TARGETS: ${
      callbackTargets.join(" | ") || "none"
    }.`,
    "ATTENTION LADDER: recognition → jolt → jolt → escalation/meaning shift → payoff.",
    "TASTE RULE: prefer specific, mischievous, emotionally intelligent, visually concrete language over generic prettiness.",
    "HUMOR RULE: use humor when it emerges from personality, status, contradiction, or circumstance; do not force jokes into every world.",
    "VALUE RULE: monetary value is context; find ownership, provenance, craft, ritual, history, or human meaning.",
    `GENERIC BANS: ${GENERIC_BANS.join(", ")}.`,
  ];

  return {
    round,
    mode,
    subjectIdentity:
      clean(input.subject) ||
      "unknown subject",
    permanentTruths,
    currentEvidence,
    contradictions,
    characterRead,
    attentionCandidates,
    latentMovieCandidates,
    chosenAttentionStrategy: chosen,
    operatorMix,
    callbackTargets,
    antiRepetitionRules,
    sceneRules,
    authorBrief,
    realityGraph: input.realityGraph,
  };
}