import type {
  CognitiveBeatKind,
  CognitiveEvidence,
  CognitiveExperiencePlan,
  CognitiveExperienceRealization,
  CognitivePremise,
  StoryBeat,
} from "@qre/contracts";

/**
 * SUPER COG
 *
 * Presentation-only imagination.
 *
 * Durable memory must never consume this layer.
 *
 * Super Cog is the creative cognition layer between semantic understanding
 * and presentation.
 *
 * It does NOT try to write a generic story.
 *
 * It asks:
 *
 *   What is actually happening?
 *   What is expected to happen?
 *   What is interesting about that situation?
 *   What could change without breaking causality?
 *   Which creative transformation creates the strongest consequence?
 *   Which consequence creates the strongest emotional payoff?
 *
 * Pipeline:
 *
 *   PROMPT
 *      ↓
 *   DOMAIN
 *      ↓
 *   SITUATION
 *      ↓
 *   OPPORTUNITIES
 *      ↓
 *   CANDIDATE OPERATIONS
 *      ↓
 *   CANDIDATE MOMENTS
 *      ↓
 *   CANDIDATE SCORING
 *      ↓
 *   WINNING TRANSFORMATION
 *      ↓
 *   REALIZATION
 *
 * Creativity != random novelty.
 *
 * The goal is:
 *
 *   specificity
 *   + causality
 *   + deviation
 *   + consequence
 *   + emotional movement
 *   + payoff potential
 *
 * without inventing unrelated facts.
 */

type Domain =
  | "romance"
  | "horror"
  | "comedy"
  | "service"
  | "wonder"
  | "cinematic";

type CognitiveOperation =
  | "externalize"
  | "personify"
  | "invert"
  | "magnify"
  | "reinterpret"
  | "contrast"
  | "reveal"
  | "escalate"
  | "collapse_distance"
  | "transfer_agency"
  | "change_perspective"
  | "symbolize";

type DomainModel = {
  domain: Domain;
  entities: string[];
  affordances: string[];
  tensions: string[];
  transformations: string[];
  emotionalStart: string;
  emotionalTarget: string;
};

type SituationModel = {
  subject: string;
  activity: string;
  setting: string;
  change: string;
  tension: string;
  opportunity: string;
};

type CognitiveOpportunity = {
  kind:
    | "expectation_gap"
    | "personality"
    | "contrast"
    | "escalation"
    | "hidden_meaning"
    | "agency"
    | "consequence";

  signal: string;
  strength: number;
};

type CognitiveTransformation = {
  operation: CognitiveOperation;
  sourceState: string;
  transformedState: string;
  consequence: string;
  emotionalEffect: string;
};

type CognitiveRealization = {
  domain: DomainModel;
  situation: SituationModel;
  transformation: CognitiveTransformation;
};

type CognitiveMoment = {
  observation: string;
  expectation: string;
  deviation: string;
  consequence: string;
  emotionalShift: string;
  agency: string;
};

type CognitiveCandidate = {
  operation: CognitiveOperation;
  moment: CognitiveMoment;
  novelty: number;
  specificity: number;
  causalFit: number;
  payoffPotential: number;
  emotionalMovement: number;
  totalScore: number;
};

type CognitiveTrajectory = {
  moments: CognitiveMoment[];
  candidate: CognitiveCandidate;
  payoff: string;
};

const clean = (value: unknown): string =>
  typeof value === "string"
    ? value.replace(/\s+/g, " ").trim()
    : "";

const lower = (value: unknown): string =>
  clean(value).toLowerCase();

const SERIOUS =
  /\b(?:memorial|funeral|death|died|grief|emergency|medical|injury|lawsuit|legal|crisis|trauma|mourning|bereavement)\b/i;

const unique = (values: string[]): string[] =>
  [...new Set(values.map(clean).filter(Boolean))];

const containsAny = (
  text: string,
  words: string[],
): boolean =>
  words.some((word) => text.includes(word));

function clamp(
  value: number,
  min = 0,
  max = 1,
): number {
  return Math.max(min, Math.min(max, value));
}

function wordCount(value: string): number {
  return clean(value)
    .split(/\s+/)
    .filter(Boolean)
    .length;
}

function overlapScore(
  a: string,
  b: string,
): number {
  const aWords = new Set(
    lower(a)
      .split(/\W+/)
      .filter((word) => word.length > 3),
  );

  const bWords = new Set(
    lower(b)
      .split(/\W+/)
      .filter((word) => word.length > 3),
  );

  if (!aWords.size || !bWords.size) {
    return 0;
  }

  let overlap = 0;

  for (const word of aWords) {
    if (bWords.has(word)) {
      overlap++;
    }
  }

  return clamp(
    overlap /
      Math.max(
        3,
        Math.min(aWords.size, bWords.size),
      ),
  );
}

function subject(
  plan: CognitiveExperiencePlan,
  premise?: CognitivePremise,
): string {
  const value = premise?.slots.find(
    (slot) => slot.role === "subject",
  )?.values[0];

  return (
    clean(value) ||
    clean(plan.centralSubject) ||
    "the moment"
  );
}

