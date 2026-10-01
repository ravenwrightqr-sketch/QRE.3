import { createHash } from "node:crypto";
import { existsSync, readFileSync, mkdirSync, writeFileSync } from "node:fs";
import type { AuthorDomainContext } from "@qre/contracts";
import { buildAuthorRealityGraph } from "./src/services/authorRealityGraph.js";
import {
  discoverAuthorCreativeDirection,
  verifyExperimentalRhetoricalPovCandidates,
} from "./src/services/authorCreativeDiscovery.js";
import * as authorCreativeModule from "./src/services/authorCreative.js";
import {
  buildDirectAuthorMemoryMessages,
  createAuthorExperience,
  directAuthorAttemptsToProductions,
  generateDirectAuthorMemoryProductions,
  editDirectAuthorReality,
  parseJson as parseAuthorJson,
  synthesizeAuthorizedRealizations,
  type AuthorizedRealization,
  type AuthorCreativeEvent,
  type AuthorDirectTextProduction,
} from "./src/services/authorCreative.js";
import { verifyAuthorCreativeGrounding } from "./src/services/authorCreativeGroundingVerifier.js";
import { localModelConfig, localModelGenerate } from "./src/services/localModelRuntime.js";

const PRE_HOOK_SOURCE_REGION_HASH =
  "4f119b85a757354846dbf48d1176caf957cc6f732bcd6665a4ca3e88deb6956a";

const SEMANTIC_SCOPE_SEARCH_INSTRUCTION = [
  "Before writing public cuts, perform a private thought-distance search.",
  "Treat supplied reality as evidence for thought, not as material that must be retold. First notice what is literally supplied. Then privately generate several different things a distinctive speaker could notice, infer, judge, joke about, complain about, question, generalize from, or find absurd because those facts are true.",
  "At least some private candidates must move beyond event-description: they should not be obtainable merely by shortening, synonym-swapping, dramatizing, personifying, or metaphorically renaming the supplied timeline.",
  "The public realization does not owe the viewer a recap. It may omit the originating fact entirely when the resulting thought is still licensed by that fact.",
  "Prefer a supported thought that changes what the facts mean or what becomes noticeable over a clever restatement of what happened.",
  "A broader proposition, ordinary social observation, attitude, rhetorical point of view, implication, joke, complaint, judgment, or question is available when supported. None of these creates a new participant or event merely by being said.",
  "Do not manufacture a leap just to be different. If a farther thought is not genuinely supported, remain particular. Concrete reality remains closed: do not invent who acted, what happened, what was observed, motives, causes, duration, persistence, outcomes, or history.",
  "Only after this private search, write the moving-text cuts. Return public words only; never expose the private search.",
].join("\\n");

const PROPOSITIONAL_SCOPE_SEARCH_INSTRUCTION =
  "Before writing, privately test whether supplied particulars support a grounded proposition whose semantic subject can be broader than the particular subject or occurrence itself. A broader category, pattern, convention, tendency, or audience may become the subject of that proposition without implying that any additional concrete participant entered the supplied occurrence. This is a change in propositional scope, not permission to invent events. Choose it only when genuinely supported.";

const SEMANTIC_SCOPE_AB_DOMAIN_IDS: DomainId[] = [
  "coco",
  "milo",
  "relationship",
  "house",
  "car",
];

const SEMANTIC_SCOPE_AB_RUNS = 3;

const DEFAULT_RUNS = 10;

type DomainId =
  | "coco"
  | "milo"
  | "relationship"
  | "house"
  | "car"
  | "negative-control";

type DiscoveryDomain = {
  id: DomainId;
  label: string;
  source: string;
  prompt: string;
  subject: string;
  facts: string[];
  domainContext: AuthorDomainContext;
  notes?: string[];
};

type CliOptions = {
  domains: DomainId[];
  runs: number;
  runsExplicit: boolean;
  live: boolean;
  rawOnly: boolean;
  semanticScopeAb: boolean;
  propositionalScopeOnly: boolean;
  classifierRegression: boolean;
  classifyText?: string;
  reclassifyFile?: string;
  authorityReplay?: string;
};

type DebugBlock = {
  label: string;
  text: string;
  parsed?: unknown;
};

type DiagnosticLabel =
  | "PARTICULAR_CHARACTERIZATION"
  | "GENERALIZED_PROPOSITION"
  | "SPECIFIC_UNSUPPLIED_PARTICIPATION"
  | "RHETORICAL_POV"
  | "PERSONIFICATION"
  | "DERIVED_CHARACTERIZATION"
  | "DERIVED_SIGNIFICANCE"
  | "SOCIAL_OBSERVATION"
  | "METAPHOR"
  | "ABSTRACTION"
  | "IMPLICATION"
  | "RECONTEXTUALIZATION"
  | "DIRECT_REPLAY_ONLY"
  | "POSSIBLE_NEW_CONCRETE_REALITY";

type SemanticOperationClass =
  | "PARTICULAR_CHARACTERIZATION"
  | "GENERALIZED_PROPOSITION"
  | "SPECIFIC_UNSUPPLIED_PARTICIPATION"
  | "OTHER";

type RawProductionDiagnostic = {
  domain: DomainId;
  condition?: SemanticScopeCondition;
  run: number;
  production: string;
  text: string;
  semanticClass: SemanticOperationClass;
  labels: DiagnosticLabel[];
  possibleNewConcreteReasons: string[];
  thoughtDiagnostics: Array<{
    exactText: string;
    semanticClass: SemanticOperationClass;
    labels: DiagnosticLabel[];
    possibleNewConcreteReasons: string[];
    explanatoryWrapping: boolean;
    authorityStatus: "NOT_CHECKED";
  }>;
  authority?: AuthorityObservation;
};

type ReplayEntry = {
  run?: number;
  production?: string;
  text: string;
};

type AuthorityObservation = {
  claimAuditorUnsupported: boolean;
  realityEditorRemoved: boolean;
  finalGroundingRejected: boolean;
  acceptedByScoring: boolean;
  selectedLate: boolean;
  assembledFromProduction: boolean;
  discoveredAndSurvived: boolean;
  failureLayer: "NONE" | "CLAIM_AUDITOR" | "REALITY_EDITOR" | "FINAL_GROUNDING" | "LATE_SELECTION";
};

const DOMAINS: DiscoveryDomain[] = [
  {
    id: "coco",
    label: "COCO",
    source: "apps/api/author-direct-creative-live-output.ts canonical supplied reality",
    prompt: "Create the customer-facing memory from this grooming visit.",
    subject: "Coco",
    facts: [
      "Dropped off at 9:00 AM.",
      "Bath.",
      "Blue bows.",
      "Tried to remove the bows.",
      "Happy at pickup.",
    ],
    domainContext: {
      experienceMode: "MEMORY",
      category: "SERVICE",
      serviceType: "GROOMING",
      subjectKind: "PET",
    },
  },
  {
    id: "milo",
    label: "MILO",
    source: "apps/api/author-universal-creative-stress.ts canonical Milo dog-walk fixture",
    prompt: "Create the customer-facing memory from this dog walk.",
    subject: "Milo",
    facts: [
      "Walk started at 5:00 PM",
      "Walk lasted 56 minutes",
      "Went to the park",
      "Saw squirrels",
      "Saw five dogs",
      "Two people said Milo was cute",
    ],
    domainContext: {
      experienceMode: "MEMORY",
      category: "SERVICE",
      serviceType: "DOG WALKING",
      subjectKind: "PET",
    },
  },
  {
    id: "relationship",
    label: "RELATIONSHIP / MEMORY",
    source: "apps/api/author-universal-core-acceptance.ts canonical relationship fixture",
    prompt: "Create the QRE experience from supplied reality.",
    subject: "Alex",
    facts: [
      "felt nervous before meeting Alex",
      "talked for two hours",
      "felt lighter afterward",
      "met Alex again the next week",
    ],
    domainContext: {
      experienceMode: "MEMORY",
      category: "RELATIONSHIP MEMORY",
      subjectKind: "PERSON",
    },
  },
  {
    id: "house",
    label: "HOUSE / REAL ESTATE",
    source: "test-only concrete property/history fixture",
    prompt: "Create the customer-facing memory from this property history.",
    subject: "Maple Street house",
    facts: [
      "Front porch photographed on Thursday.",
      "Afternoon showing.",
      "Open house on Saturday.",
      "Offer came Monday.",
    ],
    domainContext: {
      experienceMode: "MEMORY",
      category: "REAL ESTATE",
      subjectKind: "PLACE",
    },
    notes: [
      "No suitable canonical real-estate author fixture was found; this is concrete history only.",
    ],
  },
  {
    id: "car",
    label: "CAR / OBJECT HISTORY",
    source: "test-only concrete object-history fixture",
    prompt: "Create the customer-facing memory from this object history.",
    subject: "red car",
    facts: [
      "Red car listed for sale.",
      "Test drive on Friday.",
      "Exterior washed before pickup.",
      "Buyer picked up the car on Monday.",
    ],
    domainContext: {
      experienceMode: "MEMORY",
      category: "OBJECT HISTORY",
      subjectKind: "OBJECT",
    },
    notes: [
      "No canonical car/object-history author fixture was found; this is concrete history only.",
    ],
  },
  {
    id: "negative-control",
    label: "NEGATIVE CONTROL",
    source: "test-only low-social-basis fixture",
    prompt: "Create the customer-facing memory from this service record.",
    subject: "meter check",
    facts: [
      "Arrived at 8:00 AM.",
      "Checked meter.",
      "Recorded reading 42.",
      "Left at 8:07 AM.",
    ],
    domainContext: {
      experienceMode: "MEMORY",
      category: "SERVICE RECORD",
      serviceType: "METER CHECK",
    },
    notes: [
      "Concrete facts only; little supplied basis for social or group generalization.",
    ],
  },
];

const DIAGNOSTIC_LABELS: DiagnosticLabel[] = [
  "DIRECT_REPLAY_ONLY",
  "PARTICULAR_CHARACTERIZATION",
  "GENERALIZED_PROPOSITION",
  "SPECIFIC_UNSUPPLIED_PARTICIPATION",
  "RHETORICAL_POV",
  "METAPHOR",
  "DERIVED_SIGNIFICANCE",
  "POSSIBLE_NEW_CONCRETE_REALITY",
  "PERSONIFICATION",
  "DERIVED_CHARACTERIZATION",
  "SOCIAL_OBSERVATION",
  "ABSTRACTION",
  "IMPLICATION",
  "RECONTEXTUALIZATION",
];

const clean = (value: unknown): string =>
  String(value ?? "").replace(/\s+/g, " ").trim();

const record = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? value as Record<string, unknown> : {};

const array = (value: unknown): unknown[] => Array.isArray(value) ? value : [];

function currentDirectAuthorPromptHash(): string {
  const localSource = new URL("./src/services/authorCreative.ts", import.meta.url);
  const cwdUrl = `file:///${process.cwd().replace(/\\/g, "/").replace(/\/?$/, "/")}`;
  const cwdSource = new URL("./src/services/authorCreative.ts", cwdUrl);
  const sourcePath = existsSync(localSource) ? localSource : cwdSource;
  const source = readFileSync(sourcePath, "utf8");
  const start = source.indexOf("export function buildDirectAuthorMemoryMessages");
  const end = source.indexOf("function buildDeterministicMouthFallback", start);
  if (start < 0 || end <= start) {
    throw new Error("Direct Creative Author prompt region not found");
  }
  return createHash("sha256").update(source.slice(start, end)).digest("hex");
}

