import type { CognitiveLens, WorldEvent, WorldModel } from "./worldModel.js";
import type { SignificanceResult } from "./significanceEngine.js";
import { generateWriterDrafts } from "./creativeWriter.js";

export type CreativeCandidate = {
  eventId: string;
  text: string;
  lens: CognitiveLens;
  creativity: number;
  evidenceCoverage: number;
  novelty: number;
  causalFit: number;
  attention: number;
  score: number;
  creativeDetails: string[];
};

type CandidateDraft = { text: string; creativeDetails: string[]; move: string };

const clean = (value: string) => value.replace(/\s+/g, " ").trim().replace(/[.!?]+$/, "");
const lower = (value: string) => clean(value).toLowerCase();
const unique = (values: readonly string[]) => [...new Set(values.map(clean).filter(Boolean))];
const words = (value: string) => lower(value).split(/\W+/).filter((word) => word.length >= 4);

function subject(event: WorldEvent): string {
  return event.participants.join(" and ") || event.object || event.place || "the moment";
}

function primaryDetail(event: WorldEvent): string | undefined {
  return event.object || event.details[0] || event.place;
}

function secondaryDetail(event: WorldEvent, primary?: string): string | undefined {
  return event.details.find((detail) => lower(detail) !== lower(primary ?? "")) || event.time || event.place;
}

function explicitAnchors(event: WorldEvent): string[] {
  return unique([
    ...event.participants.filter((participant) => event.raw.toLowerCase().includes(participant.toLowerCase())),
    event.object ?? "",
    event.place ?? "",
    event.time ?? "",
    ...event.details,
  ]);
}

function coverage(text: string, event: WorldEvent): number {
  const body = lower(text);
  const anchors = explicitAnchors(event);
  if (!anchors.length) return 1;
  return anchors.filter((anchor) => body.includes(lower(anchor))).length / anchors.length;
}

function novelty(text: string, prior: string[], usedPhrases: string[]): number {
  const bodyWords = new Set(words(text));
  if (!bodyWords.size) return 0;
  const overlaps = prior.map((item) => {
    const priorWords = new Set(words(item));
    return [...bodyWords].filter((word) => priorWords.has(word)).length / Math.max(1, bodyWords.size);
  });
  const phrasePenalty = usedPhrases.filter((phrase) => lower(text).includes(lower(phrase))).length * 0.15;
  return Math.max(0, 1 - Math.max(...overlaps, 0) - phrasePenalty);
}

function learnedBias(text: string, preferences: string[], accepted: string[], rejected: string[]): number {
  const body = lower(text);
  let score = 0;
  for (const preference of preferences) if (body.includes(lower(preference))) score += 1.6;
  for (const value of accepted) if (body.includes(lower(value))) score += 1.2;
  for (const value of rejected) if (body.includes(lower(value))) score -= 3.5;
  return score;
}

function rhythm(event: WorldEvent): string {
  const bits = [event.time, subject(event), event.action, event.object, event.place].filter(Boolean).join(" ");
  return clean(bits);
}

function sentenceOpenings(lens: CognitiveLens): string[] {
  switch (lens) {
    case "comedy": return ["Apparently,", "Somewhere along the way,", "Naturally,", "The plan was simple until", "Nobody had authorized the part where"];
    case "horror": return ["At first,", "Then", "The problem was not", "Nothing had changed except", "That would have been ordinary, if"];
    case "romance": return ["Years later,", "At the time,", "What stayed was", "It was only a small detail, but", "Some moments become larger when"];
    case "mysterious": return ["The strange part was", "Nothing explained why", "At first glance,", "One detail refused to fit:", "The facts were ordinary until"];
    case "wild": return ["And then", "This was where", "For a perfectly normal day,", "The reasonable version ended when", "From there,"];
    default: return ["On paper,", "Then", "What mattered was", "The detail that stayed was", "Somehow,"];
  }
}

