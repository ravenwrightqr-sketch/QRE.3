import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  applyAuthorRealityEditorEdits,
  buildAuthorRealityEditorPayload,
} from "./src/services/authorCreative.js";
import {
  verifyAuthorCreativeGrounding,
} from "./src/services/authorCreativeGroundingVerifier.js";
import {
  localModelConfig,
  localModelGenerate,
  type LocalModelJsonSchema,
  type LocalModelMessage,
} from "./src/services/localModelRuntime.js";

const DIRECT_AUTHOR_PROMPT_HASH =
  "0d81899c9379fc1268f956d9d60a5a128a40c6ec6b67295c6f1bd42253c1349a";

const OUTPUT_DIR = ".qre-debug/semantic-boundary";
const OUTPUT_FILE = "semantic-boundary-results.json";

const CLAIM_AUDITOR_SYSTEM = [
  "You are the Claim Auditor.",
  "The supplied reality controls what actually happened.",
  "The text has already been authored. Do not author it again.",
  "Judge independently removable exact text spans from the authored productions.",
  "First partition each authored production into atomicClaimSpans, then classify each atomicClaimSpan.",
  "Each atomicClaimSpan must be the smallest exact, non-overlapping, semantically independently classifiable authored substring needed to distinguish SUPPORTED_REALITY, KEEP_EXPRESSION, and UNSUPPORTED_REALITY.",
  "A mixed authored sentence must not be represented by one audit span when different semantic claim units inside it can receive different classifications.",
  "A sentence or clause containing separable substantive material that one classification cannot truthfully describe is not a valid atomicClaimSpan.",
  "Audit at the smallest semantically independent claim unit that can be exactly identified in the authored text.",
  "You may identify smaller exact substrings inside a sentence when one sentence mixes supported reality, allowable expression, and unsupported reality.",
  "Do not classify an entire sentence UNSUPPORTED_REALITY merely because one atomic claim inside it is unsupported.",
  "Do not classify an entire sentence KEEP_EXPRESSION when it embeds an unsupported concrete or mental proposition.",
  "Split authored material into smaller exact claim-bearing spans when necessary.",
  "Classify each span as exactly SUPPORTED_REALITY, KEEP_EXPRESSION, or UNSUPPORTED_REALITY.",
  "SUPPORTED_REALITY means exact authored material directly established by supplied reality.",
  "KEEP_EXPRESSION means exact authored amplification or derived meaning of supplied reality that introduces no new concrete occurrence.",
  "UNSUPPORTED_REALITY means exact authored material requiring additional reality.",
  "Classification is about what must be true for the authored span to be valid.",
  "Expressiveness does not excuse an unsupported proposition.",
  "REALITY STAYS FIXED. MEANING MAY MOVE.",
  "REALITY IS CLOSED. DISCOURSE IS OPEN.",
  "New language, perspective, implication, category reference, rhetorical speaker, personification, metaphor, and discovered significance are allowed when they do not require additional world participation.",
  "Mention is not participation. A category, role, group, narrator, institution, object voice, place voice, or social class may appear in expressive language without becoming a factual participant in the occurrence.",
  "Do not ask whether the span mentions an unsupplied entity. Ask whether understanding it requires believing a particular additional entity actually participated in the supplied world.",
  "POV licenses voice, not events. A rhetorical speaker is not automatically a literal actor, observer, thinker, or source of additional history.",
  "A derived characterization of supplied reality is not automatically another fact in supplied reality.",
  "Ask whether understanding the authored characterization requires believing that an additional concrete occurrence happened.",
  "If no additional concrete occurrence is required, the span may qualify as KEEP_EXPRESSION even when the exact characterization was not supplied.",
  "KEEP_EXPRESSION may characterize, interpret, reframe, compress, compare, intensify, abstract, or change the perceived significance of supplied material without becoming an additional occurrence.",
  "Derived perception of intensity, density, significance, contrast, pattern, atmosphere, emphasis, relationship, progression, transformation, salience, or experiential character is allowed only when it does not require another concrete occurrence.",
  "Do not treat experiential character or perceived density as an asserted mental state unless the span requires a specific experiencer's private state.",
  "UNSUPPORTED_REALITY remains required for any additional participant, event, action, interaction, participant behavior, physical relation, location, object, chronology, causal occurrence, observed occurrence, mental state, or outcome.",
  "Universal authority test: strip away rhetoric, metaphor, POV, personification, generalized reference, abstraction, comparison, implication, interpretation, attitude, and discovered significance; then ask what additional thing the viewer must believe actually happened.",
  "If the answer is nothing additional, the span may be KEEP_EXPRESSION. If the answer requires an additional participant, event, action, interaction, observation, mental state, location, object, chronology, cause, outcome, or concrete history, it requires supplied evidence.",
  "First ask whether the span asserts or requires any additional concrete occurrence beyond supplied evidence.",
  "If it requires additional reality that supplied evidence directly establishes, classify SUPPORTED_REALITY.",
  "If it introduces no new concrete occurrence and can function as derived meaning, rhetoric, evaluation, metaphor, humor, attitude, or framing of supplied reality, classify KEEP_EXPRESSION.",
  "If it requires additional concrete occurrence that supplied evidence does not directly establish, classify UNSUPPORTED_REALITY.",
  "Otherwise classify UNSUPPORTED_REALITY.",
  "Evidence licenses only what it establishes.",
  "A supplied object, entity, event, action, state, or relationship licenses that supplied reality only.",
  "It does not license unsupplied measurements, quantities, colors, temperatures, materials, sensory properties, physical attributes, physical manifestations, methods, components, environmental details, causes, outcomes, mental states, preferences, motives, or other concrete specifics.",
  "Do not infer facts from common sense, world knowledge, domain familiarity, likelihood, typical consequences, implication, association, narrative convention, or what usually happens.",
  "An action does not establish its method, manner, tool, component, motive, preference, success, failure, resistance, ownership, or outcome unless supplied.",
  "A state or emotion does not establish bodily behavior, visible manifestation, private thought, preference, cause, or later continuity unless supplied.",
  "Chronology does not establish causality, resolution, transition mechanism, urgency, or duration beyond what is supplied.",
  "An event or object does not establish an unreported measurement, quantity, sensory property, material, color, temperature, location, environmental condition, physical effect, or neighboring attribute.",
  "A supplied specificity becomes usable reality: if the authored span uses the supplied exact specificity, classify that portion as SUPPORTED_REALITY when it is otherwise faithful.",
  "Do not infer neighboring properties from a supplied property.",
  "Mental propositions are reality too: wanting, preferring, noticing, remembering, forgetting, feeling, deciding, liking, disliking, satisfaction, offense, expectation, or motive are UNSUPPORTED_REALITY unless supplied evidence establishes them.",
  "Physical and sensory propositions are reality too: visible bodily motion, contact, texture, smell, sound, taste, temperature, pressure, weight, volume, speed, amount, material, or environmental condition are UNSUPPORTED_REALITY unless supplied evidence establishes them.",
  "Missing specificity must redirect creative pressure onto supplied reality itself, not complete the missing attribute.",
  "KEEP_EXPRESSION may amplify supplied reality through derived significance, relational meaning, attitude, absurdity, tension, contrast, metaphor, rhetorical role, emphasis, or evaluative framing only when the span introduces no new concrete occurrence.",
  "Derived meaning may say a supplied event mattered, changed how another supplied event reads, became setup, became payoff, felt less accidental, or gained significance, provided it does not add an unsupplied event, action, participant, object, place, physical state, mental state, cause, chronology, outcome, property, measurement, sensory detail, or state change.",
  "A rhetorical characterization of an established event may survive when it does not require another event, property, cause, state, motive, or outcome to be true.",
  "Do not automatically treat a word as safe or unsafe based on vocabulary alone.",
  "Judge what proposition the span requires in context.",
  "If a phrase requires a literal unsupplied event, action, participant, object, place, property, measurement, quantity, sensory detail, manifestation, method, cause, outcome, physical state, mental state, or state change, classify that phrase UNSUPPORTED_REALITY.",
  "If it is derived meaning or rhetorical framing of supplied reality and introduces no new concrete occurrence, classify KEEP_EXPRESSION.",
  "Do not invent or assume participation, role participation, objects, places, actions, interactions, environments, observations, reactions, sensations, preferences, thoughts, causes, outcomes, or concrete history.",
  "Do not classify an entire production as one claim when smaller independently removable claims exist.",
  "Do not hide an unsupported proposition inside a larger KEEP_EXPRESSION span.",
  "If a sentence contains both safe rhetoric and an unsupported concrete or mental claim, separate them when exact authored substrings permit safe deterministic deletion.",
  "UNKNOWN ATTRIBUTE -> DO NOT COMPLETE. KNOWN THING -> AMPLIFY THE KNOWN THING.",
  "Do not rewrite, improve, summarize, paraphrase, replace, repair, or create prose.",
  "Do not substitute words, reorder words, or generate replacement prose.",
  "Return only judgments tied to exact authored text.",
].join("\n");

const CLAIM_AUDITOR_SCHEMA: LocalModelJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["audits"],
  properties: {
    audits: {
      type: "array",
      minItems: 3,
      maxItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["production", "atomicClaimSpans"],
        properties: {
          production: { type: "string", enum: ["A", "B", "C"] },
          atomicClaimSpans: {
            type: "array",
            minItems: 0,
            maxItems: 64,
            items: {
              type: "object",
              additionalProperties: false,
              required: ["exactText", "classification", "sourceEventIds", "atomicity"],
              properties: {
                exactText: { type: "string" },
                classification: {
                  type: "string",
                  enum: [
                    "SUPPORTED_REALITY",
                    "KEEP_EXPRESSION",
                    "UNSUPPORTED_REALITY",
                  ],
                },
                atomicity: {
                  type: "string",
                  enum: ["SMALLEST_INDEPENDENT_CLASSIFIABLE_UNIT"],
                },
                sourceEventIds: {
                  type: "array",
                  minItems: 0,
                  maxItems: 32,
                  items: { type: "string", maxLength: 64 },
                },
              },
            },
          },
        },
      },
    },
  },
};

type Domain = {
  id: string;
  label: string;
  source: string;
  subject: string;
  facts: string[];
  omitted?: boolean;
  omitReason?: string;
  notes?: string[];
  domainContext?: Record<string, unknown>;
};

