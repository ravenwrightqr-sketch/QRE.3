import type { CognitiveLens, WorldEvent, WorldModel } from "./worldModel.js";
import type { SignificanceResult } from "./significanceEngine.js";

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

const clean = (value: string) => value.replace(/\s+/g, " ").trim().replace(/[.!?]+$/, "");
const lower = (value: string) => clean(value).toLowerCase();
const unique = (values: readonly string[]) => [...new Set(values.map(clean).filter(Boolean))];
const GENERIC = /\b(?:the experience|this was memorable|a meaningful experience|worth remembering|discover the magic|make memories|unforgettable|one of a kind|journey of|gave the moment its texture|gave the moment a shape|made the moment meaningful)\b/i;
const TEMPLATE = /\b(?:common sense quietly left|reasonab(?:le|ility) was|the plan survived.*dignity|ordinary.*stopped feeling ordinary|small in the moment.*larger in the memory|nothing had to announce|somewhere.*day changed lanes)\b/i;

function subject(event: WorldEvent) { return event.participants.join(" and ") || event.object || event.place || "the moment"; }
function anchors(event: WorldEvent) { return unique([...event.participants, event.object ?? "", event.place ?? "", event.time ?? "", ...event.details]); }
function coverage(text: string, event: WorldEvent): number { const body = lower(text); const values = anchors(event); return values.length ? values.filter((value) => body.includes(lower(value))).length / values.length : 1; }
function phraseOverlap(text: string, prior: string[]): number {
  const body = new Set(lower(text).split(/\W+/).filter((word) => word.length >= 4));
  if (!prior.length || !body.size) return 0;
  const ratios = prior.map((item) => { const other = new Set(lower(item).split(/\W+/).filter((word) => word.length >= 4)); return [...body].filter((word) => other.has(word)).length / Math.max(1, body.size); });
  return Math.max(...ratios, 0);
}
function learnedBias(text: string, preferences: string[], accepted: string[], rejected: string[], usedPhrases: string[]): number {
  const body = lower(text); let score = 0;
  for (const value of preferences) if (value && body.includes(lower(value))) score += 1.5;
  for (const value of accepted) if (value && body.includes(lower(value))) score += 1;
  for (const value of rejected) if (value && body.includes(lower(value))) score -= 3.5;
  for (const value of usedPhrases) if (value && body.includes(lower(value))) score -= 1.75;
  if (GENERIC.test(body)) score -= 8;
  return score;
}
function thing(event: WorldEvent): string | undefined { return event.object ?? event.details[0] ?? event.place ?? event.time; }

function lensTail(lens: CognitiveLens, event: WorldEvent, previous?: WorldEvent, next?: WorldEvent): Array<{ text: string; detail: string }> {
  const t = thing(event); const prior = previous ? thing(previous) : undefined; const upcoming = next ? thing(next) : undefined; const out: Array<{ text: string; detail: string }> = [];
  if (t) out.push({ text: `${t} became the detail nobody could quite ignore.`, detail: "detail elevation" });
  if (t && event.action) out.push({ text: `${t} was small enough to overlook and specific enough to remember.`, detail: "specificity and memory" });
  if (prior && t) out.push({ text: `After ${prior}, ${t} changed the shape of the sequence.`, detail: "causal turn" });
  if (t && upcoming) out.push({ text: `${t} left ${upcoming} feeling like the next question.`, detail: "anticipatory tension" });
  switch (lens) {
    case "comedy":
      if (t) out.push({ text: `${t} behaved like it had been waiting all day for one glorious entrance.`, detail: "comic agency" });
      out.push({ text: "The plan was still technically intact. Its dignity was not.", detail: "comic reversal" });
      out.push({ text: "Nobody had scheduled the ridiculous part. It arrived anyway.", detail: "comic surprise" });
      break;
    case "horror":
      if (t) out.push({ text: `${t} was ordinary right up until it became the wrong kind of ordinary.`, detail: "horror reversal" });
      out.push({ text: "Nothing announced danger. The familiar details simply stopped feeling friendly.", detail: "horror implication" });
      if (prior) out.push({ text: `The unsettling part came after ${prior}, not before it.`, detail: "horror escalation" });
      break;
    case "romance":
      if (t) out.push({ text: `${t} was the sort of little thing memory learns to keep.`, detail: "romantic significance" });
      out.push({ text: "It looked ordinary while it was happening. Later, it would not.", detail: "romantic hindsight" });
      break;
    case "mysterious":
      if (t) out.push({ text: `${t} was the detail that refused to explain itself.`, detail: "mystery residue" });
      if (upcoming && t) out.push({ text: `${t} made ${upcoming} feel slightly less accidental.`, detail: "mystery linkage" });
      break;
    case "wild":
      if (t) out.push({ text: `${t} was the hinge; after that, the plan had to keep up.`, detail: "wild escalation" });
      if (upcoming && t) out.push({ text: `${t} opened the door for ${upcoming}, and neither waited politely.`, detail: "wild momentum" });
      break;
    default:
      if (t) out.push({ text: `${t} is what makes this version belong to itself.`, detail: "distinctive specificity" });
  }
  return out;
}