type SemanticScopeCondition = "CONTROL" | "SEMANTIC_SCOPE" | "PROPOSITIONAL_SCOPE";

function experimentalInstructionFor(
  condition: SemanticScopeCondition,
): { semanticScopeSearchInstruction?: string } {
  if (condition === "SEMANTIC_SCOPE") {
    return { semanticScopeSearchInstruction: SEMANTIC_SCOPE_SEARCH_INSTRUCTION };
  }
  if (condition === "PROPOSITIONAL_SCOPE") {
    return { semanticScopeSearchInstruction: PROPOSITIONAL_SCOPE_SEARCH_INSTRUCTION };
  }
  return {};
}

function directAuthorMessagesFor(
  domain: DiscoveryDomain,
  condition: SemanticScopeCondition = "CONTROL",
): Array<{ role: "system" | "user"; content: string }> {
  const events = suppliedRealityEventsFromWorld(buildDomainRealityGraph(domain));

  return buildDirectAuthorMemoryMessages({
    subject: domain.subject,
    suppliedReality: events,
    ...experimentalInstructionFor(condition),
  });
}

function messageHash(messages: ReadonlyArray<{ role: string; content: string }>): string {
  return createHash("sha256").update(JSON.stringify(messages)).digest("hex");
}

function buildDomainRealityGraph(domain: DiscoveryDomain): ReturnType<typeof buildAuthorRealityGraph> {
  return buildAuthorRealityGraph({
    prompt: domain.prompt,
    subject: domain.subject,
    facts: domain.facts,
    sourceMoments: [],
    memoryContext: [],
    trajectory: [],
  });
}

function suppliedRealityEventsFromWorld(
  world: ReturnType<typeof buildAuthorRealityGraph>,
): AuthorCreativeEvent[] {
  return world.events
    .map((event) => ({ id: event.id, text: clean(event.label) }))
    .filter((event) => event.text);
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}
async function probeDedicatedGeneralizationSearch(input: {
  subject: string;
  events: readonly AuthorCreativeEvent[];
  domainContext?: AuthorDomainContext;
}): Promise<void> {
  const result = await localModelGenerate(
    [
      {
        role: "system",
        content: [
          "You are QRE Experimental Rhetorical-POV Search.",
          "This is a Discovery search, not a writing task.",
          "Reality is fixed. Discourse may move.",
          "",
          "Search only for grounded RHETORICAL_POV available because SUPPLIED_REALITY is true.",
          "Do not summarize the episode. Do not write moving-text cuts. Do not select a winner.",
          "",
          "Generate the thought itself, not an analysis of what a speaker could think.",
          "perception must be a first-order proposition, judgment, observation, question, complaint, or opinion about the material.",
          "Do not describe the availability of a viewpoint.",
          "BAN META-DISCOURSE IN perception:",
          "Do not write 'someone could think', 'someone could find', 'the speaker can', 'the speaker could', 'this invites', 'this suggests a view', 'this supports a view', 'can be seen as', or equivalent framing.",
          "Those constructions explain a possible thought instead of supplying the thought.",
          "relationship may explain why the thought is licensed. perception must contain the thought itself.",
          "",
          "The speaker's attitude does not have to paraphrase the supplied facts.",
          "The thought may move sideways from the event.",
          "It may treat a supplied detail as ridiculous, revealing, charming, annoying, excessive, trivial, important, contradictory, or worth commenting on when that stance is genuinely licensed by the evidence.",
          "",
          "Do not confuse rhetorical POV with event description.",
          "A clever synonym, metaphorical recap, dramatic restatement, or personification of the timeline is not enough.",
          "The candidate should contain an actual viewpoint: something being thought ABOUT the supplied reality rather than merely another way of describing it.",
          "",
          "The rhetorical speaker is not a participant in the supplied event.",
          "A judgment, joke, complaint, question, comparison, opinion, or attitude does not create a new concrete participant or occurrence merely by being expressed.",
          "",
          "KEEP REALITY CLOSED.",
          "Do not invent who acted, what happened, what was observed, motives, causes, duration, persistence, outcomes, chronology, history, measurements, physical states, mental states, or additional concrete examples.",
          "Do not convert rhetorical attitude into documentary fact.",
          "",
          "Search for genuinely different viewpoints rather than several phrasings of one idea.",
          "Zero useful viewpoints is valid.",
          "Return discoveries, not polished public copy.",
          "Return only the requested structured object.",
        ].join("\n"),
      },
      {
        role: "user",
        content: JSON.stringify({
          SUBJECT: input.subject,
          SUPPLIED_REALITY: input.events,
          BUSINESS_CONTEXT: input.domainContext,
          instruction:
            "Search for distinct grounded viewpoints that become available because these facts are true. Find what a speaker can legitimately have an opinion about without adding anything to what happened.",
        }),
      },
    ],
    "json",
    {
      numPredict: 700,
      temperature: 0.92,
      jsonSchema: {
        type: "object",
        additionalProperties: false,
        required: ["candidates"],
        properties: {
          candidates: {
            type: "array",
            minItems: 0,
            maxItems: 6,
            items: {
              type: "object",
              additionalProperties: false,
              required: [
                "perception",
                "relationship",
                "evidenceEventIds",
              ],
              properties: {
                perception: {
                  type: "string",
                  maxLength: 180,
                },
                relationship: {
                  type: "string",
                  maxLength: 180,
                },
                evidenceEventIds: {
                  type: "array",
                  maxItems: 32,
                  items: {
                    type: "string",
                    maxLength: 64,
                  },
                },
              },
            },
          },
        },
      },
    },
  );

  const parsed = parseJson(result.text) as
    | {
        candidates?: Array<{
          perception?: unknown;
          relationship?: unknown;
          evidenceEventIds?: unknown;
        }>;
      }
    | undefined;

  const probeCandidates = (parsed?.candidates ?? [])
    .map((candidate, index) => ({
      id: `rhetorical-pov-probe-${index + 1}`,
      perception:
        typeof candidate.perception === "string"
          ? candidate.perception.trim()
          : "",
      relationship:
        typeof candidate.relationship === "string"
          ? candidate.relationship.trim()
          : "",
      evidenceEventIds: Array.isArray(candidate.evidenceEventIds)
        ? candidate.evidenceEventIds.filter(
            (id): id is string => typeof id === "string",
          )
        : [],
    }))
    .filter((candidate) => candidate.perception.length > 0);

  const verification =
    await verifyExperimentalRhetoricalPovCandidates({
      candidates: probeCandidates,
      events: input.events,
      domainContext: input.domainContext,
    });

  printHeader("DEDICATED RHETORICAL POV SEARCH PROBE");
  printJson({
    model: result.model,
    rawOutput: result.text,
    parsed,
  });

  printHeader("RHETORICAL POV PRODUCTION AUTHORITY VERIFICATION");
  printJson({
    modelCalls: verification.modelCalls,
    results: verification.results,
  });
}
function captureQreDebugLogs(): {
  blocks: DebugBlock[];
  restore: () => void;
} {
  const blocks: DebugBlock[] = [];
  const originalLog = console.log.bind(console);

  console.log = (...args: unknown[]) => {
    const text = args.map((arg) =>
      typeof arg === "string" ? arg : JSON.stringify(arg, null, 2),
    ).join(" ");
    const match = text.match(/^\n--- QRE ([^\n]+) ---\n([\s\S]*)\n--- END QRE \1 ---\n?$/);
    if (match) {
      blocks.push({
        label: match[1]!,
        text: match[2]!,
        parsed: parseJson(match[2]!),
      });
      return;
    }

    originalLog(...args);
  };

  return {
    blocks,
    restore: () => {
      console.log = originalLog;
    },
  };
}

function debugBlock(blocks: readonly DebugBlock[], label: string): DebugBlock | undefined {
  return blocks.find((block) => block.label === label);
}

function rawAttemptText(rawAuthor: unknown, index: number): string {
  return clean(record(array(record(rawAuthor).attempts)[index]).text);
}

function rawAttemptEntries(rawAuthor: unknown): Array<{ production: string; text: string }> {
  const attempts = array(record(rawAuthor).attempts);
  return attempts.map((_, index) => ({
    production: String.fromCharCode("A".charCodeAt(0) + index),
    text: rawAttemptText(rawAuthor, index),
  })).filter((entry) => entry.text);
}

function rawProductionEntries(
  productions: readonly AuthorDirectTextProduction[],
): Array<{ production: string; text: string }> {
  return productions.map((production) => ({
    production: production.production,
    text: production.lines.map((line) => line.text).filter((text) => clean(text)).join("\n"),
  })).filter((entry) => entry.text);
}

function productionTextFromMemoryDebug(memoryProductionsDebug: unknown, production: string): string {
  const item = array(record(memoryProductionsDebug).productions)
    .find((candidate) => clean(record(candidate).production).toUpperCase() === production.toUpperCase());
  return array(record(item).lines)
    .map((line) => clean(record(line).text))
    .filter(Boolean)
    .join(" ");
}

function sentenceParts(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+|\n+/g)
    .map(clean)
    .filter(Boolean);
}

function oldKeywordGeneralizedReference(text: string): boolean {
  return /\b(?:humans?|people|everyone|everybody|anyone|somebody|someone|owners?|customers?|buyers?|sellers?|agents?|workers?|groomers?|dogs?|pets?|houses?|homes?|cars?|vehicles?|objects?|things?|the world|society)\b/i
    .test(text);
}

function hasTrueGeneralizedProposition(sentence: string): boolean {
  // Open-class quantified subjects can express a proposition without naming a
  // category in our historical keyword list. This remains a surface heuristic.
  if (/^(?:all|every|any|most|many|some|no)\s+(?:[a-z-]+\s+){1,4}(?:are|is|can|tend|usually|often|outlast|matter|remain|become)\b/i.test(sentence.trim())) return true;
  const classSubject =
    "humans?|people|everyone|everybody|nobody|no one|anyone|anybody|owners?|customers?|clients?|buyers?|sellers?|agents?|real estate agents?|workers?|groomers?|pet owners?|service clients?|dogs?|pets?|houses?|homes?|cars?|vehicles?|objects?|audiences?|viewers?|visitors?|neighbors?|families|society|the world";
  const habitualPredicate =
    "(?:will|would|can|could|tend(?:s)? to|usually|always|never|often|apparently|have a way of|has a way of|love|loves|like|likes|hate|hates|want|wants|need|needs|prefer|prefers|expect|expects|treat|treats|call|calls|make|makes|turn|turns|decorate|decorates|read|reads|overread|overreads)";
  const universalQuantifiedSubject = new RegExp(
    `\\b(?:all|every|any|most|many|some|no)\\s+(?:of\\s+the\\s+)?(?:${classSubject})\\b[^.!?;]{0,120}\\b${habitualPredicate}\\b`,
    "i",
  );
  const bareClassSubject = new RegExp(
    `^(?:apparently\\s*,?\\s*)?(?:the\\s+)?(?:${classSubject})\\s+[^.!?;]{0,80}\\b${habitualPredicate}\\b`,
    "i",
  );
  const classModalOrHabit = new RegExp(
    `\\b(?:${classSubject})\\b[^.!?;]{0,80}\\b${habitualPredicate}\\b`,
    "i",
  );
  const generalFrame = /\b(?:as a rule|in general|that is how|this is what|the way the world works|apparently)\b/i;

  return (
    universalQuantifiedSubject.test(sentence) ||
    bareClassSubject.test(sentence) ||
    (generalFrame.test(sentence) && classModalOrHabit.test(sentence))
  );
}

