import type { AuthorDomainContext } from "@qre/contracts";
import { localModelGenerate } from "./localModelRuntime.js";

const clean = (value: unknown): string =>
  String(value ?? "").replace(/\s+/g, " ").trim();

const unique = (values: readonly string[]): string[] =>
  [...new Set(values.map(clean).filter(Boolean))];

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

function stringArray(value: unknown, limit: number): string[] {
  return Array.isArray(value)
    ? unique(
        value
          .filter((item): item is string => typeof item === "string")
          .map(clean)
          .filter(Boolean),
      ).slice(0, limit)
    : [];
}

export type AuthorCreativeCandidate = {
  id: string;
  perception: string;
  relationship: string;
  observerInference: string;
  evidenceEventIds: string[];
  whyItHits: string;
  risk: string;
};

export type AuthorCreativeDiscovery = {
  candidates: AuthorCreativeCandidate[];
  selectedCandidateId: string;
  selected: AuthorCreativeCandidate;
  playableEventIds: string[];
  backgroundEventIds: string[];
  experienceShape: string[];
  lens: string;
  confidence: number;
  selectionReason: string;
  risk: string;
};

function normalizeCandidate(
  value: unknown,
  index: number,
  allowedEventIds: Set<string>,
): AuthorCreativeCandidate | undefined {
  if (!value || typeof value !== "object") return undefined;

  const record = value as Record<string, unknown>;
  const perception = clean(record.perception);
  const relationship = clean(record.relationship);
  const observerInference = clean(record.observerInference);

  if (!perception && !relationship && !observerInference) return undefined;

  return {
    id: clean(record.id) || `candidate-${index + 1}`,
    perception,
    relationship,
    observerInference,
    evidenceEventIds: stringArray(record.evidenceEventIds, 32)
      .filter((id) => allowedEventIds.has(id)),
    whyItHits: clean(record.whyItHits),
    risk: clean(record.risk),
  };
}

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
  const allowedEventIds = new Set(input.events.map((event) => event.id));

  const system = [
    "You are QRE Creative Discovery.",
    "You do NOT write the final viewer-facing experience.",
    "Your job is to search supplied reality for several competing grounded perceptions, then select the strongest one.",
    "",
    "CORE LAW:",
    "Reality is fixed. Interpretation is free.",
    "Do not change what happened. Change what a human can notice in what happened.",
    "",
    "AUTHORITY LANES:",
    "CURRENT_REALITY = what happened now. It is the only current-event evidence.",
    "MEMORY = previously established truth. It may create continuity or recontextualization, but it did not happen now unless CURRENT_REALITY says so.",
    "BUSINESS_CONTEXT = stable world/domain context. It helps understanding but is never an occurrence.",
    "CREATIVE_INTENT = requested treatment only. It is not evidence.",
    "",
    "UNIVERSAL SEARCH:",
    "Do not use domain-specific templates.",
    "Do not assume a service, pet, person, relationship, object, business, place, memory, or event needs a special story type.",
    "Search relationships among the supplied evidence itself.",
    "Possible relational structures include pattern, contrast, recurrence, accumulation, invariant, hierarchy, status change, transformation, origin, convergence, recontextualization, preference constellation, relational role, contradiction, progression, or another structure you discover.",
    "These are search possibilities, not mandatory slots.",
    "",
    "COMPETING READS:",
    "Generate 3 to 5 genuinely different candidate perceptions before selecting one.",
    "Do not generate cosmetic paraphrases of the same idea.",
    "Each candidate must state:",
    "- perception: what this reality can become when perceived differently",
    "- relationship: which relationship among supplied evidence creates that perception",
    "- observerInference: what the observer may reasonably infer without QRE stating the final conclusion",
    "- evidenceEventIds: supplied CURRENT_REALITY IDs supporting the candidate",
    "- whyItHits: why this read could be distinctive, revealing, funny, moving, strange, satisfying, tense, or otherwise worth watching",
    "- risk: grounding, genericness, obviousness, or explanation risk",
    "",
    "SELECTION OBJECTIVE:",
    "Select the candidate that best maximizes grounding, relational strength, specificity, observer inference, recontextualization, distinctiveness, entertainment potential, compression potential, and unresolved space.",
    "Penalize administrative/process language, genericness, fact restatement, explanation, obviousness, predictability, invented reality, and unsupported conclusions.",
    "A candidate that merely summarizes a workflow, service, chronology, effort, efficiency, completion, or business value is usually weak unless that is genuinely the surprising human perception in the evidence.",
    "",
    "EVIDENCE SELECTION AFTER THE READ:",
    "Only after selecting the strongest perception decide which CURRENT_REALITY facts deserve viewer-facing use.",
    "playableEventIds = only facts that deserve DIRECT literal presence on screen because the experience becomes materially weaker without showing them.",
    "backgroundEventIds = grounded facts that may remain underneath as provenance/context and may collectively support a higher-order interpretive cut.",
    "Candidate evidenceEventIds may be broader than playableEventIds. Do not copy all candidate evidence into playableEventIds.",
    "When accumulation itself supports the selected perception, prefer keeping the contributing facts as background evidence and let them jointly support one interpretive cut rather than replaying the list.",
    "Arrival, start time, finish time, chronology, timestamps, completion, and source order are optional. Never use them merely because they exist.",
    "Dense operational evidence may collectively support one higher-order perception without each task becoming a beat.",
    "Quality beats coverage.",
    "",
    "OBSERVER LAW:",
    "QRE should let the observer complete meaningful inference.",
    "The observer should feel 'I noticed that', not 'the AI explained that'.",
    "Observer inference must stay at the level of relationships among supplied facts. Do NOT infer a hidden cause, motive, personality trait, psychological state, personal standard, urgency, pride, satisfaction, obsession, intention, or unseen condition unless CURRENT_REALITY explicitly supports it.",
    "A playful relational read such as a preference pattern is allowed when it is visibly constructed from supplied facts; an unseen explanation for why the pattern exists is not.",
    "Do not resolve the latent meaning before the observer gets a chance to make it.",
    "",
    "LENS:",
    "Discover the selected perception BEFORE choosing or applying a lens.",
    "Lens is pressure/treatment on the selected relation. Lens does not decide what the story is.",
    "Return one lens or NONE.",
    "",
    "GROUNDING:",
    "Do not invent concrete people, objects, actions, conditions, sensory evidence, chronology, before-states, after-states, motives, emotions, relationships, outcomes, or future events.",
    "Clearly nonliteral interpretation is allowed, but the candidate itself must remain traceable to supplied evidence.",
    "Do not infer a before-state from an action: cleaning does not prove grime, disorder, chaos, neglect, or something being obscured; repair does not prove negligence; completion does not prove pride, relief, satisfaction, or future recurrence.",
    "Do not infer intensity from elapsed time alone: timestamps do not prove urgency, racing, pressure, efficiency, or leisurely pace unless supplied.",
    "",
    "EXPERIENCE SHAPE:",
    "After selection, return a short abstract viewer trajectory only if useful. Do not force a genre arc.",
    "",
    "Return JSON only in this shape:",
    "{\"candidates\":[{\"id\":\"candidate-1\",\"perception\":\"...\",\"relationship\":\"...\",\"observerInference\":\"...\",\"evidenceEventIds\":[\"event-1\"],\"whyItHits\":\"...\",\"risk\":\"...\"}],\"selectedCandidateId\":\"candidate-1\",\"playableEventIds\":[\"event-1\"],\"backgroundEventIds\":[\"event-2\"],\"experienceShape\":[\"...\",\"...\"],\"lens\":\"NONE\",\"confidence\":0.0,\"selectionReason\":\"...\",\"risk\":\"...\"}.",
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
          instruction:
            "Search several genuinely different grounded perceptions. Select the strongest latent read first. Only then select the minimum evidence needed to make that perception playable. Do not write final cuts.",
        }),
      },
    ],
    "json",
    { numPredict: 1100, temperature: 0.8 },
  );

  const parsed = parseJson(result.text);
  const rawCandidates = Array.isArray(parsed?.candidates) ? parsed.candidates : [];
  const candidates = rawCandidates
    .map((value, index) => normalizeCandidate(value, index, allowedEventIds))
    .filter((value): value is AuthorCreativeCandidate => Boolean(value))
    .slice(0, 5);

  const fallbackCandidate: AuthorCreativeCandidate = {
    id: "candidate-1",
    perception: "",
    relationship: "",
    observerInference: "",
    evidenceEventIds: [],
    whyItHits: "",
    risk: "creative_discovery_parse_failure",
  };

  const selectedCandidateId = clean(parsed?.selectedCandidateId);
  const selected =
    candidates.find((candidate) => candidate.id === selectedCandidateId) ??
    candidates[0] ??
    fallbackCandidate;

  const requestedPlayable = stringArray(parsed?.playableEventIds, 32)
    .filter((id) => allowedEventIds.has(id));

  const playableEventIds = requestedPlayable;

  const playableSet = new Set(playableEventIds);
  const requestedBackground = stringArray(parsed?.backgroundEventIds, 64)
    .filter((id) => allowedEventIds.has(id))
    .filter((id) => !playableSet.has(id));

  const backgroundEventIds = requestedBackground.length
    ? requestedBackground
    : input.events
        .map((event) => event.id)
        .filter((id) => !playableSet.has(id));

  return {
    discovery: {
      candidates,
      selectedCandidateId: selected.id,
      selected,
      playableEventIds,
      backgroundEventIds,
      experienceShape: stringArray(parsed?.experienceShape, 7),
      lens: clean(parsed?.lens) || requestedLens || "NONE",
      confidence: clamp(parsed?.confidence, 0.65),
      selectionReason: clean(parsed?.selectionReason),
      risk: clean(parsed?.risk) || selected.risk,
    },
    model: result.model,
    modelCalls: 1,
  };
}
