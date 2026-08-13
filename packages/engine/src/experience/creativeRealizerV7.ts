import type { LatentMovieV5 } from "./latentMovieExtractorV5.js";

const clean = (value: string) => value.replace(/\s+/g, " ").trim();
const lower = (value: string) => clean(value).toLowerCase();

const INTERNAL = /\b(?:mechanic|payoff|compiler|memory thread|recurring signal|latent movie|story compiler|cognitive plan|narrative operation|trajectory|blueprint|directive)\b/i;
const STALE = /\b(?:the story moved forward|part of the story|part that changed the shape of the story|that is how an ordinary moment earns a place in the story)\b/i;

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

function freshFrame(movie: LatentMovieV5, beatIndex: number): string | undefined {
  const text = lower(movie.facts.map((fact) => fact.text).join(" "));
  const name = subject(movie);
  const seed = `${movie.subject}:${beatIndex}:${text}`;

  if (/\b(kitchen|bathroom|clean|housekeep|mess|spotless)\b/.test(text)) {
    return choose([
      "The mess had picked the wrong day.",
      "The kitchen had officially entered negotiations.",
      "By then, the mess was running out of excuses.",
      "The rooms were starting to remember what clean looked like.",
    ], seed);
  }

  if (/\b(dog|pomeranian|puppy|groom|bath|bow|dryer)\b/.test(text)) {
    return choose([
      `${name} had apparently arrived with an agenda.`,
      `${name} was already negotiating the terms.`,
      `${name} had found the day's most important side quest.`,
      `Somehow, ${name} had turned a routine visit into an incident.`,
    ], seed);
  }

  if (/\b(wedding|vow|ceremony|bride|groom)\b/.test(text)) {
    return choose([
      "For a moment, everything seemed to hold still.",
      "The ordinary world made room for something worth keeping.",
      "And suddenly, this was no longer just another date on a calendar.",
    ], seed);
  }

  if (/\b(travel|trip|journey|beach|rave|festival|concert)\b/.test(text)) {
    return choose([
      "The day had become a place worth remembering.",
      "One more moment joined the journey.",
      "The map was starting to look a lot like a memory.",
    ], seed);
  }

  return choose([
    "Then the ordinary part acquired a little more personality.",
    "That was when the moment started becoming something else.",
    "And suddenly, there was a reason to remember this one.",
  ], seed);
}

/**
 * Creative realization is downstream of facts and intent.
 * It may reframe significance, but it can never invent a factual event.
 * It also scrubs internal compiler language before prose reaches the user.
 */
export function realizeLatentMovieV7(movie: LatentMovieV5): LatentMovieV5 {
  const beats = movie.beats.map((beat, index) => {
    let text = clean(beat.text);

    // V5 historically leaked a service-specific name into generic service prose.
    // The entity itself is authoritative; never import another person's name.
    text = text.replace(/\bMaria\b/g, subject(movie));

    if (INTERNAL.test(text) || STALE.test(text)) {
      const replacement = freshFrame(movie, index);
      if (replacement) text = replacement;
    }

    // Mechanical punctuation duplication came from concatenating fact + frame.
    text = text.replace(/\.\s*\./g, ".");

    return { ...beat, text };
  });

  return { ...movie, beats };
}
