import type { AuthorDomainContext } from "@qre/contracts";
import { localModelGenerate } from "./localModelRuntime.js";

const clean = (value: unknown): string =>
  String(value ?? "").replace(/\s+/g, " ").trim();

function parseJson(text: string): Record<string, unknown> | undefined {
  const source = clean(text)
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();

  if (!source) return undefined;

  try {
    const value = JSON.parse(source);
    return value && typeof value === "object"
      ? value as Record<string, unknown>
      : undefined;
  } catch {
    const start = source.indexOf("{");
    const end = source.lastIndexOf("}");
    if (start < 0 || end <= start) return undefined;
    try {
      const value = JSON.parse(source.slice(start, end + 1));
      return value && typeof value === "object"
        ? value as Record<string, unknown>
        : undefined;
    } catch {
      return undefined;
    }
  }
}

const clamp = (value: unknown, fallback = 0): number => {
  const number = Number(value);
  return Number.isFinite(number)
    ? Number(Math.max(0, Math.min(1, number)).toFixed(3))
    : fallback;
};

export type AuthorCreativeDiscovery = {
  relationship: string;
  change: string;
  organizingIdea: string;
  subjectPattern: string;
  tension: string;
  surprisePotential: string;
  payoffPotential: string;
  experienceShape: string[];
  carrierEventIds: string[];
  backgroundEventIds: string[];
  turnEventIds: string[];
  payoffEventIds: string[];
  compressionReason: string;
  thesis: string;
  lens: string;
  confidence: number;
  risk: string;
};

