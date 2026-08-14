import type { WorldEvent, WorldModel } from "./worldModel.js";
import type { CreativeCandidate } from "./creativePolicy.js";

export type NarrativeMove =
  | "character-turn"
  | "object-turn"
  | "setting-turn"
  | "memory-turn"
  | "time-turn"
  | "contrast-turn"
  | "comic-turn"
  | "horror-turn"
  | "romance-turn"
  | "mystery-turn"
  | "wild-turn"
  | "service-payoff"
  | "return-payoff"
  | "quiet-payoff";

const clean = (value: string) => value.replace(/\s+/g, " ").trim();
const sentence = (value: string) => clean(value).replace(/[.!?]+$/, "");
const lower = (value: string) => sentence(value).toLowerCase();
const unique = (values: readonly string[]) => [...new Set(values.map(sentence).filter(Boolean))];

function subject(event: WorldEvent): string {
  if (event.participants.length === 1) return event.participants[0]!;
  if (event.participants.length > 1) return event.participants.join(" and ");
  if (/\b(family|couple|crowd|everyone|guests|team|group|table)\b/i.test(event.raw)) {
    const match = event.raw.match(/\b(family|couple|crowd|everyone|guests|team|group|table)\b/i);
    if (match?.[1]) return match[1];
  }
  if (event.place) return `the scene at ${event.place}`;
  return "the moment";
}

function primary(event: WorldEvent): string | undefined {
  return event.object || event.details.find((detail) => detail.length >= 4) || event.place || event.time;
}

function secondary(event: WorldEvent, first?: string): string | undefined {
  return event.details.find((detail) => lower(detail) !== lower(first ?? "") && detail.length >= 4) || event.time || event.place;
}

function hasReturn(raw: string): boolean {
  return /\b(?:again|back|returned|returning|same place|revisited|came back)\b/i.test(raw);
}

function hasServiceShape(raw: string): boolean {
  return /\b(?:cleaned|groomed|washed|repaired|fixed|served|prepared|styled|trimmed|cut|checked|inspected|finished the job|completed the service|client|customer|homeowner|housekeeper|mechanic|groomer|salon)\b/i.test(raw);
}

function hasLongMemory(raw: string): boolean {
  return /\b(?:years later|months later|for years|for decades|for twenty years|for thirty years|for forty years|every summer|every thanksgiving|anniversary)\b/i.test(raw);
}

function safeRaw(event: WorldEvent): string {
  return `${sentence(event.raw)}.`;
}

function candidate(event: WorldEvent, world: WorldModel, text: string, move: NarrativeMove, details: string[], creativity = 8.2): CreativeCandidate {
  return {
    eventId: event.id,
    text: `${sentence(text)}.`,
    lens: world.lens,
    creativity: Math.min(10, creativity),
    evidenceCoverage: 1,
    novelty: 0.93,
    causalFit: event.order === 0 ? 0.97 : 0.95,
    attention: Math.min(1.5, 1.02 + details.length * 0.13),
    score: 91 + creativity * 3 + details.length * 5,
    creativeDetails: [`narrative:${move}`, ...details],
  };
}

