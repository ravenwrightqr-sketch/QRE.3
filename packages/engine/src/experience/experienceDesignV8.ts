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
const DIRECTIVE = /^(?:please\s+)?(?:make|create|build|turn|transform|write|tell|give|generate|design|produce|show)\b/i;

function creativeFactText(text: string): boolean {
  const value = clean(text);
  if (!value || DIRECTIVE.test(value)) return false;
  return !/\b(?:for the client|for customers?|for viewers?|make it|make this|turn this|write it|create an?|give it)\b/i.test(value);
}

function rawSignalWords(movie: LatentMovieV5): string[] {
  const stop = new Set(["the", "and", "was", "were", "with", "that", "this", "then", "from", "into", "when", "she", "he", "they", "her", "his", "their", "came", "went", "arrived", "left", "today", "there", "here", "just", "very", "really", "again"]);
  return movie.facts.filter((fact) => creativeFactText(fact.text)).flatMap((fact) => normalize(fact.text).split(" ")).filter((word) => word.length >= 4 && !stop.has(word));
}

function trajectory(intent: ExperienceIntentV7, movie: LatentMovieV5): ExperienceTrajectoryV8 {
  const text = normalize(movie.facts.filter((fact) => creativeFactText(fact.text)).map((fact) => fact.text).join(" "));
  if (/\b(scared|nervous|afraid|anxious|happy|relaxed|calm|changed|transformed)\b/.test(text)) return "transformation";
  if (intent.purpose === "journey" || /\b(adventure|trip|travel|rave|festival)\b/.test(text)) return "adventure";
  if (intent.purpose === "memory" || intent.purpose === "personal") return "reflection";
  if (intent.tone.includes("funny")) return "escalation";
  return movie.facts.length >= 3 ? "reveal" : "warmth";
}

function voices(intent: ExperienceIntentV7, movie: LatentMovieV5): ExperienceVoiceV8[] {
  const text = normalize(movie.facts.filter((fact) => creativeFactText(fact.text)).map((fact) => fact.text).join(" "));
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
  const rawSignals = rawSignalWords(movie);
  const counts = new Map<string, number>();
  for (const signal of rawSignals) counts.set(signal, (counts.get(signal) ?? 0) + 1);
  const repeated = [...counts.entries()].filter(([, count]) => count >= 2).map(([signal]) => signal);
  const signals = unique(rawSignals);
  const factualTexts = movie.facts.map((fact) => fact.text).filter(creativeFactText);
  const normalizedFacts = factualTexts.map(normalize);
  const recurringMotifs = unique([
    ...movie.memoryThread.identitySignals,
    ...movie.memoryThread.continuationSignals,
    ...repeated,
  ]).filter(creativeFactText).slice(0, 8);
  const novelMotifs = unique(factualTexts.filter((fact, index) => index === normalizedFacts.findIndex((candidate) => candidate === normalize(fact)))).slice(0, 8);

  const t = trajectory(intent, movie);
  const voice = voices(intent, movie);
  const turningFacts = movie.facts.filter((fact) => /\b(stole|chewed|ate|found|discovered|revealed|unexpected|surprise|chaos|escaped|broke|caught|almost|nearly|suddenly)\b/i.test(fact.text));
  return {
    trajectory: t,
    voice,
    openingJob: t === "adventure" || t === "escalation" ? "intrigue" : "orient",
    middleJob: turningFacts.length ? "reframe" : t === "transformation" || t === "reflection" ? "deepen" : t === "reveal" ? "reframe" : "escalate",
    endingJob: intent.continuationEnabled || intent.memoryEnabled ? "invite_continuation" : t === "reflection" ? "linger" : "payoff",
    recurringMotifs,
    novelMotifs,
    phraseOpportunities: unique([
      ...recurringMotifs.slice(0, 4),
      ...signals.slice(0, 6),
      ...turningFacts.flatMap((fact) => normalize(fact.text).split(" ").filter((word) => word.length >= 4)).slice(0, 6),
      t,
      ...voice,
    ]).slice(0, 20),
    memoryWeight: intent.memoryEnabled ? 1 : 0.35,
    promotionWeight: intent.purpose === "service_receipt" || intent.purpose === "business" ? 0.7 : 0.15,
  };
}
