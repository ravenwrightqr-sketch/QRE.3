import type {
  AdaptiveAnswer,
  AdaptiveCapabilityDefinition,
  AdaptiveCapabilityId,
  AdaptiveExperienceBrief,
  AdaptiveStep,
  AdaptiveStepOption,
} from "@qre/contracts";
import { ADAPTIVE_CAPABILITIES } from "@qre/contracts";
import { compileCognitiveExperience } from "@qre/engine";
import { createAnalyticsRepository } from "../repositories/analyticsRepository.js";
import { createMemoryRepository } from "../repositories/memoryRepository.js";
import { getCreativeLearningContext } from "./creativeLearning.js";

const analytics = createAnalyticsRepository();

const DOMAIN_RULES: Array<[string, RegExp]> = [
  ["pet", /\b(dog|cat|pet|puppy|kitten|rescue|breeder|adopt|animal|dog tag)\b/],
  ["property", /\b(real estate|property|home|house|estate|building|development|listing|open house)\b/],
  ["event", /\b(wedding|party|festival|concert|birthday|ceremony|rave|event|venue)\b/],
  ["business", /\b(company|business|brand|service|agency|shop|salon|restaurant|hotel|brokerage)\b/],
  ["memory", /\b(memory|remember|memorial|archive|history|trip|travel|anniversary|family)\b/],
  ["identity", /\b(identity|profile|represent|about me|digital card|business card)\b/],
];

const OUTPUT_RULES: Array<[string, RegExp]> = [
  ["cinematic_video", /\b(movie|video|film|cinematic|reel|commercial|promo)\b/],
  ["memory", /\b(memory|remember|archive|history|living memory)\b/],
  ["profile", /\b(profile|identity|card|about)\b/],
  ["event", /\b(event|festival|wedding|party|concert)\b/],
  ["reward", /\b(reward|points|discount|offer|loyalty|coupon)\b/],
  ["ticket", /\b(ticket|entry|admission|check.?in)\b/],
  ["booking", /\b(book|booking|appointment|showing|inquiry)\b/],
  ["gallery", /\b(gallery|album|photos|photo)\b/],
];

function clean(value: unknown): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

function unique(values: string[]): string[] {
  return [...new Set(values.map(clean).filter(Boolean))];
}

function inferDomain(brief: AdaptiveExperienceBrief): string | undefined {
  const haystack = [brief.originalIntent, brief.subjectType, brief.subject, ...brief.facts, ...Object.values(brief.fields)].join(" ").toLowerCase();
  return DOMAIN_RULES.find(([, pattern]) => pattern.test(haystack))?.[0];
}

function inferOutput(brief: AdaptiveExperienceBrief): string | undefined {
  const haystack = [brief.originalIntent, brief.goal, ...brief.facts, ...brief.preferences].join(" ").toLowerCase();
  return OUTPUT_RULES.find(([, pattern]) => pattern.test(haystack))?.[0];
}

function capabilitiesFor(brief: AdaptiveExperienceBrief): AdaptiveCapabilityDefinition[] {
  const haystack = [brief.originalIntent, brief.domain, brief.subjectType, brief.goal, brief.output, ...brief.facts, ...brief.preferences].join(" ").toLowerCase();
  const matches = ADAPTIVE_CAPABILITIES.filter((capability) => {
    if (brief.rejectedCapabilities.includes(capability.id)) return false;
    return capability.intents.some((intent) => haystack.includes(intent.toLowerCase())) ||
      capability.id === brief.output ||
      (brief.domain === "pet" && ["pet_identity", "living_profile", "memory", "cinematic_video", "contact"].includes(capability.id)) ||
      (brief.domain === "property" && ["property_record", "memory", "cinematic_video", "gallery", "booking", "contact", "location"].includes(capability.id)) ||
      (brief.domain === "event" && ["event", "ticket", "memory", "collaborative_memory", "cinematic_video", "gallery", "location"].includes(capability.id)) ||
      (brief.domain === "business" && ["living_profile", "cinematic_video", "reward", "booking", "social", "share", "contact"].includes(capability.id));
  });
  const ordered = [...matches];
  for (const capability of ADAPTIVE_CAPABILITIES) {
    if (capability.id === brief.output && !ordered.some((item) => item.id === capability.id)) ordered.unshift(capability);
  }
  return ordered.slice(0, 8);
}

function completeness(brief: AdaptiveExperienceBrief): number {
  const checks = [
    Boolean(brief.originalIntent),
    Boolean(brief.domain),
    Boolean(brief.subject || brief.subjectType || brief.fields.name),
    brief.facts.length > 0 || Object.keys(brief.fields).length > 0,
    Boolean(brief.output),
    Boolean(brief.goal),
  ];
  const weighted = checks.filter(Boolean).length / checks.length;
  return Number(weighted.toFixed(2));
}