function isOnlyConcreteReferenceToSuppliedClass(sentence: string, domain: DiscoveryDomain): boolean {
  const factsLower = domain.facts.join(" ").toLowerCase();
  const lower = sentence.toLowerCase();
  if (/\b(?:five|two|three|four|six|seven|eight|nine|ten|\d+)\s+(?:people|dogs|pets|cars|vehicles|houses|homes|objects|things)\b/i.test(sentence)) {
    return true;
  }
  if (/\b(?:people|dogs|pets|cars|vehicles|houses|homes|objects|things|owners|customers|buyers|sellers|agents|workers|groomers)\b/i.test(sentence)) {
    const categoryWords = lower.match(/\b(?:people|dogs|pets|cars|vehicles|houses|homes|objects|things|owners|customers|buyers|sellers|agents|workers|groomers)\b/g) ?? [];
    return categoryWords.length > 0 && categoryWords.every((word) => factsLower.includes(word));
  }
  return false;
}

function isGeneralizedProposition(text: string, domain: DiscoveryDomain): boolean {
  return sentenceParts(text).some((sentence) =>
    hasTrueGeneralizedProposition(sentence) &&
    !isOnlyConcreteReferenceToSuppliedClass(sentence, domain),
  );
}

function isUnresolvedParticipantReferenceToSuppliedOccurrence(sentence: string, domain: DiscoveryDomain): boolean {
  const factsLower = domain.facts.join(" ").toLowerCase();
  if (!/\b(?:someone|somebody|they|a person|the person)\b/i.test(sentence)) return false;
  if (
    /\b(?:tried|attempted)\b[^.!?;]{0,80}\b(?:remove|undo|take off|get off|pull off)\b/i.test(sentence) &&
    /\b(?:tried|attempted)\b[^.!?;]{0,80}\b(?:remove|undo|take off|get off|pull off)\b/i.test(factsLower)
  ) {
    return true;
  }
  return false;
}

function isSpecificUnsuppliedParticipation(text: string, domain: DiscoveryDomain): boolean {
  const factsLower = domain.facts.join(" ").toLowerCase();
  const participantAction =
    /\b(?:someone|somebody|person|people|woman|man|owner|customer|buyer|seller|agent|worker|groomer|neighbor|family|client|viewer|observer|visitor|staff|they)\b[^.!?;]{0,120}\b(?:said|saw|watched|gave|put|added|removed|picked|dropped|took|noticed|laughed|smiled|admired|praised|complimented|opened|closed|came|left|visited|showed|washed|photographed|listed|offered|thought|felt|wanted|liked|loved|hated)\b/i;
  const passiveParticipant =
    /\b(?:was|were|got|had been)\b[^.!?;]{0,80}\b(?:given|handed|shown|watched|admired|praised|laughed at|picked up|dropped off)\b[^.!?;]{0,80}\b(?:by|from)\s+(?:someone|somebody|a person|people|a woman|a man|an owner|a customer|a buyer|a seller|an agent|a worker|a groomer|a neighbor|a family|a client|a viewer|an observer|a visitor|staff)\b/i;

  return sentenceParts(text).some((sentence) => {
    const lower = sentence.toLowerCase();
    if (!participantAction.test(sentence) && !passiveParticipant.test(sentence)) return false;
    if (isUnresolvedParticipantReferenceToSuppliedOccurrence(sentence, domain)) return false;
    return !factsLower.includes(lower);
  });
}

function hasParticularCharacterization(text: string): boolean {
  return /\b(?:notable thing|important thing|one real conflict|whole arc|detail that matters|reduced .* to|narrowed to|worth trying|stayed simple|clearest|mattered|matters|meaning|significance|became|becomes|turned into|turns into|reads? like|read differently|reframes?|reframed|sequence|arc|conflict|point|argument|ceremony|verdict|proof)\b/i
    .test(text);
}

function classifySpan(text: string, domain: DiscoveryDomain): Pick<RawProductionDiagnostic, "semanticClass" | "labels" | "possibleNewConcreteReasons"> {
  const lower = text.toLowerCase();
  const factsLower = domain.facts.join(" ").toLowerCase();
  const labels = new Set<DiagnosticLabel>();
  const possibleNewConcreteReasons: string[] = [];
  const concreteParticipation =
    /\b(?:someone|somebody|person|people|woman|man|owner|customer|buyer|seller|agent|worker|groomer|neighbor|family|client|viewer|observer)\b[^.!?;]*(?:said|saw|watched|gave|put|added|removed|picked|dropped|took|noticed|laughed|smiled|admired|praised|complimented|opened|closed|came|left|visited|showed|washed|photographed|listed|offered)\b/i;
  const suppliedCategoryReference = isOnlyConcreteReferenceToSuppliedClass(text, domain);
  const generalizedProposition = isGeneralizedProposition(text, domain);
  const specificUnsuppliedParticipation = isSpecificUnsuppliedParticipation(text, domain);

  if (generalizedProposition) labels.add("GENERALIZED_PROPOSITION");
  if (specificUnsuppliedParticipation) labels.add("SPECIFIC_UNSUPPLIED_PARTICIPATION");
  if (/\b(?:humans?|people|everyone|everybody|society|the world|customers?|buyers?|owners?)\b/i.test(text)) {
    labels.add("SOCIAL_OBSERVATION");
  }
  if (/\b(?:i|we|my|our|me|us)\b/i.test(text) && /(?:house|home|car|vehicle|mug|object|place|porch|street)/i.test(`${domain.subject} ${text}`)) {
    labels.add("RHETORICAL_POV");
  }
  if (/\b(?:says?|speaks?|asks?|answers?|remembers?|knows?|wants?|decides?|insists?|refuses?|approves?|disapproves?|waits?|welcomes?|carries?|keeps score|testifies)\b/i.test(text) &&
    /\b(?:bows?|house|home|car|vehicle|mug|meter|porch|open house|offer|bath|reading)\b/i.test(text)) {
    labels.add("PERSONIFICATION");
  }
  if (/\b(?:notable thing|important thing|detail that matters|one real conflict|whole arc|became|becomes|turned into|turns into|made .* read|reads? like|read differently|mattered|matter|meaning|significance|history|less accidental|payoff|setup|punchline|point)\b/i.test(text)) {
    labels.add("DERIVED_SIGNIFICANCE");
  }
  if (/\b(?:apparently|as if|suggests?|implies?|reads? like|seems?|turns out|no longer|somehow)\b/i.test(text)) {
    labels.add("IMPLICATION");
  }
  if (/\b(?:read differently|made .* read|reframes?|reframed|no longer|suddenly|became|turns? .* into|changed the read)\b/i.test(text)) {
    labels.add("RECONTEXTUALIZATION");
  }
  if (/\b(?:as|like|war|crown|ceremony|verdict|receipt|trial|mission|battle|treaty|negotiation|declaration|evidence|case file|portrait|weather|gravity)\b/i.test(text)) {
    labels.add("METAPHOR");
  }
  if (/\b(?:resistance|adornment|arrival|departure|recurrence|attention|status|approval|history|proof|pattern|contrast|transformation|sequence|ritual|meaning)\b/i.test(text)) {
    labels.add("ABSTRACTION");
  }
  if (/\b(?:fabulous|official|dramatic|negotiable|serious|tiny|large|loud|quiet|defiant|ceremonial|important|crowded|successful|complete)\b/i.test(text)) {
    labels.add("DERIVED_CHARACTERIZATION");
  }

  if ((concreteParticipation.test(text) || specificUnsuppliedParticipation) && !suppliedCategoryReference) {
    labels.add("POSSIBLE_NEW_CONCRETE_REALITY");
    possibleNewConcreteReasons.push("mentions an unsupplied concrete class/member performing or observing an action");
  }
  if (/\b(?:hated|loved|wanted|preferred|decided|remembered|forgot|felt|knew|expected)\b/i.test(text) &&
    !/\b(?:felt nervous|felt lighter|happy|loves walks|loves bacon|loves small dogs)\b/i.test(factsLower)) {
    labels.add("POSSIBLE_NEW_CONCRETE_REALITY");
    possibleNewConcreteReasons.push("appears to assert an unsupplied mental state or preference");
  }
  if (/\b(?:right after|because|caused|so that|therefore|led to|made .* happen|resulted in)\b/i.test(text)) {
    labels.add("POSSIBLE_NEW_CONCRETE_REALITY");
    possibleNewConcreteReasons.push("appears to assert unsupplied causality or chronology");
  }
  for (const cue of text.match(/\b(?:immediately|instantly|already|survived|stayed|outlast(?:s|ed)?|continued|still)\b/gi) ?? []) {
    if (!new RegExp(`\\b${cue}\\b`, "i").test(factsLower)) {
      labels.add("POSSIBLE_NEW_CONCRETE_REALITY");
      possibleNewConcreteReasons.push(`review timing or persistence cue: ${cue}; lexical flag only, not a factual verdict`);
    }
  }

  const factTokens = domain.facts
    .flatMap((fact) => fact.toLowerCase().replace(/[^a-z0-9\s:]/g, " ").split(/\s+/))
    .filter((token) => token.length > 2);
  const textTokens = lower.replace(/[^a-z0-9\s:]/g, " ").split(/\s+/).filter((token) => token.length > 2);
  const overlap = textTokens.length
    ? textTokens.filter((token) => factTokens.includes(token)).length / textTokens.length
    : 0;
  const hasOnlyReplayLabels = [...labels].every((label) => label === "POSSIBLE_NEW_CONCRETE_REALITY");
  if (overlap >= 0.72 && (labels.size === 0 || hasOnlyReplayLabels)) {
    labels.add("DIRECT_REPLAY_ONLY");
  }
  if (!labels.size) {
    labels.add("DIRECT_REPLAY_ONLY");
  }
  if (hasParticularCharacterization(text) && !generalizedProposition && !specificUnsuppliedParticipation) {
    labels.add("PARTICULAR_CHARACTERIZATION");
  }

  const semanticClass: SemanticOperationClass = specificUnsuppliedParticipation
    ? "SPECIFIC_UNSUPPLIED_PARTICIPATION"
    : generalizedProposition
      ? "GENERALIZED_PROPOSITION"
      : labels.size === 1 && labels.has("DIRECT_REPLAY_ONLY")
        ? "OTHER"
        : "PARTICULAR_CHARACTERIZATION";
  if (semanticClass === "PARTICULAR_CHARACTERIZATION") {
    labels.add("PARTICULAR_CHARACTERIZATION");
  }

  return {
    semanticClass,
    labels: [...labels],
    possibleNewConcreteReasons,
  };
}

function labelsForText(text: string, domain: DiscoveryDomain): Pick<RawProductionDiagnostic,
  "semanticClass" | "labels" | "possibleNewConcreteReasons" | "thoughtDiagnostics"> {
  const production = classifySpan(text, domain);
  // Retain the actual words. These sentence/cut boundaries are observational,
  // not the Claim Auditor's independently removable atomic claim boundaries.
  const thoughtDiagnostics = text.split(/(?<=[.!?])\s+|\n+/g).map((part) => part.trim())
    .filter(Boolean).map((exactText) => ({
      exactText,
      ...classifySpan(exactText, domain),
      explanatoryWrapping: /\b(?:the (?:notable|important) thing|the detail that|that (?:is|was) the (?:whole|kind)|which is (?:how|its)|the (?:whole )?(?:story|day) had a clear sequence)\b/i.test(exactText),
      authorityStatus: "NOT_CHECKED" as const,
    }));
  return { ...production, thoughtDiagnostics };
}