function endingMoves(lens: CognitiveLens, subjectText: string, detail?: string): string[] {
  const noun = detail ? ` ${detail}` : "";
  switch (lens) {
    case "comedy": return [
      `${subjectText} had, at minimum, made a compelling case for doing it again.`,
      `It was not the plan. It was certainly the part everyone would remember.`,
      `The day kept its schedule. Its dignity did not.`,
      `There are worse ways to leave with a story.`,
    ];
    case "horror": return [
      `The ordinary part ended there.`,
      `Nothing followed the detail, which was somehow worse.`,
      `The room gave no explanation.${noun}`,
      `It would have been easier if anything had looked obviously wrong.`,
    ];
    case "romance": return [
      `It was the kind of detail memory refuses to throw away.`,
      `The moment passed. The meaning stayed.`,
      `Somewhere in all that ordinary time, this became theirs.`,
      `Years later, the smallness of it would be the point.`,
    ];
    case "mysterious": return [
      `The answer stayed one step behind the evidence.`,
      `Nothing in the room volunteered an explanation.`,
      `The detail remained, unresolved.`,
      `That was the part no one could quite account for.`,
    ];
    case "wild": return [
      `By then, ordinary was no longer on the itinerary.`,
      `The plan survived. Somehow, everything around it got louder.`,
      `At that point, stopping would have required more effort than continuing.`,
      `And that was how a normal day lost the plot.`,
    ];
    default: return [
      `That was the detail that made the moment stay.`,
      `The facts were simple. The memory was not.`,
      `Nothing about it needed to be bigger than it was.`,
      `It was ordinary right up until it wasn't.`,
    ];
  }
}

function personify(subjectText: string, action: string | undefined, detail?: string): string {
  if (!action) return `${subjectText} carried on${detail ? ` with ${detail}` : ""}`;
  const object = detail ? ` ${detail}` : "";
  return `${subjectText} ${action}${object}`;
}

function contextualTurn(event: WorldEvent, lens: CognitiveLens): CandidateDraft[] {
  const raw = clean(event.raw);
  const primary = primaryDetail(event);
  const secondary = secondaryDetail(event, primary);
  const corpus = lower(`${raw} ${event.details.join(" ")}`);
  const drafts: CandidateDraft[] = [];
  const add = (text: string, details: string[], move: string) => drafts.push({ text, creativeDetails: details, move });

  if (/\bwedding\b/.test(corpus) || /\bvows?\b/.test(corpus)) add(`${raw}. The vows have a script; everything after them gets the dangerous freedom of a live night.`, ["semantic turn", "anticipation", "earned unpredictability"], "contextual-wedding");
  else if (/\b(first date|anniversary|nine years|years ago|grandmother|grandma|father|dad|mother|mom)\b/.test(corpus)) add(`${raw}. The calendar can measure the distance; it cannot measure what the detail kept alive.`, ["memory compression", "emotional implication"], "contextual-memory");
  else if (/\bconcert|rave|festival|crowd|sunrise\b/.test(corpus)) add(`${raw}. The event had a schedule; the atmosphere clearly had other plans.`, ["atmospheric contrast", "event momentum"], "contextual-event");
  else if (/\brestaurant|bakery|salon|groomer|hotel|housekeeper|client\b/.test(corpus)) add(`${raw}. Routine was the official description. The details were already making a better story.`, ["routine-to-story turn", "specificity"], "contextual-service");
  else if (/\bkeychain|watch|teapot|guitar|camera|suitcase|compass|ticket\b/.test(corpus)) add(`${raw}. The object stayed the same; the places around it kept changing what it meant.`, ["object continuity", "meaning evolution"], "contextual-object");
  else if (/\b(?:room|hallway|motel|hotel room|lights|chairs|door|window|ocean)\b/.test(corpus)) add(`${raw}. Nothing about the setting needed to announce itself. The arrangement was enough to change the feeling.`, ["setting inversion", "atmospheric implication"], "contextual-setting");
  else if (primary || secondary) add(`${raw}. ${primary && secondary && lower(primary) !== lower(secondary) ? `${primary} was the visible fact; ${secondary} was where the meaning started to move.` : `${primary ?? "One small detail"} gave the facts something to catch on to.`}`, ["detail hierarchy", "semantic turn"], "contextual-pivot");

  if (lens === "comedy") add(`${raw}. The situation had somehow acquired more confidence than evidence.`, ["comic incongruity"], "contextual-comedy");
  if (lens === "horror") add(`${raw}. The details remained ordinary. Their combination did not.`, ["horror implication", "ordinary-to-ominous"], "contextual-horror");
  if (lens === "romance") add(`${raw}. It was small enough to overlook and precise enough for memory to keep.`, ["romantic compression", "memory spotlight"], "contextual-romance");
  if (lens === "mysterious") add(`${raw}. Every fact had an explanation except the feeling they produced together.`, ["mystery implication", "withheld explanation"], "contextual-mystery");
  if (lens === "wild") add(`${raw}. The sensible version of the day was still technically alive; it was simply losing ground.`, ["escalation", "comic momentum"], "contextual-wild");

  return drafts;
}