function promptActivity(
  prompt: string,
  plan: CognitiveExperiencePlan,
): string {
  const text = clean(prompt);

  if (text) {
    return text;
  }

  return (
    clean(plan.purpose) ||
    clean(plan.centralSubject) ||
    "an ordinary moment"
  );
}

/**
 * DOMAIN MODEL
 *
 * Domains provide cognitive affordances, not finished scenes.
 */
function domainModel(
  prompt: string,
  plan: CognitiveExperiencePlan,
): DomainModel | undefined {
  if (SERIOUS.test(prompt)) {
    return undefined;
  }

  const text = lower(
    [
      prompt,
      ...(plan.emotionalIntent ?? []),
      ...(plan.creativePossibilities ?? []),
      plan.purpose ?? "",
      plan.direction ?? "",
    ].join(" "),
  );

  if (
    containsAny(text, [
      "horror",
      "horrifying",
      "terrifying",
      "haunted",
      "creepy",
      "sinister",
      "nightmare",
      "cursed",
      "scary",
    ])
  ) {
    return {
      domain: "horror",
      entities: [
        "familiar place",
        "anomaly",
        "observer",
        "environment",
      ],
      affordances: [
        "observe",
        "notice",
        "investigate",
        "reinterpret",
        "escape",
      ],
      tensions: [
        "familiarity becoming uncertainty",
        "evidence contradicting expectation",
        "environment becoming less trustworthy",
      ],
      transformations: [
        "familiar → suspicious",
        "small anomaly → meaningful signal",
        "observation → threat",
        "uncertainty → inevitability",
      ],
      emotionalStart: "safe",
      emotionalTarget: "uneasy",
    };
  }

  if (
    containsAny(text, [
      "wedding",
      "wife",
      "husband",
      "married",
      "romantic",
      "romance",
      "love",
      "couple",
      "anniversary",
      "intimate",
      "connected",
      "just us",
    ])
  ) {
    return {
      domain: "romance",
      entities: [
        "partners",
        "shared moment",
        "place",
        "memory",
      ],
      affordances: [
        "share",
        "remember",
        "notice",
        "linger",
        "connect",
      ],
      tensions: [
        "private connection inside public space",
        "ordinary setting carrying unusual meaning",
        "present experience becoming future memory",
      ],
      transformations: [
        "shared → intimate",
        "ordinary → meaningful",
        "public → private",
        "moment → memory",
      ],
      emotionalStart: "connected",
      emotionalTarget: "intimate",
    };
  }

  if (
    containsAny(text, [
      "funny",
      "comedy",
      "absurd",
      "ridiculous",
      "wild",
      "weird",
      "playful",
      "hilarious",
      "silly",
      "groomer",
      "grooming",
      "dog",
      "spa",
      "billionaire",
    ])
  ) {
    return {
      domain: "comedy",
      entities: [
        "subject",
        "expectation",
        "decision",
        "consequence",
      ],
      affordances: [
        "misbehave",
        "overreact",
        "reinterpret",
        "escalate",
        "commit",
      ],
      tensions: [
        "expectation versus personality",
        "reasonable plan versus unreasonable consequence",
        "small decision becoming disproportionate",
      ],
      transformations: [
        "ordinary → questionable",
        "questionable → committed",
        "small → disproportionate",
        "consequence → absurd payoff",
      ],
      emotionalStart: "neutral",
      emotionalTarget: "amused",
    };
  }

  if (
    containsAny(text, [
      "housekeeper",
      "housekeeping",
      "cleaning",
      "cleaned",
      "repair",
      "technician",
      "office",
      "client",
      "customer",
      "home",
      "document",
      "inspect",
      "service",
    ])
  ) {
    return {
      domain: "service",
      entities: [
        "worker",
        "client",
        "space",
        "condition",
        "result",
      ],
      affordances: [
        "inspect",
        "clean",
        "repair",
        "restore",
        "organize",
        "document",
        "reveal",
      ],
      tensions: [
        "visible disorder versus hidden condition",
        "before versus after",
        "work performed versus experience restored",
      ],
      transformations: [
        "accumulation → clarity",
        "disorder → order",
        "neglect → restoration",
        "problem → relief",
        "space → renewed possibility",
      ],
      emotionalStart: "overwhelmed",
      emotionalTarget: "relieved",
    };
  }

  if (
    containsAny(text, [
      "concert",
      "musician",
      "guitar",
      "portal",
      "universe",
      "memory",
      "memories",
      "magical",
      "wonder",
      "discovery",
    ])
  ) {
    return {
      domain: "wonder",
      entities: [
        "observer",
        "ordinary world",
        "discovery",
        "meaning",
      ],
      affordances: [
        "notice",
        "discover",
        "connect",
        "reinterpret",
        "remember",
      ],
      tensions: [
        "ordinary world containing unexpected significance",
        "known becoming newly visible",
        "small discovery implying something larger",
      ],
      transformations: [
        "ordinary → remarkable",
        "noticed → discovered",
        "event → meaning",
        "moment → possibility",
      ],
      emotionalStart: "curious",
      emotionalTarget: "wonder",
    };
  }

  const direction = lower(plan.direction);

  if (
    [
      "story",
      "memory",
      "discovery",
      "social",
      "journey",
      "ritual",
      "identity",
      "game",
      "commerce",
    ].includes(direction)
  ) {
    return {
      domain: "cinematic",
      entities: [
        "subject",
        "environment",
        "event",
        "meaning",
      ],
      affordances: [
        "notice",
        "change",
        "connect",
        "reinterpret",
        "remember",
      ],
      tensions: [
        "ordinary event versus remembered significance",
        "what happened versus what it means",
        "present action versus future memory",
      ],
      transformations: [
        "ordinary → significant",
        "event → story",
        "action → consequence",
        "moment → memory",
      ],
      emotionalStart: "neutral",
      emotionalTarget: "meaningful",
    };
  }

  /**
   * FALLBACK
   *
   * Super Cog should not die just because the prompt does not contain
   * one of our known domain words.
   */
  return {
    domain: "cinematic",
    entities: [
      "subject",
      "environment",
      "activity",
      "consequence",
    ],
    affordances: [
      "notice",
      "reinterpret",
      "contrast",
      "reveal",
      "change_perspective",
    ],
    tensions: [
      "ordinary action versus unexpected significance",
      "what happens versus how it is experienced",
      "present action versus remembered consequence",
    ],
    transformations: [
      "ordinary → specific",
      "specific → meaningful",
      "action → consequence",
      "moment → memory",
    ],
    emotionalStart: "neutral",
    emotionalTarget: "meaningful",
  };
}

