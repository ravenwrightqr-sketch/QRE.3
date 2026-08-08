import type {
  CognitiveAssumption,
  CognitiveClaim,
  CognitiveEvidence,
  CognitiveExperiencePlan,
  CognitiveExperienceState,
  ExperienceEntities,
  ExperienceHypothesis,
  ExperienceHypothesisKind,
} from "@qre/contracts";
import type { StoryCompilerContext } from "../experience/universalStoryCompiler.js";

const STOP = new Set([
  "a", "an", "the", "and", "or", "but", "for", "with", "about", "this", "that",
  "into", "from", "make", "create", "something", "please", "experience", "story", "build",
  "want", "need", "give", "get", "tell", "show", "i", "to", "my", "me", "is", "are",
  "was", "were", "be", "has", "have", "had", "just", "than", "then", "so",
]);

const unique = (values: string[]) => [...new Set(values.map((value) => value.trim()).filter(Boolean))];
const clean = (value: string) => value.replace(/\s+/g, " ").trim();
const lower = (value: string) => clean(value).toLowerCase();
const tokens = (value: string) => clean(value).split(/[^A-Za-z0-9'’-]+/).filter(Boolean);
const clamp = (value: number) => Math.max(0, Math.min(1, value));
const has = (text: string, pattern: RegExp) => pattern.test(text);

function promptEvidence(detail: string, confidence = 0.95): CognitiveEvidence {
  return { source: "prompt", detail, confidence };
}

function extractEntities(prompt: string, context: StoryCompilerContext): ExperienceEntities {
  const text = clean(prompt);
  const lo = lower(text);
  const keywords = unique(tokens(text).map((value) => value.toLowerCase()).filter((value) => value.length > 2 && !STOP.has(value)));
  const people = unique([
    ...(text.match(/\b(?:my|our)\s+([A-Z][A-Za-z'’-]+(?:\s+[A-Z][A-Za-z'’-]+){0,2})/g) ?? []).map((value) => value.replace(/^\b(?:my|our)\s+/i, "")),
    ...(has(lo, /\bmusician\b/) ? ["musician"] : []),
    ...(has(lo, /\bartist\b/) ? ["artist"] : []),
  ]);
  return {
    people,
    places: unique([
      ...(context.location?.label ? [context.location.label] : []),
      ...(context.location?.city ? [context.location.city] : []),
      ...(context.event?.venue ? [context.event.venue] : []),
      ...(text.match(/\b(?:at|near)\s+([A-Z][A-Za-z'’-]+(?:\s+[A-Z][A-Za-z'’-]+){0,3})/g) ?? []).map((value) => value.replace(/^\b(?:at|near)\s+/i, "")),
    ]),
    organizations: unique(lo.match(/\b(brand|company|business|shop|studio|restaurant|hotel|club|venue)\b/g) ?? []),
    dates: unique(text.match(/\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/g) ?? []),
    times: unique(text.match(/\b\d{1,2}(?::\d{2})?\s?(?:am|pm)\b/gi) ?? []),
    events: unique(lo.match(/\b(wedding|concert|festival|birthday|party|ceremony|event|show|conference|rave|club|anniversary|memorial)\b/g) ?? []),
    products: unique(lo.match(/\b(qr|nfc|tag|keychain|sticker|card|poster|shirt|book|product|watch|gift|surfboard|truck|vehicle|guitar|guitar pick|pick|jewelry|artwork|tattoo)\b/g) ?? []),
    urls: unique(text.match(/https?:\/\/[^\s]+/gi) ?? []),
    phones: unique(text.match(/\+?\d[\d\s().-]{7,}\d/g) ?? []),
    media: has(lo, /\b(photo|image|video|film|music|song|voice|recording|qr|nfc|scan)\b/) ? ["media"] : [],
    emails: unique(text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) ?? []),
    keywords,
  };
}

