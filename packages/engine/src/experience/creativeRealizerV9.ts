import type { LatentMovieV5 } from "./latentMovieExtractorV5.js";
import type { ExperienceDesignV8 } from "./experienceDesignV8.js";
import { detectCreativeOpportunitiesV9, type CreativeOpportunitySetV9 } from "./creativeOpportunityV9.js";
import { inventPhraseV9, type PhraseInventionV9 } from "./phraseInventorV9.js";

const INTERNAL = /\b(?:mechanic|payoff|compiler|memory thread|recurring signal|latent movie|story compiler|cognitive plan|narrative operation|trajectory|blueprint|directive|experience design)\b/i;
const DIRECTIVE = /\b(?:make it|make this|turn this|write it|create it|give it|for the client|for customers?|for viewers?|for the audience)\b/i;
const STALE = /\b(?:the story moved forward|part of the story|part that changed the shape of the story|that is how an ordinary moment earns a place in the story)\b/i;

export type RealizedMovieV9 = {
  movie: LatentMovieV5;
  opportunities: CreativeOpportunitySetV9;
  inventions: PhraseInventionV9[];
};

function clean(value: string): string {
  return value.replace(/\s+/g, " ").replace(/\.\s*\./g, ".").trim();
}

export function realizeLatentMovieV9(movie: LatentMovieV5, design: ExperienceDesignV8): RealizedMovieV9 {
  const opportunities = detectCreativeOpportunitiesV9(movie, design);
  const inventions: PhraseInventionV9[] = [];
  const beats = movie.beats.map((beat, index) => {
    let text = clean(beat.text);
    const shouldInvent = index > 0 && (INTERNAL.test(text) || STALE.test(text) || DIRECTIVE.test(text) || opportunities.opportunities.some((opportunity) => opportunity.score >= 0.78));
    if (shouldInvent) {
      const invention = inventPhraseV9(movie, design, opportunities, index);
      inventions.push(invention);
      text = invention.text;
    }
    return { ...beat, text };
  });
  if (beats.length > 1 && inventions.length === 0) {
    const invention = inventPhraseV9(movie, design, opportunities, beats.length - 1);
    inventions.push(invention);
    beats[beats.length - 1] = { ...beats[beats.length - 1], text: invention.text };
  }
  return { movie: { ...movie, beats }, opportunities, inventions };
}