/**
 * Extract the smallest useful situation.
 *
 * We deliberately do not rewrite the entire prompt.
 */
function situationModel(
  prompt: string,
  plan: CognitiveExperiencePlan,
  premise?: CognitivePremise,
  domain?: DomainModel,
): SituationModel {
  const s = subject(plan, premise);
  const activity = promptActivity(prompt, plan);

  const premiseValues =
    premise?.slots.flatMap(
      (slot) => slot.values ?? [],
    ) ?? [];

  const setting =
    clean(
      premise?.slots.find(
        (slot) =>
          slot.role === "medium" ||
          slot.role === "event" ||
          slot.role === "social" ||
          slot.role === "temporal" ||
          slot.role === "constraint",
      )?.values?.[0],
    ) ||
    clean(
      premiseValues.find((value) =>
        /\b(?:home|house|room|office|restaurant|venue|studio|salon|park|city|street|hotel|church|kitchen|bathroom|yard|garage|shop|store|client)\b/i.test(
          value,
        ),
      ),
    ) ||
    "the surrounding environment";

  const change =
    clean(
      plan.realization?.semanticArc?.at(-1),
    ) ||
    clean(plan.purpose) ||
    domain?.transformations[0] ||
    "the situation changes";

  const tension =
    domain?.tensions[0] ||
    "what is happening versus what it comes to mean";

  const opportunity =
    domain?.transformations[0] ||
    "ordinary details can acquire significance";

  return {
    subject: s,
    activity,
    setting,
    change,
    tension,
    opportunity,
  };
}

/**
 * Detect creative opportunities already present in the situation.
 *
 * This is important:
 *
 * Super Cog does not invent a premise first.
 * It discovers leverage already present in the premise.
 */
function detectOpportunities(
  situation: SituationModel,
  domain: DomainModel,
): CognitiveOpportunity[] {
  const text = lower(
    [
      situation.subject,
      situation.activity,
      situation.setting,
      situation.change,
      situation.tension,
      situation.opportunity,
    ].join(" "),
  );

  const opportunities: CognitiveOpportunity[] = [];

  const add = (
    kind: CognitiveOpportunity["kind"],
    signal: string,
    strength: number,
  ) => {
    opportunities.push({
      kind,
      signal,
      strength: clamp(strength),
    });
  };

  if (
    /\b(?:dog|cat|person|client|customer|owner|worker|child|friend|poodle|pet)\b/.test(
      text,
    )
  ) {
    add(
      "personality",
      `${situation.subject} can influence how the situation unfolds`,
      0.82,
    );
  }

  if (
    situation.activity &&
    situation.change &&
    lower(situation.activity) !==
      lower(situation.change)
  ) {
    add(
      "expectation_gap",
      "the expected activity and the resulting change are not identical",
      0.7,
    );
  }

  if (
    /\b(?:before|after|finished|completed|restored|clean|changed|groomed|washed|trimmed|fixed)\b/.test(
      text,
    )
  ) {
    add(
      "contrast",
      "the difference between states can become visible",
      0.78,
    );
  }

  if (
    /\b(?:small|little|tiny|minor|simple|ordinary|routine)\b/.test(
      text,
    )
  ) {
    add(
      "escalation",
      "a small event can become disproportionately meaningful",
      0.72,
    );
  }

  if (
    /\b(?:notice|discover|hidden|secret|meaning|memory|remember|strange|odd|unexpected)\b/.test(
      text,
    )
  ) {
    add(
      "hidden_meaning",
      "an existing detail can acquire a different interpretation",
      0.8,
    );
  }

  if (
    domain.domain === "comedy" ||
    domain.domain === "horror"
  ) {
    add(
      "agency",
      "the subject or environment can appear to influence the experience",
      0.72,
    );
  }
   if (situation.change) {

    add(
      "consequence",
      "the initial event can create a secondary consequence",
      0.68,
    );
  }

  return opportunities
    .sort((a, b) => b.strength - a.strength)
    .slice(0, 5);
}

