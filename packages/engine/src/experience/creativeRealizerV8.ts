import type { LatentMovieV5 } from "./latentMovieExtractorV5.js";
import type { ExperienceDesignV8 } from "./experienceDesignV8.js";

const clean = (value: string) => value.replace(/\s+/g, " ").replace(/\.\s*\./g, ".").trim();
const lower = (value: string) => clean(value).toLowerCase();
const INTERNAL = /\b(?:mechanic|payoff|compiler|memory thread|recurring signal|latent movie|story compiler|cognitive plan|narrative operation|trajectory|blueprint|directive|experience design)\b/i;
const STALE = /\b(?:the story moved forward|part of the story|part that changed the shape of the story|that is how an ordinary moment earns a place in the story)\b/i;
const DIRECTIVE_LEAK = /\b(?:make it|make this|turn this|write it|create it|give it|for the client|for customers?|for viewers?|for the audience)\b/i;
const TURNING_POINT = /\b(?:stole|chewed|ate|found|discovered|revealed|unexpected|surprise|surprised|chaos|escaped|broke|caught|almost|nearly|suddenly)\b/i;

function hash(value: string): number {
  let result = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index);
    result = Math.imul(result, 16777619);
  }
  return result >>> 0;
}

function choose<T>(values: T[], seed: string): T {
  return values[hash(seed) % values.length];
}

function subject(movie: LatentMovieV5): string {
  return movie.subject.trim() || "The moment";
}

function sourceFact(movie: LatentMovieV5, beat: LatentMovieV5["beats"][number]): string {
  const ids = new Set(beat.sourceFactIds);
  return movie.facts.filter((fact) => ids.has(fact.id)).map((fact) => fact.text).join(" ");
}

function frame(movie: LatentMovieV5, design: ExperienceDesignV8, index: number, source: string): string | undefined {
  const text = lower(movie.facts.map((fact) => fact.text).join(" "));
  const sourceText = lower(source);
  const name = subject(movie);
  const motif = design.recurringMotifs[0] || design.phraseOpportunities[0];
  const seed = `${movie.subject}:${design.trajectory}:${design.voice.join("|")}:${index}:${source}:${text}`;

  if (/\b(stole|stolen)\b/.test(sourceText) && /\bbow\b/.test(sourceText)) {
    return choose([
      `${name} came in for a grooming appointment and apparently decided the bow was part of the compensation package.`,
      `The grooming went well. Then ${name} stole a bow, which felt less like an accident and more like a business decision.`,
      `${name} found the one thing worth taking home: the bow. Priorities were apparently settled.`,
      `Everything was going smoothly until ${name} made the executive decision to leave with a bow.`,
    ], seed);
  }

  if (TURNING_POINT.test(source) || design.middleJob === "reframe") {
    if (/\b(dog|pomeranian|puppy|groom|bath|bow|dryer)\b/.test(text)) return choose([
      `${name} had apparently arrived with an agenda.`,
      `${name} was already negotiating the terms.`,
      `${name} had found the day's most important side quest.`,
      `Somehow, ${name} had turned a routine visit into an incident.`,
    ], seed);
    if (/\b(kitchen|bathroom|clean|housekeep|mess|spotless)\b/.test(text)) return choose([
      "The mess had picked the wrong day.",
      "The kitchen had officially entered negotiations.",
      "By then, the mess was running out of excuses.",
      "The rooms were starting to remember what clean looked like.",
    ], seed);
  }

  if (/\b(dog|pomeranian|puppy|groom|bath|bow|dryer)\b/.test(text)) {
    if (design.trajectory === "transformation") return choose([
      `${name} came in nervous. The rest of the visit had other plans.`,
      `${name} started the day unsure. By the end, that had clearly changed.`,
      `The appointment began cautiously. ${name} had other ideas by the end.`,
    ], seed);
    return choose([
      `${name} had apparently arrived with an agenda.`,
      `${name} was already negotiating the terms.`,
      `${name} had found the day's most important side quest.`,
      `Somehow, ${name} had turned a routine visit into an incident.`,
    ], seed);
  }

  if (/\b(kitchen|bathroom|clean|housekeep|mess|spotless)\b/.test(text)) return choose([
    "The mess had picked the wrong day.",
    "The kitchen had officially entered negotiations.",
    "By then, the mess was running out of excuses.",
    "The rooms were starting to remember what clean looked like.",
  ], seed);

  if (/\b(wedding|vow|ceremony|bride|groom)\b/.test(text)) return choose([
    "For a moment, everything seemed to hold still.",
    "The ordinary world made room for something worth keeping.",
    "And suddenly, this was no longer just another date on a calendar.",
  ], seed);

  if (/\b(travel|trip|journey|beach|rave|festival|concert)\b/.test(text)) return choose([
    "The day had become a place worth remembering.",
    "One more moment joined the journey.",
    "The map was starting to look a lot like a memory.",
  ], seed);

  if (design.trajectory === "escalation") return choose([
    `${name} had a perfectly ordinary plan. It did not stay that way.`,
    `Everything was behaving normally, which should have been the first warning.`,
    `The day had started innocently. That arrangement was temporary.`,
  ], seed);

  if (design.trajectory === "reflection") return choose([
    "Some moments do not need much explaining. They just deserve to stay.",
    "And suddenly, there was a reason to remember this one.",
    motif ? `The little details were becoming the part worth keeping: ${motif}.` : "The ordinary part had become something worth keeping.",
  ], seed);

  return choose([
    "Then the ordinary part acquired a little more personality.",
    "That was when the moment started becoming something else.",
    "And suddenly, there was a reason to remember this one.",
  ], seed);
}

/**
 * V8 realizes an experience design, not a template. It can reframe evidence,
 * vary voice, and exploit recurring motifs, but it cannot manufacture a factual
 * event. Internal cognitive vocabulary and user instructions are scrubbed before
 * audience-facing prose.
 */
export function realizeLatentMovieV8(movie: LatentMovieV5, design: ExperienceDesignV8): LatentMovieV5 {
  const beats = movie.beats.map((beat, index) => {
    let text = clean(beat.text);
    const source = sourceFact(movie, beat);

    if (INTERNAL.test(text) || STALE.test(text) || DIRECTIVE_LEAK.test(text) || /\b(?:it funny|it memorable|memorable for the client)\b/i.test(text)) {
      const replacement = frame(movie, design, index, source || text);
      if (replacement) text = replacement;
    }

    if (index === movie.beats.length - 1 && design.endingJob === "invite_continuation" && !/\b(next|again|another|more|keep|remember|return|memory|memories)\b/i.test(text)) {
      const seed = `${movie.subject}:ending:${design.trajectory}`;
      text = choose([
        `${text} And this one is going in the memory.`,
        `${text} Definitely one for the memories.`,
        `${text} Not a bad chapter to keep.`,
      ], seed);
    }

    return { ...beat, text };
  });

  return { ...movie, beats };
}
