import type {
  CognitiveAssumption,
  CognitiveClaim,
  CognitiveEvidence,
  CognitiveExperienceState,
  ExperienceEntities,
  ExperienceHypothesis,
  ExperienceHypothesisKind,
} from "@qre/contracts";

import type { StoryCompilerContext } from "../experience/universalStoryCompiler.js";

const STOP = new Set(["a", "an", "the", "and", "or", "but", "for", "with", "about", "this", "that", "into", "from", "make", "create", "something", "please", "experience", "story", "build", "want", "need", "give", "get", "tell", "show", "i"]);

const unique = (values: string[]) => [...new Set(values.map((value) => value.trim()).filter(Boolean))];
const tokens = (value: string) => value.split(/[^A-Za-z0-9'’-]+/).filter(Boolean);
const clamp = (value: number) => Math.max(0, Math.min(1, value));

function promptEvidence(prompt: string, detail: string, confidence = 0.95): CognitiveEvidence {
  return { source: "prompt", detail, confidence };
}

function extractEntities(prompt: string, context: StoryCompilerContext): ExperienceEntities {
  const lower = prompt.toLowerCase();
  const keywords = unique(tokens(prompt).map((value) => value.toLowerCase()).filter((value) => value.length > 2 && !STOP.has(value)));
  const events = unique((lower.match(/\b(wedding|concert|festival|birthday|party|ceremony|event|show|conference|rave|club)\b/g) ?? []));
  const products = unique((lower.match(/\b(qr|nfc|tag|keychain|sticker|card|poster|shirt|book|product|watch|gift|surfboard|vehicle)\b/g) ?? []));
  const places = unique([
    ...(context.location?.label ? [context.location.label] : []),
    ...(context.location?.city ? [context.location.city] : []),
  ]);
  const people = unique((prompt.match(/\bmy\s+([A-Za-z][A-Za-z'’-]+)/gi) ?? []).map((value) => value.replace(/^my\s+/i, "")));

  return {
    people,
    places,
    organizations: [],
    dates: [],
    times: [],
    events,
    products,
    urls: [],
    phones: [],
    media: /\b(photo|image|video|film|music|song|voice|recording)\b/i.test(prompt) ? ["media"] : [],
    emails: [],
    keywords,
  };
}

function inferSubject(prompt: string, entities: ExperienceEntities): CognitiveClaim<string> {
  const possessive = prompt.match(/\bmy\s+([^,.!?]+?)(?:[,.!?]|$)/i)?.[1]?.trim();
  const direct = prompt.match(/\b(?:for|about|with)\s+([^,.!?]+?)(?:[,.!?]|$)/i)?.[1]?.trim();
  const value = possessive || direct || entities.people[0] || entities.products[0] || entities.events[0] || entities.keywords.slice(0, 4).join(" ") || "this experience";
  return { value, status: possessive || direct || entities.people[0] || entities.products[0] || entities.events[0] ? "observed" : "derived", confidence: possessive || direct ? 0.95 : 0.65, evidence: [promptEvidence(prompt, `subject candidate: ${value}`, possessive || direct ? 0.95 : 0.65)] };
}

function inferParticipants(prompt: string, context: StoryCompilerContext): CognitiveClaim<string[]> {
  const values: string[] = [];
  if (/\b(friend|family|guests?|community|crowd|fans?|people|customers?|visitors?|team|together|shared)\b/i.test(prompt)) values.push("shared participants");
  if (/\b(my|me|mine|personal|private)\b/i.test(prompt)) values.push("owner");
  values.push(...(context.event?.participants ?? []));
  const result = unique(values);
  return { value: result, status: result.length ? "observed" : "unknown", confidence: result.length ? 0.8 : 0, evidence: result.length ? [promptEvidence(prompt, `participants: ${result.join(", ")}`, 0.8)] : [] };
}

function opportunities(prompt: string, entities: ExperienceEntities) {
  const lower = prompt.toLowerCase();
  const memory = unique([
    /\b(memory|remember|forever|legacy|preserve|wedding|memorial|family|history|anniversary)\b/.test(lower) ? "preserve meaningful moments and contributions over time" : "",
    entities.people.length ? "attach evolving memories to people and relationships" : "",
  ]);
  const geographic = unique([
    /\b(place|venue|restaurant|bar|shop|hotel|beach|park|where|location|near|travel|journey)\b/.test(lower) ? "connect the experience to meaningful places and routes" : "",
  ]);
  const social = unique([
    /\b(friend|family|community|crowd|guests?|fans?|team|together|shared|club)\b/.test(lower) ? "allow participants to contribute, react, or return" : "",
  ]);
  const discovery = unique([
    /\b(secret|hidden|mystery|discover|explore|find|reveal|quest|treasure)\b/.test(lower) ? "progressively reveal meaningful information or connections" : "",
    entities.keywords.length > 3 ? "surface relationships between people, objects, places, and moments" : "",
  ]);
  const temporal = unique([
    /\b(today|tonight|live|event|return|again|future|anniversary|milestone|next)\b/.test(lower) ? "change behavior across time, repeat participation, or milestones" : "",
  ]);
  const commercial = unique([
    /\b(buy|shop|product|brand|book|booking|restaurant|hotel|club|business|customer|loyalty|reward|membership|subscribe)\b/.test(lower) ? "offer commerce or retention only when it naturally follows the experience" : "",
  ]);
  return { memory, geographic, social, discovery, temporal, commercial };
}

function hypothesis(kind: ExperienceHypothesisKind, premise: string, rationale: string, evidence: CognitiveEvidence[], dimensions: ExperienceHypothesis["dimensions"]): ExperienceHypothesis {
  const score = clamp(
    dimensions.subjectFit * 0.2 + dimensions.emotionalResonance * 0.15 + dimensions.interactionNaturalness * 0.15 +
    dimensions.memoryPotential * 0.1 + dimensions.discoveryPotential * 0.1 + dimensions.socialPotential * 0.08 +
    dimensions.temporalPotential * 0.07 + dimensions.commercialPotential * 0.05 + dimensions.novelty * 0.05 + dimensions.feasibility * 0.05,
  );
  return { id: `${kind}-${Math.round(score * 100)}`, kind, premise, rationale, evidence, dimensions, score };
}

export function understandExperience(prompt: string, context: StoryCompilerContext = {}): CognitiveExperienceState {
  const text = prompt.trim();
  if (!text) throw new Error("Experience prompt required.");
  const entities = extractEntities(text, context);
  const subject = inferSubject(text, entities);
  const participants = inferParticipants(text, context);
  const lower = text.toLowerCase();
  const emotionalIntent = unique([
    /\b(love|romantic|wedding|beloved)\b/.test(lower) ? "connection" : "",
    /\b(memory|memorial|nostalgia|remember|legacy)\b/.test(lower) ? "remembrance" : "",
    /\b(secret|mystery|hidden|discover)\b/.test(lower) ? "curiosity" : "",
    /\b(fun|playful|rave|party|game|quest)\b/.test(lower) ? "play" : "",
    /\b(missing|urgent|help)\b/.test(lower) ? "urgency" : "",
  ]);
  const affordances = unique([
    /\b(scan|qr|nfc|unlock|reveal)\b/.test(lower) ? "reveal" : "",
    /\b(game|challenge|quest|treasure|hunt)\b/.test(lower) ? "progression" : "",
    /\b(memory|remember|preserve|forever)\b/.test(lower) ? "continuity" : "",
    participants.value.length ? "participation" : "",
    "interaction",
  ]);
  const opportunity = opportunities(text, entities);
  const evidence = [promptEvidence(text, `central subject: ${subject.value}`, subject.confidence)];
  const base = { subjectFit: 0.8, emotionalResonance: emotionalIntent.length ? 0.85 : 0.55, interactionNaturalness: 0.8, memoryPotential: opportunity.memory.length ? 0.9 : 0.35, discoveryPotential: opportunity.discovery.length ? 0.9 : 0.4, socialPotential: opportunity.social.length ? 0.85 : 0.3, temporalPotential: opportunity.temporal.length ? 0.8 : 0.35, commercialPotential: opportunity.commercial.length ? 0.75 : 0.2, novelty: 0.7, feasibility: 0.9 };
  const hypotheses: ExperienceHypothesis[] = [
    hypothesis("story", `${subject.value} unfolds through a sequence of meaningful reveals`, "A narrative spine provides orientation without requiring an industry template.", evidence, base),
    hypothesis("memory", `${subject.value} becomes an evolving memory object`, "Persistent history is appropriate when the subject can accumulate meaning over time.", evidence, { ...base, memoryPotential: Math.max(base.memoryPotential, 0.75), temporalPotential: Math.max(base.temporalPotential, 0.65), novelty: 0.75 }),
    hypothesis("discovery", `${subject.value} becomes a portal for finding hidden relationships and layers`, "Discovery is selected when curiosity, secrets, places, or connected entities are present.", evidence, { ...base, discoveryPotential: Math.max(base.discoveryPotential, 0.75), interactionNaturalness: 0.85 }),
    hypothesis("social", `${subject.value} becomes a shared participation space`, "Shared experiences can gain meaning from contribution and return visits.", evidence, { ...base, socialPotential: Math.max(base.socialPotential, participants.value.length ? 0.9 : 0.6) }),
    hypothesis("journey", `${subject.value} becomes a progression that changes across interaction`, "A journey model supports milestones, repeat scans, and accumulated participation.", evidence, { ...base, temporalPotential: Math.max(base.temporalPotential, 0.7), interactionNaturalness: 0.9 }),
  ].sort((a, b) => b.score - a.score);
  const selectedHypothesis = hypotheses[0];
  const motivations = unique(["understand the subject", ...emotionalIntent.map((value) => `feel ${value}`), selectedHypothesis.kind === "discovery" ? "discover something meaningful" : ""]);
  const assumptions: CognitiveAssumption[] = [];
  if (!participants.value.length) assumptions.push({ statement: "The first version can be experienced by an individual scanner.", reason: "No specific participant group was confirmed.", confidence: 0.7 });
  if (!context.location && geographic.length === 0) assumptions.push({ statement: "No geographic behavior is required initially.", reason: "The prompt did not establish a meaningful place dependency.", confidence: 0.8 });
  return { prompt: text, subject, participants, motivations: { value: motivations, status: motivations.length ? "derived" : "unknown", confidence: 0.75, evidence }, entities, affordances, emotionalIntent, memoryOpportunities: opportunity.memory, geographicOpportunities: opportunity.geographic, socialOpportunities: opportunity.social, discoveryOpportunities: opportunity.discovery, temporalOpportunities: opportunity.temporal, commercialOpportunities: opportunity.commercial, hypotheses, selectedHypothesis, assumptions };
}