/**
 * Candidate generation.
 *
 * Super Cog gets multiple ways to think about the same situation.
 *
 * IMPORTANT:
 * Opportunities are inputs to operation generation.
 * They do not make the final decision.
 */
function candidateOperations(
  situation: SituationModel,
  domain: DomainModel,
  beatKind?: CognitiveBeatKind,
  opportunities: CognitiveOpportunity[] = [],
): CognitiveOperation[] {
  const operations: CognitiveOperation[] = [];

  const add = (
    operation: CognitiveOperation,
  ) => {
    if (!operations.includes(operation)) {
      operations.push(operation);
    }
  };

  /**
   * Opportunity-driven cognition.
   *
   * This is where the detected situation leverage becomes
   * actual candidate operations.
   */
  for (const opportunity of opportunities) {
    switch (opportunity.kind) {
      case "expectation_gap":
        add("invert");
        add("reinterpret");
        break;

      case "personality":
        add("personify");
        add("transfer_agency");
        add("magnify");
        break;

      case "contrast":
        add("contrast");
        add("externalize");
        break;

      case "escalation":
        add("magnify");
        add("escalate");
        break;

      case "hidden_meaning":
        add("reinterpret");
        add("reveal");
        add("symbolize");
        break;

      case "agency":
        add("personify");
        add("transfer_agency");
        break;

      case "consequence":
        add("escalate");
        add("externalize");
        break;
    }
  }

  const text = lower(
    [
      situation.activity,
      situation.change,
      situation.tension,
      situation.opportunity,
      beatKind ?? "",
    ].join(" "),
  );

  /**
   * Beat-specific cognitive pressure.
   */
  if (
    beatKind === "reveal" ||
    beatKind === "discovery" ||
    /\b(?:reveal|discover|hidden|secret|notice)\b/.test(
      text,
    )
  ) {
    add("reveal");
    add("reinterpret");
  }

  if (
    beatKind === "reflection" ||
    /\b(?:memory|remember|meaning|significance|identity)\b/.test(
      text,
    )
  ) {
    add("reinterpret");
    add("symbolize");
    add("change_perspective");
  }

  if (
    beatKind === "escalation" ||
    beatKind === "transformation"
  ) {
    add("escalate");
    add("magnify");
    add("invert");
    add("personify");
  }

  /**
   * Domain affordances.
   *
   * These are candidates, NOT decisions.
   */
  switch (domain.domain) {
    case "comedy":
      add("magnify");
      add("personify");
      add("invert");
      add("transfer_agency");
      add("escalate");
      add("reinterpret");
      break;

    case "romance":
      add("collapse_distance");
      add("reinterpret");
      add("symbolize");
      add("change_perspective");
      add("externalize");
      break;

    case "horror":
      add("reinterpret");
      add("reveal");
      add("transfer_agency");
      add("invert");
      add("escalate");
      break;

    case "service":
      add("contrast");
      add("externalize");
      add("reveal");
      add("personify");
      add("symbolize");
      break;

    case "wonder":
      add("change_perspective");
      add("reveal");
      add("reinterpret");
      add("symbolize");
      add("externalize");
      break;

    case "cinematic":
      add("externalize");
      add("reinterpret");
      add("change_perspective");
      add("symbolize");
      add("reveal");
      add("contrast");
      break;
  }

  /**
   * Semantic pressure can introduce additional operations.
   */
  if (
    /\b(?:small|little|tiny|minor|simple|routine)\b/.test(
      text,
    )
  ) {
    add("magnify");
    add("symbolize");
  }

  if (
    /\b(?:strange|odd|weird|unexpected|surprising)\b/.test(
      text,
    )
  ) {
    add("invert");
    add("reinterpret");
    add("reveal");
  }

  if (
    /\b(?:before|after|fixed|clean|restored|finished|completed|groomed|trimmed)\b/.test(
      text,
    )
  ) {
    add("contrast");
    add("externalize");
  }

  if (
    /\b(?:person|dog|cat|client|customer|worker|owner|child|friend|pet|poodle)\b/.test(
      text,
    )
  ) {
    add("personify");
    add("transfer_agency");
  }

  return operations.length
    ? operations
    : [
        "externalize",
        "reinterpret",
        "change_perspective",
      ];
}