function ready(brief: AdaptiveExperienceBrief): boolean {
  if (!brief.domain || !brief.output || !brief.goal) return false;
  if (!brief.subject && !brief.subjectType && !brief.fields.name) return false;
  if (brief.output === "cinematic_video" && brief.facts.length === 0) return false;
  return true;
}

function makeOption(id: string, label: string, value: string, capabilityId?: AdaptiveCapabilityId): AdaptiveStepOption {
  return { id, label, value, capabilityId };
}

function deterministicStep(brief: AdaptiveExperienceBrief, suggested: AdaptiveCapabilityDefinition[]): AdaptiveStep {
  const domain = brief.domain;
  if (!domain) {
    return {
      id: "domain",
      kind: "choice",
      field: "domain",
      title: "What kind of thing are we making?",
      options: [
        makeOption("pet", "A pet / animal", "pet", "pet_identity"),
        makeOption("property", "A property / place", "property", "property_record"),
        makeOption("event", "An event", "event"),
        makeOption("business", "A company / business", "business"),
        makeOption("memory", "A memory / life story", "memory"),
        makeOption("identity", "A person / identity", "identity"),
      ],
      optional: false,
      why: "Domain controls which capabilities and questions are relevant next.",
      readyForAuthor: false,
    };
  }

  if (!brief.subjectType && domain === "pet") {
    return {
      id: "subject-type",
      kind: "choice",
      field: "subjectType",
      title: "What is this about?",
      options: [
        makeOption("dog", "Dog", "dog", "pet_identity"),
        makeOption("cat", "Cat", "cat", "pet_identity"),
        makeOption("other", "Another animal", "animal", "pet_identity"),
      ],
      why: "QRE uses the subject to choose the right identity, memory and experience options.",
      readyForAuthor: false,
    };
  }

  if (!brief.fields.name && domain && ["pet", "property", "business", "event", "identity"].includes(domain)) {
    const label = domain === "property" ? "What is the property called?" : domain === "business" ? "What's the company or brand called?" : domain === "event" ? "What's the event called?" : domain === "identity" ? "Whose identity is this?" : "What's the name?";
    return {
      id: "name",
      kind: "question",
      field: "name",
      title: label,
      placeholder: domain === "pet" ? "Coco" : domain === "property" ? "Ocean View Estate" : domain === "business" ? "Acme Real Estate" : "Name it",
      why: "A named subject gives the asset a stable human-readable identity.",
      readyForAuthor: false,
    };
  }

  if (domain === "property" && !brief.fields.location) {
    return {
      id: "property-location",
      kind: "question",
      field: "location",
      title: "Where is it?",
      placeholder: "Address, city or place",
      why: "Property experiences benefit from a real place anchor.",
      readyForAuthor: false,
    };
  }

  if (!brief.goal && (domain === "business" || domain === "property" || domain === "pet" || domain === "event")) {
    const options = domain === "pet"
      ? [
          makeOption("meet", "Help people meet them", "meet", "pet_identity"),
          makeOption("story", "Tell their story", "story", "cinematic_video"),
          makeOption("contact", "Help people inquire", "contact", "contact"),
          makeOption("all", "All of it", "all"),
        ]
      : domain === "property"
        ? [
            makeOption("sell", "Sell the property", "sell", "property_record"),
            makeOption("show", "Show the property's story", "show", "cinematic_video"),
            makeOption("inquire", "Generate inquiries", "inquire", "booking"),
            makeOption("all", "All of it", "all"),
          ]
        : domain === "business"
          ? [
              makeOption("promote", "Promote what we do", "promote", "cinematic_video"),
              makeOption("connect", "Connect people to us", "connect", "contact"),
              makeOption("reward", "Reward people", "reward", "reward"),
              makeOption("all", "All of it", "all"),
            ]
          : [
              makeOption("attend", "Help people experience it", "attend", "event"),
              makeOption("remember", "Remember it", "remember", "memory"),
              makeOption("contribute", "Let people contribute", "contribute", "collaborative_memory"),
              makeOption("all", "All of it", "all"),
            ];
    return { id: "goal", kind: "choice", field: "goal", title: "What should this help people do?", options, why: "Goal determines which QRE capabilities are worth exposing.", readyForAuthor: false };
  }

  if (!brief.output) {
    const options = suggested.map((capability) => makeOption(capability.id, capability.label, capability.id, capability.id));
    if (options.length) return { id: "output", kind: "capability", field: "output", title: "What should people experience?", explanation: "QRE only shows capabilities that fit what you've told us.", options, optional: false, why: "The output determines what information QRE still needs.", readyForAuthor: false };
  }

  const outputCapability = suggested.find((capability) => capability.id === brief.output);
  if (outputCapability?.authoring === "required" && !brief.facts.length) {
    return { id: "facts", kind: "question", field: "facts", title: "What should be true in this experience?", placeholder: "Add the real facts, moments, behaviors, or details QRE should use.", why: "Author needs supplied reality before it can responsibly create the experience.", readyForAuthor: false };
  }

  if (outputCapability?.media === "required" && !brief.media.length) {
    return { id: "media", kind: "media", field: "media", title: "Want to add media?", explanation: "Photos and video become source material for the experience.", options: [makeOption("add", "Add media", "add"), makeOption("later", "Later", "later")], optional: true, why: "This capability needs source media.", readyForAuthor: false };
  }

  if (brief.output === "cinematic_video" && !brief.tone.length) {
    return { id: "tone", kind: "choice", field: "tone", title: "How should it feel?", options: [makeOption("sweet", "Sweet", "sweet"), makeOption("funny", "Funny", "funny"), makeOption("fierce", "Fierce", "fierce"), makeOption("cinematic", "Cinematic", "cinematic")], optional: true, why: "Tone guides Author without becoming a fact.", readyForAuthor: false };
  }

  if (brief.output === "cinematic_video" && brief.media.length === 0) {
    return { id: "media-choice", kind: "media", field: "media", title: "Want to add photos or video?", options: [makeOption("photos", "Photos", "photos"), makeOption("video", "Video", "video"), makeOption("both", "Both", "both"), makeOption("later", "Later", "later")], optional: true, why: "Media can enrich the movie while remaining separate from factual truth.", readyForAuthor: false };
  }

  if (!brief.facts.length) {
    return { id: "facts", kind: "question", field: "facts", title: "What are the real facts we should use?", placeholder: "Give QRE the facts. We'll do the creative work.", optional: false, why: "Author must work from supplied reality.", readyForAuthor: false };
  }

  return { id: "create", kind: "create", title: "I have enough.", explanation: "QRE has the direction and source material needed to build the experience.", optional: false, why: "The brief is ready for Author.", readyForAuthor: true };
}