function makeDrafts(event: WorldEvent, world: WorldModel, previous?: WorldEvent, next?: WorldEvent): CandidateDraft[] {
  const s = subject(event);
  const primary = primaryDetail(event);
  const secondary = secondaryDetail(event, primary);
  const action = event.action;
  const raw = clean(event.raw);
  const drafts: CandidateDraft[] = [{ text: raw, creativeDetails: [], move: "reality-anchor" }];

  drafts.push(...contextualTurn(event, world.lens));
  drafts.push(...generateWriterDrafts(world, event, previous, next).map((draft) => ({ text: draft.text, creativeDetails: draft.details, move: `writer-${draft.move}` })));

  if (action && primary) drafts.push({
    text: `${s} ${action} ${primary}${event.place ? ` at ${event.place}` : ""}${event.time ? ` at ${event.time}` : ""}.`,
    creativeDetails: [],
    move: "compressed-factual",
  });

  const openings = sentenceOpenings(world.lens);
  const open = openings[event.order % openings.length]!;
  const openWithDetail = secondary ?? primary;

  if (action && primary) drafts.push({
    text: `${open} ${personify(s, action, primary)}. ${secondary ? `${secondary} was the detail that changed the feel.` : "The small details did the rest."}`,
    creativeDetails: ["specificity spotlight", "framing"],
    move: "spotlight",
  });

  if (action && previous) drafts.push({ text: `After ${primaryDetail(previous) ?? clean(previous.raw)}, ${personify(s, action, primary)}. The sequence had changed direction.`, creativeDetails: ["causal consequence", "turn"], move: "cause-turn" });
  if (action && next) drafts.push({ text: `${personify(s, action, primary)}. ${sentenceOpenings(world.lens)[(event.order + 2) % sentenceOpenings(world.lens).length]} ${primaryDetail(next) ?? "something else"} was still coming.`, creativeDetails: ["anticipation", "forward pull"], move: "anticipation" });
  if (primary && secondary) drafts.push({ text: `${s} ${action ?? "was there"}. ${primary} was the obvious detail. ${secondary} was the one that stayed.`, creativeDetails: ["contrast", "detail hierarchy"], move: "contrast" });
  if (event.details.length >= 2) drafts.push({ text: `${s} ${action ?? "was there"}. ${event.details[0]} looked incidental; ${event.details[1]} gave the moment its shape.`, creativeDetails: ["contrast", "detail hierarchy"], move: "detail-contrast" });
  if (world.events.length >= 3 && event.order === Math.floor(world.events.length / 2)) drafts.push({ text: `${s} ${action ?? "was there"}${primary ? ` with ${primary}` : ""}. This was the point where the earlier details finally started to mean something together.`, creativeDetails: ["midpoint synthesis", "callback"], move: "midpoint" });

  const frameEnds = endingMoves(world.lens, s, openWithDetail);
  if (action && primary) drafts.push({ text: `${personify(s, action, primary)}. ${frameEnds[event.order % frameEnds.length]!}`, creativeDetails: ["performance", "payoff"], move: "payoff" });
  if (event.order > 0 && previous?.details.length) drafts.push({ text: `${s} ${action ?? "was there"}${primary ? ` ${primary}` : ""}. The earlier ${previous.details[0]} suddenly made more sense in hindsight.`, creativeDetails: ["callback", "reinterpretation"], move: "callback" });

  if (world.lens === "comedy" && action) drafts.push(...[
    `${personify(s, action, primary)}. This was a bold strategy for a day that had done nothing to deserve one.`,
    `${personify(s, action, primary)}. Somehow, the normal version of events had already been voted out.`,
    `${personify(s, action, primary)}. Reasonable had apparently stepped outside for a minute.`,
    `${personify(s, action, primary)}. The situation had acquired exactly the amount of attitude it did not need.`,
  ].map((text) => ({ text, creativeDetails: ["comic reframing", "personification"], move: "comedy" })));

  if (world.lens === "horror" && action) drafts.push(...[
    `${personify(s, action, primary)}. The familiar details stayed in place, which was the unsettling part.`,
    `${personify(s, action, primary)}. Nothing announced danger; the pattern itself was enough.`,
    `${personify(s, action, primary)}. The room had not changed. The meaning had.`,
    `${personify(s, action, primary)}. It would have been easier if anything had looked wrong.`,
  ].map((text) => ({ text, creativeDetails: ["horror implication", "atmospheric turn"], move: "horror" })));

  if (world.lens === "romance" && action) drafts.push(...[
    `${personify(s, action, primary)}. Small in the moment, larger in the memory.`,
    `${personify(s, action, primary)}. It was only a detail then; memory would give it a larger room later.`,
    `${personify(s, action, primary)}. Nothing about it asked to be important. That is often how important memories begin.`,
    `${personify(s, action, primary)}. The clock moved on. The detail stayed.`,
  ].map((text) => ({ text, creativeDetails: ["romantic compression", "memory foreshadowing"], move: "romance" })));

  if (world.lens === "mysterious" && action) drafts.push(...[
    `${personify(s, action, primary)}. One detail refused to fit the rest.`,
    `${personify(s, action, primary)}. Everything made sense separately. Together, it did not.`,
    `${personify(s, action, primary)}. The explanation was missing from precisely the wrong place.`,
    `${personify(s, action, primary)}. The facts stayed quiet. The implication did not.`,
  ].map((text) => ({ text, creativeDetails: ["mystery implication", "withheld explanation"], move: "mystery" })));

  if (world.lens === "wild" && action) drafts.push(...[
    `${personify(s, action, primary)}. That was apparently enough to make the day accelerate.`,
    `${personify(s, action, primary)}. From there, the sensible version had to work overtime.`,
    `${personify(s, action, primary)}. The plan survived; the possibility of a quiet day did not.`,
    `${personify(s, action, primary)}. And that was before the next thing happened.`,
  ].map((text) => ({ text, creativeDetails: ["escalation", "comic momentum"], move: "wild" })));

  return drafts.filter((draft, index, list) => index === list.findIndex((other) => lower(other.text) === lower(draft.text)));
}

