import type { CognitiveIntent, CognitiveUnderstanding } from "./types.js";

export type CognitiveExperiencePlan = {
  subject: string;
  audience: string[];
  emotionalIntent: string[];
  purpose: string[];
  interactionModel: string[];
  storyStructure: string[];
  memoryOpportunities: string[];
  geographicOpportunities: string[];
  socialOpportunities: string[];
  discoveryOpportunities: string[];
  rewardOpportunities: string[];
  commerceOpportunities: string[];
  progression: string[];
  contentOpportunities: string[];
  dynamicBehavior: string[];
  futureEvolution: string[];
  assumptions: string[];
};

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function subjectOf(understanding: CognitiveUnderstanding): string {
  return (
    understanding.objects[0] ??
    understanding.places[0] ??
    understanding.people[0] ??
    understanding.cognitiveWorld.objects[0] ??
    understanding.cognitiveWorld.entities[0]?.text ??
    "the thing being created"
  );
}

function intentPurpose(intent: CognitiveIntent[]): string[] {
  const result: string[] = [];

  if (intent.includes("remember")) result.push("preserve and reveal meaning over time");
  if (intent.includes("discover")) result.push("turn interaction into discovery");
  if (intent.includes("connect")) result.push("create a shared human experience");
  if (intent.includes("celebrate")) result.push("make the moment feel significant");
  if (intent.includes("serve")) result.push("make the service useful and memorable");
  if (intent.includes("teach")) result.push("make knowledge interactive");
  if (intent.includes("sell")) result.push("create a natural path to action");
  if (intent.includes("reward")) result.push("give participation visible value");
  if (intent.includes("protect")) result.push("make important information immediately useful");

  return unique(result);
}

export function buildCognitiveExperiencePlan(
  understanding: CognitiveUnderstanding,
): CognitiveExperiencePlan {
  const subject = subjectOf(understanding);
  const intents = understanding.intent;
  const social = understanding.audience.social;

  const purpose = intentPurpose(intents);

  const interactionModel = unique([
    "scan → immediate reveal",
    understanding.memory.past ? "timeline or memory reveal" : "contextual story reveal",
    understanding.objects.length ? "object-centered interaction" : "subject-centered interaction",
    understanding.places.length ? "location-aware context" : "contextual context",
    intents.includes("reward") ? "participation reward" : "optional participation",
    intents.includes("sell") || intents.includes("serve") ? "clear action path" : "soft continuation",
  ]);

  const storyStructure = unique([
    "arrival",
    "identity",
    "reveal",
    understanding.memory.past ? "memory or history" : "meaning",
    intents.includes("discover") ? "discovery" : "transformation",
    "completion",
    "continuation",
  ]);

  const memoryOpportunities = unique([
    ...(understanding.memory.past ? ["past events", "timeline", "milestones"] : []),
    ...(understanding.memory.present ? ["current moment", "live state"] : []),
    ...(understanding.memory.future ? ["future milestones", "planned continuation"] : []),
    ...(understanding.memory.legacy ? ["legacy", "persistent history"] : []),
    ...(understanding.objects.length ? ["object history"] : []),
    ...(understanding.people.length ? ["people and relationships"] : []),
  ]);

  const geographicOpportunities = understanding.places.length
    ? ["location context", "place history", "map reveal"]
    : ["optional location capture when meaningful"];

  const socialOpportunities = social === "community"
    ? ["shared participation", "community milestones", "collective progress"]
    : social === "shared"
      ? ["shared memories", "participant interaction", "social sharing"]
      : ["optional sharing when it feels natural"];

  const discoveryOpportunities = unique([
    "connections between remembered entities",
    "repeated locations or events",
    "timeline changes",
    ...(understanding.cognitiveWorld.relationships.length ? ["relationships already present in the prompt"] : []),
  ]);

  const rewardOpportunities = intents.includes("reward") || intents.includes("sell")
    ? ["scan milestones", "unlockable rewards", "repeat participation"]
    : ["optional milestone recognition"];

  const commerceOpportunities = intents.includes("sell") || intents.includes("serve")
    ? ["purchase or booking", "repeat action", "referral or review", "tip or appreciation when appropriate"]
    : ["commerce only when it naturally belongs to the subject"];

  const dynamicBehavior = unique([
    "scan count",
    "time and date",
    "previous interaction",
    "location when relevant",
    "ownership or access state",
    "new memories and events",
    "community activity",
  ]);

  return {
    subject,
    audience: unique(understanding.audience.types),
    emotionalIntent: unique(understanding.emotions),
    purpose,
    interactionModel,
    storyStructure,
    memoryOpportunities,
    geographicOpportunities,
    socialOpportunities,
    discoveryOpportunities,
    rewardOpportunities,
    commerceOpportunities,
    progression: ["first scan", "deeper interaction", "meaningful reveal", "completion", "return"],
    contentOpportunities: unique([
      ...understanding.objects,
      ...understanding.places,
      ...understanding.people,
      ...understanding.dates,
      ...understanding.times,
    ]),
    dynamicBehavior,
    futureEvolution: [
      "accumulate history",
      "learn from analytics",
      "surface discoveries",
      "add new content without rebuilding the asset",
    ],
    assumptions: purpose.length
      ? []
      : ["The prompt does not state a concrete purpose, so QRE will begin with a useful exploratory experience."],
  };
}
