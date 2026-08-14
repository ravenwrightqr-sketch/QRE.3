import type { CognitiveLens, WorldEvent, WorldModel } from "./worldModel.js";

export type WriterMove =
  | "observer"
  | "trickster"
  | "poet"
  | "director"
  | "historian"
  | "comic"
  | "suspense"
  | "tender"
  | "reversal"
  | "understatement"
  | "detail-first"
  | "place-first"
  | "time-first"
  | "consequence-first"
  | "implication-first";

export type WriterDraft = {
  text: string;
  move: WriterMove;
  details: string[];
};

const clean = (value: string) => value.replace(/\s+/g, " ").trim().replace(/[.!?]+$/, "");
const lower = (value: string) => clean(value).toLowerCase();

function dominantObject(event: WorldEvent): string | undefined {
  return event.object || event.details.find((detail) => detail.length >= 3);
}
function contextualNoun(event: WorldEvent): string { return event.object || event.place || event.details[0] || "the detail"; }
function objectKernel(object: string | undefined): string | undefined {
  if (!object) return undefined;
  const v = lower(object);
  if (/\b(?:bow|ribbon|flower|dress|ring)\b/.test(v)) return "ornament";
  if (/\b(?:watch|clock|ticket|photo|photograph|letter|note|diary|journal)\b/.test(v)) return "memory-artifact";
  if (/\b(?:guitar|piano|drum|song|music|record)\b/.test(v)) return "voice";
  if (/\b(?:camera|phone|video|film)\b/.test(v)) return "witness";
  if (/\b(?:key|keychain|compass)\b/.test(v)) return "talisman";
  if (/\b(?:suitcase|bag|backpack)\b/.test(v)) return "traveler";
  if (/\b(?:door|window|hallway|stairs|bridge)\b/.test(v)) return "threshold";
  if (/\b(?:house|home|room|hotel|motel|restaurant|shop|salon|groomer)\b/.test(v)) return "stage";
  if (/\b(?:snow|rain|ocean|lake|sunrise|sunset|night|storm)\b/.test(v)) return "atmosphere";
  return undefined;
}
function movePool(lens: CognitiveLens, event: WorldEvent): WriterMove[] {
  if (lens === "comedy") return ["trickster", "comic", "reversal", "understatement", "detail-first"];
  if (lens === "horror") return ["suspense", "observer", "reversal", "understatement", "implication-first"];
  if (lens === "romance") return ["tender", "historian", "poet", "observer", "detail-first"];
  if (lens === "mysterious") return ["suspense", "observer", "reversal", "historian", "place-first"];
  if (lens === "wild") return ["trickster", "comic", "director", "reversal", "consequence-first"];
  if (event.details.length >= 2) return ["observer", "poet", "historian", "reversal", "detail-first"];
  return ["observer", "poet", "historian", "understatement", "implication-first"];
}

function entryVariants(event: WorldEvent, lens: CognitiveLens): WriterDraft[] {
  const raw = clean(event.raw);
  const object = dominantObject(event);
  const place = event.place;
  const time = event.time;
  const detail = event.details.find((value) => lower(value) !== lower(object ?? ""));
  const drafts: WriterDraft[] = [];
  const add = (text: string, move: WriterMove, ...details: string[]) => { const value = clean(text); if (value && lower(value) !== lower(raw)) drafts.push({ text: `${value}.`, move, details }); };

  if (object) add(`${object} was the first detail worth noticing`, "detail-first", "attention shift", "object-first entry");
  if (place) add(`${place} set the scene before anyone explained what the moment meant`, "place-first", "setting-first entry");
  if (time) add(`${time} looked ordinary on the clock; the sequence around it was less ordinary`, "time-first", "temporal contrast");
  if (detail) add(`${detail} looked incidental until the rest of the event gave it weight`, "detail-first", "detail revaluation");
  if (object && place) add(`At ${place}, ${object} became more than background detail`, "place-first", "contextual elevation");
  if (lens === "horror" && place) add(`The unsettling part was that ${place} still looked completely normal`, "implication-first", "ordinary-to-ominous");
  if (lens === "romance" && detail) add(`${detail} was small enough to overlook and exact enough to remember`, "detail-first", "romantic compression");
  if (lens === "comedy" && object) add(`${object} had somehow become the most overqualified part of the situation`, "trickster", "comic incongruity");
  return drafts;
}