function strategyValue(move: string): number {
  if (move.startsWith("writer-")) {
    const writerMove = move.slice("writer-".length);
    return writerMove === "poet" || writerMove === "historian" || writerMove === "reversal" ? 2.35 : 2.15;
  }
  switch (move) {
    case "reality-anchor": return 0;
    case "compressed-factual": return 0.2;
    case "spotlight": return 1;
    case "cause-turn": return 1.2;
    case "anticipation": return 1.1;
    case "contrast": return 1.35;
    case "detail-contrast": return 1.4;
    case "midpoint": return 1.5;
    case "payoff": return 1.65;
    case "callback": return 1.7;
    case "contextual-wedding": return 2.25;
    case "contextual-memory": return 2.15;
    case "contextual-event": return 2.1;
    case "contextual-service": return 2.0;
    case "contextual-object": return 2.1;
    case "contextual-setting": return 2.15;
    case "contextual-pivot": return 2.0;
    case "contextual-comedy": return 2.1;
    case "contextual-horror": return 2.1;
    case "contextual-romance": return 2.1;
    case "contextual-mystery": return 2.1;
    case "contextual-wild": return 2.1;
    case "comedy": return 1.9;
    case "horror": return 1.9;
    case "romance": return 1.9;
    case "mystery": return 1.9;
    case "wild": return 1.9;
    default: return 1;
  }
}