type IntendedSemanticClass =
  | "DERIVED_MEANING"
  | "EXPRESSIVE_FRAME"
  | "DIRECT_REPLAY"
  | "NEW_CONCRETE_REALITY";

type Probe = {
  probeId: string;
  domain: string;
  group: string;
  semanticOperation: string;
  intendedSemanticClass: IntendedSemanticClass;
  minimalPairId: string;
  pairSide: "A" | "B";
  text: string;
};

type MappingSpan = {
  exactText: string;
  start: number | null;
  end: number | null;
  mappingStatus: "MAPPED" | "NOT_FOUND";
  overlapOrAmbiguityStatus: "NONE" | "AMBIGUOUS_DUPLICATE" | "OVERLAP" | "NOT_MAPPED";
};

type ResultRecord = {
  probeId: string;
  domain: string;
  group: string;
  semanticOperation: string;
  intendedSemanticClass: IntendedSemanticClass;
  minimalPairId: string;
  suppliedReality: Array<{ id: string; text: string }>;
  candidateText: string;
  rawClaimAudit: unknown;
  normalizedSpans: unknown[];
  mapping: MappingSpan[];
  realityEditor: unknown;
  finalGrounding: unknown;
  finalAuthority: "PASS" | "FAIL" | "TEST_ERROR" | "DRY_NOT_RUN";
  failureLayer:
    | "NONE"
    | "CLAIM_AUDITOR"
    | "NORMALIZATION"
    | "MAPPING"
    | "REALITY_EDITOR"
    | "FINAL_GROUNDING"
    | "OTHER"
    | "DRY_NOT_RUN";
};

type ProbeSelection = {
  probes: Probe[];
  probeIds: string[];
  groups: string[];
  limit?: number;
  acceptanceGate: boolean;
};

type CapturedLogs = {
  rawModelOutputs: string[];
  openRouterUsage: string[];
  finishReasons: string[];
  requestModels: string[];
};

const DOMAINS: Domain[] = [
  {
    id: "COCO",
    label: "Coco grooming",
    source: "apps/api/author-direct-creative-live-output.ts and requested fixture",
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
    id: "HOUSEKEEPING",
    label: "Housekeeping service",
    source: "apps/api/author-universal-creative-stress.ts",
    subject: "housekeeping service",
    facts: [
      "Arrived at 9:04 AM",
      "Cleaned the kitchen",
      "Cleaned two bathrooms",
      "Finished at 11:47 AM",
    ],
    notes: [
      "Canonical repo fixture differs from requested housekeeping example: no 10:10 AM arrival, no cat appeared, and no 1:00 PM departure.",
    ],
    domainContext: {
      experienceMode: "MEMORY",
      category: "SERVICE",
      serviceType: "HOUSEKEEPING",
    },
  },
  {
    id: "REAL_ESTATE",
    label: "Real estate showing memory",
    source: "test-only closed-world/open-discourse fixture",
    subject: "Maple Street house",
    facts: [
      "Front porch photographed on Thursday.",
      "Afternoon showing.",
      "Open house on Saturday.",
      "Offer came Monday.",
    ],
    notes: [
      "Test-only supplied reality fixture for rhetorical place POV and real-estate category commentary.",
    ],
    domainContext: {
      experienceMode: "MEMORY",
      category: "REAL ESTATE",
      subjectKind: "PLACE",
    },
  },
  {
    id: "MILO",
    label: "Milo dog walk",
    source: "apps/api/author-universal-creative-stress.ts",
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
    id: "RELATIONSHIP",
    label: "Relationship memory",
    source: "apps/api/author-universal-core-acceptance.ts",
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
      subjectType: "PERSON",
    },
  },
  {
    id: "BUSINESS_SERVICE",
    label: "Mobile car detailing service",
    source: "apps/api/author-universal-creative-stress.ts",
    subject: "mobile car detail",
    facts: [
      "Arrived at 1:15 PM",
      "Vacuumed interior",
      "Cleaned seats",
      "Washed exterior",
      "Finished at 3:02 PM",
    ],
    domainContext: {
      experienceMode: "MEMORY",
      category: "SERVICE",
      serviceType: "MOBILE CAR DETAILING",
    },
  },
  {
    id: "CAR_HISTORY",
    label: "Car object history",
    source: "test-only closed-world/open-discourse fixture",
    subject: "red car",
    facts: [
      "Red car listed for sale.",
      "Test drive on Friday.",
      "Exterior washed before pickup.",
      "Buyer picked up the car on Monday.",
    ],
    notes: [
      "Test-only supplied reality fixture for rhetorical object POV without literal object cognition.",
    ],
    domainContext: {
      experienceMode: "MEMORY",
      category: "OBJECT HISTORY",
      subjectKind: "OBJECT",
    },
  },
  {
    id: "TRAVEL",
    label: "Travel recurrence memory",
    source: "test-only relational-meaning fixture",
    subject: "Lisbon trip",
    facts: [
      "Memory 1: visited Lisbon in April.",
      "Memory 1: stopped at the same riverside cafe.",
      "Memory 2: returned to Lisbon in October.",
      "Memory 2: stopped at the same riverside cafe again.",
      "Memory 3: packed the same green suitcase for Lisbon.",
    ],
    notes: [
      "Test-only supplied reality fixture for multi-memory recurrence and place significance probes.",
    ],
    domainContext: {
      experienceMode: "MEMORY",
      category: "TRAVEL",
      subjectType: "PLACE",
    },
  },
  {
    id: "OBJECT_HISTORY",
    label: "Object history memory",
    source: "test-only relational-meaning fixture",
    subject: "green mug",
    facts: [
      "Memory 1: bought a green mug at the airport.",
      "Memory 2: packed the green mug during the move.",
      "Memory 3: put the green mug on the new kitchen shelf.",
      "Memory 4: used the green mug on the first morning in the new apartment.",
    ],
    notes: [
      "Test-only supplied reality fixture for object significance/history without adding physical object events.",
    ],
    domainContext: {
      experienceMode: "MEMORY",
      category: "OBJECT HISTORY",
      subjectType: "OBJECT",
    },
  },
];