function unsupportedForProduction(realityEditorDebug: unknown, production: string): boolean {
  const audit = array(record(realityEditorDebug).auditorSpans)
    .find((item) => clean(record(item).production).toUpperCase() === production.toUpperCase());
  return array(record(audit).spans)
    .some((span) => clean(record(span).classification).toUpperCase() === "UNSUPPORTED_REALITY");
}

function removedForProduction(realityEditorDebug: unknown, production: string): boolean {
  const removed = array(record(realityEditorDebug).removedSpans)
    .find((item) => clean(record(item).production).toUpperCase() === production.toUpperCase());
  return array(record(removed).removedSpans).length > 0;
}

function scoringAccepted(memoryProductionsDebug: unknown, production: string): boolean {
  const item = array(record(memoryProductionsDebug).productions)
    .find((candidate) => clean(record(candidate).production).toUpperCase() === production.toUpperCase());
  return record(item).accepted === true;
}

function assembledFromProduction(synthesizedFromDebug: unknown, production: string): boolean {
  return array(synthesizedFromDebug).some((line) =>
    array(record(line).synthesizedFrom).some((id) =>
      clean(id).toUpperCase().startsWith(`${production.toUpperCase()}-`),
    ),
  );
}

function finalGroundingRejected(groundingResult: unknown, production: string, memoryProductionsDebug: unknown): boolean {
  const selected = clean(record(memoryProductionsDebug).winner).toUpperCase();
  if (selected !== production.toUpperCase()) return false;
  const original = Number(record(groundingResult).originalScenes ?? 0);
  const accepted = Number(record(groundingResult).acceptedScenes ?? original);
  return accepted < original;
}

function observeAuthority(input: {
  production: string;
  realityEditorDebug: unknown;
  memoryProductionsDebug: unknown;
  synthesizedFromDebug: unknown;
  groundingResult: unknown;
}): AuthorityObservation {
  const claimAuditorUnsupported = unsupportedForProduction(input.realityEditorDebug, input.production);
  const realityEditorRemoved = removedForProduction(input.realityEditorDebug, input.production);
  const acceptedByScoring = scoringAccepted(input.memoryProductionsDebug, input.production);
  const selectedLate = clean(record(input.memoryProductionsDebug).winner).toUpperCase() === input.production.toUpperCase();
  const assembled = assembledFromProduction(input.synthesizedFromDebug, input.production);
  const finalRejected = finalGroundingRejected(input.groundingResult, input.production, input.memoryProductionsDebug);
  const discoveredAndSurvived = (selectedLate || assembled) && !finalRejected;
  const failureLayer: AuthorityObservation["failureLayer"] = discoveredAndSurvived
    ? "NONE"
    : claimAuditorUnsupported
      ? "CLAIM_AUDITOR"
      : realityEditorRemoved
        ? "REALITY_EDITOR"
        : finalRejected
          ? "FINAL_GROUNDING"
          : acceptedByScoring
            ? "LATE_SELECTION"
            : "LATE_SELECTION";

  return {
    claimAuditorUnsupported,
    realityEditorRemoved,
    finalGroundingRejected: finalRejected,
    acceptedByScoring,
    selectedLate,
    assembledFromProduction: assembled,
    discoveredAndSurvived,
    failureLayer,
  };
}

function parseArgs(argv: string[]): CliOptions {
  let runs = DEFAULT_RUNS;
  let runsExplicit = false;
  let live = false;
  let rawOnly = false;
  let semanticScopeAb = false;
  let propositionalScopeOnly = false;
  let classifierRegression = false;
  let classifyText: string | undefined;
  let reclassifyFile: string | undefined;
  let authorityReplay: string | undefined;
  const domains: DomainId[] = [];

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]!;
    if (arg === "--authority-replay") {
      authorityReplay = argv[++index];
      if (!authorityReplay) throw new Error("--authority-replay requires a saved discovery JSON path");
      continue;
    }
    if (arg === "--live") {
      live = true;
      continue;
    }
    if (arg === "--raw-only") {
      rawOnly = true;
      continue;
    }
    if (arg === "--semantic-scope-ab") {
      semanticScopeAb = true;
      continue;
    }
    if (arg === "--propositional-scope-only") {
      propositionalScopeOnly = true;
      continue;
    }
    if (arg === "--classifier-regression") {
      classifierRegression = true;
      continue;
    }
    if (arg === "--runs") {
      runs = Number(argv[++index]);
      runsExplicit = true;
      continue;
    }
    if (arg.startsWith("--runs=")) {
      runs = Number(arg.slice("--runs=".length));
      runsExplicit = true;
      continue;
    }
    if (arg === "--domain") {
      domains.push(...domainIdsFromArg(argv[++index] ?? ""));
      continue;
    }
    if (arg.startsWith("--domain=")) {
      domains.push(...domainIdsFromArg(arg.slice("--domain=".length)));
      continue;
    }
    if (arg === "--classify-text") {
      classifyText = argv[++index] ?? "";
      continue;
    }
    if (arg.startsWith("--classify-text=")) {
      classifyText = arg.slice("--classify-text=".length);
      continue;
    }
    if (arg === "--reclassify-file") {
      reclassifyFile = argv[++index] ?? "";
      continue;
    }
    if (arg.startsWith("--reclassify-file=")) {
      reclassifyFile = arg.slice("--reclassify-file=".length);
      continue;
    }
  }

  if (!Number.isInteger(runs) || runs < 1) {
    throw new Error("--runs must be a positive integer");
  }
  if (semanticScopeAb && propositionalScopeOnly) {
    throw new Error("--semantic-scope-ab and --propositional-scope-only cannot be combined");
  }

  return {
    domains: domains.length ? [...new Set(domains)] : DOMAINS.map((domain) => domain.id),
    runs,
    runsExplicit,
    live,
    rawOnly,
    semanticScopeAb,
    propositionalScopeOnly,
    classifierRegression,
    classifyText,
    reclassifyFile,
    authorityReplay,
  };
}

function domainIdsFromArg(value: string): DomainId[] {
  const normalized = value.trim().toLowerCase();
  if (!normalized || normalized === "all") return DOMAINS.map((domain) => domain.id);
  const ids = normalized.split(",").map((item) => item.trim()).filter(Boolean);
  const allowed = new Set(DOMAINS.map((domain) => domain.id));
  for (const id of ids) {
    if (!allowed.has(id as DomainId)) {
      throw new Error(`Unknown --domain ${id}. Expected one of: ${[...allowed].join(", ")}, all`);
    }
  }
  return ids as DomainId[];
}

function printHeader(title: string): void {
  console.log(`\n=== ${title} ===`);
}

function printJson(value: unknown): void {
  console.log(JSON.stringify(value ?? null, null, 2));
}

function flattenReplayTexts(value: unknown): string[] {
  if (typeof value === "string") return [clean(value)].filter(Boolean);
  if (Array.isArray(value)) {
    return value.flatMap((item) => flattenReplayTexts(item));
  }
  const item = record(value);
  const directText = clean(item.text ?? item.production ?? item.raw ?? item.rawText);
  if (directText) return [directText];
  for (const key of ["rawProductions", "productions", "attempts", "items", "results"]) {
    const nested = item[key];
    const texts = flattenReplayTexts(nested);
    if (texts.length) return texts;
  }
  return [];
}

function replayEntriesFromCapturedHarnessLog(source: string): ReplayEntry[] {
  const entries: ReplayEntry[] = [];
  let currentRun: number | undefined;
  let pendingProduction: string | undefined;
  let pendingLines: string[] = [];

  const flush = () => {
    const text = clean(pendingLines.join(" "));
    if (pendingProduction && text) {
      entries.push({
        run: currentRun,
        production: pendingProduction,
        text,
      });
    }
    pendingProduction = undefined;
    pendingLines = [];
  };

  for (const rawLine of source.split(/\r?\n/)) {
    const line = rawLine.trim();
    const runMatch = line.match(/^===\s+COCO RUN\s+(\d+)\s+===$/i);
    if (runMatch) {
      flush();
      currentRun = Number(runMatch[1]);
      continue;
    }

    const productionMatch = line.match(/^===\s+RAW AUTHOR\s+([A-Z])\s+===$/i);
    if (productionMatch) {
      flush();
      pendingProduction = productionMatch[1]!.toUpperCase();
      continue;
    }

    if (!pendingProduction) continue;
    if (line.startsWith("===")) {
      flush();
      continue;
    }
    if (!line) {
      flush();
      continue;
    }
    pendingLines.push(line);
  }

  flush();
  return entries;
}

function resolveReplayPath(path: string): string | URL {
  if (existsSync(path)) return path;
  if (/^(?:[a-z]:[\\/]|[\\/])/i.test(path)) return path;
  const repoRelative = new URL(`../../${path.replace(/\\/g, "/")}`, import.meta.url);
  return existsSync(repoRelative) ? repoRelative : path;
}

function readReplayText(path: string): string {
  const buffer = readFileSync(resolveReplayPath(path));
  if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xfe) {
    return buffer.toString("utf16le").replace(/^\uFEFF/, "");
  }
  const sample = buffer.subarray(0, Math.min(buffer.length, 200));
  const zeroBytes = [...sample].filter((byte) => byte === 0).length;
  if (zeroBytes > sample.length / 4) {
    return buffer.toString("utf16le").replace(/^\uFEFF/, "");
  }
  return buffer.toString("utf8").replace(/^\uFEFF/, "");
}

