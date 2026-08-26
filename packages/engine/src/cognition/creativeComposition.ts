import type { CognitiveLens, WorldEvent, WorldModel } from "./worldModel.js";
import type { CreativeCandidate } from "./creativePolicy.js";

const clean = (value: string) => value.replace(/\s+/g, " ").trim().replace(/[.!?]+$/, "");
const lower = (value: string) => clean(value).toLowerCase();
const unique = (values: readonly string[]) => [...new Set(values.map(clean).filter(Boolean))];

function subject(event: WorldEvent) {
  return event.participants.join(" and ") || event.object || event.place || "the moment";
}

function primary(event: WorldEvent) {
  return event.object || event.details[0] || event.place || event.action;
}

function secondary(event: WorldEvent) {
  return event.details.find((detail) => lower(detail) !== lower(primary(event) ?? "")) || event.time || event.place;
}

function association(value?: string): { noun: string; meaning: string } | undefined {
  if (!value) return undefined;
  const v = lower(value);
  if (/\b(ring|vow|wedding|anniversary)\b/.test(v)) return { noun: value, meaning: "promise" };
  if (/\b(bow|ribbon|dress|flower|gift)\b/.test(v)) return { noun: value, meaning: "evidence of attention" };
  if (/\b(ticket|pass|key|keychain|badge)\b/.test(v)) return { noun: value, meaning: "permission to enter or remember" };
  if (/\b(photo|photograph|camera|video|film)\b/.test(v)) return { noun: value, meaning: "witness" };
  if (/\b(watch|clock|calendar|date)\b/.test(v)) return { noun: value, meaning: "time made personal" };
  if (/\b(suitcase|bag|backpack|car)\b/.test(v)) return { noun: value, meaning: "evidence of the journey" };
  if (/\b(house|home|room|hotel|restaurant|salon|groomer|shop)\b/.test(v)) return { noun: value, meaning: "stage" };
  if (/\b(ocean|sea|lake|rain|snow|sunrise|sunset|night|storm)\b/.test(v)) return { noun: value, meaning: "emotional weather" };
  if (/\b(dog|cat|pet|puppy|kitten)\b/.test(v)) return { noun: value, meaning: "character with opinions" };
  return { noun: value, meaning: "second meaning" };
}

function payoff(lens: CognitiveLens, subjectText: string, detail?: string): string {
  const noun = detail || "the detail";
  switch (lens) {
    case "comedy": return `${subjectText} had somehow promoted ${noun} from background detail to co-conspirator.`;
    case "horror": return `${noun} remained ordinary, which made the pattern around it harder to dismiss.`;
    case "romance": return `${noun} was small enough to overlook and exact enough for memory to keep.`;
    case "mysterious": return `${noun} did not explain the moment. It only made the unanswered part more interesting.`;
    case "wild": return `${noun} was merely the first sign that ordinary had lost control of the schedule.`;
    default: return `${noun} was the small thing that made the larger moment stay.`;
  }
}

function opening(lens: CognitiveLens, event: WorldEvent, index: number): string {
  const choices = lens === "comedy"
    ? ["The day had a plan.", "Everything was normal for approximately a minute.", "There was, technically, a sensible explanation."]
    : lens === "horror"
      ? [
    "Nothing announced itself as wrong.",  "At first, every detail behaved.", "Nothing in the supplied details offered a warning.",]: lens === "romance"
        ? ["At the time, it looked small.", "Nobody needed to call it important yet.", "The moment was ordinary enough to pass quietly."]
        : lens === "mysterious"
          ? ["The facts were ordinary.", "Every detail had a plausible explanation.", "Nothing looked strange on its own."]
          : lens === "wild"
            ? ["The sensible version of the day was still technically alive.", "This was where ordinary started losing ground.", "The plan had not yet realized what was coming."]
            : ["The facts were simple.", "Nothing in the moment asked for a speech.", "It would have been easy to summarize this."];
  return choices[(event.order + index) % choices.length]!;
}