const PROBES: Probe[] = [
  p("COCO-001A", "COCO", "generalized observation", "COCO-GENERAL-REFERENCE-PARTICIPANT", "A", "Apparently. Humans love bows."),
  p("COCO-001B", "COCO", "new concrete participant", "COCO-GENERAL-REFERENCE-PARTICIPANT", "B", "A woman admired the bows."),
  p("COCO-002A", "COCO", "metaphor", "COCO-METAPHOR-PHYSICAL-ACTION", "A", "The bows were a declaration of war."),
  p("COCO-002B", "COCO", "new concrete action", "COCO-METAPHOR-PHYSICAL-ACTION", "B", "Someone declared war over the bows."),
  p("COCO-003A", "COCO", "personification", "COCO-PERSONIFICATION-EVENT", "A", "The bows had ambitions."),
  p("COCO-003B", "COCO", "new concrete action", "COCO-PERSONIFICATION-EVENT", "B", "The bows moved."),
  p("COCO-004A", "COCO", "interpretive attitude", "COCO-INTERPRETATION-MENTAL-STATE", "A", "Apparently, the bows were negotiable."),
  p("COCO-004B", "COCO", "new mental state", "COCO-INTERPRETATION-MENTAL-STATE", "B", "Coco hated the bows."),
  p("COCO-005A", "COCO", "abstraction", "COCO-ABSTRACTION-ACTION", "A", "Adornment met resistance."),
  p("COCO-005B", "COCO", "new concrete action", "COCO-ABSTRACTION-ACTION", "B", "Coco ripped the bows off."),
  p("COCO-006A", "COCO", "literal replay", "COCO-SUPPLIED-EVENTS-CHRONOLOGY", "A", "Bath. Bows. Resistance."),
  p("COCO-006B", "COCO", "new chronology", "COCO-SUPPLIED-EVENTS-CHRONOLOGY", "B", "Right after the bath, she tried to remove the bows."),
  p("COCO-007A", "COCO", "generalized observation", "COCO-GENERAL-CONCRETE-OBSERVATION", "A", "Decoration is rarely a democracy."),
  p("COCO-007B", "COCO", "social observation", "COCO-GENERAL-CONCRETE-OBSERVATION", "B", "Everyone thought the bows looked good."),
  p("COCO-008A", "COCO", "rhetorical framing", "COCO-RHETORICAL-FRAMING-OUTCOME", "A", "The bows became the headline."),
  p("COCO-008B", "COCO", "new outcome", "COCO-RHETORICAL-FRAMING-OUTCOME", "B", "The bows made Coco famous."),

  p("HOUSE-001A", "HOUSEKEEPING", "compression", "HOUSE-COMPRESSION-DURATION", "A", "Kitchen. Two bathrooms. Done by 11:47."),
  p("HOUSE-001B", "HOUSEKEEPING", "new duration", "HOUSE-COMPRESSION-DURATION", "B", "The bathrooms took an hour."),
  p("HOUSE-002A", "HOUSEKEEPING", "category reference", "HOUSE-CATEGORY-OBJECT", "A", "Housekeeping turned into a checklist."),
  p("HOUSE-002B", "HOUSEKEEPING", "new object", "HOUSE-CATEGORY-OBJECT", "B", "A mop crossed every room."),
  p("HOUSE-003A", "HOUSEKEEPING", "rhetorical role", "HOUSE-RHETORICAL-ROLE-LOCATION", "A", "The kitchen was the opening act."),
  p("HOUSE-003B", "HOUSEKEEPING", "new location", "HOUSE-RHETORICAL-ROLE-LOCATION", "B", "They cleaned the bedrooms too."),
  p("HOUSE-004A", "HOUSEKEEPING", "personification", "HOUSE-PERSONIFICATION-PARTICIPANT", "A", "The bathrooms demanded attention."),
  p("HOUSE-004B", "HOUSEKEEPING", "new concrete participant", "HOUSE-PERSONIFICATION-PARTICIPANT", "B", "A cat appeared during the cleaning."),
  p("HOUSE-005A", "HOUSEKEEPING", "supplied-fact relationship", "HOUSE-SUPPLIED-RELATION-CAUSALITY", "A", "The kitchen and two bathrooms defined the job."),
  p("HOUSE-005B", "HOUSEKEEPING", "new causality", "HOUSE-SUPPLIED-RELATION-CAUSALITY", "B", "Because the kitchen was messy, the bathrooms came next."),

  p("MILO-001A", "MILO", "literal replay", "MILO-REPLAY-QUANTITY", "A", "5:00 PM walk. Park. Squirrels. Five dogs. Two compliments. 56 minutes."),
  p("MILO-001B", "MILO", "new quantity", "MILO-REPLAY-QUANTITY", "B", "Six dogs appeared."),
  p("MILO-002A", "MILO", "category reference", "MILO-CATEGORY-LOCATION", "A", "This was a park walk, not a living room walk."),
  p("MILO-002B", "MILO", "new location", "MILO-CATEGORY-LOCATION", "B", "Milo crossed the bridge."),
  p("MILO-003A", "MILO", "social observation", "MILO-SOCIAL-INFERENCE", "A", "Two people said Milo was cute."),
  p("MILO-003B", "MILO", "narrator inference", "MILO-SOCIAL-INFERENCE", "B", "Milo knew he was cute."),
  p("MILO-004A", "MILO", "hyperbole", "MILO-HYPERBOLE-ACTION", "A", "The squirrels ran the agenda."),
  p("MILO-004B", "MILO", "new concrete action", "MILO-HYPERBOLE-ACTION", "B", "Milo chased the squirrels."),
  p("MILO-005A", "MILO", "comparison", "MILO-COMPARISON-DURATION", "A", "Five dogs made the walk feel crowded."),
  p("MILO-005B", "MILO", "new duration", "MILO-COMPARISON-DURATION", "B", "The park stop lasted half an hour."),

  p("REL-001A", "RELATIONSHIP", "literal replay", "REL-REPLAY-MENTAL-STATE", "A", "Nervous before Alex. Two hours talking. Lighter afterward. Next week again."),
  p("REL-001B", "RELATIONSHIP", "new mental state", "REL-REPLAY-MENTAL-STATE", "B", "Alex felt the same way."),
  p("REL-002A", "RELATIONSHIP", "abstraction", "REL-ABSTRACTION-CAUSALITY", "A", "Nerves gave way to lightness."),
  p("REL-002B", "RELATIONSHIP", "new causality", "REL-ABSTRACTION-CAUSALITY", "B", "Talking to Alex caused the lightness."),
  p("REL-003A", "RELATIONSHIP", "counterfactual-style expression", "REL-COUNTERFACTUAL-LOCATION", "A", "As if two hours had opened a window."),
  p("REL-003B", "RELATIONSHIP", "new location", "REL-COUNTERFACTUAL-LOCATION", "B", "They talked by a window."),
  p("REL-004A", "RELATIONSHIP", "interpretive relationship", "REL-INTERPRETIVE-CHRONOLOGY", "A", "The second meeting made the first one matter."),
  p("REL-004B", "RELATIONSHIP", "new chronology", "REL-INTERPRETIVE-CHRONOLOGY", "B", "They texted every day before meeting again."),

  p("BUS-001A", "BUSINESS_SERVICE", "compression", "BUS-COMPRESSION-OBJECT", "A", "Vacuumed interior. Cleaned seats. Washed exterior. Finished at 3:02 PM."),
  p("BUS-001B", "BUSINESS_SERVICE", "new object", "BUS-COMPRESSION-OBJECT", "B", "They polished the dashboard."),
  p("BUS-002A", "BUSINESS_SERVICE", "rhetorical role", "BUS-RHETORICAL-OUTCOME", "A", "The seats became the center of the job."),
  p("BUS-002B", "BUSINESS_SERVICE", "new outcome", "BUS-RHETORICAL-OUTCOME", "B", "The car looked brand new."),
  p("BUS-003A", "BUSINESS_SERVICE", "supplied-fact relationship", "BUS-SUPPLIED-WORLD-KNOWLEDGE", "A", "Interior, seats, exterior: the supplied work."),
  p("BUS-003B", "BUSINESS_SERVICE", "world-knowledge assertion", "BUS-SUPPLIED-WORLD-KNOWLEDGE", "B", "Details like this usually need wax."),
  p("BUS-004A", "BUSINESS_SERVICE", "recontextualization", "BUS-RECONTEXTUALIZATION-IMPLICATION", "A", "The 3:02 finish turned the wash into a completed service."),
  p("BUS-004B", "BUSINESS_SERVICE", "implication", "BUS-RECONTEXTUALIZATION-IMPLICATION", "B", "The exterior wash suggested the whole car got attention."),

  p("RM-REL-001A", "RELATIONSHIP", "later-event recontextualization", "RM-REL-MADE-MATTER", "A", "The second meeting made the first one matter.", "DERIVED_MEANING", "relational-meaning"),
  p("RM-REL-001B", "RELATIONSHIP", "later-event recontextualization", "RM-REL-MADE-MATTER", "B", "The second meeting happened because the first one mattered.", "NEW_CONCRETE_REALITY", "relational-meaning"),
  p("RM-REL-002A", "RELATIONSHIP", "later-event recontextualization", "RM-REL-CHANGED-MEANING", "A", "The second meeting changed the meaning of the first.", "DERIVED_MEANING", "relational-meaning"),
  p("RM-REL-002B", "RELATIONSHIP", "later-event recontextualization", "RM-REL-CHANGED-MEANING", "B", "The second meeting changed the plan from the first.", "NEW_CONCRETE_REALITY", "relational-meaning"),
  p("RM-REL-003A", "RELATIONSHIP", "retrospective reinterpretation", "RM-REL-READS-DIFFERENTLY", "A", "The first meeting reads differently after the second.", "DERIVED_MEANING", "relational-meaning"),
  p("RM-REL-003B", "RELATIONSHIP", "retrospective reinterpretation", "RM-REL-READS-DIFFERENTLY", "B", "The first meeting reads like Alex expected the second.", "NEW_CONCRETE_REALITY", "relational-meaning"),
  p("RM-REL-004A", "RELATIONSHIP", "relationship acquires significance through recurrence", "RM-REL-LESS-ACCIDENTAL", "A", "Two meetings made this feel less accidental.", "DERIVED_MEANING", "relational-meaning"),
  p("RM-REL-004B", "RELATIONSHIP", "relationship acquires significance through recurrence", "RM-REL-LESS-ACCIDENTAL", "B", "Two meetings happened because this was less accidental.", "NEW_CONCRETE_REALITY", "relational-meaning"),
  p("RM-REL-005A", "RELATIONSHIP", "later-event recontextualization", "RM-REL-NO-LONGER-ALONE", "A", "By the second meeting, the first no longer stood alone.", "DERIVED_MEANING", "relational-meaning"),
  p("RM-REL-005B", "RELATIONSHIP", "later-event recontextualization", "RM-REL-NO-LONGER-ALONE", "B", "By the second meeting, Alex no longer arrived alone.", "NEW_CONCRETE_REALITY", "relational-meaning"),
  p("RM-REL-006A", "RELATIONSHIP", "earlier event becomes setup", "RM-REL-FIRST-AS-SETUP", "A", "The first meeting became setup once the second happened.", "DERIVED_MEANING", "relational-meaning"),
  p("RM-REL-006B", "RELATIONSHIP", "earlier event becomes setup", "RM-REL-FIRST-AS-SETUP", "B", "The first meeting set up plans for the second.", "NEW_CONCRETE_REALITY", "relational-meaning"),
  p("RM-REL-007A", "RELATIONSHIP", "later event becomes payoff", "RM-REL-SECOND-AS-PAYOFF", "A", "The second meeting became the payoff to the first.", "DERIVED_MEANING", "relational-meaning"),
  p("RM-REL-007B", "RELATIONSHIP", "later event becomes payoff", "RM-REL-SECOND-AS-PAYOFF", "B", "The second meeting paid off a promise from the first.", "NEW_CONCRETE_REALITY", "relational-meaning"),
  p("RM-REL-008A", "RELATIONSHIP", "rhetorical interpretation of supplied relationship", "RM-REL-PUNCTUATION", "A", "Two meetings turned coincidence into punctuation.", "EXPRESSIVE_FRAME", "relational-meaning"),
  p("RM-REL-008B", "RELATIONSHIP", "rhetorical interpretation of supplied relationship", "RM-REL-PUNCTUATION", "B", "Two meetings turned into an anniversary.", "NEW_CONCRETE_REALITY", "relational-meaning"),
  p("RM-REL-009A", "RELATIONSHIP", "direct replay", "RM-REL-DIRECT-REPLAY", "A", "Met Alex again the next week.", "DIRECT_REPLAY", "relational-meaning"),
  p("RM-REL-009B", "RELATIONSHIP", "direct replay", "RM-REL-DIRECT-REPLAY", "B", "Met Alex again the next day.", "NEW_CONCRETE_REALITY", "relational-meaning"),

  p("RM-MILO-001A", "MILO", "supplied facts create perceived intensity", "RM-MILO-CROWDED-EXACT", "A", "Five dogs made the walk feel crowded.", "DERIVED_MEANING", "relational-meaning"),
  p("RM-MILO-001B", "MILO", "supplied facts create perceived intensity", "RM-MILO-CROWDED-EXACT", "B", "Five dogs crowded Milo on the walk.", "NEW_CONCRETE_REALITY", "relational-meaning"),
  p("RM-MILO-002A", "MILO", "accumulation creates meaning", "RM-MILO-FIVE-DOGS-ACCUMULATION", "A", "Seeing five dogs made the walk feel busier.", "DERIVED_MEANING", "relational-meaning"),
  p("RM-MILO-002B", "MILO", "accumulation creates meaning", "RM-MILO-FIVE-DOGS-ACCUMULATION", "B", "Seeing five dogs made the path busier with owners.", "NEW_CONCRETE_REALITY", "relational-meaning"),
  p("RM-MILO-003A", "MILO", "supplied facts create comparison", "RM-MILO-DOG-COMPARISON", "A", "Five dogs was more dog than one quiet walk needed.", "EXPRESSIVE_FRAME", "relational-meaning"),
  p("RM-MILO-003B", "MILO", "supplied facts create comparison", "RM-MILO-DOG-COMPARISON", "B", "Five dogs barked more than one quiet walk needed.", "NEW_CONCRETE_REALITY", "relational-meaning"),
  p("RM-MILO-004A", "MILO", "supplied facts create perceived intensity", "RM-MILO-LOT-OF-DOG", "A", "Apparently, five dogs is a lot of dog for one walk.", "EXPRESSIVE_FRAME", "relational-meaning"),
  p("RM-MILO-004B", "MILO", "supplied facts create perceived intensity", "RM-MILO-LOT-OF-DOG", "B", "Apparently, five dogs brought a lot of noise to one walk.", "NEW_CONCRETE_REALITY", "relational-meaning"),

  p("RM-COCO-001A", "COCO", "contrast creates meaning", "RM-COCO-BATH-BOW-CONTRAST", "A", "The bath made the bow resistance sharper.", "DERIVED_MEANING", "relational-meaning"),
  p("RM-COCO-001B", "COCO", "contrast creates meaning", "RM-COCO-BATH-BOW-CONTRAST", "B", "The bath made Coco resist the bows harder.", "NEW_CONCRETE_REALITY", "relational-meaning"),
  p("RM-COCO-002A", "COCO", "supplied sequence creates pattern", "RM-COCO-SEQUENCE-PATTERN", "A", "Drop-off, bath, bows, resistance: the day found its pattern.", "DERIVED_MEANING", "relational-meaning"),
  p("RM-COCO-002B", "COCO", "supplied sequence creates pattern", "RM-COCO-SEQUENCE-PATTERN", "B", "Drop-off, bath, bows, resistance: the day followed Coco's usual pattern.", "NEW_CONCRETE_REALITY", "relational-meaning"),
  p("RM-COCO-003A", "COCO", "mundane occurrence becomes meaningful through later occurrence", "RM-COCO-BOW-MATTERED", "A", "The blue bows mattered more after Coco tried to remove them.", "DERIVED_MEANING", "relational-meaning"),
  p("RM-COCO-003B", "COCO", "mundane occurrence becomes meaningful through later occurrence", "RM-COCO-BOW-MATTERED", "B", "The blue bows mattered more after Coco hid them.", "NEW_CONCRETE_REALITY", "relational-meaning"),

  p("RM-HOUSE-001A", "HOUSEKEEPING", "repetition changes interpretation", "RM-HOUSE-TWO-BATHROOMS-REPETITION", "A", "Two bathrooms made the job read like repetition.", "DERIVED_MEANING", "relational-meaning"),
  p("RM-HOUSE-001B", "HOUSEKEEPING", "repetition changes interpretation", "RM-HOUSE-TWO-BATHROOMS-REPETITION", "B", "They cleaned the same bathroom twice.", "NEW_CONCRETE_REALITY", "relational-meaning"),
  p("RM-HOUSE-002A", "HOUSEKEEPING", "supplied facts create comparison", "RM-HOUSE-LARGER-THAN-ROOM", "A", "The kitchen and two bathrooms made the job feel larger than one room.", "DERIVED_MEANING", "relational-meaning"),
  p("RM-HOUSE-002B", "HOUSEKEEPING", "supplied facts create comparison", "RM-HOUSE-LARGER-THAN-ROOM", "B", "The kitchen and two bathrooms were larger than the bedroom.", "NEW_CONCRETE_REALITY", "relational-meaning"),
  p("RM-HOUSE-003A", "HOUSEKEEPING", "general implication from supplied pattern", "RM-HOUSE-INSIDE-SUPPLIED-ROOMS", "A", "Kitchen plus bathrooms implies the work stayed inside the supplied rooms.", "DERIVED_MEANING", "relational-meaning"),
  p("RM-HOUSE-003B", "HOUSEKEEPING", "general implication from supplied pattern", "RM-HOUSE-INSIDE-SUPPLIED-ROOMS", "B", "Kitchen plus bathrooms implies the bedrooms were next.", "NEW_CONCRETE_REALITY", "relational-meaning"),

  p("RM-TRAVEL-001A", "TRAVEL", "recurrence creates significance", "RM-TRAVEL-RETURN-LESS-RANDOM", "A", "Returning to Lisbon made the first visit feel less random.", "DERIVED_MEANING", "relational-meaning"),
  p("RM-TRAVEL-001B", "TRAVEL", "recurrence creates significance", "RM-TRAVEL-RETURN-LESS-RANDOM", "B", "Returning to Lisbon happened because the first visit felt unfinished.", "NEW_CONCRETE_REALITY", "relational-meaning"),
  p("RM-TRAVEL-002A", "TRAVEL", "place acquires significance through supplied recurrence", "RM-TRAVEL-CAFE-MORE-THAN-STOP", "A", "Coming back made the riverside cafe more than a stop.", "DERIVED_MEANING", "relational-meaning"),
  p("RM-TRAVEL-002B", "TRAVEL", "place acquires significance through supplied recurrence", "RM-TRAVEL-CAFE-MORE-THAN-STOP", "B", "Coming back led to a conversation at the riverside cafe.", "NEW_CONCRETE_REALITY", "relational-meaning"),
  p("RM-TRAVEL-003A", "TRAVEL", "later-event recontextualization", "RM-TRAVEL-B-CHANGES-A", "A", "The October return changed how the April visit reads.", "DERIVED_MEANING", "relational-meaning"),
  p("RM-TRAVEL-003B", "TRAVEL", "later-event recontextualization", "RM-TRAVEL-B-CHANGES-A", "B", "The October return changed the April itinerary.", "NEW_CONCRETE_REALITY", "relational-meaning"),
  p("RM-TRAVEL-004A", "TRAVEL", "direct replay", "RM-TRAVEL-DIRECT-REPLAY", "A", "Returned to Lisbon in October.", "DIRECT_REPLAY", "relational-meaning"),
  p("RM-TRAVEL-004B", "TRAVEL", "direct replay", "RM-TRAVEL-DIRECT-REPLAY", "B", "Returned to Lisbon in November.", "NEW_CONCRETE_REALITY", "relational-meaning"),

  p("RM-OBJECT-001A", "OBJECT_HISTORY", "object acquires significance through supplied history", "RM-OBJECT-MUG-HISTORY", "A", "By the first morning in the new apartment, the green mug had history.", "DERIVED_MEANING", "relational-meaning"),
  p("RM-OBJECT-001B", "OBJECT_HISTORY", "object acquires significance through supplied history", "RM-OBJECT-MUG-HISTORY", "B", "By the first morning in the new apartment, the green mug had a chip.", "NEW_CONCRETE_REALITY", "relational-meaning"),
  p("RM-OBJECT-002A", "OBJECT_HISTORY", "compression of several supplied events into one derived reading", "RM-OBJECT-COMPRESSED-BIOGRAPHY", "A", "Bought, packed, shelved, used: the mug became a tiny moving biography.", "DERIVED_MEANING", "relational-meaning"),
  p("RM-OBJECT-002B", "OBJECT_HISTORY", "compression of several supplied events into one derived reading", "RM-OBJECT-COMPRESSED-BIOGRAPHY", "B", "Bought, packed, shelved, used: the mug survived customs.", "NEW_CONCRETE_REALITY", "relational-meaning"),
  p("RM-OBJECT-003A", "OBJECT_HISTORY", "object acquires significance through supplied history", "RM-OBJECT-SHELF-SIGNIFICANCE", "A", "The shelf mattered because the mug had already traveled through the move.", "DERIVED_MEANING", "relational-meaning"),
  p("RM-OBJECT-003B", "OBJECT_HISTORY", "object acquires significance through supplied history", "RM-OBJECT-SHELF-SIGNIFICANCE", "B", "The shelf mattered because the mug almost broke during the move.", "NEW_CONCRETE_REALITY", "relational-meaning"),

  p("OD-COCO-001A", "COCO", "generalized reference without concrete participant", "OD-GENERALIZED-REFERENCE-PARTICIPANT", "A", "People have always overestimated what bows can negotiate.", "EXPRESSIVE_FRAME", "closed-world-open-discourse"),
  p("OD-COCO-001B", "COCO", "specific unsupplied participant", "OD-GENERALIZED-REFERENCE-PARTICIPANT", "B", "Three people laughed at Coco's bows.", "NEW_CONCRETE_REALITY", "closed-world-open-discourse"),
  p("OD-TRAVEL-001A", "TRAVEL", "generalized group commentary", "OD-GROUP-COMMENTARY-PARTICIPATION", "A", "Travelers make rituals out of returning to the same place.", "EXPRESSIVE_FRAME", "closed-world-open-discourse"),
  p("OD-TRAVEL-001B", "TRAVEL", "unsupplied group participation", "OD-GROUP-COMMENTARY-PARTICIPATION", "B", "Other travelers returned to the riverside cafe too.", "NEW_CONCRETE_REALITY", "closed-world-open-discourse"),
  p("OD-CAR-001A", "CAR_HISTORY", "rhetorical object POV", "OD-OBJECT-POV-COGNITION", "A", "I became easier to understand after the Friday test drive.", "EXPRESSIVE_FRAME", "closed-world-open-discourse"),
  p("OD-CAR-001B", "CAR_HISTORY", "literal object cognition", "OD-OBJECT-POV-COGNITION", "B", "The red car remembered the Friday test drive.", "NEW_CONCRETE_REALITY", "closed-world-open-discourse"),
  p("OD-RE-001A", "REAL_ESTATE", "rhetorical place POV", "OD-PLACE-POV-OBSERVATION", "A", "By Monday, I knew what the porch photo had been setting up.", "EXPRESSIVE_FRAME", "closed-world-open-discourse"),
  p("OD-RE-001B", "REAL_ESTATE", "unsupplied place observation", "OD-PLACE-POV-OBSERVATION", "B", "The house watched the agent leave after the showing.", "NEW_CONCRETE_REALITY", "closed-world-open-discourse"),
  p("OD-BUS-001A", "BUSINESS_SERVICE", "rhetorical business POV", "OD-BUSINESS-POV-CUSTOMER-EVENT", "A", "From the shop's point of view, the seats became the case.", "EXPRESSIVE_FRAME", "closed-world-open-discourse"),
  p("OD-BUS-001B", "BUSINESS_SERVICE", "invented customer event", "OD-BUSINESS-POV-CUSTOMER-EVENT", "B", "A customer returned at 3:05 to inspect the seats.", "NEW_CONCRETE_REALITY", "closed-world-open-discourse"),
  p("OD-HOUSE-001A", "HOUSEKEEPING", "category reference without member participation", "OD-CATEGORY-MEMBER-PARTICIPATION", "A", "Clean rooms have a way of making labor visible.", "EXPRESSIVE_FRAME", "closed-world-open-discourse"),
  p("OD-HOUSE-001B", "HOUSEKEEPING", "specific member participation", "OD-CATEGORY-MEMBER-PARTICIPATION", "B", "The owner walked through the clean rooms.", "NEW_CONCRETE_REALITY", "closed-world-open-discourse"),
  p("OD-OBJECT-001A", "OBJECT_HISTORY", "personification without concrete action", "OD-PERSONIFICATION-CONCRETE-ACTION", "A", "The green mug carried the move in miniature.", "EXPRESSIVE_FRAME", "closed-world-open-discourse"),
  p("OD-OBJECT-001B", "OBJECT_HISTORY", "concrete object action", "OD-PERSONIFICATION-CONCRETE-ACTION", "B", "The green mug rolled off the shelf.", "NEW_CONCRETE_REALITY", "closed-world-open-discourse"),
  p("OD-REL-001A", "RELATIONSHIP", "derived social commentary", "OD-SOCIAL-COMMENTARY-OBSERVER", "A", "Some connections only look accidental until they repeat.", "DERIVED_MEANING", "closed-world-open-discourse"),
  p("OD-REL-001B", "RELATIONSHIP", "invented observer", "OD-SOCIAL-COMMENTARY-OBSERVER", "B", "A friend noticed the connection repeating.", "NEW_CONCRETE_REALITY", "closed-world-open-discourse"),
  p("OD-TRAVEL-002A", "TRAVEL", "derived significance", "OD-SIGNIFICANCE-CAUSALITY", "A", "The October return made April feel like a beginning.", "DERIVED_MEANING", "closed-world-open-discourse"),
  p("OD-TRAVEL-002B", "TRAVEL", "invented causality", "OD-SIGNIFICANCE-CAUSALITY", "B", "The October return happened because April felt like a beginning.", "NEW_CONCRETE_REALITY", "closed-world-open-discourse"),
  p("OD-RE-002A", "REAL_ESTATE", "implication without occurrence", "OD-IMPLICATION-OCCURRENCE", "A", "The Monday offer made the Saturday open house read differently.", "DERIVED_MEANING", "closed-world-open-discourse"),
  p("OD-RE-002B", "REAL_ESTATE", "invented occurrence", "OD-IMPLICATION-OCCURRENCE", "B", "The Saturday open house led to a bidding war.", "NEW_CONCRETE_REALITY", "closed-world-open-discourse"),
];

