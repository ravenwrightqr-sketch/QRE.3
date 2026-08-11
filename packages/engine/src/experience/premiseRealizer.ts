import type {
  CognitiveExperiencePlan,
  CognitivePremise,
  CognitivePremiseRole,
  StoryBeat,
} from "@qre/contracts";

/**
 * =============================================================================
 * CANONICAL UNIVERSAL PREMISE REALIZER
 * =============================================================================
 *
 * Cognition owns meaning.
 * Trajectory owns causal pressure.
 * The universal compiler owns structure.
 *
 * This boundary translates those constraints into observable,
 * evidence-backed events expressed as natural language.
 *
 * CRITICAL INVARIANTS
 *
 * 1. Semantic significance is never presentation copy.
 *
 * 2. Abstract cognitive directives never become literal story language.
 *
 * 3. Concrete prompt/premise evidence survives realization whenever available.
 *
 * 4. Concrete directive actions outrank generic prose.
 *
 * 5. A beat must describe something that happens, changes, appears,
 *    becomes available, or remains available because of the trajectory.
 *
 * 6. Compiler artifacts are never promoted to experiential evidence.
 *
 * 7. Expressive mechanics must become visible in presentation.
 *
 * 8. Cognitive mechanics are expressed through observable consequences,
 *    not through mechanic names.
 *
 * 9. Authoritative realization directives are not required to contain
 *    multiple lexical tokens. A concrete one-word or short action is
 *    still a valid executable action.
 */

const clean = (value: unknown): string =>
  typeof value === "string"
    ? value.replace(/\s+/g, " ").trim()
    : "";

const lower = (value: unknown): string =>
  clean(value).toLowerCase().replace(/[’]/g, "'");

const sentence = (value: unknown): string =>
  clean(value).replace(/[.!?]+$/, "");

const cap = (value: unknown): string => {
  const text = clean(value);
  return text
    ? text.charAt(0).toUpperCase() + text.slice(1)
    : "The subject";
};

/**
 * These phrases describe compiler intent rather than observable experience.
 * They must never survive into final presentation.
 */
const DEAD_PROSE: RegExp[] = [
  /the experience puts into focus/i,
  /deserves a closer look/i,
  /gives the story somewhere concrete to begin/i,
  /the next layer/i,
  /the next move follows from the state reached here/i,
  /what the experience has revealed/i,
  /has become more meaningful through the interaction/i,
  /the experience leaves a meaning behind/i,
  /giving the moment a direction/i,
  /lands differently because of everything that happened/i,
  /the supplied premise/i,
  /the supplied context/i,
  /the concrete detail is/i,
  /the next concrete condition in the premise/i,
  /reaches the result established by the premise/i,
  /the situation is now meaningful/i,
  /the experience becomes more interesting/i,
];

/**
 * Strings that may be valid cognitive instructions but are not executable
 * presentation actions.
 */
const ABSTRACT_DIRECTIVE: RegExp[] = [
  /make .*?\bmatte?r\b/i,
  /make .*?\bmeaningful\b/i,
  /make .*?\bexplicit\b/i,
  /connect .*? to meaning/i,
  /connect .*? with identity/i,
  /surface .*? evidence/i,
  /preserve .*? context/i,
  /adapt to accumulated/i,
  /adapt to .*? history/i,
  /allow participants to/i,
  /let participants/i,
  /enter living memory/i,
  /witness .*? contribute/i,
  /affect shared state/i,
  /change what can happen next/i,
  /determine what happens next/i,
  /use the current state/i,
  /carry .*? into the present/i,
  /recognize what .*? means/i,
  /recognize .*? significance/i,
  /create a reason to continue/i,
  /provide the next relevant knowledge/i,
  /resolve the current experience/i,
  /continue from the current state/i,
  /advance the selected cognitive direction/i,
  /the intended experiential result/i,
  /the useful target/i,
  /the next available relationship/i,
  /the next supported condition/i,
  /go further than before/i,
  /increase the active condition/i,
  /carry the preceding state/i,
  /reach the result produced by what happened before/i,
];

/**
 * Compiler-generated fragments that are neither evidence nor
 * executable actions.
 */
const COMPILER_FRAGMENT: RegExp[] = [
  /^gets increasingly\b/i,
  /^becomes increasingly\b/i,
  /^increasingly\b/i,
  /^the current condition\b/i,
  /^the changed state\b/i,
  /^the next state\b/i,
  /^the resulting state\b/i,
  /^the active condition\b/i,
  /^the accumulated state\b/i,
  /^the preceding state\b/i,
  /^what happens next\b/i,
  /^what follows\b/i,
  /^the situation\b/i,
  /^the experience\b/i,
  /^the interaction\b/i,
  /^the result\b/i,
];

/**
 * Known extraction artifacts.
 *
 * These are deliberately narrow. They clean malformed compiler output
 * without trying to become a domain-specific vocabulary.
 */