async function replaySavedAuthority(path: string, live: boolean): Promise<void> {
  const saved = record(JSON.parse(readReplayText(path)));
  if (saved.schemaVersion !== 1) throw new Error("Expected saved discoveries schemaVersion 1");
  const entries = array(saved.discoveries).map(record);
  if (!entries.length) throw new Error("Saved discoveries must not be empty");
  const worlds = new Map<string, { subject: string; suppliedReality: AuthorCreativeEvent[]; entries: Record<string, unknown>[] }>();
  // Validate every candidate before making any calls. No first-world filtering
  // or first-three truncation: a good losing candidate must remain reviewable.
  for (const entry of entries) {
    if (typeof entry.subject !== "string" || !clean(entry.subject) ||
        typeof entry.text !== "string" || !clean(entry.text)) {
      throw new Error("Every saved discovery requires a subject and nonempty text");
    }
    const reality = array(entry.suppliedReality).map((item) => {
      const event = record(item);
      if (typeof event.id !== "string" || !clean(event.id) ||
          typeof event.text !== "string" || !clean(event.text)) throw new Error("Invalid supplied reality event");
      return { id: event.id, text: event.text };
    });
    if (!reality.length || new Set(reality.map((item) => item.id)).size !== reality.length) {
      throw new Error("Supplied reality must have unique event IDs");
    }
    const key = JSON.stringify([entry.subject, reality]);
    let world = worlds.get(key);
    if (!world) {
      world = { subject: entry.subject, suppliedReality: reality, entries: [] };
      worlds.set(key, world);
    }
    world.entries.push(entry);
  }
  const batches = [...worlds.values()].flatMap((world) => {
    const result = [];
    for (let index = 0; index < world.entries.length; index += 3) {
      const selected = world.entries.slice(index, index + 3);
      const productions = directAuthorAttemptsToProductions({
        attempts: selected.map((entry) => ({ text: entry.text })),
      }).map((production) => ({ ...production, lines: production.lines.map((line) => ({
        ...line, sourceEventIds: world.suppliedReality.map((event) => event.id),
      })) }));
      result.push({ subject: world.subject, suppliedReality: world.suppliedReality, selected, productions });
    }
    return result;
  });
  console.log("AUTHORITY REPLAY: saved words only; no Author generation or synthesis.");
  console.log(`Replaying all ${entries.length} discoveries across ${worlds.size} worlds in ${batches.length} batches; none omitted.`);
  console.log(`Claim Auditor/Reality Editor, then final grounding on surviving sequences. At most ${batches.length + entries.length} model calls.`);
  console.log("Initial source IDs expose the full world for auditing; they are not evidence of support.");
  if (!live) {
    printJson({ batches });
    console.log("DRY: authority NOT_CHECKED; no model calls.");
    return;
  }
  const directory = new URL("../../.qre-debug/open-discourse/", import.meta.url);
  mkdirSync(directory, { recursive: true });
  const destination = new URL(`authority-${Date.now()}-${process.pid}.json`, directory);
  const results = [];
  for (const batch of batches) {
    const edited = await editDirectAuthorReality({ suppliedReality: batch.suppliedReality, productions: batch.productions });
    const final = [];
    for (const production of edited.productions) {
      const grounded = await verifyAuthorCreativeGrounding({ scenes: production.lines, suppliedReality: batch.suppliedReality });
      final.push({ production: production.production, ...grounded });
    }
    results.push({ ...batch, edited, final });
    // Keep completed observations if a later batch fails.
    const report = { schemaVersion: 1, source: path, totalCandidates: entries.length,
      completedBatches: results.length, totalBatches: batches.length, batches: results,
      authorityStatus: "MODEL_JUDGMENT_OBSERVED",
      note: "Observed audit judgments need human review; survival does not prove correctness." };
    writeFileSync(destination, `${JSON.stringify(report, null, 2)}\n`);
    printJson(results[results.length - 1]);
  }
  console.log(`SAVED AUTHORITY JSON: ${decodeURIComponent(destination.pathname).replace(/^\/(?=[a-z]:)/i, "")}`);
}

function replayEntriesFromFile(path: string): ReplayEntry[] {
  const source = readReplayText(path);
  const capturedHarnessEntries = replayEntriesFromCapturedHarnessLog(source);
  if (capturedHarnessEntries.length) return capturedHarnessEntries;

  const parsed = parseJson(source);
  if (parsed !== undefined) {
    return flattenReplayTexts(parsed).map((text) => ({ text }));
  }

  return source
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*(?:[-*]|\d+[.)]|[A-Z]:|\[[^\]]+\])\s*/, ""))
    .map(clean)
    .filter((line) => line && !line.startsWith("#"))
    .map((text) => ({ text }));
}

function diagnosticForReplayEntry(
  entry: ReplayEntry,
  domain: DiscoveryDomain,
  index: number,
): RawProductionDiagnostic {
  const text = entry.text.trim();
  const diagnostic = labelsForText(text, domain);
  return {
    domain: domain.id,
    run: entry.run ?? Math.floor(index / 3) + 1,
    production: entry.production ?? String.fromCharCode("A".charCodeAt(0) + (index % 3)),
    text,
    ...diagnostic,
  };
}

function printClassificationOnly(entries: readonly ReplayEntry[], domain: DiscoveryDomain): void {
  const diagnostics = entries.map((entry, index) => diagnosticForReplayEntry(entry, domain, index));
  const oldGeneralized = diagnostics.filter((item) => oldKeywordGeneralizedReference(item.text)).length;
  const generalized = diagnostics.filter((item) => item.semanticClass === "GENERALIZED_PROPOSITION");
  const particular = diagnostics.filter((item) => item.semanticClass === "PARTICULAR_CHARACTERIZATION");
  const specificUnsupplied = diagnostics.filter((item) => item.semanticClass === "SPECIFIC_UNSUPPLIED_PARTICIPATION");
  const other = diagnostics.filter((item) => item.semanticClass === "OTHER");

  printHeader("POST-GENERATION OBSERVATIONAL RECLASSIFICATION");
  console.log("No Author generation, authority, scoring, selection, or downstream calls performed.");
  console.log(`domain: ${domain.id}`);
  console.log(`total raw productions: ${diagnostics.length}`);
  console.log(`OLD KEYWORD GENERALIZED_REFERENCE count: ${oldGeneralized}`);
  console.log(`GENERALIZED_PROPOSITION count: ${generalized.length}`);
  console.log(`PARTICULAR_CHARACTERIZATION count: ${particular.length}`);
  console.log(`SPECIFIC_UNSUPPLIED_PARTICIPATION count: ${specificUnsupplied.length}`);
  console.log(`OTHER count: ${other.length}`);
  const thoughts = diagnostics.flatMap((item) => item.thoughtDiagnostics);
  console.log(`GENERALIZED_PROPOSITION thought spans: ${thoughts.filter((item) => item.labels.includes("GENERALIZED_PROPOSITION")).length}`);
  console.log(`EXPLANATORY_WRAPPING thought spans: ${thoughts.filter((item) => item.explanatoryWrapping).length}`);
  console.log("Thought flags are observational. Authority NOT_CHECKED; mixed productions can contain both discovery and invention.");
  printHeader("GENERALIZED_PROPOSITION TEXTS");
  if (!generalized.length) {
    console.log("ZERO");
  } else {
    for (const item of generalized) console.log(`[run ${item.run} ${item.production}] ${item.text}`);
  }
  printHeader("SPECIFIC_UNSUPPLIED_PARTICIPATION TEXTS");
  if (!specificUnsupplied.length) {
    console.log("ZERO");
  } else {
    for (const item of specificUnsupplied) console.log(`[run ${item.run} ${item.production}] ${item.text}`);
  }
  if (diagnostics.length <= 10) {
    printJson(diagnostics.map((item) => ({
      run: item.run,
      production: item.production,
      semanticClass: item.semanticClass,
      labels: item.labels,
      oldKeywordGeneralizedReference: oldKeywordGeneralizedReference(item.text),
      text: item.text,
      thoughtDiagnostics: item.thoughtDiagnostics,
    })));
  }
}

function assertClassifierCase(
  name: string,
  domain: DiscoveryDomain,
  text: string,
  expected: SemanticOperationClass,
): void {
  const actual = labelsForText(text, domain).semanticClass;
  if (actual !== expected) {
    throw new Error(`${name}: expected ${expected}, received ${actual} for ${JSON.stringify(text)}`);
  }
}

function runDeterministicClassifierRegressionTests(): void {
  const coco = DOMAINS.find((domain) => domain.id === "coco")!;
  const house = DOMAINS.find((domain) => domain.id === "house")!;

  assertClassifierCase(
    "open-class generalized proposition from saved live discovery",
    coco,
    "Some complaints are brief. Some accessories outlast them.",
    "GENERALIZED_PROPOSITION",
  );
  for (const text of ["Coco objected immediately.", "The bows survived.", "The bows were already there."]) {
    if (!labelsForText(text, coco).possibleNewConcreteReasons.length) throw new Error(`Missing review flag: ${text}`);
  }
  const mixed = labelsForText("The notable thing is that Coco objected. Some complaints are brief. A neighbor praised Coco's bows.", coco);
  if (!mixed.thoughtDiagnostics.some((item) => item.semanticClass === "GENERALIZED_PROPOSITION") ||
      !mixed.thoughtDiagnostics.some((item) => item.semanticClass === "SPECIFIC_UNSUPPLIED_PARTICIPATION") ||
      !mixed.thoughtDiagnostics.some((item) => item.explanatoryWrapping)) {
    throw new Error("Mixed production must expose discovery, invention, and wrapping independently");
  }
  const nomination = labelsForText("The bows survived the objection.", coco);
  if (nomination.thoughtDiagnostics[0]?.exactText !== "The bows survived the objection." ||
      nomination.thoughtDiagnostics[0]?.authorityStatus !== "NOT_CHECKED") {
    throw new Error("User-nominated expression must remain exact and unaudited, not automatically rejected");
  }
  assertClassifierCase(
    "particular characterization",
    coco,
    "Coco's bath mattered less than the little bow standoff.",
    "PARTICULAR_CHARACTERIZATION",
  );
  assertClassifierCase(
    "true generalized proposition",
    coco,
    "Customers usually treat tiny details as proof.",
    "GENERALIZED_PROPOSITION",
  );
  assertClassifierCase(
    "generic noun without generalized proposition",
    coco,
    "The ceremony was the blue bows, not the bath.",
    "PARTICULAR_CHARACTERIZATION",
  );
  assertClassifierCase(
    "unresolved participant reference to supplied occurrence",
    coco,
    "Someone tried to undo Coco's blue bows before pickup.",
    "OTHER",
  );
  assertClassifierCase(
    "rhetorical class statement",
    house,
    "Real estate agents love turning porch light into a thesis.",
    "GENERALIZED_PROPOSITION",
  );
  assertClassifierCase(
    "specific unsupplied participation",
    coco,
    "A neighbor praised Coco's blue bows before pickup.",
    "SPECIFIC_UNSUPPLIED_PARTICIPATION",
  );

  printHeader("DETERMINISTIC CLASSIFIER REGRESSION");
  console.log("PASS");
}

function antiContaminationReport(messages: ReadonlyArray<{ role: string; content: string }>): Array<{ term: string; present: boolean; note: string }> {
  const input = messages.map((message) => message.content).join("\n");
  const terms = [
    "Apparently, humans love bows.",
    "generalized reference",
    "generalized observation",
    "generalized-reference instruction",
    "category-level commentary",
    "category-level instruction",
    "target semantic operation",
    "humans",
    "people",
    "society",
    "everyone",
    "nobody",
    "visitors",
    "humanity",
    "particular-to-general",
    "rhetorical POV",
    "make the house talk",
    "personification",
    "social commentary",
    "GENERALIZED_PROPOSITION",
    "RHETORICAL_POV",
    "PERSONIFICATION",
    "DERIVED_CHARACTERIZATION",
    "DERIVED_SIGNIFICANCE",
    "SOCIAL_OBSERVATION",
    "METAPHOR",
    "ABSTRACTION",
    "IMPLICATION",
    "RECONTEXTUALIZATION",
    "DIRECT_REPLAY_ONLY",
    "POSSIBLE_NEW_CONCRETE_REALITY",
  ];

  return terms.map((term) => ({
    term,
    present: input.toLowerCase().includes(term.toLowerCase()),
    note: input.toLowerCase().includes(term.toLowerCase())
      ? "present in current production Author input; review whether this is legitimate production doctrine"
      : "not present",
  }));
}

