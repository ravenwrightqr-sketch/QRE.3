import type { RealityEvent } from "@qre/contracts";

const STOP = new Set([
  "the", "a", "an", "and", "or", "but", "to", "of", "in", "on", "at", "for", "with", "from", "by",
  "this", "that", "it", "is", "are", "was", "were", "be", "been", "being", "as", "into", "my", "your",
  "our", "their", "his", "her", "its", "he", "she", "they", "them", "you", "we", "me", "again", "time",
  "visit", "visited", "grooming", "groomed", "place", "now", "then", "first", "second", "third", "would",
]);

const STATE = new Set([
  "happy", "sad", "angry", "calm", "excited", "nervous", "scared", "proud", "confident", "funny", "wild",
  "goofy", "sweet", "gentle", "fierce", "stubborn", "tired", "quiet", "loud", "beautiful", "strange", "weird",
  "odd", "dark", "bright", "new", "old", "young", "ready", "clean", "dirty", "broken", "fixed", "alive", "gone",
  "back", "open", "closed", "positive", "negative", "relaxed", "anxious", "comfortable", "uncomfortable",
]);

const COLORS = new Set([
  "red", "blue", "green", "yellow", "purple", "pink", "orange", "black", "white", "brown", "gray", "grey", "silver",
]);

const ACTION = new Set([
  "arrived", "arrive", "returned", "return", "came", "left", "leave", "went", "go", "met", "talked", "spoke", "said",
  "made", "gave", "got", "found", "lost", "cleaned", "finished", "started", "opened", "closed", "walked", "ran", "drove",
  "ate", "drank", "kissed", "married", "celebrated", "played", "worked", "visited", "bought", "sold", "built", "fixed",
  "painted", "wore", "used", "shook", "chewed", "connected", "stayed", "waited", "called", "laughed", "cried", "looked",
  "felt", "seemed", "became", "changed", "loved", "liked", "jumped",
]);

function normalize(text: string): string {
  return String(text ?? "").toLowerCase().replace(/[^a-z0-9'’-]+/g, " ").replace(/\s+/g, " ").trim();
}

function tokens(text: string): string[] {
  return [...new Set(
    normalize(text)
      .split(" ")
      .filter((token) => token.length >= 3 && !STOP.has(token)),
  )];
}

function stateTokens(text: string): string[] {
  return tokens(text).filter((token) => STATE.has(token));
}

function actionTokens(text: string): string[] {
  return tokens(text).filter((token) => ACTION.has(token));
}

function distinctiveTokens(text: string, contextTokens: ReadonlySet<string>): string[] {
  return tokens(text).filter((token) => !STATE.has(token) && !ACTION.has(token) && !contextTokens.has(token));
}

function colorTokens(text: string): string[] {
  return tokens(text).filter((token) => COLORS.has(token));
}

function shared(left: readonly string[], right: readonly string[]): string[] {
  const rightSet = new Set(right);
  return left.filter((token) => rightSet.has(token));
}

function deriveContextTokens(priorAnchors: readonly string[]): Set<string> {
  const counts = new Map<string, number>();
  for (const anchor of priorAnchors) {
    for (const token of new Set(tokens(anchor))) counts.set(token, (counts.get(token) ?? 0) + 1);
  }

  const threshold = Math.max(2, Math.ceil(priorAnchors.length * 0.35));
  return new Set([...counts.entries()].filter(([, count]) => count >= threshold).map(([token]) => token));
}

function continuityStrength(
  current: string,
  prior: string,
  contextTokens: ReadonlySet<string>,
): number {
  const currentStates = stateTokens(current);
  const priorStates = stateTokens(prior);
  const sharedStates = shared(currentStates, priorStates);
  const currentDistinctive = distinctiveTokens(current, contextTokens);
  const priorDistinctive = distinctiveTokens(prior, contextTokens);
  const sharedDistinctive = shared(currentDistinctive, priorDistinctive);
  const currentColors = colorTokens(current);
  const priorColors = colorTokens(prior);
  const sharedObject = sharedDistinctive.some((token) => !COLORS.has(token));
  const colorReentry =
    currentColors.length > 0 &&
    priorColors.length > 0 &&
    currentColors.some((token) => !priorColors.includes(token)) &&
    priorColors.some((token) => !currentColors.includes(token));

  if (sharedStates.length > 0 && sharedDistinctive.length > 0) return 0.98;
  if (sharedStates.length > 0) return 0.9;
  if (sharedDistinctive.length >= 2) return 0.86;
  if (sharedDistinctive.length === 1) {
    if (colorReentry && sharedObject) return 0.94;
    if (sharedObject && (actionTokens(current).length > 0 || actionTokens(prior).length > 0)) return 0.78;
  }
  return 0;
}

export function detectAuthorMemoryContinuity(
  currentEvents: readonly RealityEvent[],
  priorAnchors: readonly string[],
): string[] {
  if (!currentEvents.length || !priorAnchors.length) return [];
  const contextTokens = deriveContextTokens(priorAnchors);

  return currentEvents
    .filter((current) => {
      const currentLabel = current.label.trim();
      return priorAnchors.some((prior) => continuityStrength(currentLabel, prior, contextTokens) >= 0.78);
    })
    .map((current) => current.id)
    .slice(0, 24);
}

export function summarizeAuthorMemoryContinuity(
  currentEvents: readonly RealityEvent[],
  priorAnchors: readonly string[],
): string[] {
  if (!currentEvents.length || !priorAnchors.length) return [];
  const contextTokens = deriveContextTokens(priorAnchors);

  return currentEvents.flatMap((current) => {
    const matches = priorAnchors
      .map((prior) => ({ prior, strength: continuityStrength(current.label, prior, contextTokens) }))
      .filter((match) => match.strength >= 0.78)
      .sort((a, b) => b.strength - a.strength)
      .slice(0, 2);

    return matches.map((match) => `revisit:${current.id}:${match.prior}`);
  }).slice(0, 24);
}