function compose(event: WorldEvent, world: WorldModel): Array<{ text: string; details: string[]; move: string }> {
  const raw = clean(event.raw);
  const s = subject(event);
  const p = primary(event);
  const q = secondary(event);
  const assoc = association(p);
  const drafts: Array<{ text: string; details: string[]; move: string }> = [];

  if (p) {
    drafts.push({
      text: `${raw}. ${opening(world.lens, event, 0)} ${p} looked like the obvious detail. ${assoc ? `It was also starting to mean ${assoc.meaning}.` : "It was also starting to mean something else."}`,
      details: ["observation", "semantic lift", "second meaning"],
      move: "meaning-lift",
    });
  }

  if (p && q) {
    drafts.push({
      text: `${raw}. ${p} was the visible fact; ${q} was where the meaning began to move. ${payoff(world.lens, s, q)}`,
      details: ["contrast", "foreground/background", "payoff"],
      move: "double-focus",
    });
  }

  if (assoc) {
    drafts.push({
      text: `${raw}. ${opening(world.lens, event, 1)} ${assoc.noun} had a second job now: ${assoc.meaning}. ${payoff(world.lens, s, assoc.noun)}`,
      details: ["association", "personification", "payoff"],
      move: "second-job",
    });
  }

  if (event.place && p) {
    drafts.push({
      text: `${raw}. ${event.place} held the scene still while ${p} changed what the scene meant. ${payoff(world.lens, s, p)}`,
      details: ["setting-as-stage", "meaning-shift", "payoff"],
      move: "stage-turn",
    });
  }

  if (event.time && p) {
    drafts.push({
      text: `${raw}. ${event.time} was only a timestamp until ${p} gave it a memory. ${payoff(world.lens, s, p)}`,
      details: ["time-to-memory", "future-recall", "payoff"],
      move: "time-to-memory",
    });
  }

  if (event.details.length >= 2) {
    const a = event.details[0]!;
    const b = event.details[1]!;
    drafts.push({
      text: `${raw}. ${a} looked incidental. ${b} gave the moment its shape. ${payoff(world.lens, s, b)}`,
      details: ["detail hierarchy", "revaluation", "payoff"],
      move: "detail-hierarchy",
    });
  }

  if (world.events.length > 1 && event.order > 0) {
    const prior = world.events[event.order - 1]!;
    const priorDetail = primary(prior) || clean(prior.raw);
    drafts.push({
      text: `${raw}. After ${priorDetail}, this detail landed differently. ${payoff(world.lens, s, p)}`,
      details: ["continuity", "state-change", "payoff"],
      move: "sequence-turn",
    });
  }

  if (world.events.length > 1 && event.order < world.events.length - 1) {
    const next = world.events[event.order + 1]!;
    const nextDetail = primary(next) || clean(next.raw);
    drafts.push({
      text: `${raw}. ${opening(world.lens, event, 2)} The next beat was ${nextDetail}. For now, this was the hinge.`,
      details: ["anticipation", "hinge", "forward-pull"],
      move: "hinge",
    });
  }

  if (world.events.length >= 3 && event.order === world.events.length - 1) {
    const first = world.events[0]!;
    const firstDetail = primary(first) || clean(first.raw);
    drafts.push({
      text: `${raw}. Earlier, ${firstDetail} seemed like the beginning. Now it reads like setup. ${payoff(world.lens, s, p)}`,
      details: ["callback", "reinterpretation", "payoff"],
      move: "final-callback",
    });
  }

  if (world.lens === "comedy" && p) {
    drafts.push({
      text: `${raw}. ${p} had apparently mistaken participation for authority. ${payoff(world.lens, s, p)}`,
      details: ["comic-personification", "incongruity", "payoff"],
      move: "comic-authority",
    });
  }

  if (world.lens === "horror" && p) {
    drafts.push({
      text: `${raw}. ${p} was not the frightening part. The fact that it still fit the scene was. ${payoff(world.lens, s, p)}`,
      details: ["horror-inversion", "ordinary-ominous", "payoff"],
      move: "ordinary-ominous",
    });
  }

  if (world.lens === "romance" && p) {
    drafts.push({
      text: `${raw}. Nobody had to name the feeling yet. ${p} was enough to give the memory somewhere to live. ${payoff(world.lens, s, p)}`,
      details: ["tender-understatement", "memory-container", "payoff"],
      move: "tender-container",
    });
  }

  return drafts.filter((draft, index, list) => index === list.findIndex((item) => lower(item.text) === lower(draft.text)));
}

export function generateCompositionCandidates(world: WorldModel): CreativeCandidate[] {
  const candidates: CreativeCandidate[] = [];
  for (const event of world.events) {
    for (const [index, draft] of compose(event, world).entries()) {
      const raw = lower(event.raw);
      const body = lower(draft.text);
      const anchors = unique([
        ...event.participants.filter((participant) => raw.includes(lower(participant))),
        event.object ?? "",
        event.place ?? "",
        event.time ?? "",
        ...event.details,
      ]);
      const coverage = anchors.length ? anchors.filter((anchor) => body.includes(lower(anchor))).length / anchors.length : 1;
      const novelty = Math.min(1, 0.68 + index * 0.018 + draft.details.length * 0.045);
      const attention = Math.min(1.55, 0.88 + draft.details.length * 0.13);
      const causalFit = event.order === 0 ? 0.95 : 0.9;
      const creativity = Math.min(10, 7.1 + draft.details.length * 0.48 + (draft.move.includes("callback") || draft.move.includes("meaning") ? 0.65 : 0));
      const score = 68 + coverage * 34 + novelty * 20 + attention * 10 + causalFit * 12 + creativity * 3;
      candidates.push({
        eventId: event.id,
        text: draft.text,
        lens: world.lens,
        creativity,
        evidenceCoverage: coverage,
        novelty,
        causalFit,
        attention,
        score,
        creativeDetails: [`composition:${draft.move}`, ...draft.details],
      });
    }
  }
  return candidates;
}