/**
 * Transform an existing state.
 *
 * Nothing here is permitted to introduce a completely unrelated object.
 */
function transform(
  situation: SituationModel,
  domain: DomainModel,
  operation: CognitiveOperation,
): CognitiveTransformation {
  switch (operation) {
    case "collapse_distance":
      return {
        operation,
        sourceState: "shared experience",
        transformedState:
          "the surrounding world feels less important",
        consequence:
          "the setting becomes a container for the relationship rather than the focus of attention",
        emotionalEffect: "intimacy",
      };

    case "reinterpret":
      return {
        operation,
        sourceState: situation.change,
        transformedState:
          domain.domain === "horror"
            ? "an ordinary detail acquires threatening meaning"
            : "an ordinary detail acquires emotional meaning",
        consequence:
          domain.domain === "horror"
            ? "what seemed familiar can no longer be interpreted the same way"
            : "the original event becomes more meaningful when viewed from another perspective",
        emotionalEffect:
          domain.domain === "horror"
            ? "unease"
            : "meaning",
      };

    case "magnify":
      return {
        operation,
        sourceState: situation.change,
        transformedState:
          "a small consequence becomes disproportionately important",
        consequence:
          domain.domain === "comedy"
            ? "the subject's personality turns an ordinary situation into something harder to contain"
            : "the original change becomes impossible to ignore",
        emotionalEffect:
          domain.domain === "comedy"
            ? "amusement"
            : "impact",
      };

    case "contrast":
      return {
        operation,
        sourceState: situation.change,
        transformedState:
          "the difference between before and after becomes perceptible",
        consequence:
          "the result communicates the value of what happened without requiring the work itself to be explained",
        emotionalEffect: "relief",
      };

    case "reveal":
      return {
        operation,
        sourceState: situation.opportunity,
        transformedState:
          "something already present becomes newly visible",
        consequence:
          "the observer understands the situation differently because of what has been revealed",
        emotionalEffect:
          domain.domain === "horror"
            ? "unease"
            : "discovery",
      };

    case "escalate":
      return {
        operation,
        sourceState: situation.change,
        transformedState:
          "the first consequence produces a second consequence",
        consequence:
          "the situation can no longer return to its original state without acknowledging what happened",
        emotionalEffect: "momentum",
      };

    case "change_perspective":
      return {
        operation,
        sourceState: situation.activity,
        transformedState:
          "the same event becomes more significant from another point of view",
        consequence:
          "the observer notices meaning that was invisible from the original perspective",
        emotionalEffect: "wonder",
      };

    case "personify":
      return {
        operation,
        sourceState: situation.setting,
        transformedState:
          "the environment appears to express the result of what happened",
        consequence:
          "the physical environment communicates an emotional state",
        emotionalEffect: "relief",
      };

    case "externalize":
      return {
        operation,
        sourceState: situation.change,
        transformedState:
          "an internal or abstract change becomes visible in the environment",
        consequence:
          "the observer can experience the change rather than merely being told about it",
        emotionalEffect: "recognition",
      };

    case "invert":
      return {
        operation,
        sourceState: situation.activity,
        transformedState:
          "the expected interpretation is reversed",
        consequence:
          "the familiar action produces an unexpectedly revealing result",
        emotionalEffect: "surprise",
      };

    case "transfer_agency":
      return {
        operation,
        sourceState: situation.setting,
        transformedState:
          "the environment appears to participate in the experience",
        consequence:
          "the setting becomes part of the story rather than passive background",
        emotionalEffect: "immersion",
      };

    case "symbolize":
      return {
        operation,
        sourceState: situation.change,
        transformedState:
          "a concrete change stands for a larger emotional change",
        consequence:
          "the small event carries meaning beyond itself",
        emotionalEffect: "resonance",
      };

    default:
      return {
        operation,
        sourceState: situation.change,
        transformedState:
          "the situation acquires a new consequence",
        consequence:
          "the moment becomes more memorable",
        emotionalEffect: domain.emotionalTarget,
      };
  }
}

/**
 * Build a candidate moment from one possible cognitive operation.
 */
function buildCognitiveMoment(
  situation: SituationModel,
  domain: DomainModel,
  operation: CognitiveOperation,
): CognitiveMoment {
  const transformation = transform(
    situation,
    domain,
    operation,
  );

  const expectation =
    domain.domain === "comedy"
      ? "the situation should remain reasonably normal"
      : domain.domain === "horror"
        ? "the familiar environment should remain trustworthy"
        : domain.domain === "romance"
          ? "the shared experience should remain connected to the surrounding world"
          : "the situation should proceed according to its ordinary expectation";

  const deviation =
    transformation.transformedState;

  const consequence =
    transformation.consequence;

  const agency =
    domain.domain === "comedy"
      ? `${situation.subject} contributes to the situation rather than merely experiencing it`
      : domain.domain === "horror"
        ? "the environment becomes an active source of uncertainty"
        : domain.domain === "service"
          ? "the result becomes evidence of what happened"
          : `${situation.subject} becomes part of what the moment comes to mean`;

  return {
    observation: situation.change,
    expectation,
    deviation,
    consequence,
    emotionalShift:
      transformation.emotionalEffect,
    agency,
  };
}