function inferSubject(prompt: string, entities: ExperienceEntities): CognitiveClaim<string> {
  const text = clean(prompt);
  const candidates: Array<{ value: string; confidence: number; reason: string }> = [];
  const transform = text.match(/\b(?:turn|transform|make)\s+(?:a|an|the|my|our)?\s*(.+?)\s+\b(?:into|as)\b/i)?.[1];
  if (transform) candidates.push({ value: clean(transform), confidence: 0.98, reason: "object being transformed" });
  const possessive = text.match(/\b(?:my|our)\s+(.+?)(?=\s+(?:just\s+)?(?:turned|is|was|has|have|had|wants?|needs?|keeps?|goes?|went|will|can|could|should|and\s+I|and\s+we|after|before)\b|[,.!?]|$)/i)?.[1];
  if (possessive) candidates.push({ value: clean(possessive), confidence: 0.96, reason: "possessive subject" });
  const business = text.match(/\b(?:run|own|manage)\s+(?:a|an|the)?\s*(.+?)(?=\s+(?:but|and|that|which|because|so)\b|[,.!?]|$)/i)?.[1];
  if (business) candidates.push({ value: clean(business), confidence: 0.95, reason: "operated subject" });
  const created = text.match(/\b(?:create|build|design)\s+(?:a|an|the)?\s*(.+?)(?=\s+for\s+|\s+in\s+|\s+with\s+|[,.!?]|$)/i)?.[1];
  if (created) candidates.push({ value: clean(created), confidence: 0.94, reason: "requested creation" });
  const direct = text.match(/\b(?:for|about|with)\s+(.+?)(?=\s+(?:in|at|on|tonight|today|now|because|that)\b|[,.!?]|$)/i)?.[1];
  if (direct) candidates.push({ value: clean(direct), confidence: 0.88, reason: "explicit relational subject" });

  const best = candidates.filter((candidate) => candidate.value.length > 1 && candidate.value.length <= 80).sort((a, b) => b.confidence - a.confidence)[0];
  const fallback = entities.products[0] ?? entities.events[0] ?? entities.people[0] ?? tokens(text).filter((value) => !STOP.has(value.toLowerCase())).slice(0, 5).join(" ") || "this experience";
  const value = best?.value ?? fallback;
  const confidence = best?.confidence ?? 0.6;
  return {
    value,
    status: best ? "observed" : "derived",
    confidence,
    evidence: [promptEvidence(`subject candidate: ${value}${best ? ` (${best.reason})` : " (lexical fallback)"}`, confidence)],
  };
}

function inferParticipants(prompt: string, context: StoryCompilerContext): CognitiveClaim<string[]> {
  const text = lower(prompt);
  const values: string[] = [];
  if (/\bmy\s+(?:dog|cat|pet)\b/.test(text)) values.push("owner");
  if (/\bmusician\b/.test(text)) values.push("musician");
  if (/\bartist\b/.test(text)) values.push("artist");
  if (/\b(?:family|friends?|community|fans?|customers?|visitors?|guests?|crowd|people|team|group|everyone)\b/.test(text)) values.push("shared participants");
  if (/\b(?:kids?|children)\b/.test(text)) values.push("kids");
  if (/\b(?:someone|user|scanner|visitor)\b/.test(text)) values.push("scanner");
  values.push(...(context.event?.participants ?? []));
  const result = unique(values);
  return {
    value: result,
    status: result.length ? "observed" : "unknown",
    confidence: result.length ? 0.82 : 0,
    evidence: result.length ? [promptEvidence(`participants: ${result.join(", ")}`, 0.82)] : [],
  };
}

