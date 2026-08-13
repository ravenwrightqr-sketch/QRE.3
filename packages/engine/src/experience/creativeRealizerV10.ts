import type { ExperienceDesignV8 } from "./experienceDesignV8.js";
import type { LatentMovieV5 } from "./latentMovieExtractorV5.js";
import { detectCreativeOpportunitiesV9, type CreativeOpportunitySetV9 } from "./creativeOpportunityV9.js";
import { extractCreativeLearningV10, inventPhraseV10, type PhraseInventionV10 } from "./phraseInventorV10.js";

const INTERNAL = /\b(?:mechanic|payoff|compiler|memory thread|recurring signal|latent movie|story compiler|cognitive plan|narrative operation|trajectory|blueprint|directive|experience design)\b/i;
const DIRECTIVE = /\b(?:make it|make this|turn this|write it|create it|give it|for the client|for customers?|for viewers?|for the audience)\b/i;
const STALE = /\b(?:the story moved forward|part of the story|part that changed the shape of the story|that is how an ordinary moment earns a place in the story|the ordinary part of the day had found an unexpected detail)\b/i;

export type RealizedMovieV10 = {
  movie: LatentMovieV5;
  opportunities: CreativeOpportunitySetV9;
  inventions: PhraseInventionV10[];
  learning: ReturnType<typeof extractCreativeLearningV10>;
};

function clean(value: string): string {
  return value.replace(/\s+/g, " ").replace(/\.\s*\./g, ".").trim();
}

/** V10 prefers evidence-specific inventions and records what vocabulary made them possible. */
export function realizeLatentMovieV10(movie: LatentMovieV5, design: ExperienceDesignV8): RealizedMovieV10 {
  const opportunities = detectCreativeOpportunitiesV9(movie, design);
  const inventions: PhraseInventionV10[] = [];
  const used = new Set<string>();
  const beats = movie.beats.map((beat, index) => {
    let text = clean(beat.text);
    const highOpportunity = opportunities.opportunities.some((opportunity) => opportunity.score >= 0.72);
    const shouldInvent = index > 0 && (INTERNAL.test(text) || STALE.test(text) || DIRECTIVE.test(text) || highOpportunity);
    if (shouldInvent) {
      const invention = inventPhraseV10(movie, design, opportunities, index);
      const key = clean(invention.text).toLowerCase();
      if (!used.has(key) && !movie.beats.some((candidate, candidateIndex) => candidateIndex !== index && clean(candidate.text).toLowerCase() === key)) {
        inventions.push(invention);
        used.add(key);
        text = invention.text;
      }
    }
    return { ...beat, text };
  });

  if (beats.length > 1 && inventions.length === 0) {
    const invention = inventPhraseV10(movie, design, opportunities, beats.length - 1);
    const key = clean(invention.text).toLowerCase();
    if (!used.has(key)) {
      inventions.push(invention);
      beats[beats.length - 1] = { ...beats[beats.length - 1], text: invention.text };
    }
  }

  const realizedMovie = { ...movie, beats };
  return {
    movie: realizedMovie,
    opportunities,
    inventions,
    learning: extractCreativeLearningV10(realizedMovie, inventions),
  };
}