/**
 * SCORE CANDIDATE
 *
 * We do NOT ask:
 *
 *   "Which operation belongs to this domain?"
 *
 * We ask:
 *
 *   "Which possible transformation produces the strongest experience
 *    while remaining attached to the actual situation?"
 */
function scoreCandidate(
  candidate: {
    operation: CognitiveOperation;
    moment: CognitiveMoment;
  },
  situation: SituationModel,
  domain: DomainModel,
  beatKind?: CognitiveBeatKind,
): CognitiveCandidate {
  const momentText = [
    candidate.moment.observation,
    candidate.moment.expectation,
    candidate.moment.deviation,
    candidate.moment.consequence,
    candidate.moment.emotionalShift,
    candidate.moment.agency,
  ].join(" ");

  const sourceText = [
    situation.subject,
    situation.activity,
    situation.setting,
    situation.change,
    situation.tension,
    situation.opportunity,
  ].join(" ");

  /**
   * Specificity:
   *
   * Does the candidate remain attached to THIS subject/situation?
   */
  const subjectPresence =
    lower(momentText).includes(
      lower(situation.subject),
    )
      ? 0.35
      : 0;

  const settingPresence =
    lower(momentText).includes(
      lower(situation.setting),
    )
      ? 0.25
      : 0;

  const sourceOverlap = overlapScore(
    sourceText,
    momentText,
  );

  const specificity = clamp(
    subjectPresence +
      settingPresence +
      sourceOverlap * 0.55,
  );

  /**
   * Causal fit:
   *
   * Strong candidates should transform something that already exists.
   */
  const causalOverlap = overlapScore(
    situation.change,
    momentText,
  );

  const opportunityOverlap = overlapScore(
    situation.opportunity,
    momentText,
  );

  const activityOverlap = overlapScore(
    situation.activity,
    momentText,
  );

  const causalFit = clamp(
    causalOverlap * 0.45 +
      opportunityOverlap * 0.35 +
      activityOverlap * 0.2,
  );

  /**
   * Novelty:
   *
   * We reward deviation from expectation.
   * But we do not reward arbitrary weirdness.
   */
  const deviationDistance =
    lower(candidate.moment.deviation) !==
    lower(candidate.moment.expectation);

  let novelty = deviationDistance
    ? 0.55
    : 0.25;

  if (
    [
      "invert",
      "personify",
      "transfer_agency",
      "symbolize",
    ].includes(candidate.operation)
  ) {
    novelty += 0.18;
  }

  if (candidate.operation === "externalize") {
    novelty += 0.08;
  }

  if (candidate.operation === "reinterpret") {
    novelty += 0.12;
  }

  novelty = clamp(novelty);

  /**
   * Payoff:
   *
   * A strong transformation should create a consequence
   * that can actually close a beat.
   */
  const consequenceLength = wordCount(
    candidate.moment.consequence,
  );

  const consequenceStrength =
    consequenceLength >= 10
      ? 0.75
      : consequenceLength >= 6
        ? 0.55
        : 0.35;

  let payoffPotential =
    consequenceStrength;

  if (
    [
      "magnify",
      "escalate",
      "reveal",
      "invert",
      "reinterpret",
      "symbolize",
    ].includes(candidate.operation)
  ) {
    payoffPotential += 0.18;
  }

  if (beatKind === "payoff") {
    payoffPotential += 0.15;
  }

  payoffPotential = clamp(
    payoffPotential,
  );

  /**
   * Emotional movement:
   *
   * The candidate should move the audience somewhere.
   */
  let emotionalMovement = 0.45;

  if (
    candidate.moment.emotionalShift !==
    domain.emotionalStart
  ) {
    emotionalMovement += 0.25;
  }

  if (
    candidate.moment.emotionalShift ===
    domain.emotionalTarget
  ) {
    emotionalMovement += 0.25;
  }

  if (
    [
      "reinterpret",
      "contrast",
      "collapse_distance",
      "change_perspective",
      "symbolize",
    ].includes(candidate.operation)
  ) {
    emotionalMovement += 0.08;
  }

  emotionalMovement = clamp(
    emotionalMovement,
  );

  /**
   * Weighted synthesis.
   *
   * Causality and specificity are deliberately heavy.
   * Otherwise "creative" becomes random.
   */
  const totalScore = clamp(
    novelty * 0.2 +
      specificity * 0.22 +
      causalFit * 0.27 +
      payoffPotential * 0.18 +
      emotionalMovement * 0.13,
  );

  return {
    operation: candidate.operation,
    moment: candidate.moment,
    novelty,
    specificity,
    causalFit,
    payoffPotential,
    emotionalMovement,
    totalScore,
  };
}