const EXTRACTION_ARTIFACT: RegExp[] = [
  /^n\b/i,
  /^n\s+/i,
  /\band gets$/i,
  /\bgets\s*$/i,
  /^the interaction$/i,
  /^the experience$/i,
  /^the situation$/i,
];

/**
 * Only roles with actual experiential payload are permitted to contribute
 * evidence.
 */
const ROLES: CognitivePremiseRole[] = [
  "subject",
  "event",
  "medium",
  "artifact",
  "participants",
  "outcome",
  "emotion",
  "affordance",
  "temporal",
  "place",
  "social",
  "transformation",
  "constraint",
];

const STOP = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "because",
  "by",
  "can",
  "could",
  "create",
  "do",
  "does",
  "doing",
  "for",
  "from",
  "get",
  "gets",
  "give",
  "gives",
  "given",
  "has",
  "have",
  "how",
  "i",
  "if",
  "in",
  "into",
  "is",
  "it",
  "its",
  "make",
  "makes",
  "making",
  "me",
  "my",
  "of",
  "on",
  "or",
  "our",
  "people",
  "please",
  "that",
  "the",
  "their",
  "this",
  "those",
  "to",
  "turn",
  "up",
  "was",
  "we",
  "what",
  "when",
  "where",
  "which",
  "who",
  "with",
  "you",
  "your",
  "something",
  "someone",
  "thing",
  "experience",
  "story",
  "about",
  "through",
  "just",
  "more",
  "than",
  "then",
  "now",
  "will",
  "keep",
  "after",
  "before",
  "very",
  "really",
  "want",
  "needs",
  "need",
  "next",
  "concrete",
  "current",
  "available",
  "supported",
  "meaningful",
  "intended",
  "useful",
  "immediate",
  "observed",
  "situation",
  "condition",
  "state",
  "change",
  "changed",
  "result",
  "interaction",
]);

function premise(
  plan?: CognitiveExperiencePlan,
): CognitivePremise | undefined {
  return plan?.premise;
}

function unique(items: string[]): string[] {
  return [...new Set(items.map(clean).filter(Boolean))];
}

function matchesAny(value: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(value));
}

function abstractDirective(value: string): boolean {
  return matchesAny(value, ABSTRACT_DIRECTIVE);
}

function generic(value: string): boolean {
  return matchesAny(value, DEAD_PROSE);
}

function compilerFragment(value: string): boolean {
  return matchesAny(value, COMPILER_FRAGMENT);
}

function extractionArtifact(value: string): boolean {
  return matchesAny(value, EXTRACTION_ARTIFACT);
}

/**
 * Strip only known lexical pollution.
 */