function printDry(options: CliOptions, selectedDomains: DiscoveryDomain[]): void {
  const coco = DOMAINS.find((domain) => domain.id === "coco")!;
  const cocoMessages = directAuthorMessagesFor(coco, "CONTROL");
  const model = localModelConfig();
  const promptHash = currentDirectAuthorPromptHash();

  printHeader("DRY MODE");
  console.log("No live model calls performed.");
  console.log(`runs per domain: ${options.runs}`);
  console.log(`selected domains: ${selectedDomains.map((domain) => domain.id).join(", ")}`);
  console.log(`raw-only: ${String(options.rawOnly)}`);

  printHeader("PROVIDER / MODEL RESOLUTION");
  printJson(model);
  console.log(`author fallback model: ${clean(process.env.QRE_AUTHOR_FALLBACK_MODEL) || "(empty)"}`);

  printHeader("PROMPT HASHES");
  console.log(`source region hash: ${promptHash}`);
  console.log(`pre-hook source region hash: ${PRE_HOOK_SOURCE_REGION_HASH}`);
  console.log(`actual Coco CONTROL message hash: ${messageHash(cocoMessages)}`);

  printHeader("DOMAINS AND SUPPLIED REALITY");
  for (const domain of selectedDomains) {
    console.log(`\n${domain.label}`);
    console.log(`id: ${domain.id}`);
    console.log(`source: ${domain.source}`);
    console.log(`subject: ${domain.subject}`);
    console.log(`prompt: ${domain.prompt}`);
    domain.facts.forEach((fact, index) => console.log(`event-${index + 1}: ${fact}`));
    for (const note of domain.notes ?? []) console.log(`note: ${note}`);
  }

  printHeader("CALL PLAN");
  const plannedRuns = selectedDomains.length * options.runs;
  console.log(`independent Direct Creative Author generations planned: ${plannedRuns}`);
  console.log(`expected Direct Author calls: ${plannedRuns}`);
  console.log(`expected total provider calls: ${options.rawOnly ? plannedRuns : `up to ${plannedRuns * 8}`}`);
  console.log(`expected Claim Auditor calls: ${options.rawOnly ? 0 : "pipeline-dependent"}`);
  console.log(`expected Final Grounding calls: ${options.rawOnly ? 0 : "pipeline-dependent"}`);
  console.log(`expected Synthesizer calls: ${options.rawOnly ? 0 : "pipeline-dependent"}`);
  console.log(`--raw-only downstream avoidance: ${String(options.rawOnly)}`);
  console.log(`normal production function: ${generateDirectAuthorMemoryProductions.name}`);
  console.log(`raw-only function: ${generateDirectAuthorMemoryProductions.name}`);
  console.log(`raw-only imported production generator identity: ${String(generateDirectAuthorMemoryProductions === authorCreativeModule.generateDirectAuthorMemoryProductions)}`);
  console.log("raw-only parser/converter: production parseJson -> directAuthorAttemptsToProductions");

  printHeader("EXACT COCO AUTHOR REQUEST / MESSAGES");
  printJson(cocoMessages);

  printHeader("ANTI-CONTAMINATION CHECK");
  const report = antiContaminationReport(cocoMessages);
  printJson({
    harnessSpecificCreativeCoachingDetected: report.some((item) =>
      item.present &&
      !["IMPLICATION"].includes(item.term),
    ),
    note: "This scan is over the exact Coco Direct Creative Author input reconstructed from the current production function. The harness adds no creative coaching to those messages.",
    findings: report,
  });
}

function printSemanticScopeAbDry(options: CliOptions, selectedDomains: DiscoveryDomain[]): void {
  const experimentDomains = selectedDomains.filter((domain) => SEMANTIC_SCOPE_AB_DOMAIN_IDS.includes(domain.id));
  const experimentRuns = options.runsExplicit ? options.runs : SEMANTIC_SCOPE_AB_RUNS;
  const sourceRegionHash = currentDirectAuthorPromptHash();

  printHeader("SEMANTIC SCOPE A/B DRY MODE");
  console.log("No live model calls performed.");
  console.log("mode: CONTROL and TREATMENT through generateDirectAuthorMemoryProductions");
  console.log(`domains: ${experimentDomains.map((domain) => domain.id).join(", ")}`);
  console.log(`runs per condition per domain: ${experimentRuns}`);

  printHeader("SOURCE REGION HASH");
  console.log(`pre-hook source region hash: ${PRE_HOOK_SOURCE_REGION_HASH}`);
  console.log(`new source region hash: ${sourceRegionHash}`);

  printHeader("ACTUAL MODEL-MESSAGE HASHES");
  for (const domain of experimentDomains) {
    console.log(domain.label);
    console.log(`CONTROL: ${messageHash(directAuthorMessagesFor(domain, "CONTROL"))}`);
    console.log(`SEMANTIC_SCOPE: ${messageHash(directAuthorMessagesFor(domain, "SEMANTIC_SCOPE"))}`);
  }

  printHeader("A/B CALL PLAN");
  console.log(`domains: ${experimentDomains.length}`);
  console.log(`total Direct Author calls: ${experimentDomains.length * experimentRuns * 2}`);
  console.log(`CONTROL calls: ${experimentDomains.length * experimentRuns}`);
  console.log(`TREATMENT calls: ${experimentDomains.length * experimentRuns}`);
  console.log(`raw productions: ${experimentDomains.length * experimentRuns * 2 * 3}`);
  console.log("Claim Auditor calls: 0");
  console.log("Reality Editor calls: 0");
  console.log("Final Grounding calls: 0");
  console.log("scoring calls: 0");
  console.log("synthesizer calls: 0");
  console.log(`CONTROL omits semanticScopeSearchInstruction: true`);
  console.log(`TREATMENT supplies semanticScopeSearchInstruction: true`);
  console.log(`treatment instruction: ${SEMANTIC_SCOPE_SEARCH_INSTRUCTION}`);
  console.log("same production generator: true");
  console.log("same parser/converter: production parseJson -> directAuthorAttemptsToProductions");
  console.log("downstream pipeline invoked: false");
}

function printPropositionalScopeDry(options: CliOptions, selectedDomains: DiscoveryDomain[]): void {
  const experimentDomains = selectedDomains.filter((domain) => SEMANTIC_SCOPE_AB_DOMAIN_IDS.includes(domain.id));
  const directAuthorCalls = experimentDomains.length * options.runs;
  const coco = DOMAINS.find((domain) => domain.id === "coco")!;

  printHeader("PROPOSITIONAL SCOPE DRY MODE");
  console.log("No live model calls performed.");
  console.log(`domain: ${experimentDomains.map((domain) => `${domain.label} (${domain.id})`).join(", ")}`);
  console.log("condition: PROPOSITIONAL_SCOPE");
  console.log(`runs: ${options.runs}`);
  console.log(`raw-only: ${String(options.rawOnly)}`);
  console.log(`expected Direct Author calls: ${directAuthorCalls}`);
  console.log(`expected raw productions: ${directAuthorCalls * 3}`);
  console.log("expected Claim Auditor calls: 0");
  console.log("expected Reality Editor calls: 0");
  console.log("expected Final Grounding calls: 0");
  console.log("expected scoring calls: 0");
  console.log("expected synthesizer calls: 0");
  console.log(`actual Coco PROPOSITIONAL_SCOPE message hash: ${messageHash(directAuthorMessagesFor(coco, "PROPOSITIONAL_SCOPE"))}`);
  console.log(`PROPOSITIONAL_SCOPE instruction: ${PROPOSITIONAL_SCOPE_SEARCH_INSTRUCTION}`);
  console.log("same production generator: true");
  console.log("same parser/converter: production parseJson -> directAuthorAttemptsToProductions");
  console.log("downstream pipeline invoked: false");
}

function authorizedDiscoveryPool(
  discovery: Awaited<ReturnType<typeof discoverAuthorCreativeDirection>>["discovery"],
): AuthorizedRealization[] {
  return discovery.candidates.map((candidate, index) => ({
    id: `discovery-${candidate.id}`,
    sourceProduction: "A",
    text: candidate.perception,
    classification: "KEEP_EXPRESSION",
    sourceEventIds: [...candidate.evidenceEventIds],
    originalOrder: index + 1,
    spanIndex: 0,
    materialKind: "EXPRESSIVE_PERSPECTIVE",
  }));
}

async function synthesizeGroundedDiscoveryPool(input: {
  subject: string;
  events: readonly AuthorCreativeEvent[];
  discovery: Awaited<ReturnType<typeof discoverAuthorCreativeDirection>>["discovery"];
}) {
  const pool = authorizedDiscoveryPool(input.discovery);
  const synthesis = await synthesizeAuthorizedRealizations({
    subject: input.subject,
    suppliedReality: input.events,
    pool,
  });
  return { pool, synthesis };
}

async function realizeGroundedDiscoveryAsMovingText(input: {
  subject: string;
  events: ReadonlyArray<{ id: string; text: string }>;
  discovery: Awaited<ReturnType<typeof discoverAuthorCreativeDirection>>["discovery"];
}): Promise<{ text: string; model: string }> {
  const selected = input.discovery.selected;
  const result = await localModelGenerate(
    [
      {
        role: "system",
        content: [
          "You are QRE Experimental Mouth.",
          "A separate Discovery stage already decided what is worth saying. Do not rediscover the experience and do not fall back to retelling the supplied timeline.",
          "Your job is realization only: turn the authorized grounded thought into viewer-facing moving text.",
          "The DISCOVERY PERCEPTION is the thought to preserve. The DISCOVERY RELATIONSHIP explains why supplied evidence licenses it; it is not copy that must appear.",
          "Public wording may be completely new. It may sound conversational, opinionated, funny, irritated, affectionate, observant, questioning, blunt, strange, or understated when that realizes the authorized thought.",
          "Do not equate creativity with poetry, dramatic fragments, metaphor, ceremonial language, or event recap.",
          "The public cuts do not owe the viewer the originating facts. Mention a supplied fact only when it makes the authorized thought stronger.",
          "Write for moving text. Each line is one arriving beat. Aim for 3-6 nonempty cuts. Favor 1-7 words per cut, but preserve a complete sharp thought rather than making it cryptic.",
          "Reality remains closed. Do not add a concrete participant, event, action, object, place, physical state, observation, motive, cause, duration, persistence, outcome, chronology, or history beyond SUPPLIED_REALITY.",
          "Expression remains open. Attitude, implication, rhetorical perspective, judgment, humor, comparison, generalized observation, and questions are allowed when they realize the authorized discovery without asserting a new concrete occurrence.",
          "Return only structured JSON.",
        ].join("\\n"),
      },
      {
        role: "user",
        content: JSON.stringify({
          SUBJECT: input.subject,
          SUPPLIED_REALITY: input.events,
          AUTHORIZED_DISCOVERY: {
            perception: selected.perception,
            relationship: selected.relationship,
            evidenceEventIds: selected.evidenceEventIds,
          },
          instruction:
            "Realize the authorized discovery as moving text. Preserve its thought; do not replace it with a timeline recap.",
        }),
      },
    ],
    "json",
    {
      numPredict: 500,
      openRouterMaxTokens: 1000,
      temperature: 0.92,
      jsonSchema: {
        type: "object",
        additionalProperties: false,
        required: ["text"],
        properties: {
          text: { type: "string" },
        },
      },
    },
  );

  const parsed = parseAuthorJson(result.text);
  return {
    text: clean(parsed?.text),
    model: result.model,
  };
}