function genericCandidates(event: WorldEvent, world: WorldModel): CreativeCandidate[] {
  const raw = safeRaw(event);
  const s = subject(event);
  const p = primary(event);
  const q = secondary(event, p);
  const out: CreativeCandidate[] = [candidate(event, world, raw, "quiet-payoff", ["source preserved"], 7.2)];

  if (p) out.push(candidate(event, world, `${raw} ${sentence(p)} was the detail that kept the scene from becoming just another report`, "object-turn", ["specificity", "report-to-memory"], 8.2));
  if (p && q) out.push(candidate(event, world, `${raw} ${sentence(p)} drew the eye; ${sentence(q)} was what gave the moment its shape`, "contrast-turn", ["foreground", "counterpoint"], 8.5));
  if (event.place && p) out.push(candidate(event, world, `${raw} ${sentence(event.place)} was more than a backdrop; it was the room in which ${sentence(p)} changed meaning`, "setting-turn", ["setting-as-witness", "semantic-shift"], 8.7));
  if (event.time && p) out.push(candidate(event, world, `${raw} ${sentence(event.time)} was only a timestamp until ${sentence(p)} gave it something worth remembering`, "time-turn", ["time-to-memory", "future-recall"], 8.7));
  if (hasReturn(event.raw) && p) out.push(candidate(event, world, `${raw} Returning changed the detail: ${sentence(p)} was no longer just part of the place; it was part of the history there`, "return-payoff", ["recurrence", "memory-evolution"], 9.0));
  if (hasLongMemory(event.raw) && p) out.push(candidate(event, world, `${raw} Years can change what an object means without changing the object at all; ${sentence(p)} had already crossed that line`, "memory-turn", ["long-memory", "reinterpretation"], 9.1));

  if (hasServiceShape(event.raw)) out.push(candidate(event, world, `${raw} The useful part was not the list of steps. It was the change the person could actually feel when the work was finished`, "service-payoff", ["service-outcome", "customer-facing-value"], 9.15));

  switch (world.lens) {
    case "comedy":
      if (p) out.push(candidate(event, world, `${raw} ${sentence(p)} behaved like it had been promoted to management without anyone remembering the interview`, "comic-turn", ["status-inversion", "personification"], 9.3));
      else out.push(candidate(event, world, `${raw} The sensible interpretation was still available. The scene had simply decided not to use it`, "comic-turn", ["comic-contrast", "understatement"], 9.1));
      break;
    case "horror":
      out.push(candidate(event, world, `${raw} Nothing in the facts needed to be impossible. The unsettling part was how neatly the details fit together`, "horror-turn", ["ordinary-ominous", "pattern-recognition"], 9.4));
      if (p) out.push(candidate(event, world, `${raw} ${sentence(p)} was ordinary on its own. In this arrangement, it became the detail nobody wanted to look at twice`, "horror-turn", ["ordinary-inversion", "avoidance"], 9.5));
      break;
    case "romance":
      if (p) out.push(candidate(event, world, `${raw} ${sentence(p)} was small enough to miss in the moment and exact enough for memory to keep`, "romance-turn", ["tender-understatement", "memory-afterimage"], 9.4));
      out.push(candidate(event, world, `${raw} The scene did not need to announce its importance. That is usually how the moments worth keeping arrive`, "romance-turn", ["emotional-understatement", "memory"], 9.2));
      break;
    case "mysterious":
      out.push(candidate(event, world, `${raw} Every detail had an explanation. The combination was what made the explanation feel incomplete`, "mystery-turn", ["assembled-implication", "open-question"], 9.4));
      if (p) out.push(candidate(event, world, `${raw} ${sentence(p)} was not strange by itself. It became strange when the rest of the scene refused to let it stay ordinary`, "mystery-turn", ["relational-strangeness", "tension"], 9.35));
      break;
    case "wild":
      out.push(candidate(event, world, `${raw} The plan was still technically alive; the night had simply stopped respecting it`, "wild-turn", ["escalation", "plan-versus-reality"], 9.25));
      if (p) out.push(candidate(event, world, `${raw} ${sentence(p)} was not the whole story. It was the part that made the next bad idea look inevitable`, "wild-turn", ["foreshadowing", "escalation"], 9.35));
      break;
    default:
      break;
  }

  return out;
}

function sequenceCandidates(event: WorldEvent, world: WorldModel): CreativeCandidate[] {
  const out: CreativeCandidate[] = [];
  const previous = world.events[event.order - 1];
  const next = world.events[event.order + 1];
  const p = primary(event);
  if (previous && p) out.push(candidate(event, world, `${safeRaw(event)} After ${sentence(primary(previous) || previous.raw)}, ${sentence(p)} landed differently`, "contrast-turn", ["sequence-memory", "state-change"], 9.0));
  if (next && p) out.push(candidate(event, world, `${safeRaw(event)} ${sentence(p)} had one job for now: make the next beat feel worth waiting for`, "memory-turn", ["anticipation", "forward-pull"], 8.9));
  if (!next && previous && p) out.push(candidate(event, world, `${safeRaw(event)} Earlier, ${sentence(primary(previous) || previous.raw)} looked like the important part. By the end, ${sentence(p)} had inherited the memory`, "memory-turn", ["callback", "payoff", "reinterpretation"], 9.5));
  return out;
}

export function generateNarrativeCandidates(world: WorldModel): CreativeCandidate[] {
  return world.events.flatMap((event) => [...genericCandidates(event, world), ...sequenceCandidates(event, world)]);
}