function cleanEvidenceValue(value: unknown): string {
  let text = sentence(value);

  if (!text) return "";

  text = text
    .replace(/^n\s+/i, "")
    .replace(/\s+and\s+gets$/i, "")
    .replace(/\s+gets$/i, "")
    .replace(/\bthe interaction\b/gi, "")
    .replace(/\bthe experience\b/gi, "")
    .replace(/\bthe situation\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  return sentence(text);
}

/**
 * A value is presentation-safe only when it is concrete enough to appear
 * in an observable event.
 */
function presentationSafe(value: string): boolean {
  const text = cleanEvidenceValue(value);

  if (!text) return false;
  if (generic(text)) return false;
  if (abstractDirective(text)) return false;
  if (compilerFragment(text)) return false;
  if (extractionArtifact(text)) return false;

  return true;
}

function values(
  plan: CognitiveExperiencePlan | undefined,
  role: CognitivePremiseRole,
): string[] {
  const raw =
    premise(plan)?.slots
      .filter((slot) => slot.role === role)
      .flatMap((slot) => slot.values)
      .filter((value): value is string => typeof value === "string") ?? [];

  return unique(
    raw
      .map(cleanEvidenceValue)
      .filter(presentationSafe)
      .filter(
        (value) =>
          role !== "outcome" || !abstractDirective(value),
      ),
  );
}

function first(
  plan: CognitiveExperiencePlan | undefined,
  role: CognitivePremiseRole,
): string {
  return values(plan, role)[0] ?? "";
}

function words(value: unknown): string[] {
  return clean(value)
    .replace(/[^\p{L}\p{N}'’-]+/gu, " ")
    .split(/\s+/)
    .map((word) => word.replace(/^['-]+|['-]+$/g, ""))
    .filter(
      (word) =>
        word.length > 2 &&
        !STOP.has(lower(word)),
    );
}

function validSubject(value: string): boolean {
  const text = cleanEvidenceValue(value);

  if (!text) return false;

  if (/^n\b/i.test(text)) return false;

  if (
    /^(?:a|an|the|this|that|something|someone|people)$/i.test(
      text,
    )
  ) {
    return false;
  }

  if (
    /^(?:create|make|build|design|turn|transform|give|write|tell|generate)\b/i.test(
      text,
    )
  ) {
    return false;
  }

  if (generic(text)) return false;
  if (abstractDirective(text)) return false;

  return true;
}

function subject(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string {
  const explicit = first(plan, "subject");

  if (validSubject(explicit)) {
    return explicit;
  }

  const entity = cleanEvidenceValue(
    beat.entities?.[0],
  );

  if (validSubject(entity)) {
    return entity;
  }

  const central = cleanEvidenceValue(
    plan?.centralSubject,
  );

  if (validSubject(central)) {
    const centralWords = words(central);

    const filtered = centralWords.filter(
      (word) => !/^n$/i.test(word),
    );

    if (filtered.length <= 5) {
      return filtered.join(" ");
    }

    return filtered[0] ?? "the subject";
  }

  return "the subject";
}

/**
 * Extract concrete premise evidence while rejecting compiler semantics.
 */
function premiseEvidence(
  plan?: CognitiveExperiencePlan,
): string[] {
  const candidates = ROLES.flatMap((role) =>
    values(plan, role),
  );

  return unique(
    candidates
      .map(cleanEvidenceValue)
      .filter(presentationSafe)
      .filter(
        (value) => words(value).length > 0,
      ),
  );
}

/**
 * Extract meaningful lexical terms from upstream material.
 *
 * This is intentionally NOT a semantic classifier.
 * It is a conservation fallback for concrete prompt evidence that may
 * never have been assigned to a premise slot.
 */
function lexicalEvidence(
  value: unknown,
): string[] {
  return words(value)
    .filter((word) => word.length >= 4)
    .filter((word) => !STOP.has(lower(word)))
    .filter(
      (word) =>
        !/^(?:interaction|experience|situation|condition|state|result|change|changed)$/i.test(
          word,
        ),
    );
}

/**
 * Extract phrases from source text while preventing compiler scaffolding
 * from becoming evidence.
 */
function lexicalPhrases(
  value: unknown,
): string[] {
  const text = cleanEvidenceValue(value);

  if (!text) return [];

  return text
    .split(
      /\s+(?:and|then|because|when|while|so|that)\s+/i,
    )
    .map(cleanEvidenceValue)
    .filter(Boolean)
    .filter(presentationSafe)
    .filter(
      (phrase) =>
        words(phrase).length >= 2,
    )
    .slice(0, 8);
}

/**
 * Beat-local evidence plus premise evidence.
 *
 * Ranking:
 *
 * event
 * artifact
 * medium
 * place
 * temporal
 * outcome
 * transformation
 * other premise roles
 * entities
 * lexical conservation
 */
function evidenceCandidates(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string[] {
  const subjectValue = lower(
    cleanEvidenceValue(
      subject(beat, plan),
    ),
  );

  const roleEvidence = ROLES.flatMap(
    (role) =>
      values(plan, role).map((value) => {
        const slot = premise(plan)?.slots.find(
          (item) =>
            item.role === role &&
            item.values.some(
              (candidate) =>
                lower(candidate) ===
                lower(value),
            ),
        );

        const priority =
          role === "event"
            ? 8
            : role === "artifact"
              ? 7
              : role === "medium"
                ? 6
                : role === "place"
                  ? 5
                  : role === "temporal"
                    ? 4
                    : role === "outcome"
                      ? 3
                      : role === "transformation"
                        ? 2
                        : 1;

        return {
          value: cleanEvidenceValue(value),
          priority:
            priority +
            (slot?.salience ?? 0),
        };
      }),
  );

  const beatLexical = unique([
    ...lexicalPhrases(beat.text),
    ...lexicalEvidence(beat.text),
  ])
    .map(cleanEvidenceValue)
    .filter(presentationSafe)
    .map((value) => ({
      value,
      priority: 4,
    }));

  const entityEvidence = (beat.entities ?? [])
    .map(cleanEvidenceValue)
    .filter(presentationSafe)
    .map((value) => ({
      value,
      priority: 6,
    }));

  const premiseFallback = premiseEvidence(
    plan,
  ).map((value) => ({
    value: cleanEvidenceValue(value),
    priority: 5,
  }));

  return unique(
    [
      ...roleEvidence,
      ...premiseFallback,
      ...entityEvidence,
      ...beatLexical,
    ]
      .filter(
        (item) =>
          presentationSafe(item.value),
      )
      .sort(
        (a, b) =>
          b.priority - a.priority,
      )
      .map((item) => item.value),
  )
    .filter(Boolean)
    .filter(
      (value) =>
        lower(value) !== subjectValue,
    )
    .filter(
      (value) =>
        !generic(value) &&
        !abstractDirective(value) &&
        !compilerFragment(value) &&
        !extractionArtifact(value),
    )
    .filter(
      (value) =>
        !STOP.has(lower(value)),
    )
    .slice(0, 6);
}

/**
 * Authoritative directive for this beat.
 */
function directiveFor(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
) {
  const item =
    plan?.realization?.directives.find(
      (candidate) =>
        candidate.kind === beat.kind,
    );

  if (!item || !clean(item.action)) {
    return undefined;
  }

  return item;
}

/**
 * Determine whether an action is actually compiler-only.
 */
function compilerOnlyDirective(
  action: string,
): boolean {
  return /^(?:make|makes|making|create|creates|creating|design|designs|designing|surface|surfaces|surfacing|adapt|adapts|adapting|allow|allows|letting|recognize|recognizes|recognizing|provide|provides|providing|resolve|resolves|resolving|advance|advances|advancing|increase|increases|increasing)\s+(?:the\s+)?(?:meaning|significance|context|evidence|identity|experience|direction|result|purpose)\b/i.test(
    action,
  );
}

/**
 * Convert a directive into an executable presentation action.
 *
 * IMPORTANT:
 *
 * A directive is authoritative cognition.
 * We therefore do not require two lexical tokens.
 *
 * "remember it"
 * "open"
 * "preserve the watch"
 * "return home"
 *
 * can all be concrete actions.
 */
function concreteDirectiveAction(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string | undefined {
  const action = sentence(
    directiveFor(beat, plan)?.action,
  );

  if (!action) return undefined;

  if (generic(action)) return undefined;

  if (compilerOnlyDirective(action)) {
    return undefined;
  }

  const lexical = lexicalEvidence(action);

  if (lexical.length === 0) {
    return undefined;
  }

  return action;
}

function evidencePair(
  items: string[],
): string {
  if (items.length === 1) {
    return items[0];
  }

  if (items.length === 2) {
    return `${items[0]} and ${items[1]}`;
  }

  return `${items.slice(0, -1).join(", ")}, and ${items.at(-1)}`;
}

/**
 * Extract the strongest concrete outcome without allowing semantic
 * interpretation to masquerade as an event.
 */
function concreteOutcome(
  plan?: CognitiveExperiencePlan,
): string {
  const outcome = first(
    plan,
    "outcome",
  );

  return presentationSafe(outcome)
    ? sentence(outcome)
    : "";
}

/**
 * Extract a concrete affordance.
 */
function concreteAffordance(
  plan?: CognitiveExperiencePlan,
): string {
  const affordance = first(
    plan,
    "affordance",
  );

  return presentationSafe(affordance)
    ? sentence(affordance)
    : "";
}

/**
 * ---------------------------------------------------------------------------
 * EXPRESSIVE PRESSURE
 * ---------------------------------------------------------------------------
 *
 * Cognitive mechanics remain cognitive.
 *
 * We never emit:
 *
 *   "The suspense mechanic activates."
 *
 * Instead we translate the lexical pressure already selected by cognition
 * into an observable event.
 *
 * This intentionally uses existing evidence and directive language rather
 * than inventing a second mechanic vocabulary or domain-specific story
 * generator.
 */

type ExpressiveSignal =
  | "suspense"
  | "uncertainty"
  | "memory"
  | "discovery"
  | "reveal"
  | "escalation"
  | "surprise"
  | "transformation"
  | "continuation";

function expressiveSource(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string {
  return [
    beat.text,
    directiveFor(beat, plan)?.action,
    ...values(plan, "event"),
    ...values(plan, "emotion"),
    ...values(plan, "transformation"),
    ...values(plan, "outcome"),
    ...values(plan, "constraint"),
    ...values(plan, "temporal"),
  ]
    .map(clean)
    .filter(Boolean)
    .join(" ");
}

function hasSignal(
  source: string,
  patterns: RegExp[],
): boolean {
  return patterns.some((pattern) =>
    pattern.test(source),
  );
}

function expressiveSignals(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): ExpressiveSignal[] {
  const source = lower(
    expressiveSource(beat, plan),
  );

  const signals: ExpressiveSignal[] = [];

  if (
    hasSignal(source, [
      /\bsuspense\b/,
      /\bthreat\b/,
      /\bmenace\b/,
      /\bterrifying\b/,
      /\bterrifyingly\b/,
      /\bwaiting\b/,
      /\bwithheld\b/,
      /\bhidden\b/,
      /\bunknown\b/,
      /\bunresolved\b/,
      /\bout of sight\b/,
      /\bnot yet\b/,
    ])
  ) {
    signals.push("suspense");
  }

  if (
    hasSignal(source, [
      /\buncertainty\b/,
      /\buncertain\b/,
      /\bunknown\b/,
      /\bnot known\b/,
      /\bcan't tell\b/,
      /\bcannot tell\b/,
      /\bunclear\b/,
      /\bunresolved\b/,
      /\bdoubt\b/,
    ])
  ) {
    signals.push("uncertainty");
  }

  if (
    hasSignal(source, [
      /\bmemory\b/,
      /\bremember\b/,
      /\bremembered\b/,
      /\bmemorial\b/,
      /\bkept\b/,
      /\bpreserved\b/,
      /\bgrandmother\b/,
      /\bgave me\b/,
      /\borigin\b/,
      /\bfrom before\b/,
    ])
  ) {
    signals.push("memory");
  }

  if (
    hasSignal(source, [
      /\bdiscover\b/,
      /\bdiscovery\b/,
      /\bfinds?\b/,
      /\bfound\b/,
      /\banother layer\b/,
      /\bnew detail\b/,
      /\bnew clue\b/,
      /\bnew information\b/,
    ])
  ) {
    signals.push("discovery");
  }

  if (
    hasSignal(source, [
      /\breveal\b/,
      /\brevealed\b/,
      /\bhidden detail\b/,
      /\bshown\b/,
      /\bbecomes visible\b/,
      /\bcomes to light\b/,
    ])
  ) {
    signals.push("reveal");
  }

  if (
    hasSignal(source, [
      /\bescalat(?:e|es|ed|ing)\b/,
      /\bescalation\b/,
      /\bmore intense\b/,
      /\bgoes further\b/,
      /\bincreasing\b/,
      /\bincreasingly\b/,
      /\bgets worse\b/,
      /\bgets bigger\b/,
      /\bgets stronger\b/,
    ])
  ) {
    signals.push("escalation");
  }

  if (
    hasSignal(source, [
      /\bsurprise\b/,
      /\bsurprising\b/,
      /\bsuddenly\b/,
      /\bunexpect(?:ed|edly)\b/,
      /\bunexpected\b/,
    ])
  ) {
    signals.push("surprise");
  }

  if (
    hasSignal(source, [
      /\btransformation\b/,
      /\btransformed\b/,
      /\btransform\b/,
      /\bchanges?\b/,
      /\bchanged\b/,
      /\bdifferent\b/,
      /\bbecomes\b/,
    ])
  ) {
    signals.push("transformation");
  }

  if (
    hasSignal(source, [
      /\bcontinu(?:e|ation)\b/,
      /\bcarry\b/,
      /\bforward\b/,
      /\bnext\b/,
      /\bkeep\b/,
    ])
  ) {
    signals.push("continuation");
  }

  return unique(
    signals,
  ) as ExpressiveSignal[];
}

/**
 * Pick evidence that can actually carry expressive pressure.
 */
function expressiveContext(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string {
  const candidates = evidenceCandidates(
    beat,
    plan,
  );

  const preferred = [
    ...values(plan, "event"),
    ...values(plan, "artifact"),
    ...values(plan, "place"),
    ...values(plan, "transformation"),
    ...values(plan, "outcome"),
    ...candidates,
  ];

  return unique(
    preferred
      .map(cleanEvidenceValue)
      .filter(presentationSafe),
  )
    .filter(
      (value) =>
        lower(value) !==
        lower(
          cleanEvidenceValue(
            subject(beat, plan),
          ),
        ),
    )
    .slice(0, 2)
    .join(" and ");
}

/**
 * Express suspense as withheld observable information.
 *
 * The result deliberately uses the evidence already supplied by cognition.
 * It does not invent a haunted house, monster, room, or threat.
 */
function expressiveSuspense(
  name: string,
  context: string,
): string {
  if (context) {
    return `${name} reaches ${context}, but what comes next remains out of sight.`;
  }

  return `${name} reaches the next point, but what comes next remains unresolved.`;
}

/**
 * Express uncertainty as missing or incomplete information.
 */
function expressiveUncertainty(
  name: string,
  context: string,
): string {
  if (context) {
    return `${name} has ${context} in view, but the outcome is still unknown.`;
  }

  return `${name} has enough to continue, but the outcome is still unknown.`;
}

/**
 * Express memory by making a concrete prior detail return to the present.
 */
function expressiveMemory(
  name: string,
  context: string,
): string {
  if (context) {
    return `${name} brings ${context} back into the present.`;
  }

  return `${name} brings a remembered detail back into the present.`;
}

function expressiveEscalation(
  name: string,
  context: string,
): string {
  if (context) {
    return `${name} goes further with ${context}.`;
  }

  return `${name} goes further, adding another layer to what is already happening.`;
}

function expressiveDiscovery(
  name: string,
  context: string,
): string {
  if (context) {
    return `${name} discovers another layer in ${context}.`;
  }

  return `${name} discovers another layer that was not visible before.`;
}

function expressiveReveal(
  name: string,
  context: string,
): string {
  if (context) {
    return `${name} sees ${context} clearly for the first time.`;
  }

  return `${name} sees a hidden detail clearly for the first time.`;
}

function expressiveSurprise(
  name: string,
  context: string,
): string {
  if (context) {
    return `${name} encounters ${context} in an unexpected turn.`;
  }

  return `${name} encounters an unexpected turn.`;
}

function expressiveTransformation(
  name: string,
  context: string,
): string {
  if (context) {
    return `${name} is visibly different after ${context}.`;
  }

  return `${name} is visibly different from where the experience began.`;
}

/**
 * Determine whether an expressive pressure should replace a generic
 * beat realization.
 *
 * The ordering matters:
 *
 * suspense / uncertainty
 * memory
 * discovery / reveal
 * surprise
 * escalation
 * transformation
 */
function expressivePressure(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string | undefined {
  const signals = expressiveSignals(
    beat,
    plan,
  );

  if (!signals.length) {
    return undefined;
  }

  const name = cap(
    subject(beat, plan),
  );

  const context = expressiveContext(
    beat,
    plan,
  );

  if (
    beat.kind === "orientation" ||
    beat.kind === "encounter" ||
    beat.kind === "discovery" ||
    beat.kind === "reveal" ||
    beat.kind === "feedback" ||
    beat.kind === "escalation" ||
    beat.kind === "payoff"
  ) {
    if (signals.includes("suspense")) {
      return expressiveSuspense(
        name,
        context,
      );
    }

    if (signals.includes("uncertainty")) {
      return expressiveUncertainty(
        name,
        context,
      );
    }
  }

  if (
    signals.includes("memory") &&
    (
      beat.kind === "origin" ||
      beat.kind === "reflection" ||
      beat.kind === "provenance" ||
      beat.kind === "payoff"
    )
  ) {
    return expressiveMemory(
      name,
      context,
    );
  }

  if (
    signals.includes("discovery") &&
    beat.kind === "discovery"
  ) {
    return expressiveDiscovery(
      name,
      context,
    );
  }

  if (
    signals.includes("reveal") &&
    beat.kind === "reveal"
  ) {
    return expressiveReveal(
      name,
      context,
    );
  }

  if (
    signals.includes("surprise") &&
    (
      beat.kind === "encounter" ||
      beat.kind === "discovery" ||
      beat.kind === "reveal"
    )
  ) {
    return expressiveSurprise(
      name,
      context,
    );
  }

  if (
    signals.includes("escalation") &&
    beat.kind === "escalation"
  ) {
    return expressiveEscalation(
      name,
      context,
    );
  }

  if (
    signals.includes("transformation") &&
    beat.kind === "transformation"
  ) {
    return expressiveTransformation(
      name,
      context,
    );
  }

  return undefined;
}

/**
 * ---------------------------------------------------------------------------
 * DOMAIN-NEUTRAL EVENT REALIZATION
 * ---------------------------------------------------------------------------
 */
function eventText(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string {
  const name = cap(
    subject(beat, plan),
  );

  const evidence =
    evidenceCandidates(
      beat,
      plan,
    );

  const context = evidencePair(
    evidence.slice(0, 2),
  );

  const action =
    concreteDirectiveAction(
      beat,
      plan,
    );

  const transformation =
    values(
      plan,
      "transformation",
    );

  const outcome =
    concreteOutcome(plan);

  const affordance =
    concreteAffordance(plan);

  /**
   * Concrete directives are authoritative.
   *
   * They are handled before generic expressive pressure so cognition's
   * explicit executable action wins.
   */
  if (action) {
    switch (beat.kind) {
      case "orientation":
        return `${name} begins by ${action}.`;

      case "hook":
        return `${name} encounters the turn when ${action}.`;

      case "need":
        return `${name} needs to ${action}.`;

      case "threshold":
        return `${name} crosses the threshold by ${action}.`;

      case "origin":
        return `${name} brings ${action} into the present.`;

      case "encounter":
        return `${name} encounters a new condition when ${action}.`;

      case "challenge":
        return `${name} faces the challenge by ${action}.`;

      case "discovery":
        return `${name} discovers something when ${action}.`;

      case "reveal":
        return `${name} sees the hidden detail when ${action}.`;

      case "instruction":
        return `${name} gets a usable next move: ${action}.`;

      case "action":
        return `${name} acts: ${action}.`;

      case "feedback":
        return `${name} sees the result when ${action}.`;

      case "contribution":
        return `${name} adds to what is happening by ${action}.`;

      case "escalation":
        return `${name} goes further by ${action}.`;

      case "transformation":
        return `${name} changes when ${action}.`;

      case "reflection":
        return `${name} revisits what happened when ${action}.`;

      case "provenance":
        return `${name} preserves the origin by ${action}.`;

      case "identity":
        return `${name} establishes its identity when ${action}.`;

      case "milestone":
        return `${name} reaches a new state when ${action}.`;

      case "unlock":
        return `${name} unlocks the next state by ${action}.`;

      case "earned_access":
        return `${name} earns the next state by ${action}.`;

      case "payoff":
        return `${name} reaches the payoff by ${action}.`;

      case "next_step":
        return `${name} takes the next step: ${action}.`;

      case "continuation":
        return `${name} carries the result forward by ${action}.`;

      default:
        return `${name} acts: ${action}.`;
    }
  }

  /**
   * If cognition has selected expressive pressure but no concrete directive,
   * give that pressure a visible event instead of allowing generic prose
   * to erase it.
   */
  const expressive =
    expressivePressure(
      beat,
      plan,
    );

  if (expressive) {
    return expressive;
  }

  switch (beat.kind) {
    case "orientation":
      return context
        ? `${name} enters with ${context} already in view.`
        : `${name} enters the experience.`;

    case "hook":
      return context
        ? `${name} notices ${context}, creating the first active turn.`
        : `${name} encounters the first active turn.`;

    case "need":
      return outcome
        ? `${name} has a concrete target: ${outcome}.`
        : context
          ? `${name} has to deal with ${context}.`
          : `${name} faces the immediate problem.`;

    case "threshold":
      return context
        ? `${name} moves into ${context}.`
        : `${name} crosses into the next state.`;

    case "origin":
      return context
        ? `${name} brings ${context} into the present.`
        : `${name} starts from what is already known.`;

    case "encounter":
      return context
        ? `${name} encounters ${context}.`
        : `${name} encounters a concrete new condition.`;

    case "challenge":
      return context
        ? `${name} has to respond to ${context}.`
        : `${name} meets a condition that requires a response.`;

    case "discovery":
      return expressiveDiscovery(
        name,
        context,
      );

    case "reveal":
      return context
        ? `${name} sees ${context} for what it changes.`
        : `${name} sees a detail that was not visible at the beginning.`;

    case "instruction":
      return affordance
        ? `${name} gets a usable next move: ${affordance}.`
        : context
          ? `${name} has a concrete next move involving ${context}.`
          : `${name} gets a concrete next move.`;

    case "action":
      return affordance
        ? `${name} acts: ${affordance}.`
        : context
          ? `${name} acts on ${context}.`
          : `${name} takes the next concrete action.`;

    case "feedback":
      return outcome
        ? `${name} sees a result that changes the route toward ${outcome}.`
        : context
          ? `${name} sees what changes after ${context}.`
          : `${name} sees the result of the action.`;

    case "contribution":
      return context
        ? `${name} adds ${context} to what is happening.`
        : `${name} adds a concrete contribution.`;

    case "escalation":
      return expressiveEscalation(
        name,
        context,
      );

    case "transformation":
      return transformation.length >= 2
        ? `${name} moves from ${sentence(
            transformation[0],
          )} to ${sentence(
            transformation[1],
          )}.`
        : context
          ? `${name} is visibly different after ${context}.`
          : `${name} ends in a different state than the one established at the beginning.`;

    case "reflection":
      return context
        ? `${name} returns to ${context} and sees its consequence in the present.`
        : `${name} revisits what happened and sees its consequence.`;

    case "provenance":
      return context
        ? `${name} preserves ${context} as part of the record.`
        : `${name} preserves the origin in the experience.`;

    case "identity":
      return context
        ? `${name} becomes identifiable through ${context}.`
        : `${name} establishes a distinct identity through what has happened.`;

    case "milestone":
      return outcome
        ? `${name} reaches ${outcome}.`
        : context
          ? `${name} reaches a new state through ${context}.`
          : `${name} reaches a new state.`;

    case "unlock":
    case "earned_access":
      return outcome
        ? `${name} earns access to ${outcome}.`
        : context
          ? `${name} opens the next possibility through ${context}.`
          : `${name} earns access to the next state.`;

    case "payoff":
      return outcome
        ? `${name} reaches ${outcome}.`
        : context
          ? `${name} reaches a result shaped by ${context}.`
          : `${name} reaches the payoff.`;

    case "next_step":
      return affordance
        ? `${name} takes the next step: ${affordance}.`
        : context
          ? `${name} takes the next step with ${context} now in play.`
          : `${name} takes the next step.`;

    case "continuation":
      return context
        ? `${name} carries ${context} into what comes next.`
        : `${name} leaves a concrete next turn available.`;

    default:
      return context
        ? `${name} continues with ${context} now in play.`
        : `${name} continues.`;
  }
}

/**
 * Remove compiler language after generation.
 */
function removeCompilerFiller(
  text: string,
): string {
  let result = sentence(text);

  for (const pattern of DEAD_PROSE) {
    result = result.replace(pattern, "");
  }

  for (const pattern of ABSTRACT_DIRECTIVE) {
    result = result.replace(pattern, "");
  }

  return sentence(
    result
      .replace(/\s{2,}/g, " ")
      .replace(/\s+([,.!?])/g, "$1")
      .trim(),
  );
}

/**
 * Preserve concrete evidence without copying compiler metadata.
 *
 * Evidence is appended only when it is absent from generated text.
 *
 * The fallback additions are written as observable details rather than
 * compiler explanations.
 */
function preserveConcreteEvidence(
  text: string,
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string {
  const evidence =
    evidenceCandidates(
      beat,
      plan,
    );

  if (!evidence.length) {
    return text;
  }

  const normalized = lower(text);

  const missing = evidence.filter(
    (value) =>
      !normalized.includes(
        lower(value),
      ),
  );

  if (!missing.length) {
    return text;
  }

  const additions =
    missing.slice(0, 2);

  switch (beat.kind) {
    case "orientation":
      return `${sentence(
        text,
      )} ${additions.join(
        " and ",
      )} are present from the start.`;

    case "encounter":
      return `${sentence(
        text,
      )} Then ${additions.join(
        " and ",
      )} enter the scene.`;

    case "discovery":
    case "reveal":
      return `${sentence(
        text,
      )} Another visible detail is ${additions.join(
        " and ",
      )}.`;

    case "escalation":
      return `${sentence(
        text,
      )} It goes further with ${additions.join(
        " and ",
      )}.`;

    case "transformation":
      return `${sentence(
        text,
      )} The difference is visible in ${additions.join(
        " and ",
      )}.`;

    case "payoff":
      return `${sentence(
        text,
      )} The payoff remains tied to ${additions.join(
        " and ",
      )}.`;

    default:
      return text;
  }
}

/**
 * Ensure an authoritative concrete action survives into presentation.
 *
 * Cognition may explicitly decide that an action must happen.
 * Presentation cannot silently replace that action with generic
 * semantic prose.
 */
function preserveDirectiveAction(
  text: string,
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string {
  const action = concreteDirectiveAction(
    beat,
    plan,
  );

  if (!action) return text;

  /**
   * The cognitive realization directive is authoritative.
   *
   * Once concreteDirectiveAction() has accepted it, the presentation
   * boundary must not discard it based on beat kind.
   */
  if (lower(text).includes(lower(action))) {
    return text;
  }

  return `${sentence(text)} The concrete action is to ${action}.`;
}

export function realizePremiseBeat(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string {
  let text = eventText(
    beat,
    plan,
  );

  text = removeCompilerFiller(
    text,
  );

  text = preserveConcreteEvidence(
    text,
    beat,
    plan,
  );

  /**
   * Directive preservation is the FINAL language-authority step.
   *
   * Do not run removeCompilerFiller() after this point.
   *
   * Otherwise a directive such as:
   *
   *   "carry the preceding state into a changed condition"
   *
   * could be correctly inserted and then immediately deleted by the same
   * compiler-language filter.
   */
  text = preserveDirectiveAction(
    text,
    beat,
    plan,
  );

  return `${sentence(text)}.`;
}

export function realizePremiseBeats(
  beats: StoryBeat[],
  plan?: CognitiveExperiencePlan,
): StoryBeat[] {
  return beats.map((beat) => ({
    ...beat,
    text: realizePremiseBeat(
      beat,
      plan,
    ),
  }));
}

export function isGenericCompilerProse(
  value: string,
): boolean {
  return (
    DEAD_PROSE.some((pattern) =>
      pattern.test(value),
    ) ||
    ABSTRACT_DIRECTIVE.some(
      (pattern) =>
        pattern.test(value),
    ) ||
    COMPILER_FRAGMENT.some(
      (pattern) =>
        pattern.test(value),
    )
  );
}

/**
 * Diagnostic-only.
 *
 * It never selects a story or changes realization.
 */
export function classifyPremise(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): Record<string, boolean> {
  const text = lower(
    [
      beat.text,
      subject(beat, plan),
      ...ROLES.flatMap((role) =>
        values(plan, role),
      ),
      ...(plan?.emotionalIntent ?? []),
    ].join(" "),
  );

  return {
    evidence:
      evidenceCandidates(
        beat,
        plan,
      ).length > 0,

    relationship:
      Boolean(
        plan?.premise?.relations.some(
          (item) =>
            item.confidence >= 0.72,
        ),
      ),

    temporal:
      Boolean(
        first(plan, "temporal"),
      ),

    social:
      Boolean(
        first(plan, "social") ||
          first(plan, "participants"),
      ),

    transformation:
      Boolean(
        first(
          plan,
          "transformation",
        ),
      ),

    constraint:
      Boolean(
        first(
          plan,
          "constraint",
        ),
      ),

    outcome:
      Boolean(
        first(plan, "outcome"),
      ) ||
      /\b(?:remember|discover|return|connect|play|learn|change)\b/i.test(
        text,
      ),
  };
}