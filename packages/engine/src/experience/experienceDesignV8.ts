import type { LatentMovieV5 } from "./latentMovieExtractorV5.js";
import type { ExperienceIntentV7 } from "./experienceIntentV7.js";

export type ExperienceTrajectoryV8 = "reveal" | "escalation" | "transformation" | "warmth" | "adventure" | "reflection";
export type ExperienceVoiceV8 = "playful" | "cinematic" | "warm" | "dramatic" | "mischievous" | "aspirational" | "matter_of_fact";

export type ExperienceDesignV8 = {
  trajectory: ExperienceTrajectoryV8;
  voice: ExperienceVoiceV8[];
  openingJob: "orient" | "intrigue" | "announce";
  middleJob: "escalate" | "reframe" | "deepen" | "connect";
  endingJob: "payoff" | "linger" | "invite_continuation" | "close";
  recurringMotifs: string[];
  novelMotifs: string[];
  phraseOpportunities: string[];
  memoryWeight: number;
  promotionWeight: number;
};

const clean = (value: string) => value.replace(/\s+/g, " ").trim();
const normalize = (value: string) => clean(value).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const unique = (values: string[]) => [...new Set(values.map(clean).filter(Boolean))];

function signalWords(movie: LatentMovieV5): string[] {
  const stop = new Set(["the", "and", "was", "were", "with", "that", "this", "then", "from", "into", "when", "she", "he", "they", "her", "his", "their", "came", "went", "arrived", "left", "today", "there", "here", "just", "very", "really", "again"]);
  return unique(movie.facts.flatMap((fact) => normalize(fact.text).split(" ")).filter((word) => word.length >= 4 && !stop.has(word)));
}

function trajectory(intent: ExperienceIntentV7, movie: LatentMovieV5): ExperienceTrajectoryV8 {
  const text = normalize(movie.facts.map((fact) => fact.text).join(" "));
  if (/\b(scared|nervous|afraid|anxious|happy|relaxed|calm|changed|transformed)\b/.test(text)) return "transformation";
  if (intent.purpose === "journey" || /\b(adventure|trip|travel|rave|festival)\b/.test(text)) return "adventure";
  if (intent.purpose === "memory" || intent.purpose === "personal") return "reflection";
  if (intent.tone.includes("funny")) return "escalation";
  return movie.facts.length >= 3 ? "reveal" : "warmth";
}

function voices(intent: ExperienceIntentV7, movie: LatentMovieV5): ExperienceVoiceV8[] {
  const text = normalize(movie.facts.map((fact) => fact.text).join(" "));
  const result: ExperienceVoiceV8[] = [];
  if (intent.tone.includes("funny")) result.push("playful", "mischievous");
  if (intent.tone.includes("warm")) result.push("warm");
  if (intent.tone.includes("dark") || intent.tone.includes("mysterious")) result.push("dramatic");
  if (intent.purpose === "personal") result.push("aspirational");
  if (/\b(dog|pomeranian|puppy|groom|bow)\b/.test(text)) result.push("mischievous");
  if (!result.length) result.push("cinematic");
  return unique(result) as ExperienceVoiceV8[];
}

export function designExperienceV8(intent: ExperienceIntentV7, movie: LatentMovieV5): ExperienceDesignV8 {
  const signals = signalWords(movie);
  const repeated = signals.filter((signal, index) => signals.indexOf(signal) !== index);
  const facts = movie.facts.map((fact) => normalize(fact.text));
  const recurringMotifs = unique([
    ...movie.memoryThread.identitySignals,
    ...movie.memoryThread.continuationSignals,
    ...repeated,
  ]).slice(0, 8);
  const novelMotifs = unique(movie.facts.map((fact) => fact.text).filter((fact, index) => index === facts.findIndex((candidate) => candidate === normalize(fact)))).slice(0, 8);

  const t = trajectory(intent, movie);
  return {
    trajectory: t,
    voice: voices(intent, movie),
    openingJob: t === "adventure" || t === "escalation" ? "intrigue" : "orient",
    middleJob: t === "transformation" || t === "reflection" ? "deepen" : t === "reveal" ? "reframe" : "escalate",
    endingJob: intent.continuationEnabled || intent.memoryEnabled ? "invite_continuation" : t === "reflection" ? "linger" : "payoff",
    recurringMotifs,
    novelMotifs,
    phraseOpportunities: unique([
      ...recurringMotifs.slice(0, 4),
      ...signals.slice(0, 6),
      t,
      ...voices(intent, movie),
    ]).slice(0, 16),
    memoryWeight: intent.memoryEnabled ? 1 : 0.35,
    promotionWeight: intent.purpose === "service_receipt" || intent.purpose === "business" ? 0.7 : 0.15,
  };
}