function performance(event: WorldEvent, world: WorldModel, previous?: WorldEvent, next?: WorldEvent): Array<{ text: string; detail: string }> {
  const direct = clean(event.raw); const out: Array<{ text: string; detail: string }> = [{ text: direct, detail: "truthful fallback" }];
  for (const tail of lensTail(world.lens, event, previous, next)) out.push({ text: `${direct}. ${tail.text}`, detail: tail.detail });
  if (event.object && event.action) out.push({ text: `${direct}. ${event.object} stole the scene.`, detail: "object personification" });
  if (event.place && event.action && event.order > 0) out.push({ text: `${direct}. By then, ${event.place} was more than a backdrop.`, detail: "place significance" });
  if (event.details.length >= 2) out.push({ text: `${direct}. ${event.details[0]} was easy to miss; ${event.details[1]} was not.`, detail: "detail contrast" });
  return out.filter((candidate, index, values) => index === values.findIndex((item) => lower(item.text) === lower(candidate.text)));
}

export function generateCandidates(world: WorldModel, significance: SignificanceResult, preferences: string[] = [], accepted: string[] = [], rejected: string[] = [], usedPhrases: string[] = [], noveltyPressure = 0.55): CreativeCandidate[] {
  const result: CreativeCandidate[] = []; const prior: string[] = [];
  for (const event of world.events) {
    const previous = world.events[event.order - 1]; const next = world.events[event.order + 1];
    for (const candidate of performance(event, world, previous, next)) {
      const evidenceCoverage = coverage(candidate.text, event);
      const overlap = phraseOverlap(candidate.text, [...prior, ...usedPhrases]);
      const candidateNovelty = Math.max(0, 1 - overlap);
      const previousAnchor = lower(previous?.object ?? previous?.place ?? previous?.action ?? previous?.raw ?? "");
      const causalFit = previousAnchor && lower(candidate.text).includes(previousAnchor) ? 1 : event.order === 0 ? 0.96 : 0.84;
      const attention = Math.min(1.5, (significance.scores.get(event.id) ?? 1) / 10);
      const creativity = candidate.creativeDetails.length ? Math.min(10, 4 + candidate.creativeDetails.length * 2 + candidate.text.length / 60) : 0;
      const learning = learnedBias(candidate.text, preferences, accepted, rejected, usedPhrases);
      const raw = lower(candidate.text) === lower(event.raw);
      const creativeSignal = candidate.creativeDetails.length ? 24 + noveltyPressure * 16 : 0;
      const rawPenalty = raw ? -(8 + noveltyPressure * 14) : 0;
      const genericPenalty = GENERIC.test(candidate.text) ? -12 : 0;
      const templatePenalty = TEMPLATE.test(candidate.text) ? -9 : 0;
      const evidenceScore = evidenceCoverage >= 1 ? 62 : -120;
      const score = evidenceScore + evidenceCoverage * 42 + candidateNovelty * (22 + noveltyPressure * 16) + causalFit * 12 + attention * 10 + creativity * 2.5 + creativeSignal + learning + rawPenalty + genericPenalty + templatePenalty;
      result.push({ eventId: event.id, text: candidate.text, lens: world.lens, creativity, evidenceCoverage, novelty: candidateNovelty, causalFit, attention, score, creativeDetails: candidate.creativeDetails });
      prior.push(candidate.text);
    }
  }
  return result;
}

export function selectCreativeSequence(world: WorldModel, candidates: CreativeCandidate[]): CreativeCandidate[] {
  const selected: CreativeCandidate[] = []; const usedEvents = new Set<string>();
  for (const candidate of [...candidates].sort((a, b) => b.score - a.score)) {
    if (usedEvents.has(candidate.eventId)) continue;
    selected.push(candidate); usedEvents.add(candidate.eventId);
  }
  return world.events.map((event) => selected.find((candidate) => candidate.eventId === event.id) ?? candidates.find((candidate) => candidate.eventId === event.id)).filter(Boolean) as CreativeCandidate[];
}