async function runDomain(
  domain: DiscoveryDomain,
  runs: number,
  rawOnly: boolean,
  condition: SemanticScopeCondition = "CONTROL",
): Promise<RawProductionDiagnostic[]> {
  const diagnostics: RawProductionDiagnostic[] = [];

  for (let run = 1; run <= runs; run += 1) {
    printHeader(`${domain.label} RUN ${run}`);

    if (rawOnly) {
      const world = buildDomainRealityGraph(domain);
      const events = suppliedRealityEventsFromWorld(world);

      if (condition === "SEMANTIC_SCOPE") {
  await probeDedicatedGeneralizationSearch({
    subject: domain.subject,
    events,
    domainContext: domain.domainContext,
  });

  const fixedRhetoricalPovVerification =
    await verifyExperimentalRhetoricalPovCandidates({
      candidates: [
        {
          id: "fixed-pov-aesthetic-judgment",
          perception: "The blue bows are a bit much.",
          relationship:
            "The supplied blue bows license an aesthetic judgment about the decoration.",
          evidenceEventIds: ["event-3"],
        },
        {
          id: "fixed-pov-value-judgment",
          perception: "Happy at pickup is what matters most.",
          relationship:
            "The supplied happy pickup licenses a value judgment about which supplied detail matters most.",
          evidenceEventIds: ["event-5"],
        },
        {
          id: "fixed-pov-character-tendency",
          perception:
            "Trying to remove the bows is exactly the sort of thing Coco would do.",
          relationship:
            "The supplied removal attempt is the only evidence; this candidate tests whether one occurrence is improperly promoted into an enduring character tendency.",
          evidenceEventIds: ["event-4"],
        },
      ],
      events,
      domainContext: domain.domainContext,
    });

  printHeader("FIXED RHETORICAL POV AUTHORITY BOUNDARY");
  printJson(fixedRhetoricalPovVerification);

  const discoveryResult = await discoverAuthorCreativeDirection({
    events,
    relations: world.relations.map((relation) => ({
      from: relation.from,
      to: relation.to,
      kind: relation.kind,
      strength: relation.strength,
    })),
    domainContext: domain.domainContext,
  });
        const poolResult = await synthesizeGroundedDiscoveryPool({
          subject: domain.subject,
          events,
          discovery: discoveryResult.discovery,
        });
        const synthesizedText = clean(
          poolResult.synthesis.truthResult.candidate?.rawText ??
          poolResult.synthesis.candidate?.rawText,
        );
        const realizationResult = synthesizedText
          ? { text: synthesizedText, model: poolResult.synthesis.model }
          : await realizeGroundedDiscoveryAsMovingText({
              subject: domain.subject,
              events,
              discovery: discoveryResult.discovery,
            });

        printHeader("DISCOVERY POOL -> SYNTHESIS EXPERIMENT");
        printJson({
          condition,
          discoveryModel: discoveryResult.model,
          discoveryModelCalls: discoveryResult.modelCalls,
          authorizedDiscoveryPool: poolResult.pool.map((realization) => ({
            id: realization.id,
            text: realization.text,
            sourceEventIds: realization.sourceEventIds,
          })),
          legacySelectedDiscovery: {
            id: discoveryResult.discovery.selected.id,
            perception: discoveryResult.discovery.selected.perception,
          },
          synthesisModel: poolResult.synthesis.model,
          synthesisModelCalls: poolResult.synthesis.modelCalls,
          synthesisEligible: poolResult.synthesis.truthResult.eligible,
          synthesisReasons: poolResult.synthesis.truthResult.reasons,
          synthesisScoring: poolResult.synthesis.truthResult.scoring,
          synthesisRawOutput: poolResult.synthesis.rawOutput,
          usedSynthesizedRealization: Boolean(synthesizedText),
          fallbackMouthCalls: synthesizedText ? 0 : 1,
        });
        printHeader(synthesizedText ? "EXPERIMENTAL SYNTHESIZED REALIZATION" : "EXPERIMENTAL MOUTH FALLBACK");
        console.log(realizationResult.text);

        const diagnostic = labelsForText(realizationResult.text, domain);
        diagnostics.push({
          domain: domain.id,
          condition,
          run,
          production: synthesizedText ? "DISCOVERY_SYNTHESIS" : "DISCOVERY_MOUTH_FALLBACK",
          text: realizationResult.text,
          ...diagnostic,
        });

        printHeader("POST-GENERATION OBSERVATIONAL ANALYSIS");
        console.log("LEXICAL HEURISTICS ONLY. Discovery survivors were grounded and semantic-move verified before synthesis; synthesized realization uses the production synthesis truth path.");
        printJson(diagnostics.filter((item) => item.domain === domain.id && item.run === run));
        continue;
      }

      const directAuthorResult = await generateDirectAuthorMemoryProductions({
        subject: domain.subject,
        suppliedReality: events,
        ...experimentalInstructionFor(condition),
      });
      const parsedAuthorResult = parseAuthorJson(directAuthorResult.text);
      const authoredProductions = directAuthorAttemptsToProductions(parsedAuthorResult);

      printHeader("RAW-ONLY DIRECT AUTHOR RESULT");
      printJson({
        model: directAuthorResult.model,
        provider: directAuthorResult.provider,
        condition,
        directAuthorCalls: 1,
        totalProviderCalls: 1,
        claimAuditorCalls: 0,
        finalGroundingCalls: 0,
        synthesizerCalls: 0,
        productionGeneratorIdentity:
          generateDirectAuthorMemoryProductions === authorCreativeModule.generateDirectAuthorMemoryProductions,
        parserAndConverter: "production parseJson -> directAuthorAttemptsToProductions",
      });

      for (const entry of rawProductionEntries(authoredProductions)) {
        printHeader(`RAW AUTHOR ${entry.production}`);
        console.log(entry.text);
        const diagnostic = labelsForText(entry.text, domain);
        diagnostics.push({
          domain: domain.id,
          condition,
          run,
          production: entry.production,
          text: entry.text,
          ...diagnostic,
        });
      }

      printHeader("POST-GENERATION OBSERVATIONAL ANALYSIS");
      console.log("LEXICAL HEURISTICS ONLY. Authority NOT_CHECKED. No flags does not establish grounding; no category match does not establish absence of discovery.");
      printJson(diagnostics.filter((item) => item.domain === domain.id && item.run === run));
      continue;
    }

    const capture = captureQreDebugLogs();
    let creativeResult: Awaited<ReturnType<typeof createAuthorExperience>>;
    let groundingResult: Awaited<ReturnType<typeof verifyAuthorCreativeGrounding>>;
    let fullAuthorDiscoveryResult: Awaited<ReturnType<typeof discoverAuthorCreativeDirection>>;

    try {
      const world = buildDomainRealityGraph(domain);
      const events = suppliedRealityEventsFromWorld(world);
      fullAuthorDiscoveryResult = await discoverAuthorCreativeDirection({
        events,
        relations: world.relations.map((relation) => ({
          from: relation.from,
          to: relation.to,
          kind: relation.kind,
          strength: relation.strength,
        })),
        memory: [],
        domainContext: domain.domainContext,
      });

      creativeResult = await createAuthorExperience({
        subject: domain.subject,
        suppliedReality: events,
        creativeDiscovery: fullAuthorDiscoveryResult.discovery,
        memory: [],
        domainContext: domain.domainContext,
      });

      groundingResult = await verifyAuthorCreativeGrounding({
        scenes: creativeResult.scenes,
        suppliedReality: events,
        semanticAuthority: [
          fullAuthorDiscoveryResult.discovery.selected.perception,
          fullAuthorDiscoveryResult.discovery.selected.relationship,
        ].map(clean).filter(Boolean),
        domainContext: domain.domainContext,
      });
    } finally {
      capture.restore();
    }

    printHeader("FULL AUTHOR DISCOVERY HANDOFF");
    printJson({
      model: fullAuthorDiscoveryResult.model,
      modelCalls: fullAuthorDiscoveryResult.modelCalls,
      candidates: fullAuthorDiscoveryResult.discovery.candidates,
      selectedCandidateId: fullAuthorDiscoveryResult.discovery.selectedCandidateId,
      selected: fullAuthorDiscoveryResult.discovery.selected,
      selectionReason: fullAuthorDiscoveryResult.discovery.selectionReason,
    });
    const rawAuthor = debugBlock(capture.blocks, "DIRECT-CREATIVE-AUTHOR-PRODUCTIONS")?.parsed;
    const realityEditorDebug = debugBlock(capture.blocks, "REALITY-EDITOR")?.parsed;
    const memoryProductionsDebug = debugBlock(capture.blocks, "MEMORY-PRODUCTIONS")?.parsed;
    const synthesizedFromDebug = debugBlock(capture.blocks, "SYNTHESIZED-FROM")?.parsed;

    if (!rawAuthor) throw new Error("Missing DIRECT-CREATIVE-AUTHOR-PRODUCTIONS debug block");
    if (!realityEditorDebug) throw new Error("Missing REALITY-EDITOR debug block");
    if (!memoryProductionsDebug) throw new Error("Missing MEMORY-PRODUCTIONS debug block");

    for (const entry of rawAttemptEntries(rawAuthor)) {
      printHeader(`RAW AUTHOR ${entry.production}`);
      console.log(entry.text);
      const diagnostic = labelsForText(entry.text, domain);
      const authority = observeAuthority({
        production: entry.production,
        realityEditorDebug,
        memoryProductionsDebug,
        synthesizedFromDebug,
        groundingResult,
      });
      diagnostics.push({
        domain: domain.id,
        condition,
        run,
        production: entry.production,
        text: entry.text,
        ...diagnostic,
        authority,
      });
    }

    printHeader("POST-GENERATION OBSERVATIONAL ANALYSIS");
    printJson(diagnostics.filter((item) => item.domain === domain.id && item.run === run));

    if (!rawOnly) {
      printHeader("PROVENANCE");
      printJson(record(realityEditorDebug).originalAuthorProductions ?? null);
      printHeader("CLAIM AUDITOR");
      printJson(record(realityEditorDebug).auditorSpans ?? null);
      printHeader("REALITY EDITOR");
      printJson(realityEditorDebug);
      printHeader("FINAL GROUNDING");
      printJson(groundingResult);
      printHeader("SCORING / D / SELECTION");
      printJson(memoryProductionsDebug);
      printHeader("AUTHORIZED REALIZATION POOL");
      printJson(debugBlock(capture.blocks, "AUTHORIZED-REALIZATION-POOL")?.parsed ?? null);
      printHeader("SYNTHESIZER / ASSEMBLED CANDIDATE");
      printJson({
        assemblerRawOutput: debugBlock(capture.blocks, "ASSEMBLER-RAW-OUTPUT")?.text ?? "",
        assemblerTruthResult: debugBlock(capture.blocks, "ASSEMBLER-TRUTH-RESULT")?.parsed ?? null,
        synthesizerInput: debugBlock(capture.blocks, "SYNTHESIZER-INPUT")?.parsed ?? null,
        rawSynthesizerOutput: debugBlock(capture.blocks, "RAW-SYNTHESIZER-OUTPUT")?.text ?? "",
        synthesizedFrom: synthesizedFromDebug ?? null,
        synthesisClaimAuditor: debugBlock(capture.blocks, "SYNTHESIS-CLAIM-AUDITOR")?.parsed ?? null,
        synthesisRealityEditor: debugBlock(capture.blocks, "SYNTHESIS-REALITY-EDITOR")?.parsed ?? null,
        synthesisEligibility: debugBlock(capture.blocks, "SYNTHESIS-ELIGIBILITY")?.parsed ?? null,
      });
      printHeader("FINAL SELECTED PRODUCTION");
      printJson({
        winner: record(memoryProductionsDebug).winner ?? null,
        selectedText: productionTextFromMemoryDebug(memoryProductionsDebug, clean(record(memoryProductionsDebug).winner)),
        scenes: creativeResult.scenes,
      });
      printHeader("PRODUCTION DIAGNOSTIC MODEL CALLS");
      printJson({
        createAuthorExperienceModelCalls: creativeResult.modelCalls,
      });
    }
  }

  return diagnostics;
}