function applyValueToBrief(brief: AdaptiveExperienceBrief, field: string | undefined, value: string, values: string[]): AdaptiveExperienceBrief {
  const next = { ...brief, fields: { ...brief.fields }, facts: [...brief.facts], preferences: [...brief.preferences], tone: [...brief.tone], media: [...brief.media], capabilities: [...brief.capabilities] };
  const cleanValue = clean(value);
  if (!cleanValue && values.length === 0) return next;
  if (field === "facts") next.facts = unique([...next.facts, cleanValue, ...values]);
  else if (field === "tone") next.tone = unique([...next.tone, cleanValue, ...values]);
  else if (field === "media") next.media = unique([...next.media, cleanValue, ...values]);
  else if (field === "output") next.output = cleanValue;
  else if (field === "goal") next.goal = cleanValue;
  else if (field === "domain") next.domain = cleanValue;
  else if (field === "subjectType") next.subjectType = cleanValue;
  else if (field === "subject") next.subject = cleanValue;
  else if (field) next.fields[field] = cleanValue;
  return next;
}

export function createEmptyAdaptiveBrief(sessionId: string, assetId: string | undefined, originalIntent: string): AdaptiveExperienceBrief {
  return { sessionId, assetId, originalIntent: clean(originalIntent), fields: {}, facts: [], preferences: [], tone: [], media: [], capabilities: [], rejectedCapabilities: [], answeredStepIds: [], completeness: 0, readyForAuthor: false };
}

export function applyAdaptiveAnswer(brief: AdaptiveExperienceBrief, answer: AdaptiveAnswer): AdaptiveExperienceBrief {
  const selected = answer.selectedOptionIds ?? [];
  const value = clean(answer.value);
  const values = unique(answer.values ?? []);
  const matchingCapabilities = selected
    .map((id) => ADAPTIVE_CAPABILITIES.find((capability) => capability.id === id)?.id)
    .filter((id): id is AdaptiveCapabilityId => Boolean(id));
  const next = applyValueToBrief(brief, inferFieldFromStep(answer.stepId), value, values);
  if (matchingCapabilities.length) next.capabilities = unique([...next.capabilities, ...matchingCapabilities]) as AdaptiveCapabilityId[];
  if (answer.action === "skip") next.rejectedCapabilities = unique([...next.rejectedCapabilities, ...matchingCapabilities]) as AdaptiveCapabilityId[];
  if (answer.action === "select" && matchingCapabilities.length && answer.stepId === "output") next.output = matchingCapabilities[0];
  next.answeredStepIds = unique([...next.answeredStepIds, answer.stepId]);
  return next;
}