const DERIVED_MEANING_ACCEPTANCE_GATE_PROBE_IDS = [
  "RM-REL-001A",
  "RM-REL-001B",
  "RM-MILO-001A",
  "RM-MILO-001B",
] as const;

const DERIVED_MEANING_ACCEPTANCE_GATE_EXPECTED = new Map<string, "PASS" | "FAIL">([
  ["RM-REL-001A", "PASS"],
  ["RM-REL-001B", "FAIL"],
  ["RM-MILO-001A", "PASS"],
  ["RM-MILO-001B", "FAIL"],
]);

function p(
  probeId: string,
  domain: string,
  semanticOperation: string,
  minimalPairId: string,
  pairSide: "A" | "B",
  text: string,
  intendedSemanticClass?: IntendedSemanticClass,
  group = "semantic-boundary",
): Probe {
  return {
    probeId,
    domain,
    group,
    semanticOperation,
    intendedSemanticClass: intendedSemanticClass ?? inferIntendedSemanticClass(semanticOperation, pairSide),
    minimalPairId,
    pairSide,
    text,
  };
}

function inferIntendedSemanticClass(
  semanticOperation: string,
  pairSide: "A" | "B",
): IntendedSemanticClass {
  if (pairSide === "B") return "NEW_CONCRETE_REALITY";
  if (semanticOperation === "literal replay") return "DIRECT_REPLAY";
  return "EXPRESSIVE_FRAME";
}

