import type { LatentMovieV5 } from "./latentMovieExtractorV5.js";
import type { ExperienceDesignV8 } from "./experienceDesignV8.js";
import type { CreativeOpportunitySetV9 } from "./creativeOpportunityV9.js";

export type PhraseInventionV9 = {
  text: string;
  operation: "contrast" | "agency" | "transformation" | "metaphor" | "promotion";
  confidence: number;
  seed: string;
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

function domain(movie: LatentMovieV5): "grooming" | "housekeeping" | "generic" {
  const text = evidence(movie);
  if (/\b(?:groom|groomer|grooming|bath|bow|pomeranian|dog)\b/i.test(text)) return "grooming";
  if (/\b(?:housekeep|clean|cleaned|kitchen|bathroom|spotless|mess|tidy)\b/i.test(text)) return "housekeeping";
  return "generic";
}

/** V9 composes a realization from a cognitive operation and current evidence. */
export function inventPhraseV9(movie: LatentMovieV5, design: ExperienceDesignV8, opportunities: CreativeOpportunitySetV9, index: number): PhraseInventionV9 {
  const subject = movie.subject.trim() || "The moment";
  const kind = domain(movie);
  const seed = `${subject}|${kind}|${design.trajectory}|${design.voice.join("|")}|${opportunities.dominant}|${index}|${evidence(movie)}`;
  const dominant = opportunities.dominant;

  if (kind === "housekeeping") {
    if (dominant === "agency" || dominant === "contrast" || dominant === "absurdity") return {
      operation: "metaphor",
      confidence: 0.88,
      seed,
      text: choose([
        `The kitchen had officially entered negotiations.`,
        `The mess had picked the wrong day.`,
        `The house was beginning to realize it had underestimated ${subject}.`,
        `The kitchen and bathrooms were no longer running the meeting.`,
      ], seed),
    };
    if (dominant === "transformation") return {
      operation: "transformation",
      confidence: 0.86,
      seed,
      text: choose([
        `By the end, the house looked like it had gotten its act together.`,
        `Somewhere between the kitchen and the bathrooms, the whole place changed sides.`,
        `The mess arrived with a plan. ${subject} had a better one.`,
      ], seed),
    };
  }

  if (kind === "grooming") {
    if (dominant === "agency" || dominant === "absurdity") return {
      operation: "agency",
      confidence: 0.9,
      seed,
      text: choose([
        `${subject} apparently had a different plan for the appointment.`,
        `${subject} made one executive decision and changed the shape of the visit.`,
        `The grooming had a schedule. ${subject} had amendments.`,
        `${subject} treated the appointment less like a service and more like a mission.`
      ], seed),
    };
  }

  if (dominant === "agency" || dominant === "contrast") return {
    operation: "agency",
    confidence: 0.88,
    seed,
    text: choose([
      `${subject} apparently had a different plan for the day.`,
      `${subject} made one executive decision and changed the shape of the visit.`,
      `${subject} saw an ordinary appointment and found a way to make it personal.`,
      `The plan was ordinary. ${subject} was not especially interested in keeping it that way.`,
    ], seed),
  };

  if (dominant === "transformation") return {
    operation: "transformation",
    confidence: 0.86,
    seed,
    text: choose([
      `${subject} did not leave quite the way ${subject} arrived.`,
      `Somewhere between the beginning and the end, ${subject} found a different version of the day.`,
      `The appointment started one way and quietly became something else.`,
    ], seed),
  };

  if (dominant === "absurdity") return {
    operation: "metaphor",
    confidence: 0.8,
    seed,
    text: choose([
      `${subject} had apparently promoted the visit to a side quest.`,
      `The day had a plan. ${subject} had apparently filed an amendment.`,
      `Normal was invited. ${subject} declined.`,
      `${subject} turned one small moment into the kind of detail people remember.`,
    ], `${seed}:absurdity`),
  };

  if (dominant === "promotion") return {
    operation: "promotion",
    confidence: 0.74,
    seed,
    text: choose([
      `${subject} left with a reason to come back for the next chapter.`,
      `Another visit, another little moment worth keeping.`,
      `The service ended. The memory did not have to.`,
    ], seed),
  };

  return {
    operation: "contrast",
    confidence: 0.7,
    seed,
    text: choose([
      `The ordinary part of the day had found an unexpected detail.`,
      `One small detail was enough to give the moment a personality of its own.`,
      `And there it was: the detail that made this one different.`,
    ], seed),
  };
}