/**
 * Choose the strongest candidate.
 *
 * Important:
 *
 * We intentionally keep the candidate pool small.
 * This is cognition, not brute-force generation.
 */
function chooseBestCandidate(
  situation: SituationModel,
  domain: DomainModel,
  beatKind?: CognitiveBeatKind,
): CognitiveCandidate {
  /**
   * Discover the opportunities FIRST.
   *
   * This was previously missing from the actual execution path.
   */
  const opportunities = detectOpportunities(
    situation,
    domain,
  );

  const operations = candidateOperations(
    situation,
    domain,
    beatKind,
    opportunities,
  );

  const candidates = operations.map(
    (operation) => {
      const moment =
        buildCognitiveMoment(
          situation,
          domain,
          operation,
        );

      return scoreCandidate(
        {
          operation,
          moment,
        },
        situation,
        domain,
        beatKind,
      );
    },
  );

  candidates.sort(
    (a, b) =>
      b.totalScore - a.totalScore,
  );

  return (
    candidates[0] ??
    scoreCandidate(
      {
        operation: "externalize",
        moment: buildCognitiveMoment(
          situation,
          domain,
          "externalize",
        ),
      },
      situation,
      domain,
      beatKind,
    )
  );
}

/**
 * Build a full cognitive trajectory.
 *
 * We keep this lightweight, but it gives Super Cog a causal chain:
 *
 *   observation
 *      ↓
 *   expectation
 *      ↓
 *   deviation
 *      ↓
 *   consequence
 *      ↓
 *   payoff
 */
function buildTrajectory(
  situation: SituationModel,
  domain: DomainModel,
  candidate: CognitiveCandidate,
): CognitiveTrajectory {
  const transformation = transform(
    situation,
    domain,
    candidate.operation,
  );

  const moments: CognitiveMoment[] = [
    {
      observation: situation.change,
      expectation:
        candidate.moment.expectation,
      deviation:
        candidate.moment.deviation,
      consequence:
        candidate.moment.consequence,
      emotionalShift:
        candidate.moment.emotionalShift,
      agency: candidate.moment.agency,
    },
  ];

  const payoff =
    domain.domain === "comedy"
      ? `${situation.subject} somehow leaves the situation more memorable than it had any right to be.`
      : domain.domain === "romance"
        ? `The event matters because the experience has become something the two of them will remember together.`
        : domain.domain === "horror"
          ? `The situation ends with the unsettling realization that the meaning of what happened cannot be ignored.`
          : domain.domain === "service"
            ? `The result becomes its own proof that the situation has changed.`
            : domain.domain === "wonder"
              ? `The ordinary moment leaves behind the feeling that something larger was hiding inside it all along.`
              : `The moment leaves behind a consequence larger than the original event.`;

  /**
   * Ensure the transformation itself remains represented
   * in the trajectory.
   */
  moments.push({
    observation:
      transformation.sourceState,
    expectation:
      candidate.moment.expectation,
    deviation:
      transformation.transformedState,
    consequence:
      transformation.consequence,
    emotionalShift:
      transformation.emotionalEffect,
    agency:
      candidate.moment.agency,
  });

  return {
    moments,
    candidate,
    payoff,
  };
}

/**
 * REALIZATION
 *
 * The renderer receives a selected transformation,
 * not a canned scene.
 */
function realize(
  situation: SituationModel,
  domain: DomainModel,
  transformation: CognitiveTransformation,
  beatKind?: CognitiveBeatKind,
): string {
  const s = situation.subject;
  const setting = situation.setting;

  if (beatKind === "reflection") {
    switch (transformation.operation) {
      case "contrast":
        return `The clearest sign of the change was not the work itself, but how different ${setting} felt afterward.`;

      case "collapse_distance":
        return `The part worth remembering was not the setting itself, but how completely it seemed to belong to the two of them.`;

      case "reinterpret":
        return domain.domain === "horror"
          ? `The unsettling part was realizing that the place had not changed nearly as much as the meaning of it had.`
          : `The moment stayed because the same ordinary details meant something different once the experience was over.`;

      case "change_perspective":
        return `Seen another way, it was more than an event. It was the moment something ordinary became worth remembering.`;

      case "symbolize":
        return `The small detail mattered because it had quietly become a stand-in for everything the moment had come to mean.`;

      default:
        return `The interesting part was what the moment came to mean after everything else had happened.`;
    }
  }

  if (beatKind === "payoff") {
    switch (domain.domain) {
      case "service":
        return `By the end, ${setting} no longer looked like a problem waiting to be solved. It looked ready to be lived in again.`;

      case "romance":
        return `By the end, the setting mattered less than the feeling that, for a little while, the rest of the world had fallen away.`;

      case "horror":
        return `By the end, the frightening part was not what had appeared, but what could no longer be explained away.`;

      case "comedy":
        return `${s} somehow reached the end of the day looking innocent, which was impressive considering how far the original plan had traveled.`;

      case "wonder":
        return `By the end, the ordinary moment felt larger than the event that had created it.`;

      default:
        return `By the end, the event had become something larger than the event itself.`;
    }
  }

  switch (transformation.operation) {
    case "collapse_distance":
      return `The world was still there around ${s}, but for a moment it felt strangely far away.`;

    case "reinterpret":
      return domain.domain === "horror"
        ? `At first, nothing about ${setting} seemed unusual. Then one detail changed what everything else meant.`
        : `${s} had seen the same ordinary details before. This time, they seemed to mean something different.`;

    case "magnify":
      return `${s} made one small decision, and somehow that decision acquired considerably more importance than anyone had planned for.`;

    case "contrast":
      return `The change was easy to see: ${setting} had gone from carrying the evidence of everything that had accumulated to quietly showing the result of what had been restored.`;

    case "reveal":
      return `Nothing new had to be invented. One detail simply became visible enough to change the way the whole moment was understood.`;

    case "escalate":
      return `The first change created another, and suddenly the moment had its own momentum.`;

    case "change_perspective":
      return `From one angle it was ordinary. From another, the moment had quietly become something worth remembering.`;

    case "personify":
      return `${setting} seemed to express the change for itself, as if the environment finally understood what had just happened.`;

    case "externalize":
      return `What had been an invisible change became something ${s} could actually see around them.`;

    case "invert":
      return `The expected version of the moment never quite arrived. What happened instead revealed something more interesting.`;

    case "transfer_agency":
      return `For a moment, ${setting} stopped feeling like background and started behaving like part of the experience.`;

    case "symbolize":
      return `The small change carried a larger meaning: something in the moment had shifted, and everyone could feel it.`;

    default:
      return `Something about the moment had changed, even if the original event looked ordinary from the outside.`;
  }
}