const clean = (value: unknown): string =>
  String(value ?? "").replace(/\s+/g, " ").trim();

const record = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};

const array = (value: unknown): unknown[] => Array.isArray(value) ? value : [];

function parsePositiveInteger(value: string, flag: string): number {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1) {
    throw new Error(`${flag} must be a positive integer`);
  }
  return number;
}

function probeSelectionFromArgs(argv: string[]): ProbeSelection {
  const probeIds: string[] = [];
  const groups: string[] = [];
  let limit: number | undefined;
  let acceptanceGate = false;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index] ?? "";
    if (arg === "--live") continue;
    if (arg === "--acceptance-gate" || arg === "--derived-meaning-gate") {
      acceptanceGate = true;
      continue;
    }

    if (arg === "--group") {
      const value = argv[index + 1];
      if (!value) throw new Error("--group requires a group name or comma-separated group names");
      groups.push(...value.split(",").map(clean).filter(Boolean));
      index += 1;
      continue;
    }

    if (arg.startsWith("--group=")) {
      groups.push(...arg.slice("--group=".length).split(",").map(clean).filter(Boolean));
      continue;
    }

    if (arg === "--limit") {
      const value = argv[index + 1];
      if (!value) throw new Error("--limit requires a value");
      limit = parsePositiveInteger(value, "--limit");
      index += 1;
      continue;
    }

    if (arg.startsWith("--limit=")) {
      limit = parsePositiveInteger(arg.slice("--limit=".length), "--limit");
      continue;
    }

    if (arg === "--probe") {
      const value = argv[index + 1];
      if (!value) throw new Error("--probe requires a probe ID or comma-separated IDs");
      probeIds.push(...value.split(",").map(clean).filter(Boolean));
      index += 1;
      continue;
    }

    if (arg.startsWith("--probe=")) {
      probeIds.push(...arg.slice("--probe=".length).split(",").map(clean).filter(Boolean));
      continue;
    }
  }

  const uniqueProbeIds = [...new Set(probeIds)];
  const uniqueGroups = [...new Set(groups)];
  if (acceptanceGate && (uniqueProbeIds.length || uniqueGroups.length || typeof limit === "number")) {
    throw new Error("--acceptance-gate must be run without --probe, --group, or --limit");
  }
  const selectedProbeIds = acceptanceGate
    ? [...DERIVED_MEANING_ACCEPTANCE_GATE_PROBE_IDS]
    : uniqueProbeIds;
  const knownProbeIds = new Set(PROBES.map((probe) => probe.probeId));
  const unknownProbeIds = selectedProbeIds.filter((id) => !knownProbeIds.has(id));
  if (unknownProbeIds.length) {
    throw new Error(`Unknown --probe ID(s): ${unknownProbeIds.join(", ")}`);
  }

  const knownGroups = new Set(PROBES.map((probe) => probe.group));
  const unknownGroups = uniqueGroups.filter((group) => !knownGroups.has(group));
  if (unknownGroups.length) {
    throw new Error(`Unknown --group value(s): ${unknownGroups.join(", ")}`);
  }

  const filteredByGroup = uniqueGroups.length
    ? PROBES.filter((probe) => uniqueGroups.includes(probe.group))
    : PROBES;
  const filtered = selectedProbeIds.length
    ? filteredByGroup.filter((probe) => selectedProbeIds.includes(probe.probeId))
    : filteredByGroup;

  return {
    probes: typeof limit === "number" ? filtered.slice(0, limit) : filtered,
    probeIds: selectedProbeIds,
    groups: uniqueGroups,
    ...(typeof limit === "number" ? { limit } : {}),
    acceptanceGate,
  };
}