function inferFieldFromStep(stepId: string): AdaptiveField | undefined {
  const known = ["domain", "subject-type", "name", "property-location", "goal", "output", "facts", "media", "media-choice", "tone"] as const;
  if (known.includes(stepId as typeof known[number])) {
    if (stepId === "subject-type") return "subjectType";
    if (stepId === "property-location") return "location";
    if (stepId === "media-choice") return "media";
    return stepId as AdaptiveField;
  }
  return undefined;
}

function finalizeBrief(input: AdaptiveExperienceBrief): AdaptiveExperienceBrief {
  const brief = { ...input, fields: { ...input.fields }, facts: [...input.facts], preferences: [...input.preferences], tone: [...input.tone], media: [...input.media], capabilities: [...input.capabilities], rejectedCapabilities: [...input.rejectedCapabilities], answeredStepIds: [...input.answeredStepIds] };
  const domain = brief.domain ?? inferDomain(brief);
  const output = brief.output ?? inferOutput(brief);
  const next = { ...brief };
  if (domain) next.domain = domain;
  if (output && !next.output) next.output = output;
  next.completeness = completeness(next);
  next.readyForAuthor = ready(next);
  return next;
}

function briefPrompt(brief: AdaptiveExperienceBrief): string {
  return [
    `INTENT: ${brief.originalIntent}`,
    `DOMAIN: ${brief.domain ?? "unknown"}`,
    `SUBJECT: ${brief.subject ?? brief.fields.name ?? "unknown"}`,
    `TYPE: ${brief.subjectType ?? "unknown"}`,
    `GOAL: ${brief.goal ?? "unknown"}`,
    `OUTPUT: ${brief.output ?? "unknown"}`,
    `TONE: ${brief.tone.join(", ") || "neutral"}`,
    `FACTS: ${brief.facts.join(" | ")}`,
    `FIELDS: ${JSON.stringify(brief.fields)}`,
  ].join("\n");
}

export async function recordAdaptiveInteraction(brief: AdaptiveExperienceBrief, answer: AdaptiveAnswer, step: AdaptiveStep): Promise<void> {
  if (!brief.assetId) return;
  await analytics.trackEvent({
    assetId: brief.assetId,
    sessionId: brief.sessionId,
    type: "AI_DECISION",
    meta: {
      surface: "adaptive_intake",
      stepId: step.id,
      stepKind: step.kind,
      field: step.field ?? null,
      action: answer.action,
      value: answer.value ?? null,
      values: answer.values ?? [],
      selectedOptionIds: answer.selectedOptionIds ?? [],
      domain: brief.domain ?? null,
      output: brief.output ?? null,
      timestamp: new Date().toISOString(),
    },
  });
}

export async function getAdaptiveState(briefInput: AdaptiveExperienceBrief): Promise<{ brief: AdaptiveExperienceBrief; step: AdaptiveStep; suggestedCapabilities: AdaptiveCapabilityId[]; learning: string[] }> {
  let brief = finalizeBrief(briefInput);
  const learning = brief.assetId
    ? await getCreativeLearningContext({ assetId: brief.assetId })
    : null;

  const learningHints = learning ? [...learning.acceptedPatterns, ...learning.rejectedPatterns, ...learning.autonomousWinners].slice(0, 20) : [];
  const suggested = capabilitiesFor(brief);

  if (!brief.domain || !brief.output) {
    try {
      const context = brief.assetId
        ? await createMemoryRepository().loadContext({ assetId: brief.assetId })
        : null;
      const cognitive = compileCognitiveExperience(briefPrompt(brief), {
        memorySummary: context ? [`KNOWN MEMORY: ${JSON.stringify(context).slice(0, 10000)}`] : undefined,
        feedback: { accepted: learningHints, rejected: learning?.rejectedPatterns ?? [] },
      });
      const world = cognitive.world as any;
      const inferredDomain = clean(world?.metadata?.category ?? world?.type ?? "");
      if (!brief.domain && inferredDomain) brief.domain = inferDomain({ ...brief, fields: { ...brief.fields, category: inferredDomain } });
    } catch {
      // Deterministic fallback remains authoritative.
    }
  }

  brief.completeness = completeness(brief);
  brief.readyForAuthor = ready(brief);
  const step = deterministicStep(brief, suggested);

  return {
    brief,
    step,
    suggestedCapabilities: suggested.map((capability) => capability.id),
    learning: learningHints,
  };
}

export function buildAuthorPrompt(brief: AdaptiveExperienceBrief): string {
  return [
    "QRE ADAPTIVE EXPERIENCE BRIEF",
    briefPrompt(brief),
    `CAPABILITIES: ${brief.capabilities.join(", ")}`,
    `MEDIA: ${brief.media.join(", ") || "none"}`,
    `PREFERENCES: ${brief.preferences.join(", ") || "none"}`,
    "AUTHOR RULE: Use supplied facts as reality. Creative treatment may transform presentation, but must not invent unsupported factual events, identities, chronology, locations or attributes.",
  ].join("\n");
}
