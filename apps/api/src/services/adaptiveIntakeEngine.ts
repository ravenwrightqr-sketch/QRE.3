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
  return checks.filter(Boolean).length / checks.length;
}

function ready(brief: AdaptiveExperienceBrief): boolean {
  const hasReality = brief.facts.length >= 1 || Object.keys(brief.fields).length >= 2;
  const hasIntent = Boolean(brief.output || brief.capabilities.length);
  const authorRequired = brief.output === "cinematic_video" || brief.capabilities.includes("cinematic_video");
  if (authorRequired) return hasReality && hasIntent;
  return Boolean(brief.originalIntent) && hasReality && hasIntent;
}

function makeOption(id: string, label: string, value: string, capabilityId?: AdaptiveCapabilityId): AdaptiveStepOption {
  return { id, label, value, capabilityId };
}

function deterministicStep(brief: AdaptiveExperienceBrief, suggested: AdaptiveCapabilityDefinition[]): AdaptiveStep {
  const domain = brief.domain;

  if (!brief.domain) {
    return {
      id: "domain",
      kind: "choice",
      field: "domain",
      title: "What is this for?",
      explanation: "A rough direction is enough. QRE will adapt from there.",
      options: [
        makeOption("pet", "A pet / animal", "pet"),
        makeOption("property", "A property", "property"),
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

  if (!brief.fields.name && ["pet", "property", "business", "event", "identity"].includes(domain)) {
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
          makeOption("inquiry", "Get inquiries", "inquiry", "contact"),
          makeOption("all", "All of it", "all"),
        ]
      : domain === "property"
        ? [
            makeOption("sell", "Sell the property", "sell", "property_record"),
            makeOption("status", "Build status and prestige", "status", "cinematic_video"),
            makeOption("show", "Guide private showings", "show", "booking"),
            makeOption("record", "Preserve the property's history", "record", "memory"),
            makeOption("all", "All of it", "all"),
          ]
        : domain === "event"
          ? [
              makeOption("entry", "Handle entry", "entry", "ticket"),
              makeOption("live", "Run a live experience", "live", "event"),
              makeOption("memory", "Remember the event", "memory", "memory"),
              makeOption("both", "Run it live and remember it", "both", "memory"),
            ]
          : [
              makeOption("sell", "Sell / promote", "sell", "cinematic_video"),
              makeOption("identity", "Build the brand's identity", "identity", "living_profile"),
              makeOption("book", "Get bookings / inquiries", "book", "booking"),
              makeOption("remember", "Create live memories", "remember", "memory"),
              makeOption("all", "All of it", "all"),
            ];
    return {
      id: "goal",
      kind: "choice",
      field: "goal",
      title: "What should people get from it?",
      options,
      why: "The goal determines which QRE capabilities are worth surfacing next.",
      readyForAuthor: false,
    };
  }

  if (!brief.facts.length) {
    const title = domain === "pet" ? "Tell me the facts about them." : domain === "property" ? "What should people know about the property?" : domain === "event" ? "What actually matters about the event?" : domain === "business" ? "What should people know about the company?" : "What should this remember or communicate?";
    return {
      id: "facts",
      kind: "question",
      field: "facts",
      title,
      explanation: "Keep it factual. QRE will do the creative work later.",
      placeholder: domain === "pet" ? "3 months, male, for sale, fun, cute, loves people..." : "Enter the real details, moments or things people should know...",
      why: "Author can only safely transform what the creator actually supplies.",
      readyForAuthor: false,
    };
  }

  if (!brief.output) {
    const options: AdaptiveStepOption[] = [];
    const allowed = suggested.length ? suggested : ADAPTIVE_CAPABILITIES.slice(0, 6);
    for (const capability of allowed) {
      if (!capability.outputs.length) continue;
      options.push(makeOption(capability.id, capability.label, capability.outputs[0], capability.id));
    }
    return {
      id: "output",
      kind: "capability",
      field: "output",
      title: "What should QRE make from this?",
      options: options.slice(0, 6),
      why: "This chooses the experience type without exposing QRE's internal machinery.",
      readyForAuthor: false,
    };
  }

  if (brief.output === "cinematic_video" && !brief.preferences.some((item) => item.startsWith("tone:"))) {
    return {
      id: "tone",
      kind: "choice",
      field: "tone",
      title: "How should it feel?",
      options: [
        makeOption("funny", "Funny", "tone:funny"),
        makeOption("sweet", "Sweet", "tone:sweet"),
        makeOption("fierce", "Fierce", "tone:fierce"),
        makeOption("romantic", "Romantic", "tone:romantic"),
        makeOption("unexpected", "Unexpected", "tone:unexpected"),
      ],
      optional: true,
      why: "Tone changes how Author realizes the supplied reality without changing the facts.",
      readyForAuthor: false,
    };
  }

  if (brief.output === "cinematic_video" && !brief.media.length) {
    return {
      id: "media",
      kind: "media",
      field: "media",
      title: "Want to give the movie real media?",
      explanation: "Photos and video become source material. They are optional.",
      options: [
        makeOption("photos", "Photos", "photos"),
        makeOption("video", "Video clips", "video"),
        makeOption("both", "Photos + video", "photos,video"),
        makeOption("skip", "Not yet", "skip"),
      ],
      optional: true,
      why: "Media can make the authored experience more concrete, but the Author can work from facts alone.",
      readyForAuthor: false,
    };
  }

  if (ready(brief)) {
    return {
      id: "create",
      kind: "create",
      title: "I have enough to make it.",
      explanation: "QRE will use the facts you supplied, your selected capabilities and learned creative preferences.",
      options: [makeOption("make", "Make it", "create")],
      why: "The brief has enough grounded information and a clear output.",
      readyForAuthor: true,
    };
  }

  return {
    id: "more",
    kind: "question",
    field: "facts",
    title: "What else should QRE know?",
    placeholder: "Add another real detail...",
    optional: true,
    why: "More source reality can improve the next experience without forcing the user through a form.",
    readyForAuthor: false,
  };
}

export function createEmptyAdaptiveBrief(sessionId: string, assetId: string | undefined, originalIntent = ""): AdaptiveExperienceBrief {
  return {
    sessionId,
    assetId,
    originalIntent: clean(originalIntent),
    fields: {},
    facts: [],
    preferences: [],
    tone: [],
    media: [],
    capabilities: [],
    rejectedCapabilities: [],
    answeredStepIds: [],
    completeness: 0,
    readyForAuthor: false,
  };
}

function applyAnswer(brief: AdaptiveExperienceBrief, answer: AdaptiveAnswer): AdaptiveExperienceBrief {
  const next: AdaptiveExperienceBrief = {
    ...brief,
    fields: { ...brief.fields },
    facts: [...brief.facts],
    preferences: [...brief.preferences],
    tone: [...brief.tone],
    media: [...brief.media],
    capabilities: [...brief.capabilities],
    rejectedCapabilities: [...brief.rejectedCapabilities],
    answeredStepIds: unique([...brief.answeredStepIds, answer.stepId]),
  };

  const values = unique(answer.values?.length ? answer.values : answer.value ? [answer.value] : []);
  const chosen = unique(answer.selectedOptionIds ?? []);

  if (answer.action === "skip") return finalizeBrief(next);

  switch (answer.stepId) {
    case "domain":
      next.domain = values[0];
      break;
    case "subject-type":
      next.subjectType = values[0];
      break;
    case "name":
      next.fields.name = values[0] ?? "";
      next.subject = values[0] ?? next.subject;
      break;
    case "property-location":
      next.fields.location = values[0] ?? "";
      break;
    case "goal":
      next.goal = values[0] ?? "";
      break;
    case "facts":
    case "more":
      next.facts = unique([...next.facts, ...values.flatMap((value) => value.split(/\n|\.|;|\|/).map(clean))]);
      break;
    case "output": {
      const option = chosen[0] ?? values[0];
      next.output = option;
      const capability = ADAPTIVE_CAPABILITIES.find((item) => item.id === option);
      if (capability && !next.capabilities.includes(capability.id)) next.capabilities.push(capability.id);
      break;
    }
    case "tone":
      next.tone = unique([...next.tone, ...values.map((value) => value.replace(/^tone:/, ""))]);
      next.preferences = unique([...next.preferences, ...values.map((value) => value.startsWith("tone:") ? value : `tone:${value}`)]);
      break;
    case "media":
      next.media = unique(values.flatMap((value) => value === "photos,video" ? ["photo", "video"] : value === "skip" ? [] : [value]));
      break;
    default:
      if (values.length) next.facts = unique([...next.facts, ...values]);
  }

  const selectedCapabilityIds = chosen
    .map((id) => ADAPTIVE_CAPABILITIES.find((item) => item.id === id)?.id)
    .filter((id): id is AdaptiveCapabilityId => Boolean(id));
  next.capabilities = unique([...next.capabilities, ...selectedCapabilityIds]) as AdaptiveCapabilityId[];

  const domain = inferDomain(next);
  if (domain) next.domain = domain;
  if (!next.output) {
    const output = inferOutput(next);
    if (output) next.output = output;
  }

  return finalizeBrief(next);
}

function finalizeBrief(brief: AdaptiveExperienceBrief): AdaptiveExperienceBrief {
  const domain = inferDomain(brief);
  const output = inferOutput(brief);
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
        memorySummary: context ? `KNOWN MEMORY: ${JSON.stringify(context).slice(0, 10000)}` : undefined,
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
    suggestedCapabilities: suggested.map((item) => item.id),
    learning: learningHints,
  };
}

export function applyAdaptiveAnswer(brief: AdaptiveExperienceBrief, answer: AdaptiveAnswer): AdaptiveExperienceBrief {
  return applyAnswer(brief, answer);
}

export function buildAuthorPrompt(brief: AdaptiveExperienceBrief): string {
  return [
    `Create the approved QRE experience from this governed brief.`,
    `Intent: ${brief.originalIntent}`,
    `Domain: ${brief.domain ?? "unknown"}`,
    `Subject: ${brief.subject ?? brief.fields.name ?? "unknown"}`,
    `Subject type: ${brief.subjectType ?? "unknown"}`,
    `Goal: ${brief.goal ?? "unknown"}`,
    `Audience: ${brief.audience ?? "unknown"}`,
    `Requested output: ${brief.output ?? "experience"}`,
    `Tone preferences: ${brief.tone.join(", ") || "natural"}`,
    `Capabilities: ${brief.capabilities.join(", ")}`,
    `Facts supplied by creator:`,
    ...brief.facts.map((fact) => `- ${fact}`),
    `Creator preferences:`,
    ...brief.preferences.map((preference) => `- ${preference}`),
    `Media available: ${brief.media.join(", ") || "none"}`,
    `Reality rule: do not invent facts, people, events, chronology, locations, relationships, products, claims or outcomes not supported by supplied reality or existing governed memory.`,
    `Creative rule: transform the supplied reality into a watchable experience; do not merely summarize it.`,
  ].join("\n");
}