function parseJson(text: string): unknown {
  const source = text.trim()
    .replace(/^\`\`\`(?:json)?/i, "")
    .replace(/\`\`\`$/i, "")
    .trim();

  if (!source) return undefined;
  try {
    return JSON.parse(source);
  } catch {
    const start = source.indexOf("{");
    const end = source.lastIndexOf("}");
    if (start < 0 || end <= start) return undefined;
    try {
      return JSON.parse(source.slice(start, end + 1));
    } catch {
      return undefined;
    }
  }
}

function eventsFor(domain: Domain): Array<{ id: string; text: string }> {
  return domain.facts.map((text, index) => ({
    id: `event-${index + 1}`,
    text,
  }));
}

function domainById(domainId: string): Domain {
  const domain = DOMAINS.find((item) => item.id === domainId);
  if (!domain || domain.omitted) {
    throw new Error(`Unknown or omitted domain: ${domainId}`);
  }
  return domain;
}

function currentDirectAuthorPromptHash(): string {
  const source = readFileSync(new URL("./src/services/authorCreative.ts", import.meta.url), "utf8");
  const start = source.indexOf("export function buildDirectAuthorMemoryMessages");
  const end = source.indexOf("function buildDeterministicMouthFallback", start);
  if (start < 0 || end <= start) {
    throw new Error("Direct Creative Author prompt region not found");
  }
  return createHash("sha256").update(source.slice(start, end)).digest("hex");
}

function productionForProbe(domain: Domain, probe: Probe) {
  const ids = eventsFor(domain).map((event) => event.id);
  const firstFact = domain.facts[0] ?? "Supplied fact.";
  const secondFact = domain.facts[1] ?? firstFact;
  return [
    {
      production: "A",
      lines: [{
        order: 1,
        text: probe.text,
        sourceEventIds: ids,
      }],
    },
    {
      production: "B",
      lines: [{
        order: 1,
        text: firstFact,
        sourceEventIds: ids.slice(0, 1),
      }],
    },
    {
      production: "C",
      lines: [{
        order: 1,
        text: secondFact,
        sourceEventIds: ids.slice(1, 2).length ? ids.slice(1, 2) : ids.slice(0, 1),
      }],
    },
  ] as Array<{
    production: "A" | "B" | "C";
    lines: Array<{
      order: number;
      text: string;
      sourceEventIds: string[];
    }>;
  }>;
}

function normalizedSpansFor(rawClaimAudit: unknown, production = "A"): unknown[] {
  const audits = array(record(rawClaimAudit).audits);
  const audit = audits.find((item) => clean(record(item).production).toUpperCase() === production);
  const item = record(audit);
  return array(item.atomicClaimSpans ?? item.spans);
}

function mapExactSpans(text: string, spans: unknown[]): MappingSpan[] {
  const ranges: MappingSpan[] = [];
  let cursor = 0;

  for (const rawSpan of spans) {
    const exactText = String(record(rawSpan).exactText ?? "");
    const start = exactText ? text.indexOf(exactText, cursor) : -1;
    const duplicate = exactText ? text.indexOf(exactText, start >= 0 ? start + 1 : 0) : -1;
    const end = start >= 0 ? start + exactText.length : -1;
    const overlaps = start >= 0 && ranges.some((range) =>
      typeof range.start === "number" &&
      typeof range.end === "number" &&
      start < range.end &&
      end > range.start
    );

    ranges.push({
      exactText,
      start: start >= 0 ? start : null,
      end: end >= 0 ? end : null,
      mappingStatus: start >= 0 ? "MAPPED" : "NOT_FOUND",
      overlapOrAmbiguityStatus: start < 0
        ? "NOT_MAPPED"
        : duplicate >= 0
          ? "AMBIGUOUS_DUPLICATE"
          : overlaps
            ? "OVERLAP"
            : "NONE",
    });

    if (end >= 0) cursor = end;
  }

  return ranges;
}

function productionALine(editorResult: unknown): Record<string, unknown> | undefined {
  const production = array(record(editorResult).productions)
    .find((item) => clean(record(item).production).toUpperCase() === "A");
  return record(array(record(production).lines)[0]);
}

function diagnosticA(editorResult: unknown): Record<string, unknown> {
  const diagnostic = array(record(editorResult).diagnostics)
    .find((item) => clean(record(item).production).toUpperCase() === "A");
  return record(diagnostic);
}

function captureConsole<T>(fn: () => Promise<T>): Promise<{ result: T; logs: CapturedLogs }> {
  const originalLog = console.log.bind(console);
  const logs: CapturedLogs = {
    rawModelOutputs: [],
    openRouterUsage: [],
    finishReasons: [],
    requestModels: [],
  };

  console.log = (...args: unknown[]) => {
    const text = args.map((arg) =>
      typeof arg === "string" ? arg : JSON.stringify(arg, null, 2),
    ).join(" ");

    const rawMatch = text.match(/--- QRE RAW (?:OPENROUTER )?MODEL OUTPUT ---\n([\s\S]*?)\n--- END QRE RAW (?:OPENROUTER )?MODEL OUTPUT ---/);
    if (rawMatch) logs.rawModelOutputs.push(rawMatch[1] ?? "");
    if (/^QRE OPENROUTER RESPONSE USAGE:/.test(text)) logs.openRouterUsage.push(text);
    if (/^QRE OPENROUTER RESPONSE FINISH:/.test(text)) logs.finishReasons.push(text);
    if (/^QRE (?:OPENROUTER )?REQUEST MODEL:/.test(text)) logs.requestModels.push(text);

    originalLog(...args);
  };

  return fn()
    .then((result) => ({ result, logs }))
    .finally(() => {
      console.log = originalLog;
    });
}

async function runClaimAuditor(input: {
  suppliedReality: Array<{ id: string; text: string }>;
  productions: ReturnType<typeof productionForProbe>;
}): Promise<{ rawText: string; parsed: unknown; model: string; logs: CapturedLogs }> {
  const messages: LocalModelMessage[] = [
    { role: "system", content: CLAIM_AUDITOR_SYSTEM },
    {
      role: "user",
      content: JSON.stringify(buildAuthorRealityEditorPayload(input)),
    },
  ];

  const captured = await captureConsole(() =>
    localModelGenerate(messages, "json", {
      numPredict: 750,
      openRouterMaxTokens: 1800,
      temperature: 0.08,
      jsonSchema: CLAIM_AUDITOR_SCHEMA,
    }),
  );

  return {
    rawText: captured.result.text,
    parsed: parseJson(captured.result.text),
    model: captured.result.model,
    logs: captured.logs,
  };
}

async function runFinalGrounding(input: {
  domain: Domain;
  suppliedReality: Array<{ id: string; text: string }>;
  editorResult: unknown;
}): Promise<unknown> {
  const line = productionALine(input.editorResult);
  const text = clean(line?.text);
  if (!text) {
    return {
      skipped: true,
      reason: clean(diagnosticA(input.editorResult).unusableReason) || "no_surviving_reality_editor_text",
      rawVerifierResult: null,
      accepted: false,
      model: "none",
      modelCalls: 0,
    };
  }

  const scenes = [{
    text,
    kind: "line" as const,
    sourceEventIds: array(line?.sourceEventIds).map(clean).filter(Boolean),
    auditSpans: array(line?.auditSpans).map((span) => record(span)),
  }];

  const captured = await captureConsole(() =>
    verifyAuthorCreativeGrounding({
      scenes: scenes as never,
      suppliedReality: input.suppliedReality,
      semanticAuthority: [],
      domainContext: input.domain.domainContext,
    }),
  );

  return {
    rawVerifierResult: captured.logs.rawModelOutputs.at(-1) ?? null,
    parsedVerifierResult: parseJson(captured.logs.rawModelOutputs.at(-1) ?? ""),
    appliedScenes: captured.result.scenes,
    accepted: captured.result.scenes.length > 0,
    model: captured.result.model,
    modelCalls: captured.result.modelCalls,
    providerLogs: captured.logs,
  };
}

function failureLayerFor(input: {
  rawClaimAudit: unknown;
  mapping: MappingSpan[];
  editorResult: unknown;
  finalGrounding: unknown;
}): ResultRecord["failureLayer"] {
  if (!input.rawClaimAudit) return "CLAIM_AUDITOR";
  if (!normalizedSpansFor(input.rawClaimAudit).length) return "NORMALIZATION";
  if (input.mapping.some((item) => item.mappingStatus !== "MAPPED" || item.overlapOrAmbiguityStatus !== "NONE")) {
    return "MAPPING";
  }
  const diagnostic = diagnosticA(input.editorResult);
  if (clean(diagnostic.unusableReason) || clean(diagnostic.rejectionReason)) return "REALITY_EDITOR";
  if (record(input.finalGrounding).accepted === false) return "FINAL_GROUNDING";
  return "NONE";
}

async function runProbe(probe: Probe): Promise<ResultRecord> {
  const domain = domainById(probe.domain);
  const suppliedReality = eventsFor(domain);
  const productions = productionForProbe(domain, probe);

  printProbeHeader(probe, suppliedReality);

  try {
    const claimAudit = await runClaimAuditor({ suppliedReality, productions });
    const normalizedSpans = normalizedSpansFor(claimAudit.parsed);
    const mapping = mapExactSpans(probe.text, normalizedSpans);
    const editorResult = applyAuthorRealityEditorEdits({
      productions: productions as never,
      auditorResponse: claimAudit.parsed,
    });
    const finalGrounding = await runFinalGrounding({
      domain,
      suppliedReality,
      editorResult,
    });
    const finalAuthority = record(finalGrounding).accepted === true ? "PASS" : "FAIL";
    const failureLayer = finalAuthority === "PASS"
      ? "NONE"
      : failureLayerFor({
          rawClaimAudit: claimAudit.parsed,
          mapping,
          editorResult,
          finalGrounding,
        });

    const result: ResultRecord = {
      probeId: probe.probeId,
      domain: probe.domain,
      group: probe.group,
      semanticOperation: probe.semanticOperation,
      intendedSemanticClass: probe.intendedSemanticClass,
      minimalPairId: probe.minimalPairId,
      suppliedReality,
      candidateText: probe.text,
      rawClaimAudit: {
        text: claimAudit.rawText,
        parsed: claimAudit.parsed,
        model: claimAudit.model,
        providerLogs: claimAudit.logs,
      },
      normalizedSpans,
      mapping,
      realityEditor: {
        originalText: probe.text,
        diagnostic: diagnosticA(editorResult),
        removedSpans: array(diagnosticA(editorResult).removedSpans),
        survivingSpans: array(productionALine(editorResult)?.auditSpans),
        finalReconstructedOrPreservedText: clean(productionALine(editorResult)?.text),
        fullResult: editorResult,
      },
      finalGrounding,
      finalAuthority,
      failureLayer,
    };

    printLiveProbeResult(result);
    return result;
  } catch (error) {
    const result: ResultRecord = {
      probeId: probe.probeId,
      domain: probe.domain,
      group: probe.group,
      semanticOperation: probe.semanticOperation,
      intendedSemanticClass: probe.intendedSemanticClass,
      minimalPairId: probe.minimalPairId,
      suppliedReality,
      candidateText: probe.text,
      rawClaimAudit: {
        error: error instanceof Error ? error.message : String(error),
      },
      normalizedSpans: [],
      mapping: [],
      realityEditor: null,
      finalGrounding: null,
      finalAuthority: "TEST_ERROR",
      failureLayer: "OTHER",
    };
    printLiveProbeResult(result);
    return result;
  }
}

function dryRecord(probe: Probe): ResultRecord {
  const domain = domainById(probe.domain);
  return {
    probeId: probe.probeId,
    domain: probe.domain,
    group: probe.group,
    semanticOperation: probe.semanticOperation,
    intendedSemanticClass: probe.intendedSemanticClass,
    minimalPairId: probe.minimalPairId,
    suppliedReality: eventsFor(domain),
    candidateText: probe.text,
    rawClaimAudit: null,
    normalizedSpans: [],
    mapping: [],
    realityEditor: null,
    finalGrounding: null,
    finalAuthority: "DRY_NOT_RUN",
    failureLayer: "DRY_NOT_RUN",
  };
}

function printHeader(title: string): void {
  console.log(`\n=== ${title} ===`);
}

function printJson(value: unknown): void {
  console.log(JSON.stringify(value ?? null, null, 2));
}

function printProbeHeader(
  probe: Probe,
  suppliedReality: Array<{ id: string; text: string }>,
): void {
  console.log("\n=== PROBE ===");
  console.log(`ID: ${probe.probeId}`);
  console.log(`DOMAIN: ${probe.domain}`);
  console.log(`GROUP: ${probe.group}`);
  console.log(`SEMANTIC_OPERATION: ${probe.semanticOperation}`);
  console.log(`INTENDED_CLASS: ${probe.intendedSemanticClass}`);
  console.log(`MINIMAL_PAIR_ID: ${probe.minimalPairId}`);
  console.log(`TEXT: ${probe.text}`);
  console.log("SUPPLIED_REALITY:");
  for (const event of suppliedReality) {
    console.log(`- ${event.id}: ${event.text}`);
  }
}

function printLiveProbeResult(result: ResultRecord): void {
  printHeader("CLAIM AUDITOR RAW");
  printJson(result.rawClaimAudit);
  printHeader("NORMALIZED ATOMIC SPANS");
  printJson(result.normalizedSpans);
  printHeader("EXACT MAPPING");
  printJson(result.mapping);
  printHeader("REALITY EDITOR");
  printJson(result.realityEditor);
  printHeader("FINAL GROUNDING");
  printJson(result.finalGrounding);
  printHeader("FINAL AUTHORITY");
  console.log(result.finalAuthority);
  console.log(`FAILURE_LAYER: ${result.failureLayer}`);
}

function printInventory(selection: ProbeSelection): void {
  printHeader("DRY / INVENTORY MODE");
  console.log("No model calls will be made without --live.");
  console.log(`total probes: ${PROBES.length}`);
  console.log(`selected probes: ${selection.probes.length} / ${PROBES.length}`);
  if (selection.acceptanceGate) {
    console.log("acceptance gate: derived meaning keeps expression; concrete occurrence fails");
  }
  if (selection.probeIds.length) console.log(`--probe: ${selection.probeIds.join(", ")}`);
  if (selection.groups.length) console.log(`--group: ${selection.groups.join(", ")}`);
  if (selection.limit) console.log(`--limit: ${selection.limit}`);
  console.log(`selected minimal pair count: ${countCompletePairs(selection.probes)}`);

  printHeader("DOMAINS");
  for (const domain of DOMAINS) {
    console.log(`\n${domain.id}: ${domain.label}`);
    console.log(`source: ${domain.source}`);
    if (domain.omitted) {
      console.log(`omitted: ${domain.omitReason}`);
      continue;
    }
    console.log(`subject: ${domain.subject}`);
    domain.facts.forEach((fact, index) => console.log(`event-${index + 1}: ${fact}`));
    for (const note of domain.notes ?? []) console.log(`note: ${note}`);
  }

  printHeader("PROBES");
  for (const probe of selection.probes) {
    console.log(`${probe.probeId} | ${probe.group} | ${probe.domain} | ${probe.intendedSemanticClass} | ${probe.semanticOperation} | ${probe.minimalPairId} | ${probe.text}`);
  }

  printHeader("DOMAIN DISTRIBUTION");
  printDistribution(selection.probes.map((probe) => probe.domain));

  printHeader("INTENDED CLASS DISTRIBUTION");
  printDistribution(selection.probes.map((probe) => probe.intendedSemanticClass));

  printHeader("SEMANTIC OPERATIONS");
  for (const operation of [...new Set(selection.probes.map((probe) => probe.semanticOperation))].sort()) {
    console.log(operation);
  }

  printHeader("SEMANTIC OPERATION DISTRIBUTION");
  printDistribution(selection.probes.map((probe) => probe.semanticOperation));

  printHeader("MINIMAL PAIRS");
  for (const [pairId, pairProbes] of pairEntries(selection.probes)) {
    const a = pairProbes.find((probe) => probe.pairSide === "A");
    const b = pairProbes.find((probe) => probe.pairSide === "B");
    console.log(`${pairId}`);
    console.log(`A: ${a?.text ?? "(missing)"}`);
    console.log(`B: ${b?.text ?? "(missing)"}`);
  }

  printHeader("CALL INVENTORY");
  console.log(`probe count: ${selection.probes.length}`);
  console.log(`minimal pair count: ${countCompletePairs(selection.probes)}`);
  console.log(`expected Claim Auditor calls: ${selection.probes.length}`);
  console.log(`expected Final Grounding calls: up to ${selection.probes.length}`);
  console.log(`maximum expected model calls: ${selection.probes.length * 2}`);
  console.log("stages requiring model inference: Claim Auditor, Final Grounding Verifier");
  console.log("stages using deterministic production functions: payload builder, normalized editor application, final grounding application");
  printModelReport();
  printAcceptanceGateExpectation(selection);
}

function printModelReport(): void {
  printHeader("MODEL CONFIGURATION");
  const config = localModelConfig();
  printJson({
    configuredRuntime: config,
    claimAuditor: {
      path: "localModelGenerate through current QRE provider infrastructure",
      resolvedModel: record(config).model,
      provider: record(config).provider,
      temperature: 0.08,
      numPredict: 750,
      openRouterMaxTokensOption: 1800,
      note: "OpenRouter development ceiling may override to the runtime's schema ceiling for this authority schema.",
    },
    finalGrounding: {
      path: "verifyAuthorCreativeGrounding -> localModelGenerate through current QRE provider infrastructure",
      resolvedModel: record(config).model,
      provider: record(config).provider,
      temperature: 0.06,
      note: "Final Grounding may use the runtime's schema ceiling for final verifications.",
    },
  });
}

function pairEntries(probes: Probe[]): Array<[string, Probe[]]> {
  const pairs = new Map<string, Probe[]>();
  for (const probe of probes) {
    pairs.set(probe.minimalPairId, [...(pairs.get(probe.minimalPairId) ?? []), probe]);
  }
  return [...pairs.entries()].sort(([a], [b]) => a.localeCompare(b));
}

function countCompletePairs(probes: Probe[]): number {
  return pairEntries(probes).filter(([, pairProbes]) =>
    pairProbes.some((probe) => probe.pairSide === "A") &&
    pairProbes.some((probe) => probe.pairSide === "B")
  ).length;
}

function printDistribution(values: string[]): void {
  const rows = new Map<string, number>();
  for (const value of values) rows.set(value, (rows.get(value) ?? 0) + 1);
  for (const [value, count] of [...rows.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    console.log(`${value}: ${count}`);
  }
}

function printAcceptanceGateExpectation(selection: ProbeSelection): void {
  if (!selection.acceptanceGate) return;

  printHeader("ACCEPTANCE GATE");
  for (const probeId of DERIVED_MEANING_ACCEPTANCE_GATE_PROBE_IDS) {
    const probe = PROBES.find((item) => item.probeId === probeId);
    const expected = DERIVED_MEANING_ACCEPTANCE_GATE_EXPECTED.get(probeId);
    console.log(`${probeId}: expected ${expected} | ${probe?.text ?? "(missing)"}`);
  }
}

function assertAcceptanceGate(results: ResultRecord[], selection: ProbeSelection): void {
  if (!selection.acceptanceGate) return;

  const missing = DERIVED_MEANING_ACCEPTANCE_GATE_PROBE_IDS
    .filter((probeId) => !results.some((result) => result.probeId === probeId));
  if (missing.length) {
    throw new Error(`Acceptance gate missing probe result(s): ${missing.join(", ")}`);
  }

  const mismatches = results
    .filter((result) => DERIVED_MEANING_ACCEPTANCE_GATE_EXPECTED.has(result.probeId))
    .filter((result) => result.finalAuthority !== DERIVED_MEANING_ACCEPTANCE_GATE_EXPECTED.get(result.probeId))
    .map((result) =>
      `${result.probeId} expected ${DERIVED_MEANING_ACCEPTANCE_GATE_EXPECTED.get(result.probeId)} got ${result.finalAuthority} at ${result.failureLayer}`,
    );

  if (mismatches.length) {
    throw new Error(`Acceptance gate failed:\n${mismatches.join("\n")}`);
  }
}

function printSummaryMatrix(results: ResultRecord[]): void {
  printHeader("SUMMARY MATRIX BY INTENDED CLASS");
  printMatrix(results, (result) => result.intendedSemanticClass, "INTENDED CLASS");
  printHeader("SUMMARY MATRIX BY SEMANTIC OPERATION");
  printMatrix(results, (result) => result.semanticOperation, "SEMANTIC OPERATION");
  printHeader("SUMMARY MATRIX BY DOMAIN");
  printMatrix(results, (result) => result.domain, "DOMAIN");
  printHeader("SUMMARY MATRIX BY DOMAIN AND INTENDED CLASS");
  printMatrix(results, (result) => `${result.domain} | ${result.intendedSemanticClass}`, "DOMAIN + INTENDED CLASS");
  printHeader("SUMMARY MATRIX BY OPERATION AND DOMAIN");
  printMatrix(results, (result) => `${result.semanticOperation} | ${result.domain}`, "SEMANTIC OPERATION + DOMAIN");
}

function printMatrix(
  results: ResultRecord[],
  keyFor: (result: ResultRecord) => string,
  label: string,
): void {
  const rows = new Map<string, { pass: number; fail: number; testError: number; dry: number }>();
  for (const result of results) {
    const key = keyFor(result);
    const row = rows.get(key) ?? { pass: 0, fail: 0, testError: 0, dry: 0 };
    if (result.finalAuthority === "PASS") row.pass += 1;
    if (result.finalAuthority === "FAIL") row.fail += 1;
    if (result.finalAuthority === "TEST_ERROR") row.testError += 1;
    if (result.finalAuthority === "DRY_NOT_RUN") row.dry += 1;
    rows.set(key, row);
  }

  console.log(`${label.padEnd(42)} PASS   FAIL   TEST_ERROR   DRY   TOTAL`);
  for (const [key, row] of [...rows.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    const total = row.pass + row.fail + row.testError + row.dry;
    console.log(`${key.padEnd(42)} ${String(row.pass).padEnd(6)} ${String(row.fail).padEnd(6)} ${String(row.testError).padEnd(12)} ${String(row.dry).padEnd(5)} ${total}`);
  }
}

function firstDivergence(a: ResultRecord | undefined, b: ResultRecord | undefined): string {
  if (!a || !b) return "OTHER";
  const layers: ResultRecord["failureLayer"][] = [
    "CLAIM_AUDITOR",
    "NORMALIZATION",
    "MAPPING",
    "REALITY_EDITOR",
    "FINAL_GROUNDING",
    "OTHER",
    "NONE",
    "DRY_NOT_RUN",
  ];
  if (a.finalAuthority !== b.finalAuthority) {
    for (const layer of layers) {
      if (a.failureLayer === layer || b.failureLayer === layer) return layer;
    }
  }
  if (JSON.stringify(a.normalizedSpans) !== JSON.stringify(b.normalizedSpans)) return "CLAIM_AUDITOR";
  if (JSON.stringify(a.mapping) !== JSON.stringify(b.mapping)) return "MAPPING";
  if (JSON.stringify(a.realityEditor) !== JSON.stringify(b.realityEditor)) return "REALITY_EDITOR";
  if (JSON.stringify(a.finalGrounding) !== JSON.stringify(b.finalGrounding)) return "FINAL_GROUNDING";
  return "NONE";
}

function printMinimalPairFlips(results: ResultRecord[], probes: Probe[]): void {
  printHeader("MINIMAL PAIR FLIPS");
  for (const [pairId] of pairEntries(probes)) {
    const pairResults = results.filter((result) => result.minimalPairId === pairId);
    const a = pairResults.find((result) => probes.find((probe) => probe.probeId === result.probeId)?.pairSide === "A");
    const b = pairResults.find((result) => probes.find((probe) => probe.probeId === result.probeId)?.pairSide === "B");
    console.log(`\nPAIR ID: ${pairId}`);
    console.log(`TEXT A: ${a?.candidateText ?? "(missing)"}`);
    console.log(`AUTHORITY A: ${a?.finalAuthority ?? "(missing)"} / ${a?.failureLayer ?? "(missing)"}`);
    console.log(`TEXT B: ${b?.candidateText ?? "(missing)"}`);
    console.log(`AUTHORITY B: ${b?.finalAuthority ?? "(missing)"} / ${b?.failureLayer ?? "(missing)"}`);
    console.log(`FIRST LAYER WHERE BEHAVIOR DIVERGED: ${firstDivergence(a, b)}`);
  }
}

function rejectedSpanReport(result: ResultRecord): {
  exactText: string;
  classification: string;
  reason: string;
} {
  const spans = result.normalizedSpans.map(record);
  const unsupported = spans.find((span) => clean(span.classification).toUpperCase() === "UNSUPPORTED_REALITY");
  const diagnostic = record(record(result.realityEditor).diagnostic);
  const removedSpan = array(diagnostic.removedSpans).map(record)[0];
  return {
    exactText: clean(unsupported?.exactText) || clean(removedSpan.exactText) || "(not available)",
    classification: clean(unsupported?.classification) || clean(removedSpan.classification) || "(not available)",
    reason: clean(unsupported?.reason)
      || clean(removedSpan.reason)
      || clean(diagnostic.unusableReason)
      || clean(diagnostic.rejectionReason)
      || clean(record(result.finalGrounding).reason)
      || "(not available)",
  };
}

function printObservations(results: ResultRecord[], probes: Probe[]): void {
  printHeader("OBSERVATIONS");
  const observations: string[] = [];

  for (const result of results) {
    const diagnostic = record(record(result.realityEditor).diagnostic);
    const spans = result.normalizedSpans.map(record);
    const auditorHasUnsupported = spans.some((span) => clean(span.classification).toUpperCase() === "UNSUPPORTED_REALITY");
    const auditorPermits = spans.length > 0 && !auditorHasUnsupported && !clean(diagnostic.unusableReason);

    if (auditorPermits && result.failureLayer === "FINAL_GROUNDING") {
      observations.push(`${result.probeId}: Claim Auditor permitted but Final Grounding rejected.`);
    }
    if (auditorHasUnsupported && result.failureLayer !== "REALITY_EDITOR" && result.finalAuthority !== "TEST_ERROR") {
      observations.push(`${result.probeId}: Claim Auditor reported unsupported material without Reality Editor being the final rejection layer.`);
    }
    if (result.semanticOperation === "literal replay" && result.finalAuthority === "FAIL") {
      observations.push(`${result.probeId}: supplied literal fact failed.`);
    }
    if (result.semanticOperation === "new chronology" && result.finalAuthority === "PASS") {
      observations.push(`${result.probeId}: explicit invented chronology survived.`);
    }
    if (result.semanticOperation === "new quantity" && result.finalAuthority === "PASS") {
      observations.push(`${result.probeId}: explicit invented quantity survived.`);
    }
    if (result.semanticOperation === "metaphor" && result.finalAuthority === "FAIL") {
      observations.push(`${result.probeId}: metaphor treated as unsupported occurrence or failed downstream.`);
    }
    if (result.semanticOperation === "personification" && result.finalAuthority === "FAIL") {
      observations.push(`${result.probeId}: personification treated as unsupported occurrence or failed downstream.`);
    }
    if (clean(diagnostic.survivorIntegrity) === "FRACTURED") {
      observations.push(`${result.probeId}: Reality Editor damaged or rejected otherwise surviving material as fractured.`);
    }
    if (result.intendedSemanticClass === "DERIVED_MEANING" && result.finalAuthority === "FAIL") {
      const rejected = rejectedSpanReport(result);
      observations.push(`${result.probeId}: failed DERIVED_MEANING at ${result.failureLayer}; rejected span="${rejected.exactText}"; classification=${rejected.classification}; reason=${rejected.reason}.`);
    }
    if (result.intendedSemanticClass === "NEW_CONCRETE_REALITY" && result.finalAuthority === "PASS") {
      observations.push(`${result.probeId}: FALSE ACCEPT - NEW_CONCRETE_REALITY passed final authority.`);
    }
  }

  for (const [pairId] of pairEntries(probes)) {
    const pairResults = results.filter((result) => result.minimalPairId === pairId);
    const [a, b] = [
      pairResults.find((result) => probes.find((probe) => probe.probeId === result.probeId)?.pairSide === "A"),
      pairResults.find((result) => probes.find((probe) => probe.probeId === result.probeId)?.pairSide === "B"),
    ];
    if (a && b && a.finalAuthority === b.finalAuthority && a.finalAuthority !== "DRY_NOT_RUN") {
      observations.push(`${pairId}: minimal pair received identical final authority despite a concrete-occurrence difference.`);
    }
    if (a && b && a.finalAuthority !== b.finalAuthority && firstDivergence(a, b) !== "FINAL_GROUNDING") {
      observations.push(`${pairId}: minimal pair flips before Final Grounding.`);
    }
  }

  if (!observations.length) {
    console.log("No live observations available in dry mode.");
    return;
  }

  for (const observation of observations) console.log(`- ${observation}`);
}

function writeResults(results: ResultRecord[], live: boolean, selection: ProbeSelection): void {
  mkdirSync(OUTPUT_DIR, { recursive: true });
  const payload = {
    mode: live ? "LIVE" : "DRY",
    generatedAt: new Date().toISOString(),
    directAuthorPromptHash: currentDirectAuthorPromptHash(),
    domains: DOMAINS,
    probeCount: selection.probes.length,
    totalAvailableProbeCount: PROBES.length,
    selectedMinimalPairCount: countCompletePairs(selection.probes),
    selectedProbeIds: selection.probes.map((probe) => probe.probeId),
    filter: {
      probeIds: selection.probeIds,
      groups: selection.groups,
      limit: selection.limit ?? null,
      acceptanceGate: selection.acceptanceGate,
    },
    distribution: {
      domains: Object.fromEntries([...selection.probes.reduce((rows, probe) => {
        rows.set(probe.domain, (rows.get(probe.domain) ?? 0) + 1);
        return rows;
      }, new Map<string, number>()).entries()].sort(([a], [b]) => a.localeCompare(b))),
      intendedSemanticClasses: Object.fromEntries([...selection.probes.reduce((rows, probe) => {
        rows.set(probe.intendedSemanticClass, (rows.get(probe.intendedSemanticClass) ?? 0) + 1);
        return rows;
      }, new Map<string, number>()).entries()].sort(([a], [b]) => a.localeCompare(b))),
      semanticOperations: Object.fromEntries([...selection.probes.reduce((rows, probe) => {
        rows.set(probe.semanticOperation, (rows.get(probe.semanticOperation) ?? 0) + 1);
        return rows;
      }, new Map<string, number>()).entries()].sort(([a], [b]) => a.localeCompare(b))),
    },
    expectedMaximumLiveCalls: selection.probes.length * 2,
    modelConfiguration: localModelConfig(),
    authorityPath: [
      "candidate text",
      "Claim Auditor",
      "normalized atomicClaimSpans",
      "exact span mapping",
      "Reality Editor",
      "surviving/rejected text",
      "Final Grounding Verifier",
      "final authority result",
    ],
    results,
  };

  writeFileSync(join(OUTPUT_DIR, OUTPUT_FILE), `${JSON.stringify(payload, null, 2)}\n`);
}

async function main(): Promise<void> {
  const live = process.argv.includes("--live");
  const selection = probeSelectionFromArgs(process.argv.slice(2));
  const promptHash = currentDirectAuthorPromptHash();
  if (promptHash !== DIRECT_AUTHOR_PROMPT_HASH) {
    throw new Error(`Direct Creative Author prompt hash changed: ${promptHash}`);
  }

  process.env.QRE_AUTHOR_DEBUG_RAW = live ? "true" : process.env.QRE_AUTHOR_DEBUG_RAW;

  printHeader("DIRECT CREATIVE AUTHOR PROMPT HASH");
  console.log(promptHash);

  printHeader("AUTHORITY PATH");
  console.log("candidate text -> Atomic Claim Auditor -> normalized atomicClaimSpans -> exact span mapping -> Reality Editor -> surviving/rejected text -> Final Grounding Verifier -> final authority result");
  console.log("Direct Creative Author generation is not invoked by this harness.");

  if (!live) {
    printInventory(selection);
    const dryResults = selection.probes.map(dryRecord);
    printSummaryMatrix(dryResults);
    printMinimalPairFlips(dryResults, selection.probes);
    printObservations(dryResults, selection.probes);
    writeResults(dryResults, false, selection);
    printHeader("OUTPUT");
    console.log(join(OUTPUT_DIR, OUTPUT_FILE));
    return;
  }

  printHeader("LIVE CALL VISIBILITY");
  console.log(`probe count: ${selection.probes.length}`);
  if (selection.probeIds.length) console.log(`--probe: ${selection.probeIds.join(", ")}`);
  if (selection.groups.length) console.log(`--group: ${selection.groups.join(", ")}`);
  if (selection.limit) console.log(`--limit: ${selection.limit}`);
  console.log(`minimal pair count: ${countCompletePairs(selection.probes)}`);
  console.log(`expected Claim Auditor calls: ${selection.probes.length}`);
  console.log(`expected Final Grounding calls: up to ${selection.probes.length}`);
  console.log(`maximum expected model calls: ${selection.probes.length * 2}`);
  printModelReport();
  printAcceptanceGateExpectation(selection);

  const results: ResultRecord[] = [];
  for (const probe of selection.probes) {
    results.push(await runProbe(probe));
    writeResults(results, true, selection);
  }

  printSummaryMatrix(results);
  printMinimalPairFlips(results, selection.probes);
  printObservations(results, selection.probes);
  assertAcceptanceGate(results, selection);
  writeResults(results, true, selection);
  printHeader("OUTPUT");
  console.log(join(OUTPUT_DIR, OUTPUT_FILE));
}

await main();
