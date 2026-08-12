import type { CognitiveExperiencePlan, StoryBeat } from "@qre/contracts";
import { buildLatentMovie } from "./latentMovie.js";

const clean = (value: unknown): string => typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
const sentence = (value: string): string => clean(value).replace(/[.!?]+$/, "");
const cap = (value: string): string => { const s = sentence(value); return s ? s[0]!.toUpperCase() + s.slice(1) : ""; };
const DELIVERY = /\b(?:receipt|prompt|customer-facing|generated output|send|sending|share|sharing)\b/i;
const ABSTRACT = /\b(?:cognitive|compiler|premise|directive|semantic|realization|realizer|experience plan|story structure|interaction model|situation|experience|interaction|process|journey|meaning|progression|model|state|condition|possibility|potential|context|result|outcome|change|transformation|development|behavior|behaviour|reason to continue|new memories can change what later visitors discover)\b/i;

function usable(value: string): boolean { return Boolean(sentence(value)) && !DELIVERY.test(value) && !ABSTRACT.test(value); }
function subjectName(plan: CognitiveExperiencePlan | undefined, beat: StoryBeat): string { return buildLatentMovie(plan, [beat]).subject; }

function normalizeFact(raw: string, subject: string): string {
  let text = sentence(raw).replace(/^\s*(?:show|make|create|tell|write|give|send)\s+/i, "").replace(/^\s*(?:and|then)\s+/i, "");
  const escaped = subject.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&");
  text = text
    .replace(new RegExp(`^${escaped}\\s+arriving$`, "i"), `${subject} arrived`)
    .replace(new RegExp(`^${escaped}\\s+getting\\s+(.+)$`, "i"), `${subject} got $1`)
    .replace(new RegExp(`^${escaped}\\s+looking\\s+(.+)$`, "i"), `${subject} looked $1`)
    .replace(new RegExp(`^${escaped}\\s+being\\s+(.+)$`, "i"), `${subject} was $1`)
    .replace(/^getting\s+(.+)$/i, `${subject} got $1`)
    .replace(/^looking\s+(.+)$/i, `${subject} looked $1`)
    .replace(/^being\s+(.+)$/i, `${subject} was $1`);
  return cap(text);
}

function eventIndex(beat: StoryBeat, count: number): number {
  if (count <= 1) return 0;
  if (beat.kind === "orientation" || beat.kind === "origin") return 0;
  if (beat.kind === "payoff" || beat.kind === "continuation") return count - 1;
  if (beat.kind === "transformation") return Math.max(0, count - 1);
  return Math.min(count - 1, beat.order);
}

function removeLeadingSubject(value: string, subject: string): string {
  const escaped = subject.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&");
  return sentence(value).replace(new RegExp(`^${escaped}\\s*`, "i"), "").trim();
}

export function realizeObservedEventBeat(beat: StoryBeat, plan?: CognitiveExperiencePlan): string | undefined {
  const movie = buildLatentMovie(plan, [beat]);
  const events = movie.events.filter((event) => usable(event.fact));
  if (!events.length) return undefined;

  const subject = subjectName(plan, beat);
  const chosen = events[eventIndex(beat, events.length)] ?? events.at(-1)!;
  const fact = normalizeFact(chosen.fact, subject);
  const body = removeLeadingSubject(fact, subject);
  const first = normalizeFact(events[0]!.fact, subject);
  const last = normalizeFact(events.at(-1)!.fact, subject);
  const finalBody = removeLeadingSubject(last, subject);

  switch (beat.kind) {
    case "orientation":
    case "origin":
    case "hook":
    case "threshold": return fact;
    case "action":
    case "contribution": return body ? `From there, ${body.toLowerCase()}.` : fact;
    case "encounter": return body ? `Then came the part that mattered: ${body.toLowerCase()}.` : fact;
    case "challenge":
    case "discovery":
    case "reveal": return body ? `That brought ${body.toLowerCase()}.` : fact;
    case "escalation": return body ? `And it went further: ${body.toLowerCase()}.` : fact;
    case "feedback": return body ? `The difference showed up there: ${body.toLowerCase()}.` : `The difference showed up in ${fact.toLowerCase()}.`;
    case "reflection": return body ? `Looking back, ${body.toLowerCase()}.` : `Looking back, ${fact.toLowerCase()}.`;
    case "milestone": return body ? `That was the turning point: ${body.toLowerCase()}.` : `That was the turning point: ${fact.toLowerCase()}.`;
    case "transformation": {
      const firstBody = removeLeadingSubject(first, subject);
      if (events.length > 1 && firstBody && finalBody && firstBody.toLowerCase() !== finalBody.toLowerCase()) return `By the end, ${firstBody.toLowerCase()} had given way to ${finalBody.toLowerCase()}.`;
      return finalBody ? `By the end, ${finalBody.toLowerCase()}.` : last;
    }
    case "payoff": return finalBody ? `And that's where ${subject} left it: ${finalBody.toLowerCase()}.` : last;
    case "continuation": return movie.continuation ? cap(movie.continuation) : finalBody ? `The story keeps ${subject} there: ${finalBody.toLowerCase()}.` : last;
    default: return fact;
  }
}
