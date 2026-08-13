import type { LatentMovieV5 } from "./latentMovieExtractorV5.js";
import type { ExperienceDesignV8 } from "./experienceDesignV8.js";
import type { CreativeOpportunitySetV9 } from "./creativeOpportunityV9.js";

export type PhraseInventionV10 = {
  text: string;
  operation: "contrast" | "agency" | "transformation" | "metaphor" | "promotion";
  confidence: number;
  seed: string;
  anchors: string[];
  noveltyScore: number;
  learningSignals: string[];
};

function hash(value: string): number {
  let result = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index);
    result = Math.imul(result, 16777619);
  }
  return result >>> 0;
}

function choose(values: string[], seed: string): string {
  return values[hash(seed) % values.length];
}

function evidence(movie: LatentMovieV5): string {
  return movie.facts.map((fact) => fact.text).join(" ");
}

function facts(movie: LatentMovieV5): string[] {
  return movie.facts.map((fact) => fact.text);
}

function has(text: string, pattern: RegExp): boolean {
  return pattern.test(text);
}

function domain(movie: LatentMovieV5): "grooming" | "housekeeping" | "generic" {
  const text = evidence(movie);
  if (/\b(?:groom|groomer|grooming|bath|bow|pomeranian|dog|towel|fur)\b/i.test(text)) return "grooming";
  if (/\b(?:housekeep|clean|cleaned|kitchen|bathroom|spotless|mess|tidy|house|room)\b/i.test(text)) return "housekeeping";
  return "generic";
}

function anchorsFor(movie: LatentMovieV5): string[] {
  const text = evidence(movie);
  const candidates = [
    "kitchen", "bathrooms", "bath", "bow", "towel", "fur", "spotless", "mess",
    "scared", "sleepy", "happy", "relaxed", "stole", "cleaned", "mission", "appointment",
  ];
  return candidates.filter((candidate) => new RegExp(`\\b${candidate}\\b`, "i").test(text));
}

function signal(operation: PhraseInventionV10["operation"], anchorList: string[], kind: string): string[] {
  return [
    `domain:${kind}`,
    `operation:${operation}`,
    ...anchorList.slice(0, 4).map((anchor) => `anchor:${anchor}`),
  ];
}