function cues(prompt: string) {
  const text = lower(prompt);
  return {
    memory: has(text, /\b(memory|memorial|remember|preserve|forever|legacy|after i'?m gone|history|keepsake|nostalgia|story to keep growing)\b/),
    discovery: has(text, /\b(portal|universe|secret|hidden|mystery|mysterious|discover|explore|reveal|uncover|origin|world)\b/),
    journey: has(text, /\b(travel|traveled|travels|journey|route|passport|destination|trip|adventure|more than i have)\b/),
    social: has(text, /\b(shared|share|family|friends?|community|fans?|crowd|guests?|together|everyone|group)\b/),
    game: has(text, /\b(game|challenge|quest|treasure|hunt|race|puzzle|competition|play)\b/),
    utility: has(text, /\b(teach|how to|guide|directions?|missing|find my|help|book|booking|schedule|information)\b/),
    identity: has(text, /\b(brand|musician|artist|tattoo|shop|studio|identity|world|portal|universe)\b/),
    ritual: has(text, /\b(wedding|memorial|birthday|anniversary|ceremony|milestone|ritual|celebrate)\b/),
    commerce: has(text, /\b(loyalty|reward|rewards|purchase|buy|shop|customer|membership|subscribe|booking|upsell|referral|business)\b/),
    evolution: has(text, /\b(growing|evolving|forever|over time|return|again|future|after|milestone|ten|years?)\b/),
    geographic: has(text, /\b(place|venue|restaurant|bar|shop|hotel|beach|park|location|where|near|travel|journey|route|wave)\b/),
    media: has(text, /\b(photo|image|video|film|music|song|voice|recording|guitar|pick|qr|nfc|scan)\b/),
  };
}

function opportunities(prompt: string, entities: ExperienceEntities) {
  const cue = cues(prompt);
  return {
    memory: unique([
      cue.memory ? "preserve meaningful moments and contributions over time" : "",
      cue.evolution ? "let the experience accumulate history rather than remain static" : "",
      entities.people.length ? "attach evolving memories to people and relationships" : "",
    ]),
    geographic: unique([cue.geographic ? "connect the experience to meaningful places, routes, or destinations" : ""]),
    social: unique([cue.social ? "allow participants to contribute, react, or return" : ""]),
    discovery: unique([
      cue.discovery ? "progressively reveal meaningful information, media, or relationships" : "",
      entities.keywords.length > 4 ? "surface relationships between people, objects, places, and moments" : "",
    ]),
    temporal: unique([cue.evolution ? "change behavior across time, repeat participation, or milestones" : ""]),
    commercial: unique([cue.commerce ? "offer commerce, loyalty, access, or retention only when it follows naturally" : ""]),
  };
}

const premise: Record<ExperienceHypothesisKind, (subject: string) => string> = {
  story: (subject) => `${subject} unfolds as a sequence of meaningful moments`,
  memory: (subject) => `${subject} becomes an evolving memory object`,
  discovery: (subject) => `${subject} becomes a portal into hidden layers and relationships`,
  journey: (subject) => `${subject} becomes a journey whose history accumulates through time and place`,
  social: (subject) => `${subject} becomes a shared participation space`,
  game: (subject) => `${subject} becomes a playful progression with discovery and payoff`,
  utility: (subject) => `${subject} becomes an immediately useful interaction`,
  identity: (subject) => `${subject} becomes an expression of a person, brand, or world`,
  ritual: (subject) => `${subject} becomes a meaningful ritual that can be revisited`,
  commerce: (subject) => `${subject} becomes a commerce or retention layer without replacing the experience`,
};

const rationale: Record<ExperienceHypothesisKind, string> = {
  story: "A narrative spine gives orientation and payoff without imposing an industry template.",
  memory: "Persistent history is appropriate when meaning can accumulate across people, objects, or moments.",
  discovery: "Portal, mystery, hidden-layer, and reveal language supports progressive discovery.",
  journey: "Travel and progression language supports accumulated place, time, and milestone context.",
  social: "Shared participation can create contribution, reaction, and return behavior.",
  game: "Challenge and quest language supports progression, feedback, and reward.",
  utility: "Instructional, urgent, or practical intent should produce immediate useful value.",
  identity: "People, artists, brands, and worlds benefit from experiences that express identity.",
  ritual: "Milestones and ceremonies gain meaning when the interaction becomes part of the ritual.",
  commerce: "Commercial behavior is useful when it follows an already meaningful interaction.",
};

function dimensions(kind: ExperienceHypothesisKind, cue: ReturnType<typeof cues>, emotional: string[], participants: string[]): ExperienceHypothesis["dimensions"] {
  const base = {
    subjectFit: 0.82,
    emotionalResonance: emotional.length ? 0.86 : 0.55,
    interactionNaturalness: 0.8,
    memoryPotential: cue.memory || cue.evolution ? 0.9 : 0.35,
    discoveryPotential: cue.discovery ? 0.92 : 0.4,
    socialPotential: cue.social ? 0.88 : 0.25,
    temporalPotential: cue.evolution || cue.journey ? 0.84 : 0.35,
    commercialPotential: cue.commerce ? 0.78 : 0.18,
    novelty: cue.discovery || cue.identity ? 0.86 : 0.68,
    feasibility: 0.9,
  };
  const boost: Partial<Record<ExperienceHypothesisKind, Partial<typeof base>>> = {
    story: { emotionalResonance: 0.75 },
    memory: { memoryPotential: 0.98, temporalPotential: 0.92 },
    discovery: { discoveryPotential: 0.99, interactionNaturalness: 0.92, novelty: 0.94 },
    journey: { temporalPotential: 0.97 },
    social: { socialPotential: participants.length || cue.social ? 0.96 : 0.5 },
    game: { interactionNaturalness: 0.95, discoveryPotential: 0.72, temporalPotential: 0.76 },
    utility: { interactionNaturalness: 0.97, feasibility: 0.96 },
    identity: { novelty: 0.96, emotionalResonance: 0.82 },
    ritual: { emotionalResonance: 0.94, memoryPotential: 0.82 },
    commerce: { commercialPotential: 0.97, interactionNaturalness: 0.84 },
  };
  return { ...base, ...(boost[kind] ?? {}) };
}

function score(kind: ExperienceHypothesisKind, d: ExperienceHypothesis["dimensions"], cue: ReturnType<typeof cues>): number {
  const weighted = d.subjectFit * 0.16 + d.emotionalResonance * 0.11 + d.interactionNaturalness * 0.13 + d.memoryPotential * 0.11 + d.discoveryPotential * 0.13 + d.socialPotential * 0.08 + d.temporalPotential * 0.08 + d.commercialPotential * 0.04 + d.novelty * 0.08 + d.feasibility * 0.08;
  const boost: Record<ExperienceHypothesisKind, number> = {
    memory: cue.memory ? 0.22 : 0,
    discovery: cue.discovery ? 0.27 : 0,
    journey: cue.journey ? 0.25 : 0,
    social: cue.social ? 0.18 : 0,
    game: cue.game ? 0.27 : 0,
    utility: cue.utility ? 0.28 : 0,
    identity: cue.identity ? 0.2 : 0,
    ritual: cue.ritual ? 0.2 : 0,
    commerce: cue.commerce ? 0.22 : 0,
    story: 0.04,
  };
  return clamp(weighted + boost[kind]);
}

function makeHypotheses(subject: CognitiveClaim<string>, prompt: string, emotional: string[], participants: CognitiveClaim<string[]>): ExperienceHypothesis[] {
  const cue = cues(prompt);
  const evidence = [promptEvidence(`central subject: ${subject.value}`, subject.confidence)];
  const kinds: ExperienceHypothesisKind[] = ["story", "memory", "discovery", "journey", "social", "game", "utility", "identity", "ritual", "commerce"];
  return kinds.map((kind) => {
    const d = dimensions(kind, cue, emotional, participants.value);
    return { id: `${kind}-${Math.round(score(kind, d, cue) * 100)}`, kind, premise: premise[kind](subject.value), rationale: rationale[kind], evidence, dimensions: d, score: score(kind, d, cue) };
  }).sort((a, b) => b.score - a.score);
}

function buildPlan(subject: CognitiveClaim<string>, participants: CognitiveClaim<string[]>, selected: ExperienceHypothesis, prompt: string, emotional: string[], opportunity: ReturnType<typeof opportunities>): CognitiveExperiencePlan {
  const cue = cues(prompt);
  const audience = participants.value.length ? participants.value : ["individual scanner"];
  const plan: CognitiveExperiencePlan = {
    centralSubject: subject.value,
    audience,
    whyInteract: [], emotionalIntent: unique(emotional), purpose: "",
    interactionModel: [], storyStructure: [], memoryModel: [], geographicModel: [], socialModel: [], discoveryModel: [], rewardModel: [], commerceModel: [], progressionModel: [], contentModel: [], dynamicBehavior: [], futureEvolution: [], creativePossibilities: [],
  };

  switch (selected.kind) {
    case "memory":
      plan.whyInteract.push("add, revisit, or reveal meaningful history");
      plan.interactionModel.push("scan → enter living memory → contribute or revisit");
      plan.storyStructure.push("origin → meaningful moments → present state → continuation");
      plan.memoryModel.push("memories, media, milestones, relationships, and provenance");
      plan.progressionModel.push("the experience becomes richer as trusted history accumulates");
      plan.futureEvolution.push("new memories can change what later visitors discover");
      break;
    case "discovery":
      plan.whyInteract.push("reveal a layer that is invisible from the physical subject alone");
      plan.interactionModel.push("scan → threshold → reveal → deeper layer → payoff");
      plan.storyStructure.push("threshold → reveal → deeper layer → payoff → invitation");
      plan.discoveryModel.push("hidden media, relationships, origin, context, and next clues");
      plan.progressionModel.push("repeat interactions can reveal deeper layers");
      plan.contentModel.push("voice, media, lore, places, references, and contextual fragments");
      plan.futureEvolution.push("new work, events, places, or artifacts can add new layers");
      break;
    case "journey":
      plan.whyInteract.push("see where the subject has been and what each place means");
      plan.interactionModel.push("scan → open accumulated journey → explore chapter");
      plan.storyStructure.push("departure → places → encounters → accumulation → next destination");
      plan.geographicModel.push("meaningful locations, routes, destinations, and place memories");
      plan.progressionModel.push("each place or milestone becomes another chapter");
      plan.contentModel.push("maps, timestamps, media, milestones, and route context");
      plan.futureEvolution.push("the journey continues as new places and moments are added");
      break;
    case "game":
      plan.whyInteract.push("solve, explore, or complete something instead of simply reading");
      plan.interactionModel.push("scan → action → feedback → unlock → next step");
      plan.storyStructure.push("hook → challenge → discovery → escalation → payoff");
      plan.progressionModel.push("milestones, clues, challenges, unlocks, and meaningful rewards");
      plan.rewardModel.push("reward access, discovery, status, or artifacts rather than arbitrary points");
      break;
    case "utility":
      plan.whyInteract.push("get useful value immediately");
      plan.interactionModel.push("scan → understand need → shortest useful action");
      plan.storyStructure.push("need → answer → action");
      plan.contentModel.push("instructions, status, options, directions, links, or next actions");
      break;
    case "identity":
      plan.whyInteract.push("enter the world behind the physical subject");
      plan.interactionModel.push("scan → artifact identity → creator/world identity");
      plan.storyStructure.push("artifact → creator → world → signature → return");
      plan.discoveryModel.push("creator, aesthetic, history, origin, and surrounding universe");
      plan.contentModel.push("voice, origin, catalog, performances, and behind-the-scenes material");
      break;
    case "ritual":
      plan.whyInteract.push("mark, revisit, or deepen the meaning of a significant moment");
      plan.interactionModel.push("scan as part of the ritual, ceremony, or remembrance");
      plan.storyStructure.push("arrival → meaning → shared moment → keepsake → continuation");
      plan.memoryModel.push("preserve contributions with provenance and respectful access");
      break;
    case "commerce":
      plan.whyInteract.push("receive useful access or value after the experience earns attention");
      plan.interactionModel.push("experience first → relevant offer/access second");
      plan.commerceModel.push("loyalty, booking, membership, referral, reward, or exclusive access only when natural");
      plan.rewardModel.push("reward meaningful participation or return behavior");
      break;
    case "social":
      plan.whyInteract.push("see what others contributed and add something of your own");
      plan.interactionModel.push("scan → witness → contribute → affect shared state");
      plan.storyStructure.push("arrival → shared context → contribution → collective payoff → return");
      plan.socialModel.push("contributions accumulate into a shared experience");
      plan.memoryModel.push("remember contributions and relationships with provenance");
      break;
    case "story":
    default:
      plan.whyInteract.push("discover why this subject matters");
      plan.interactionModel.push("scan → orientation → reveal → payoff");
      plan.storyStructure.push("orientation → hook → development → payoff → continuation");
      plan.contentModel.push("subject-specific narrative, media, context, and next action");
      break;
  }

  plan.memoryModel.push(...opportunity.memory);
  plan.geographicModel.push(...opportunity.geographic);
  plan.socialModel.push(...opportunity.social);
  plan.discoveryModel.push(...opportunity.discovery);
  plan.commerceModel.push(...opportunity.commercial);

  if (cue.evolution || selected.kind === "memory" || selected.kind === "journey") plan.dynamicBehavior.push("adapt to accumulated history and milestones");
  if (cue.media || selected.kind === "discovery" || selected.kind === "identity") plan.dynamicBehavior.push("surface different content as new media or context becomes available");
  if (cue.geographic || selected.kind === "journey") plan.dynamicBehavior.push("adapt when meaningful location context is available");
  if (cue.social || selected.kind === "social") plan.dynamicBehavior.push("change with participation while protecting private state");
  if (cue.commerce) plan.dynamicBehavior.push("gate commercial behavior behind relevant experience state");
  if (!plan.dynamicBehavior.length) plan.dynamicBehavior.push("remain useful on the first interaction and become richer when future context exists");

  const text = lower(prompt);
  if (has(text, /guitar\s+pick|pick/) && selected.kind === "discovery") {
    plan.creativePossibilities.push("the physical pick can behave like a portal key into the musician's universe");
    plan.creativePossibilities.push("the reveal can connect the pick to a song, performance, venue, or moment in the artist's history");
  }
  if (has(text, /dog|pet/)) plan.creativePossibilities.push("the subject can become a living memory profile whose story grows through trusted contributions");
  if (has(text, /surfboard/)) plan.creativePossibilities.push("the object can become a travel passport for waves, places, and encounters");
  if (has(text, /tattoo\s+shop|loyalty/)) plan.creativePossibilities.push("replace points with a living studio identity, chapters, access, and meaningful return rewards");
  if (has(text, /truck|vehicle/)) plan.creativePossibilities.push("the physical object can become a durable memorial to the people, places, and stories attached to it");
  if (has(text, /rave|nightclub|club/)) plan.creativePossibilities.push("the scan can behave like a threshold into the event rather than a static information page");
  if (!plan.creativePossibilities.length) plan.creativePossibilities.push("make the physical subject feel more alive, contextual, and meaningful than it does before the interaction");

  plan.purpose = selected.kind === "utility" ? "deliver immediate useful value" : `make ${subject.value} matter through ${selected.kind}`;
  for (const key of Object.keys(plan) as Array<keyof CognitiveExperiencePlan>) {
    if (Array.isArray(plan[key])) plan[key] = unique(plan[key] as string[]) as never;
  }
  return plan;
}

export function understandExperience(prompt: string, context: StoryCompilerContext = {}): CognitiveExperienceState {
  const text = clean(prompt);
  if (!text) throw new Error("Experience prompt required.");
  const entities = extractEntities(text, context);
  const subject = inferSubject(text, entities);
  const participants = inferParticipants(text, context);
  const cue = cues(text);
  const emotionalIntent = unique([
    has(text, /\b(love|romantic|beloved|affection|care|wedding|family)\b/) ? "connection" : "",
    has(text, /\b(memory|memorial|nostalgia|remember|legacy|forever|preserve)\b/) ? "remembrance" : "",
    has(text, /\b(secret|mystery|hidden|discover|portal|universe|explore)\b/) ? "curiosity" : "",
    has(text, /\b(fun|playful|rave|party|game|quest|challenge)\b/) ? "play" : "",
    has(text, /\b(scary|dark|danger|urgent|missing)\b/) ? "urgency" : "",
    has(text, /\b(proud|achievement|victory|milestone)\b/) ? "pride" : "",
  ]);
  const affordances = unique([
    cue.discovery ? "reveal" : "",
    cue.game ? "progression" : "",
    cue.memory || cue.evolution ? "continuity" : "",
    cue.journey ? "journey" : "",
    cue.social ? "participation" : "",
    cue.commerce ? "commerce" : "",
    cue.geographic ? "environment" : "",
    "interaction",
  ]);
  const opportunity = opportunities(text, entities);
  const hypotheses = makeHypotheses(subject, text, emotionalIntent, participants);
  const selectedHypothesis = hypotheses[0];
  const motivations = unique(["understand the subject", ...emotionalIntent.map((value) => `feel ${value}`), selectedHypothesis.kind === "discovery" ? "discover something meaningful" : "", selectedHypothesis.kind === "memory" ? "preserve something worth keeping" : "", selectedHypothesis.kind === "journey" ? "see how the subject accumulates a history" : "", selectedHypothesis.kind === "utility" ? "solve the immediate need" : ""]);
  const assumptions: CognitiveAssumption[] = [];
  if (!participants.value.length) assumptions.push({ statement: "The first version can be experienced by an individual scanner.", reason: "No specific participant group was confirmed.", confidence: 0.7 });
  if (!context.location && !cue.geographic) assumptions.push({ statement: "Geographic behavior is optional until meaningful location evidence exists.", reason: "The prompt does not establish a place dependency.", confidence: 0.82 });
  if (!context.memories?.length && (cue.memory || cue.evolution)) assumptions.push({ statement: "The first interaction may begin with an empty or sparse memory layer.", reason: "The prompt implies persistence but supplies no historical records.", confidence: 0.86 });
  const plan = buildPlan(subject, participants, selectedHypothesis, text, emotionalIntent, opportunity);

  return {
    prompt: text,
    subject,
    participants,
    motivations: { value: motivations, status: "derived", confidence: 0.78, evidence: [promptEvidence("motivations inferred from explicit intent and selected hypothesis", 0.78)] },
    entities,
    affordances,
    emotionalIntent,
    memoryOpportunities: opportunity.memory,
    geographicOpportunities: opportunity.geographic,
    socialOpportunities: opportunity.social,
    discoveryOpportunities: opportunity.discovery,
    temporalOpportunities: opportunity.temporal,
    commercialOpportunities: opportunity.commercial,
    hypotheses,
    selectedHypothesis,
    plan,
    assumptions,
  };
}
