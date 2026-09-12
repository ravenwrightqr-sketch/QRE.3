/**
 * QRE UNIVERSAL CREATIVE LENS FIELD — SEQUENCE-TEXT ONLY
 *
 * A lens is a perceptual pressure applied to supplied reality. It may change
 * emphasis, implication, rhythm, status, or attention. It never creates facts.
 *
 * Lens is not a genre, production method, or separate creative artifact.
 * Keep this field universal: it should help reveal a relationship already
 * present in reality rather than force reality into a preset story form.
 */
export type CreativeLensFamily = "perceptual" | "mechanic";
export type CreativeLensDefinition = { id: string; label: string; family: CreativeLensFamily; framingBias: readonly string[]; realizationMoves: readonly string[]; forbiddenRealityMoves: readonly string[]; preferredSignals: readonly string[]; intensity: number };
export type CreativeLensCandidate = { lens: string; score: number; family: CreativeLensFamily | "none" | "compound"; reason: string; supportedSignals: string[]; forbiddenRealityMoves: string[] };
const LENS = (id: string, framingBias: readonly string[], realizationMoves: readonly string[], preferredSignals: readonly string[], intensity: number): CreativeLensDefinition => ({ id, label: id, family: "perceptual", framingBias, realizationMoves, preferredSignals, forbiddenRealityMoves: ["invented concrete event", "invented actor or object interaction", "changed chronology", "literalized metaphor", "unsupported certainty", "domain template"], intensity });
export const UNIVERSAL_CREATIVE_LENSES: readonly CreativeLensDefinition[] = [
  LENS("contrast", ["difference", "opposition", "before_after", "mismatch"], ["juxtaposition", "reversal", "compression"], ["contrast", "changes", "difference", "mismatch"], .72),
  LENS("implication", ["absence", "uncertainty", "withheld_detail", "consequence"], ["omission", "understatement", "recontextualization"], ["absence", "uncertainty", "consequence", "hidden"], .74),
  LENS("recurrence", ["return", "pattern", "habit", "memory", "repetition"], ["callback", "repetition_with_change", "recontextualization"], ["recurrence", "repeat", "return", "memory"], .68),
  LENS("specificity", ["small_detail", "exactness", "unexpected_detail", "identity"], ["compression", "specific_word_choice", "detail_reveal"], ["specificity", "detail", "identity", "exact"], .66),
  LENS("consequence", ["cause", "effect", "dependency", "stakes", "change"], ["sequence", "escalation", "reversal", "payoff"], ["causes", "changes", "depends", "consequence"], .78),
  LENS("intimacy", ["care", "closeness", "private_significance", "recognition"], ["understatement", "callback", "specificity"], ["care", "relationship", "memory", "recognition"], .54),
  LENS("anomaly", ["oddity", "exception", "unexpected", "break_in_pattern"], ["contrast", "withholding", "reframe", "surprise"], ["anomaly", "exception", "unexpected", "odd"], .82),
  LENS("compression", ["density", "priority", "hierarchy", "selection"], ["shortening", "ranking", "elision", "payoff"], ["priority", "rank", "hierarchy", "compression"], .76),
  LENS("reversal", ["status_change", "contradiction", "inversion", "changed_read"], ["reframe", "reversal", "callback"], ["contradiction", "inversion", "reversal", "change"], .8),
  LENS("accumulation", ["repetition", "build", "quantity", "layering", "pressure"], ["addition", "recurrence", "escalation", "release"], ["accumulation", "repetition", "quantity", "build"], .7),
  LENS("status", ["priority", "rank", "importance", "dominance", "dependency"], ["comparison", "compression", "reversal", "implication"], ["priority", "status", "rank", "importance"], .73),
  LENS("precision", ["procedure", "exactness", "sequence", "correction", "test"], ["specificity", "contrast", "before_after", "payoff"], ["precision", "procedure", "test", "repair", "exact"], .69),
];
const ALIASES: Record<string, string> = { funny: "contrast", comedic: "contrast", romantic: "intimacy", scary: "implication", weird: "anomaly", tender: "intimacy", dramatic: "consequence", quiet: "implication" };
const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();
const metric = (value: number): number => Number(Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0)).toFixed(3));
const unique = (values: readonly string[]): string[] => [...new Set(values.map(clean).filter(Boolean))];
const normalize = (value: string): string => ALIASES[clean(value).toLowerCase()] ?? clean(value).toLowerCase();
const bag = (values: readonly string[]): Set<string> => new Set(values.flatMap((value) => clean(value).toLowerCase().split(/[^a-z0-9-]+/i)).filter((token) => token.length >= 3));
function definitionScore(definition: CreativeLensDefinition, signals: readonly string[], strongSignals: readonly string[]) {
  const signalBag = bag(signals); const strongBag = bag(strongSignals);
  const hits = unique([...definition.preferredSignals.filter((signal) => signalBag.has(signal)), ...definition.preferredSignals.filter((signal) => strongBag.has(signal))]);
  const preferredHit = hits.length / Math.max(1, definition.preferredSignals.length); const framingHit = definition.framingBias.filter((value) => signalBag.has(value)).length / Math.max(1, definition.framingBias.length); const strongHit = definition.preferredSignals.filter((value) => strongBag.has(value)).length / Math.max(1, definition.preferredSignals.length);
  return { score: metric(preferredHit * .42 + framingHit * .18 + strongHit * .24 + definition.intensity * .16), hits };
}
export function resolveCreativeLens(value?: string): CreativeLensDefinition | undefined { const key = normalize(value ?? ""); if (!key || key === "none") return undefined; return UNIVERSAL_CREATIVE_LENSES.find((candidate) => candidate.id === key); }
export function rankCreativeLensCandidates(input: { signals?: readonly string[]; strongSignals?: readonly string[]; businessSignals?: readonly string[]; requestedLens?: string; maxCandidates?: number }): CreativeLensCandidate[] {
  const signals = unique([...(input.signals ?? []), ...(input.businessSignals ?? [])]); const strongSignals = unique(input.strongSignals ?? []); const requested = normalize(input.requestedLens ?? "");
  const scored = UNIVERSAL_CREATIVE_LENSES.map((definition) => { const result = definitionScore(definition, signals, strongSignals); return { lens: definition.label, score: metric(result.score + (requested && requested === definition.id ? .32 : 0)), family: definition.family as const, reason: result.hits.length ? `Supported by ${result.hits.slice(0, 4).join(", ")}.` : "Potentially useful because it can change perception without changing reality.", supportedSignals: result.hits.slice(0, 8), forbiddenRealityMoves: [...definition.forbiddenRealityMoves] }; });
  const nativeScore = input.strongSignals?.length ? metric(.5 + Math.min(.4, strongSignals.length * .03)) : .55;
  scored.push({ lens: "NONE", score: nativeScore, family: "none", reason: "Preserve native perception when an imposed pressure is weaker than the supplied reality.", supportedSignals: [], forbiddenRealityMoves: ["do not force a frame", "do not add concrete reality", "do not rewrite chronology"] });
  return scored.sort((a, b) => b.score - a.score || a.lens.localeCompare(b.lens)).slice(0, Math.max(3, input.maxCandidates ?? 10));
}