/** V10 turns evidence into specific, domain-aware creative language instead of generic narrative filler. */
export function inventPhraseV10(
  movie: LatentMovieV5,
  design: ExperienceDesignV8,
  opportunities: CreativeOpportunitySetV9,
  index: number,
): PhraseInventionV10 {
  const subject = movie.subject.trim() || "The moment";
  const text = evidence(movie);
  const kind = domain(movie);
  const anchorList = anchorsFor(movie);
  const anchor = anchorList[0] ?? "day";
  const seed = `${subject}|${kind}|${design.trajectory}|${design.voice.join("|")}|${opportunities.dominant}|${index}|${text}`;
  const dominant = opportunities.dominant;

  if (kind === "grooming") {
    if (has(text, /stole a bow|bow/i)) {
      const phrase = choose([
        `${subject} arrived for a grooming appointment and apparently left with a side quest: the bow.` ,
        `The bath was professional. The bow theft was apparently personal.` ,
        `Somewhere between the bath and the bow, ${subject} stopped treating this like a normal appointment.` ,
      ], seed);
      return { text: phrase, operation: "agency", confidence: 0.94, seed, anchors: ["bath", "bow"].filter((item) => anchorList.includes(item)), noveltyScore: 0.93, learningSignals: signal("agency", anchorList, kind) };
    }
    if (has(text, /scared/i) && has(text, /happy|relaxed/i)) {
      const phrase = choose([
        `${subject} came in looking like this was a terrible idea and left looking like it had been theirs all along.` ,
        `The appointment started with nerves and ended with ${subject} looking entirely too pleased with the arrangement.` ,
      ], seed);
      return { text: phrase, operation: "transformation", confidence: 0.92, seed, anchors: ["scared", "happy"].filter((item) => anchorList.includes(item)), noveltyScore: 0.91, learningSignals: signal("transformation", anchorList, kind) };
    }
    if (dominant === "agency" || dominant === "absurdity") {
      const phrase = choose([
        `${subject} had apparently reviewed the appointment and submitted amendments.` ,
        `The grooming had a schedule. ${subject} had other ideas.` ,
        `${subject} treated the appointment less like a service and more like a mission.` ,
      ], seed);
      return { text: phrase, operation: "agency", confidence: 0.89, seed, anchors: anchorList, noveltyScore: 0.86, learningSignals: signal("agency", anchorList, kind) };
    }
  }

  if (kind === "housekeeping") {
    if (has(text, /kitchen/i) && has(text, /bathroom/i)) {
      const phrase = choose([
        `The kitchen had gone to battle. ${subject} came prepared.` ,
        `The kitchen and bathrooms had formed an alliance. ${subject} broke it up.` ,
        `By the time ${subject} was finished, the kitchen had lost the argument and the bathrooms had nothing left to say.` ,
      ], seed);
      return { text: phrase, operation: "metaphor", confidence: 0.95, seed, anchors: ["kitchen", "bathrooms"], noveltyScore: 0.95, learningSignals: signal("metaphor", anchorList, kind) };
    }
    if (has(text, /spotless|cleaned/i)) {
      const phrase = choose([
        `The mess had a plan. ${subject} had a mop and considerably better ideas.` ,
        `By the end, the house looked like it had finally remembered who was in charge.` ,
        `The ordinary part of the day ended with the place looking suspiciously proud of itself.` ,
      ], seed);
      return { text: phrase, operation: "transformation", confidence: 0.91, seed, anchors: anchorList, noveltyScore: 0.9, learningSignals: signal("transformation", anchorList, kind) };
    }
    if (dominant === "agency" || dominant === "absurdity" || dominant === "contrast") {
      const phrase = choose([
        `The mess had picked the wrong day.` ,
        `The house was beginning to realize it had underestimated ${subject}.` ,
        `The room looked ready to negotiate. ${subject} declined.` ,
      ], seed);
      return { text: phrase, operation: "metaphor", confidence: 0.9, seed, anchors: anchorList, noveltyScore: 0.88, learningSignals: signal("metaphor", anchorList, kind) };
    }
  }

  if (dominant === "agency" || dominant === "contrast") {
    const phrase = choose([
      `${subject} apparently had a different plan for the day.` ,
      `${subject} made one executive decision and changed the shape of the visit.` ,
      `The plan was ordinary. ${subject} was not especially interested in keeping it that way.` ,
    ], seed);
    return { text: phrase, operation: "agency", confidence: 0.87, seed, anchors: anchorList, noveltyScore: 0.82, learningSignals: signal("agency", anchorList, kind) };
  }

  const phrase = choose([
    `The ordinary part of the day had found an unexpected detail.` ,
    `One small detail was enough to give the moment a personality of its own.` ,
    `And there it was: the detail that made this one different.` ,
  ], `${seed}:${anchor}`);
  return { text: phrase, operation: "contrast", confidence: 0.78, seed, anchors: anchorList, noveltyScore: 0.76, learningSignals: signal("contrast", anchorList, kind) };
}

export function extractCreativeLearningV10(movie: LatentMovieV5, inventions: PhraseInventionV10[]): {
  domain: "grooming" | "housekeeping" | "generic";
  recurringAnchors: string[];
  phrasePatterns: string[];
  preferredOperations: string[];
} {
  const anchorList = anchorsFor(movie);
  const patterns = inventions.map((item) => item.learningSignals.find((value) => value.startsWith("operation:")) ?? "operation:unknown");
  const preferredOperations = [...new Set(patterns)];
  return {
    domain: domain(movie),
    recurringAnchors: anchorList,
    phrasePatterns: [...new Set(inventions.flatMap((item) => item.learningSignals.filter((value) => value.startsWith("anchor:"))))],
    preferredOperations,
  };
}