export function generateCandidates(
  world: WorldModel,
  significance: SignificanceResult,
  preferences: string[] = [],
  accepted: string[] = [],
  rejected: string[] = [],
  usedPhrases: string[] = [],
): CreativeCandidate[] {
  const result: CreativeCandidate[] = [];
  const prior: string[] = [];

  for (const event of world.events) {
    const previous = world.events[event.order - 1];
    const next = world.events[event.order + 1];
    for (const draft of makeDrafts(event, world, previous, next)) {
      const evidenceCoverage = coverage(draft.text, event);
      const candidateNovelty = novelty(draft.text, prior, usedPhrases);
      const priorRef = previous ? lower(previous.object ?? previous.place ?? previous.action ?? previous.raw) : "";
      const causalFit = priorRef && lower(draft.text).includes(priorRef) ? 1 : event.order === 0 ? 0.95 : 0.86;
      const attention = Math.min(1.6, Math.max(0.25, (significance.scores.get(event.id) ?? 1) / 8));
      const creativity = Math.min(10, Math.max(0, strategyValue(draft.move) * 3 + draft.creativeDetails.length * 0.8 + Math.min(2, draft.text.length / 120)));
      const learned = learnedBias(draft.text, preferences, accepted, rejected);
      const rawPenalty = draft.move === "reality-anchor" ? -7 : 0;
      const repetitionPenalty = prior.some((item) => lower(item) === lower(draft.text)) ? 12 : 0;
      const protectedScore = evidenceCoverage >= 1 ? 44 : evidenceCoverage >= 0.75 ? -25 : -110;
      const score = protectedScore + evidenceCoverage * 40 + candidateNovelty * 21 + causalFit * 13 + attention * 11 + creativity * 3 + learned + rawPenalty - repetitionPenalty;

      result.push({ eventId: event.id, text: draft.text, lens: world.lens, creativity, evidenceCoverage, novelty: candidateNovelty, causalFit, attention, score, creativeDetails: draft.creativeDetails });
      prior.push(draft.text);
    }
  }

  return result;
}

export function selectCreativeSequence(world: WorldModel, candidates: CreativeCandidate[]): CreativeCandidate[] {
  const chosen: CreativeCandidate[] = [];
  const usedMoves = new Set<string>();

  for (const event of world.events) {
    const options = candidates.filter((candidate) => candidate.eventId === event.id);
    const ranked = [...options].sort((a, b) => {
      const aPenalty = usedMoves.has(a.creativeDetails[0] ?? "") ? 4 : 0;
      const bPenalty = usedMoves.has(b.creativeDetails[0] ?? "") ? 4 : 0;
      return (b.score - bPenalty) - (a.score - aPenalty);
    });
    const best = ranked[0];
    if (!best) continue;
    chosen.push(best);
    for (const detail of best.creativeDetails) usedMoves.add(detail);
  }
  return chosen;
}