function writerDrafts(event: WorldEvent, world: WorldModel, previous?: WorldEvent, next?: WorldEvent): WriterDraft[] {
  const raw = clean(event.raw);
  const noun = contextualNoun(event);
  const object = dominantObject(event);
  const kernel = objectKernel(object);
  const subject = event.participants.join(" and ") || event.place || object || "the moment";
  const moves = movePool(world.lens, event);
  const drafts: WriterDraft[] = [...entryVariants(event, world.lens)];
  const add = (text: string, move: WriterMove, ...details: string[]) => { const value = clean(text); if (value && lower(value) !== lower(raw)) drafts.push({ text: `${value}.`, move, details }); };

  if (kernel === "ornament") add(`${raw}. The ${noun} was technically an accessory; memory had clearly promoted it`, "poet", "object elevation", "specific association");
  if (kernel === "memory-artifact") add(`${raw}. The ${noun} had stopped being an object and started behaving like evidence`, "historian", "artifact-as-history", "memory framing");
  if (kernel === "voice") add(`${raw}. The ${noun} was doing what good witnesses do: saying more than the room did`, "poet", "object personification", "witness framing");
  if (kernel === "witness") add(`${raw}. The ${noun} did not merely record the moment; it quietly became part of it`, "observer", "witness inversion", "media significance");
  if (kernel === "talisman") add(`${raw}. The ${noun} looked practical until the story gave it a second job`, "historian", "symbolic elevation", "double function");
  if (kernel === "traveler") add(`${raw}. The ${noun} carried the geography; the people around it supplied the meaning`, "historian", "object journey", "human context");
  if (kernel === "threshold") add(`${raw}. A threshold is ordinary until something crosses it with a different story than it brought in`, "director", "threshold framing", "state transition");
  if (kernel === "stage") add(`${raw}. The ${noun} was only a setting until the details started assigning it a role`, "director", "setting-as-stage", "scene framing");
  if (kernel === "atmosphere") add(`${raw}. The atmosphere was not decoration; it changed the meaning of everything sitting inside it`, "poet", "atmosphere as meaning", "sensory framing");

  for (const move of moves) {
    switch (move) {
      case "observer": add(`${raw}. The interesting part was not that it happened, but which detail refused to disappear afterward`, move, "attention shift", "memorable detail"); break;
      case "trickster": add(`${raw}. The situation had quietly become more confident than anyone had authorized`, move, "comic incongruity", "personification"); break;
      case "poet": add(`${raw}. The smallest fact was carrying the largest shadow`, move, "compressed metaphor", "semantic compression"); break;
      case "director": add(`${raw}. Put the camera there: the scene was already telling on itself`, move, "cinematic attention", "visual direction"); break;
      case "historian": add(`${raw}. That detail changed the event from something that happened into something that could be remembered`, move, "memory conversion", "historical framing"); break;
      case "comic": add(`${raw}. Nobody had ordered the ridiculous version, but it had clearly arrived anyway`, move, "comic escalation", "surprise"); break;
      case "suspense": add(`${raw}. Everything made sense separately; together, the details were asking a different question`, move, "implication", "withheld explanation"); break;
      case "tender": add(`${raw}. It was small enough to miss and exact enough to become important later`, move, "emotional compression", "future-memory cue"); break;
      case "reversal": add(`${raw}. What looked like the point of the moment was only the setup for what it meant`, move, "reversal", "reinterpretation"); break;
      case "understatement": add(`${raw}. No fireworks required. The detail had already done its job`, move, "understatement", "restraint"); break;
      case "detail-first": if (object) add(`${object} was the part that refused to behave like background`, move, "detail elevation"); break;
      case "implication-first": if (detail) add(`${detail} was enough to make the rest of the facts read differently`, move, "implication-first"); break;
      case "consequence-first": if (previous) add(`After that, ${noun} carried more consequence than it had a moment earlier`, move, "consequence-first"); break;
      case "place-first": if (event.place) add(`${event.place} did not change, but the meaning of the scene did`, move, "place-first"); break;
      case "time-first": if (event.time) add(`${event.time} was only a timestamp until the surrounding details gave it a memory`, move, "time-first"); break;
    }
  }

  if (previous && next) add(`${raw}. It sat between what had already happened and what had not happened yet; that is usually where a story starts to lean`, "director", "structural tension", "between-beats framing");
  if (previous && lower(previous.raw) !== lower(raw)) add(`${raw}. After ${clean(previous.raw)}, this detail changed the temperature of the sequence`, "reversal", "causal turn", "sequence temperature");
  if (next && lower(next.raw) !== lower(raw)) add(`${raw}. And the next event had not happened yet, which made this the perfect place to notice it`, "suspense", "anticipatory framing", "forward pull");

  return drafts.filter((draft, index, list) => index === list.findIndex((other) => lower(other.text) === lower(draft.text)));
}

export function generateWriterDrafts(world: WorldModel, event: WorldEvent, previous?: WorldEvent, next?: WorldEvent): WriterDraft[] {
  return writerDrafts(event, world, previous, next);
}