/**
 * BUILD COGNITION
 *
 * This is now genuinely candidate-driven:
 *
 *   domain
 *      ↓
 *   situation
 *      ↓
 *   opportunities
 *      ↓
 *   candidates
 *      ↓
 *   scoring
 *      ↓
 *   transformation
 */
function buildCognition(
  prompt: string,
  plan: CognitiveExperiencePlan,
  premise?: CognitivePremise,
  beatKind?: CognitiveBeatKind,
): CognitiveRealization | undefined {
  const domain = domainModel(
    prompt,
    plan,
  );

  if (!domain) {
    return undefined;
  }

  const situation = situationModel(
    prompt,
    plan,
    premise,
    domain,
  );

  const candidate =
    chooseBestCandidate(
      situation,
      domain,
      beatKind,
    );

  const transformation = transform(
    situation,
    domain,
    candidate.operation,
  );

  return {
    domain,
    situation,
    transformation,
  };
}

function evidence(
  text: string,
  cognition?: CognitiveRealization,
): CognitiveEvidence {
  const operation =
    cognition?.transformation.operation ??
    "externalize";

  const consequence =
    cognition?.transformation.consequence ??
    "the situation acquires a new experiential consequence";

  return {
    source: "creative_realization",
    detail:
      `creative cognition: ${operation}; ` +
      `consequence: ${consequence}; ` +
      `realization: ${text}`,
    confidence: 0.9,
  };
}

function sceneForKind(
  cognition: CognitiveRealization,
  kind: CognitiveBeatKind,
): string {
  return realize(
    cognition.situation,
    cognition.domain,
    cognition.transformation,
    kind,
  );
}

/**
 * PUBLIC REALIZATION AUGMENTATION
 */
export function augmentCreativeRealization(args: {
  prompt: string;
  plan: CognitiveExperiencePlan;
  premise?: CognitivePremise;
  realization: CognitiveExperienceRealization;
}): CognitiveExperienceRealization {
  const directives =
    args.realization.directives.map(
      (directive) => {
        const cognition =
          buildCognition(
            args.prompt,
            args.plan,
            args.premise,
            directive.kind,
          );

        if (!cognition) {
          return directive;
        }

        const text = sceneForKind(
          cognition,
          directive.kind,
        );

        const created = evidence(
          text,
          cognition,
        );

        return {
          ...directive,
          action: text,
          evidence: [
            ...directive.evidence.filter(
              (item) =>
                item.source !==
                "creative_realization",
            ),
            created,
          ].slice(0, 8),
          confidence: Math.max(
            directive.confidence,
            created.confidence,
          ),
        };
      },
    );

  return {
    ...args.realization,
    directives,
    semanticArc: directives.map(
      (directive) =>
        `${directive.intent} → ${directive.stateAfter}`,
    ),
  };
}

/**
 * PUBLIC BEAT REALIZATION
 */
export function realizeCreativeBeat(args: {
  prompt: string;
  plan: CognitiveExperiencePlan;
  premise?: CognitivePremise;
  beat: StoryBeat;
  baseText: string;
}): string | undefined {
  const cognition =
    buildCognition(
      args.prompt,
      args.plan,
      args.premise,
      args.beat.kind,
    );

  if (!cognition) {
    return args.baseText || undefined;
  }

  return sceneForKind(
    cognition,
    args.beat.kind,
  );
}