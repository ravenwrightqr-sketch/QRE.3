import type { LatentMovieV5 } from "./latentMovieExtractorV5.js";
import type { ExperienceDesignV8 } from "./experienceDesignV8.js";

export type CreativeOpportunityKindV9 = "contrast" | "agency" | "transformation" | "recurrence" | "specificity" | "absurdity" | "promotion";

export type CreativeOpportunityV9 = {
  kind: CreativeOpportunityKindV9;
  score: number;
  evidence: string[];
  ingredients: string[];
};

export type CreativeOpportunitySetV9 = {
  opportunities: CreativeOpportunityV9[];
  dominant: CreativeOpportunityKindV9;
};

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const clean = (value: string) => value.replace(/\s+/g, " ").trim();
const unique = (values: string[]) => [...new Set(values.map(clean).filter(Boolean))];

function allText(movie: LatentMovieV5): string {
  return normalize(movie.facts.map((fact) => fact.text).join(" "));
}

function evidence(movie: LatentMovieV5, pattern: RegExp): string[] {
  return movie.facts.filter((fact) => pattern.test(fact.text)).map((fact) => fact.text);
}

function ingredients(movie: LatentMovieV5, pattern: RegExp): string[] {
  return unique(movie.facts.filter((fact) => pattern.test(fact.text)).flatMap((fact) => normalize(fact.text).split(" ")).filter((word) => word.length >= 4));
}

export function detectCreativeOpportunitiesV9(movie: LatentMovieV5, design: ExperienceDesignV8): CreativeOpportunitySetV9 {
  const text = allText(movie);
  const opportunities: CreativeOpportunityV9[] = [];
  const turning = evidence(movie, /\b(stole|chewed|ate|found|discovered|escaped|broke|caught|almost|nearly|surprise|unexpected|chaos)\b/i);
  if (turning.length) opportunities.push({ kind: "contrast", score: Math.min(1, 0.55 + turning.length * 0.12), evidence: turning, ingredients: ingredients(movie, /\b(stole|chewed|ate|found|discovered|escaped|broke|caught|almost|nearly)\b/i) });
  const agency = evidence(movie, /\b(stole|chewed|ate|chose|decided|refused|escaped|hid|watched|grabbed|destroyed|picked)\b/i);
  if (agency.length) opportunities.push({ kind: "agency", score: Math.min(1, 0.6 + agency.length * 0.1), evidence: agency, ingredients: ingredients(movie, /\b(stole|chewed|ate|chose|decided|refused|escaped|hid|watched|grabbed|destroyed|picked)\b/i) });
  const transformation = evidence(movie, /\b(scared|nervous|afraid|anxious|happy|relaxed|calm|changed|transformed|finished|left|became)\b/i);
  if (transformation.length >= 2 || design.trajectory === "transformation") opportunities.push({ kind: "transformation", score: Math.min(1, 0.58 + transformation.length * 0.1), evidence: transformation, ingredients: ingredients(movie, /\b(scared|nervous|afraid|anxious|happy|relaxed|calm|changed|transformed|finished|left|became)\b/i) });
  const recurring = design.recurringMotifs.filter((motif) => motif.length >= 4);
  if (recurring.length) opportunities.push({ kind: "recurrence", score: Math.min(1, 0.45 + recurring.length * 0.08), evidence: recurring, ingredients: recurring });
  const specific = movie.facts.filter((fact) => fact.places.length || fact.times.length || fact.dates.length);
  if (specific.length) opportunities.push({ kind: "specificity", score: Math.min(1, 0.5 + specific.length * 0.1), evidence: specific.map((fact) => fact.text), ingredients: unique(specific.flatMap((fact) => [...fact.places, ...fact.times, ...fact.dates])) });
  if (design.voice.includes("playful") || design.voice.includes("mischievous") || /\b(funny|absurd|ridiculous|wild|chaos)\b/.test(text)) opportunities.push({ kind: "absurdity", score: 0.68, evidence: [movie.subject, ...design.voice], ingredients: unique([movie.subject, ...design.phraseOpportunities]) });
  if (design.promotionWeight > 0) opportunities.push({ kind: "promotion", score: design.promotionWeight, evidence: [movie.subject, ...design.novelMotifs.slice(0, 3)], ingredients: unique([movie.subject, ...design.novelMotifs.slice(0, 4)]) });
  opportunities.sort((a, b) => b.score - a.score);
  return { opportunities, dominant: opportunities[0]?.kind ?? "specificity" };
}