function countWithLabel(items: readonly RawProductionDiagnostic[], label: DiagnosticLabel): number {
  return items.filter((item) => item.labels.includes(label)).length;
}

function rate(count: number, total: number): string {
  return total ? `${count}/${total} (${((count / total) * 100).toFixed(1)}%)` : "0/0 (0.0%)";
}

function printMetrics(allDiagnostics: readonly RawProductionDiagnostic[], selectedDomains: readonly DiscoveryDomain[], runs: number): void {
  for (const domain of selectedDomains) {
    const items = allDiagnostics.filter((item) => item.domain === domain.id);
    printHeader(`${domain.label} DISCOVERY METRICS`);
    console.log(`TOTAL AUTHOR RUNS: ${runs}`);
    console.log(`TOTAL RAW PRODUCTIONS: ${items.length}`);
    for (const label of DIAGNOSTIC_LABELS) {
      const count = countWithLabel(items, label);
      console.log(`${label}: ${rate(count, items.length)}`);
    }
    const generalizedItems = items.filter((item) => item.semanticClass === "GENERALIZED_PROPOSITION");
    const generalizedRuns = new Set(generalizedItems.map((item) => item.run));
    console.log(`NUMBER OF RUNS containing a heuristically detected GENERALIZED_PROPOSITION: ${generalizedRuns.size}`);
    console.log(`NUMBER OF RAW PRODUCTIONS containing a heuristically detected GENERALIZED_PROPOSITION: ${generalizedItems.length}`);

    const discovered = items.filter((item) =>
      item.labels.some((label) => label !== "DIRECT_REPLAY_ONLY"),
    );
    if (!items.some((item) => item.authority)) {
      console.log("AUTHORITY: NOT_CHECKED. Survival/rejection counts are unavailable in raw-only mode.");
      continue;
    }
    console.log(`DISCOVERED AND SURVIVED AUTHORITY: ${discovered.filter((item) => item.authority?.discoveredAndSurvived).length}`);
    console.log(`DISCOVERED BUT KILLED BY CLAIM AUDITOR: ${discovered.filter((item) => item.authority?.failureLayer === "CLAIM_AUDITOR").length}`);
    console.log(`DISCOVERED BUT KILLED BY REALITY EDITOR: ${discovered.filter((item) => item.authority?.failureLayer === "REALITY_EDITOR").length}`);
    console.log(`DISCOVERED BUT KILLED BY FINAL GROUNDING: ${discovered.filter((item) => item.authority?.failureLayer === "FINAL_GROUNDING").length}`);
    console.log(`DISCOVERED BUT LOST IN LATE SELECTION: ${discovered.filter((item) => item.authority?.failureLayer === "LATE_SELECTION").length}`);
  }
}

function printConditionMetrics(
  allDiagnostics: readonly RawProductionDiagnostic[],
  selectedDomains: readonly DiscoveryDomain[],
  runs: number,
  conditions: readonly SemanticScopeCondition[],
): void {
  for (const condition of conditions) {
    const items = allDiagnostics.filter((item) => item.condition === condition);
    printHeader(`${condition} CONDITION METRICS`);
    console.log(`Direct Author calls: ${selectedDomains.length * runs}`);
    console.log(`raw productions: ${items.length}`);
    for (const semanticClass of [
      "PARTICULAR_CHARACTERIZATION",
      "GENERALIZED_PROPOSITION",
      "SPECIFIC_UNSUPPLIED_PARTICIPATION",
      "OTHER",
    ] as const) {
      console.log(`${semanticClass}: ${items.filter((item) => item.semanticClass === semanticClass).length}`);
    }

    printHeader(`${condition} GENERALIZED_PROPOSITION TEXTS`);
    const generalized = items.filter((item) => item.semanticClass === "GENERALIZED_PROPOSITION");
    if (!generalized.length) console.log("ZERO");
    else for (const item of generalized) console.log(`[${item.domain} run ${item.run} ${item.production}] ${item.text}`);

    printHeader(`${condition} SPECIFIC_UNSUPPLIED_PARTICIPATION TEXTS`);
    const participation = items.filter((item) => item.semanticClass === "SPECIFIC_UNSUPPLIED_PARTICIPATION");
    if (!participation.length) console.log("ZERO");
    else for (const item of participation) console.log(`[${item.domain} run ${item.run} ${item.production}] ${item.text}`);

    printHeader(`${condition} SECONDARY OBSERVATIONAL LABELS`);
    for (const label of DIAGNOSTIC_LABELS) {
      console.log(`${label}: ${rate(countWithLabel(items, label), items.length)}`);
    }
  }
}

function printCocoSpecialReport(allDiagnostics: readonly RawProductionDiagnostic[]): void {
  const coco = allDiagnostics.filter((item) => item.domain === "coco");
  if (!coco.length) return;

  printHeader("COCO OPEN-DISCOURSE DISCOVERIES");
  const discoveries = coco.filter((item) =>
    item.labels.some((label) => label !== "DIRECT_REPLAY_ONLY" && label !== "POSSIBLE_NEW_CONCRETE_REALITY"),
  );
  if (!discoveries.length) {
    console.log("none");
  } else {
    for (const item of discoveries) console.log(`[run ${item.run} ${item.production}] ${item.text}`);
  }

  printHeader("COCO GENERALIZED PROPOSITIONS");
  const generalized = coco.filter((item) => item.semanticClass === "GENERALIZED_PROPOSITION");
  if (!generalized.length) {
    console.log("GENERALIZED PROPOSITION DISCOVERY: 0");
  } else {
    for (const item of generalized) console.log(`[run ${item.run} ${item.production}] ${item.text}`);
  }

  printHeader("COCO SPECIFIC PARTICIPATION INVENTIONS");
  const inventions = coco.filter((item) => item.labels.includes("POSSIBLE_NEW_CONCRETE_REALITY"));
  if (!inventions.length) {
    console.log("none");
  } else {
    for (const item of inventions) {
      console.log(`[run ${item.run} ${item.production}] ${item.text}`);
      for (const reason of item.possibleNewConcreteReasons) console.log(`reason: ${reason}`);
    }
  }
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const selectedDomains = DOMAINS.filter((domain) => options.domains.includes(domain.id));
  if (options.authorityReplay) {
    await replaySavedAuthority(options.authorityReplay, options.live);
    return;
  }

  if (options.classifierRegression) {
    runDeterministicClassifierRegressionTests();
    if (options.classifyText === undefined && !options.reclassifyFile && !options.live) return;
  }

  if (options.classifyText !== undefined || options.reclassifyFile) {
    const domain = selectedDomains[0] ?? DOMAINS.find((item) => item.id === "coco")!;
    const entries = [
      ...(options.classifyText !== undefined ? [{ text: options.classifyText }] : []),
      ...(options.reclassifyFile ? replayEntriesFromFile(options.reclassifyFile) : []),
    ].map((entry) => ({ ...entry, text: entry.text.trim() })).filter((entry) => entry.text);
    if (!entries.length) {
      throw new Error("No text supplied for diagnostic reclassification");
    }
    printClassificationOnly(entries, domain);
    return;
  }

  const promptHash = currentDirectAuthorPromptHash();

  if (!options.live) {
    if (options.semanticScopeAb) {
      printSemanticScopeAbDry(options, selectedDomains);
      return;
    }
    if (options.propositionalScopeOnly) {
      printPropositionalScopeDry(options, selectedDomains);
      return;
    }
    printDry(options, selectedDomains);
    return;
  }

  if (options.semanticScopeAb && !options.rawOnly) {
    throw new Error("--semantic-scope-ab requires --raw-only");
  }
  if (options.propositionalScopeOnly && !options.rawOnly) {
    throw new Error("--propositional-scope-only requires --raw-only");
  }

  const experimentDomains = options.semanticScopeAb || options.propositionalScopeOnly
    ? selectedDomains.filter((domain) => SEMANTIC_SCOPE_AB_DOMAIN_IDS.includes(domain.id))
    : selectedDomains;
  const experimentRuns = options.semanticScopeAb
    ? options.runsExplicit ? options.runs : SEMANTIC_SCOPE_AB_RUNS
    : options.runs;

  process.env.QRE_AUTHOR_DIRECT_CREATIVE_EXPERIMENT = "true";
  process.env.QRE_AUTHOR_REALITY_EDITOR_EXPERIMENT = "true";
  process.env.QRE_AUTHOR_DEBUG_RAW = "true";

  printHeader("LIVE MODE");
  console.log(`domains: ${experimentDomains.map((domain) => domain.id).join(", ")}`);
  console.log(`runs per domain: ${experimentRuns}`);
  console.log(`raw-only: ${String(options.rawOnly)}`);
  console.log(`direct author source-region hash: ${promptHash}`);
  printJson(localModelConfig());

  const allDiagnostics: RawProductionDiagnostic[] = [];
  for (const domain of experimentDomains) {
    if (options.semanticScopeAb) {
      allDiagnostics.push(...await runDomain(domain, experimentRuns, true, "CONTROL"));
      allDiagnostics.push(...await runDomain(domain, experimentRuns, true, "SEMANTIC_SCOPE"));
    } else if (options.propositionalScopeOnly) {
      allDiagnostics.push(...await runDomain(domain, experimentRuns, true, "PROPOSITIONAL_SCOPE"));
    } else {
      allDiagnostics.push(...await runDomain(domain, experimentRuns, options.rawOnly));
    }
  }

  if (options.semanticScopeAb) {
    printConditionMetrics(allDiagnostics, experimentDomains, experimentRuns, ["CONTROL", "SEMANTIC_SCOPE"]);
  } else if (options.propositionalScopeOnly) {
    printConditionMetrics(allDiagnostics, experimentDomains, experimentRuns, ["PROPOSITIONAL_SCOPE"]);
  } else {
    printMetrics(allDiagnostics, experimentDomains, experimentRuns);
  }
  printCocoSpecialReport(allDiagnostics);
  const directory = new URL("../../.qre-debug/open-discourse/", import.meta.url);
  mkdirSync(directory, { recursive: true });
  const path = new URL(`discoveries-${Date.now()}-${process.pid}.json`, directory);
  writeFileSync(path, `${JSON.stringify({ schemaVersion: 1, promptHash, model: localModelConfig(), discoveries: allDiagnostics.map((item) => {
    const domain = DOMAINS.find((domain) => domain.id === item.domain)!;
    return { ...item, subject: domain.subject, suppliedReality: suppliedRealityEventsFromWorld(buildDomainRealityGraph(domain)),
      classificationMethod: "LEXICAL_HEURISTIC", authorityStatus: item.authority ? "OBSERVED" : "NOT_CHECKED" };
  }) }, null, 2)}\n`);
  console.log(`SAVED DISCOVERIES JSON: ${decodeURIComponent(path.pathname).replace(/^\/(?=[a-z]:)/i, "")}`);
}

await main();