export async function discoverAuthorCreativeDirection(input: {
  events: ReadonlyArray<{ id: string; text: string }>;
  requestedLens?: string;
  memory?: readonly string[];
  domainContext?: AuthorDomainContext;
}): Promise<{
  discovery: AuthorCreativeDiscovery;
  model: string;
  modelCalls: number;
}> {
  const requestedLens = clean(input.requestedLens);

  const system = [
    "You are QRE Creative Discovery.",
    "You do NOT write the final experience. You discover the strongest creative idea hidden in supplied reality.",
    "You receive separate authority lanes. NEVER merge their authority:",
    "CURRENT_REALITY = what happened now. This is the only lane that can become current-event evidence.",
    "MEMORY = previously established reality. It may create continuity or callbacks, but it did not happen now unless CURRENT_REALITY says so.",
    "BUSINESS_CONTEXT = stable business/service/world information. It may improve understanding, vocabulary, and abstraction, but it is NEVER occurrence evidence.",
    "CREATIVE_INTENT = requested treatment. It is instruction, not evidence.",
    "Start from relationships among facts, not from genre vocabulary.",
    "Ask what makes this particular subject recognizable, what pattern the viewer can connect for themselves, and what supplied fact changes the meaning of another supplied fact.",
    "Look freely for an organizing idea: a subject-specific system, rule, habit, priority hierarchy, contradiction, status ladder, recurring pattern, competition, negotiation, mystery, progression, transformation, relationship, or another structure you discover. None is mandatory.",
    "A creative mechanic is a way of ORGANIZING reality. It is not a physical mechanism that changes reality.",
    "Think: REALITY -> CHARACTER/IDENTITY -> PATTERN -> CONNECTION -> SURPRISE -> MEMORY.",
    "Also think: FACT -> RELATIONSHIP -> CONSEQUENCE -> MEANING.",
    "The best discovery gives QRE something the viewer can mentally continue filling in.",
    "Also design a short EXPERIENCE SHAPE: 3-7 abstract viewer-state moves describing how the reading should progress. This is not a mandatory genre arc and not final prose. Derive it from the material.",
    "Do not assume every current fact deserves a beat. Dense operational/service detail is usually evidence underneath the experience, not the experience itself.",
    "Choose CURRENT_REALITY event IDs by function:",
    "carrierEventIds = the few facts that best carry the experience.",
    "backgroundEventIds = true supplied details that can stay underneath as provenance without screen time.",
    "turnEventIds = supplied facts that genuinely change the viewer's reading.",
    "payoffEventIds = supplied facts that can earn the landing.",
    "The same event may appear in more than one functional list when useful. Do not force every event into a list.",
    "When many operational details collectively imply one larger transformation, COMPRESS UPWARD. Find the transformation instead of narrating every task.",
    "Example: vacuumed, dusted, wiped counters, cleaned kitchen, cleaned bathrooms, finished. Those can collectively support 'the house progressively loses ground'; they do not require six cleaning beats.",
    "Examples of possible shapes: ordinary -> challenged -> losing ground -> victory; preference -> hierarchy -> conflict -> defining rule; nervous -> connection -> return -> reinterpretation. Invent the shape that fits the supplied reality.",
    "Entertainment matters more than sounding profound. Prefer a specific idea over a generic tone.",
    "Do not write scenes, captions, camera directions, dialogue, or final prose.",
    "Do not invent concrete people, objects, actions, conditions, operations, reactions, sensory evidence, before-states, after-states, or future events.",
    "Interpretive language is allowed. You may say the facts behave like a hierarchy, campaign, contest, negotiation, game, trial, resistance, victory, reversal, heist, comedy, horror, romance, or something else when that describes the relationship rather than asserting a literal event.",
    "Do not infer grime from cleaning, happiness from completion, or any plausible condition not supplied.",
    "Contrastive examples:",
    "FACTS: arrived 9:04; cleaned kitchen; cleaned two bathrooms; finished 11:47. STRONG DISCOVERY: progressive conquest — the house can lose ground room by room until completion reads as victory. WEAK DISCOVERY: chronometric optimization, efficiency, possible interruption, or a hidden obstacle. Those analyze the job instead of finding the entertaining idea.",
    "FACTS: loves walks; bacon; small dogs. STRONG DISCOVERY: a priority system or taste hierarchy that reveals character. WEAK DISCOVERY: list the preferences or invent an event where the subject chooses among them.",
    "A requested lens is creative intent, not permission to falsify reality.",
    "Return ONE lens only, or NONE.",
    "Return JSON only: {\"relationship\":\"...\",\"change\":\"...\",\"organizingIdea\":\"...\",\"subjectPattern\":\"...\",\"tension\":\"...\",\"surprisePotential\":\"...\",\"payoffPotential\":\"...\",\"experienceShape\":[\"...\",\"...\"],\"carrierEventIds\":[\"event-1\"],\"backgroundEventIds\":[\"event-2\"],\"turnEventIds\":[\"event-3\"],\"payoffEventIds\":[\"event-4\"],\"compressionReason\":\"...\",\"thesis\":\"...\",\"lens\":\"...\",\"confidence\":0.0,\"risk\":\"...\"}.",
  ].join("\n");

  const result = await localModelGenerate(
    [
      { role: "system", content: system },
      {
        role: "user",
        content: JSON.stringify({
          CURRENT_REALITY: input.events,
          MEMORY: (input.memory ?? []).slice(0, 24),
          BUSINESS_CONTEXT: input.domainContext,
          CREATIVE_INTENT: {
            requestedLens: requestedLens || undefined,
          },
          instruction: "Discover the idea worth creating from. Decide what should carry the experience and what should remain background evidence. Do not write the experience.",
        }),
      },
    ],
    "json",
    { numPredict: 560, temperature: 0.68 },
  );

  const parsed = parseJson(result.text);

  return {
    discovery: {
      relationship: clean(parsed?.relationship),
      change: clean(parsed?.change),
      organizingIdea: clean(parsed?.organizingIdea),
      subjectPattern: clean(parsed?.subjectPattern),
      tension: clean(parsed?.tension),
      surprisePotential: clean(parsed?.surprisePotential),
      payoffPotential: clean(parsed?.payoffPotential),
      experienceShape: Array.isArray(parsed?.experienceShape)
        ? parsed.experienceShape
            .filter((value): value is string => typeof value === "string")
            .map(clean)
            .filter(Boolean)
            .slice(0, 7)
        : [],
      carrierEventIds: Array.isArray(parsed?.carrierEventIds)
        ? parsed.carrierEventIds.filter((value): value is string => typeof value === "string").map(clean).filter(Boolean).slice(0, 24)
        : [],
      backgroundEventIds: Array.isArray(parsed?.backgroundEventIds)
        ? parsed.backgroundEventIds.filter((value): value is string => typeof value === "string").map(clean).filter(Boolean).slice(0, 48)
        : [],
      turnEventIds: Array.isArray(parsed?.turnEventIds)
        ? parsed.turnEventIds.filter((value): value is string => typeof value === "string").map(clean).filter(Boolean).slice(0, 16)
        : [],
      payoffEventIds: Array.isArray(parsed?.payoffEventIds)
        ? parsed.payoffEventIds.filter((value): value is string => typeof value === "string").map(clean).filter(Boolean).slice(0, 16)
        : [],
      compressionReason: clean(parsed?.compressionReason),
      thesis: clean(parsed?.thesis),
      lens: clean(parsed?.lens) || requestedLens || "NONE",
      confidence: clamp(parsed?.confidence, 0.65),
      risk: clean(parsed?.risk),
    },
    model: result.model,
    modelCalls: 1,
  };
}
