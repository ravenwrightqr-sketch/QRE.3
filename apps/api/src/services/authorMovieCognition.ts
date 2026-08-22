import type { AuthorBrainTruth } from "@qre/contracts";
import { typeRealityFact, type RealityFactType } from "./authorRealityTyping.js";

type MovieOperation = "contrast" | "reframe" | "reversal" | "amplification" | "echo" | "enclosure" | "reveal" | "implication";
type RelationshipKind = "chronology" | "transition" | "contrast" | "overlap" | "recurrence" | "continuation";
type LensId = "neutral" | "noir" | "heist" | "courtroom" | "spy" | "horror" | "deadpan" | "absurd" | "romance" | "military" | "mockumentary" | "game";

type RealityFact = {
  text: string;
  index: number;
  novelty: number;
  action: boolean;
  state: boolean;
  recurring: boolean;
  type: RealityFactType;
  typeConfidence: number;
};
type RealityRelationship = { from: number; to: number; kind: RelationshipKind; strength: number; reason: string };
type MovieLens = { id: LensId; pressure: string; fit: number; moves: string[] };
type TrajectoryCandidate = {
  facts: RealityFact[];
  relationStrength: number;
  transitionFit: number;
  novelty: number;
  repetitionRisk: number;
  opportunity: number;
  payoffPotential: number;
  baselineLift: number;
  personalityCoherence: number;
  score: number;
};

export type CognitiveState = {
  step: number;
  establishedFacts: string[];
  establishedStates: string[];
  stateBefore: string;
  trigger: string;
  stateAfter: string;
  nextPossibility: string;
  unresolvedQuestion: string;
  sourceIndex: number;
};

export type MovieHypothesis = {
  id: string;
  operation: MovieOperation;
  premise: string;
  tension: string;
  trajectory: string[];
  sources: string[];
  relationships: RealityRelationship[];
  score: number;
  novelty: number;
  causalFit: number;
  payoffPotential: number;
  repetitionRisk: number;
  lens: MovieLens;
  states: CognitiveState[];
};

export type MovieCognition = {
  facts: RealityFact[];
  relationships: RealityRelationship[];
  hypotheses: MovieHypothesis[];
  selected: MovieHypothesis;
  attentionQuestion: string;
};

const ACTION = /\b(?:arrived|came|left|got|stole|found|sent|ordered|changed|ran|returned|noticed|repaired|disappeared|stayed|moved|laughed|waited|opened|closed|called|signed|checked|cleaned|placed|listed|reviewed|diagnosed|approved|emerged|departed|took|secured|settled|turned|shifted|broke|held|talked|connected|met|married|celebrated|finished|started|worked|showed|served|paid|saw)\b/i;
const STATE = /\b(?:nervous|confident|quiet|loud|happy|sad|angry|excited|tired|ready|late|early|busy|empty|full|broken|fixed|clean|dirty|fresh|approved|rejected|missing|gone|fabulous|muddy|calm|bold|radiant|unsteady|successful|failed|resolved|unresolved|connected|proud|scared|fierce|sweet|wild|open|closed|private|together|alone|friendly)\b/i;
const OUTCOME = /\b(?:fabulous|radiant|successful|fixed|resolved|approved|finished|ready|complete|clean|calm|gone|departed|left)\b/i;
const RECURRENCE = /\b(?:again|returned|return|back|second|third|once more|still|temporary|until|finally|repeated|repeat|every day|daily)\b/i;
const CONTRAST = /\b(?:but|yet|instead|rather|despite|however|except|although|while|before|after|early|late|first|last|only|already|suddenly|then)\b/i;
const SENSITIVE = /\b(?:memorial|funeral|tribute|grief|bereavement|passed away|death|deceased|eulogy)\b/i;
const CAUSAL = /\b(?:because|so|then|after|before|when|until|therefore|as soon as|once)\b/i;

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();
const words = (value: string): string[] => clean(value).toLowerCase().split(/[^a-z0-9'-]+/i).filter(Boolean);
const tokens = (value: string): Set<string> => new Set(words(value).filter((word) => word.length > 2));
const metric = (value: number): number => Number(Math.max(0, Math.min(1, value)).toFixed(3));
const unique = (values: string[]): string[] => [...new Set(values.map(clean).filter(Boolean))];

function overlap(a: string, b: string): number {
  const left = tokens(a);
  const right = tokens(b);
  if (!left.size || !right.size) return 0;
  let shared = 0;
  for (const token of left) if (right.has(token)) shared += 1;
  return shared / Math.max(left.size, right.size);
}

function splitFacts(input: AuthorBrainTruth): string[] {
  return unique([
    ...input.facts,
    ...input.sourceMoments,
    ...(input.memoryContext ?? []),
    ...(input.trajectory ?? []),
    ...(input.presenceSummary ?? []),
  ].flatMap((value) => {
    const text = clean(value);
    if (!text) return [];
    return /[,;\n•]/.test(text) ? text.split(/[,;\n•]+/g).map(clean) : [text];
  }));
}

function rankFacts(facts: string[], ending: string[], subject = ""): RealityFact[] {
  return facts.map((text, index) => {
    const typed = typeRealityFact(text, subject);
    return {
      text,
      index,
      novelty: metric(
        0.22 + Math.min(0.28, tokens(text).size * 0.045) +
        (ACTION.test(text) ? 0.16 : 0) +
        (STATE.test(text) ? 0.1 : 0) +
        (CONTRAST.test(text) ? 0.08 : 0) +
        (RECURRENCE.test(text) ? 0.12 : 0) +
        (typed.type === "trait" || typed.type === "preference" ? 0.08 : 0) +
        (typed.type === "relationship" ? 0.06 : 0) +
        (ending.some((item) => overlap(text, item) > 0.08) ? 0.05 : 0),
      ),
      action: ACTION.test(text),
      state: STATE.test(text),
      recurring: RECURRENCE.test(text) || facts.slice(index + 1).some((candidate) => overlap(text, candidate) >= 0.75),
      type: typed.type,
      typeConfidence: typed.confidence,
    };
  });
}

function makeRelationships(facts: RealityFact[]): RealityRelationship[] {
  const ordered = [...facts].sort((a, b) => a.index - b.index);
  const relationships: RealityRelationship[] = [];
  for (let i = 0; i < ordered.length; i += 1) for (let j = i + 1; j < ordered.length; j += 1) {
    const a = ordered[i]!;
    const b = ordered[j]!;
    const shared = overlap(a.text, b.text);
    const changedState = a.state !== b.state || (a.state && b.action) || (a.action && b.state);
    let kind: RelationshipKind = "chronology";
    let strength = 0.5;
    let reason = "The facts form an ordered sequence.";
    if (a.recurring || b.recurring) { kind = "recurrence"; strength = 0.92; reason = "A supplied detail or state returns."; }
    else if (a.action && b.state) { kind = "transition"; strength = 0.94; reason = "An observed action precedes a supplied state change."; }
    else if (changedState) { kind = "transition"; strength = 0.82; reason = "The later fact changes the earlier state."; }
    else if (shared >= 0.45) { kind = "overlap"; strength = 0.74 + Math.min(0.18, shared * 0.35); reason = "The facts share a concrete detail."; }
    else if (CONTRAST.test(`${a.text} ${b.text}`) || (a.state && b.state)) { kind = "contrast"; strength = 0.74; reason = "The supplied facts create an opposing or changed read."; }
    else if (CAUSAL.test(b.text)) { kind = "continuation"; strength = 0.7; reason = "The later supplied fact contains continuation language."; }
    if (j === i + 1) strength += 0.08;
    relationships.push({ from: a.index, to: b.index, kind, strength: metric(strength), reason });
  }
  return relationships.sort((a, b) => b.strength - a.strength || a.from - b.from || a.to - b.to);
}

function operationSet(input: AuthorBrainTruth, facts: RealityFact[], relationships: RealityRelationship[]): MovieOperation[] {
  const text = [input.prompt, ...facts.map((fact) => fact.text)].join(" ");
  if (SENSITIVE.test(text)) return ["contrast", "reframe", "echo"];
  const stateFacts = facts.filter((fact) => fact.type === "state" || fact.type === "outcome");
  const personalityFacts = facts.filter((fact) => fact.type === "trait" || fact.type === "preference");
  const operations: MovieOperation[] = [];
  if (stateFacts.length >= 2 && new Set(stateFacts.map((fact) => clean(fact.text).toLowerCase())).size >= 2) operations.push("contrast");
  if (relationships.some((item) => item.kind === "recurrence")) operations.push("echo");
  if (relationships.some((item) => item.kind === "transition" || item.kind === "contrast")) operations.push("reversal");
  if (personalityFacts.length >= 2) operations.push("reframe", "amplification", "implication");
  else operations.push("reframe", "contrast", "implication");
  if (relationships.length >= 2) operations.push("amplification");
  if (/\b(?:alone|private|together|connected|just us|intimate)\b/i.test(text)) operations.push("enclosure");
  operations.push("reveal");
  return [...new Set(operations)].slice(0, 6);
}

function chooseLens(input: AuthorBrainTruth, operation: MovieOperation, facts: RealityFact[], tension: string): MovieLens {
  const requested = clean((input as AuthorBrainTruth & { lens?: string }).lens).toLowerCase();
  const text = `${input.prompt} ${facts.map((fact) => fact.text).join(" ")} ${tension}`.toLowerCase();
  const catalog: Array<{ id: LensId; pressure: string; fit: number; moves: string[]; terms: RegExp }> = [
    { id: "noir", pressure: "Treat concrete details as evidence and let implication carry tension.", fit: 0.74, moves: ["implication", "understatement", "evidence"], terms: /\bevidence|case|handled|mystery|quiet|missing|returned|fine print\b/ },
    { id: "heist", pressure: "Frame existing actions as a small operation without inventing crew, targets, or equipment.", fit: 0.76, moves: ["operation", "acquisition", "escape"], terms: /\bstole|taken|missing|deal|secured|returned|disappeared\b/ },
    { id: "courtroom", pressure: "Treat the existing event relationship like a case whose meaning changes under examination.", fit: 0.72, moves: ["evidence", "verdict", "case"], terms: /\bapproved|rejected|case|clause|terms|argument|question|answer\b/ },
    { id: "spy", pressure: "Use secrecy and uncertainty as framing without inventing surveillance, handlers, weapons, or enemies.", fit: 0.7, moves: ["secrecy", "uncertainty", "extraction"], terms: /\bquiet|returned|missing|early|late|alone|private|hidden\b/ },
    { id: "horror", pressure: "Make a familiar supplied state feel slightly wrong while never adding a literal supernatural event.", fit: 0.67, moves: ["anomaly", "absence", "reversal"], terms: /\bempty|alone|returned|missing|still|quiet|closed|dark\b/ },
    { id: "deadpan", pressure: "Treat the supplied situation with serious restraint so the ordinary consequence becomes funny.", fit: 0.82, moves: ["restraint", "officiality", "understatement"], terms: /\bquiet|simple|ordinary|routine|clean|fixed|approved|ready\b/ },
    { id: "absurd", pressure: "Take the established premise one small step too seriously, then stop before randomness begins.", fit: 0.68, moves: ["overcommitment", "officiality", "escalation"], terms: /\bstrange|odd|stole|failed|temporary|suddenly|unexpected\b/ },
    { id: "romance", pressure: "Frame existing proximity and connection as intimacy without inventing relationships or private feelings.", fit: 0.69, moves: ["closeness", "privacy", "echo"], terms: /\bconnected|together|alone|private|talked|met|married|celebrated\b/ },
    { id: "military", pressure: "Frame the supplied sequence as disciplined progression without inventing commands, units, or weapons.", fit: 0.64, moves: ["sector", "clearance", "mission"], terms: /\bcleared|secured|ready|finished|approved|checked|arrived\b/ },
    { id: "mockumentary", pressure: "Play the factual situation completely straight while allowing the behavior to create the joke.", fit: 0.8, moves: ["observational", "understatement", "callback"], terms: /\breturned|waited|stayed|ordered|worked|checked|cleaned|talked\b/ },
    { id: "game", pressure: "Frame existing milestones as progression without inventing literal game objects or rules.", fit: 0.65, moves: ["milestone", "level", "unlock"], terms: /\bapproved|fixed|clean|complete|ready|won|finished\b/ },
  ];
  if (requested && catalog.some((item) => item.id === requested)) {
    const match = catalog.find((item) => item.id === requested)!;
    return { id: match.id, pressure: match.pressure, fit: metric(Math.min(1, match.fit + 0.12)), moves: match.moves };
  }
  let best: { id: LensId; pressure: string; fit: number; moves: string[] } | undefined;
  for (const item of catalog) {
    const hits = (text.match(item.terms) ?? []).length;
    const operationFit = operation === "echo" && item.id === "noir" ? 0.08 : operation === "contrast" && item.id === "deadpan" ? 0.06 : 0;
    const score = item.fit + Math.min(0.16, hits * 0.04) + operationFit;
    if (!best || score > best.fit) best = { id: item.id, pressure: item.pressure, fit: score, moves: item.moves };
  }
  return best ? { id: best.id, pressure: best.pressure, fit: metric(best.fit), moves: best.moves } : { id: "neutral", pressure: "Use the strongest natural framing already present in the movie.", fit: 0.6, moves: [] };
}

function stateLabel(fact: RealityFact): string {
  const match = fact.text.match(STATE);
  return match ? match[0].toLowerCase() : fact.state ? clean(fact.text) : "established";
}

function buildCognitiveStates(trajectoryFacts: RealityFact[], operation: MovieOperation): CognitiveState[] {
  const states: CognitiveState[] = [];
  for (let i = 0; i < trajectoryFacts.length; i += 1) {
    const fact = trajectoryFacts[i]!;
    const previous = trajectoryFacts[i - 1];
    const next = trajectoryFacts[i + 1];
    const stateBefore = previous ? stateLabel(previous) : "starting reality";
    const stateAfter = stateLabel(fact);
    const establishedFacts = trajectoryFacts.slice(0, i + 1).map((item) => item.text);
    const establishedStates = trajectoryFacts.slice(0, i + 1).filter((item) => item.state).map(stateLabel);
    const nextPossibility = next ? `What changes because of ${fact.text}?` : operation === "echo" ? "What does the supplied detail mean now?" : "What does the completed sequence make the ending mean?";
    const unresolvedQuestion = next ? `What happens next after ${fact.text}?` : "What remains unresolved?";
    states.push({ step: i + 1, establishedFacts, establishedStates: unique(establishedStates), stateBefore, trigger: fact.text, stateAfter, nextPossibility, unresolvedQuestion, sourceIndex: fact.index });
  }
  return states;
}

function transitionFit(states: CognitiveState[]): number {
  if (states.length < 2) return states.length ? 0.45 : 0;
  let score = 0;
  for (let i = 1; i < states.length; i += 1) {
    const previous = states[i - 1]!;
    const current = states[i]!;
    const chronology = current.sourceIndex > previous.sourceIndex ? 1 : 0;
    const changed = current.trigger !== previous.trigger || current.stateBefore !== current.stateAfter ? 1 : 0;
    const question = current.nextPossibility && current.unresolvedQuestion ? 1 : 0;
    score += chronology * 0.45 + changed * 0.35 + question * 0.2;
  }
  return metric(score / (states.length - 1));
}

function baselineQuality(facts: RealityFact[]): number {
  if (!facts.length) return 0;
  const ordered = [...facts].sort((a, b) => a.index - b.index).slice(0, 5);
  const transitions = ordered.slice(1).filter((fact, index) => fact.action !== ordered[index]!.action || fact.state !== ordered[index]!.state).length;
  const uniqueText = new Set(ordered.map((fact) => clean(fact.text).toLowerCase())).size;
  return metric(0.36 + metric(transitions / Math.max(1, ordered.length - 1)) * 0.28 + metric(uniqueText / ordered.length) * 0.18 + (ordered.some((fact) => fact.recurring) ? 0.1 : 0));
}

function opportunityScore(candidate: RealityFact[], all: RealityFact[]): number {
  const used = new Set(candidate.map((fact) => fact.index));
  const unused = all.filter((fact) => !used.has(fact.index));
  if (!unused.length) return 0.42;
  const strongest = Math.max(...unused.map((fact) => fact.novelty));
  const relational = unused.reduce((best, fact) => Math.max(best, Math.max(...candidate.map((chosen) => overlap(chosen.text, fact.text)), 0)), 0);
  return metric(0.35 + strongest * 0.35 + relational * 0.3);
}

function personalityCoherence(candidate: RealityFact[]): number {
  const identity = candidate.filter((fact) => fact.type === "identity").length;
  const traits = candidate.filter((fact) => fact.type === "trait").length;
  const preferences = candidate.filter((fact) => fact.type === "preference").length;
  const social = candidate.filter((fact) => fact.type === "relationship").length;
  if (!identity && !traits && !preferences && !social) return 0.35;
  const concrete = candidate.filter((fact) => fact.type === "object" || fact.type === "place").length;
  return metric(0.4 + Math.min(0.35, (traits + preferences) * 0.08) + Math.min(0.15, social * 0.05) + (identity ? 0.05 : 0) - concrete * 0.03);
}

function trajectoryCandidates(facts: RealityFact[], relationships: RealityRelationship[], ending: string): TrajectoryCandidate[] {
  const ordered = [...facts].sort((a, b) => a.index - b.index);
  if (!ordered.length) return [];
  const target = Math.min(4, Math.max(3, ordered.length));
  const candidates: RealityFact[][] = [];
  const push = (items: RealityFact[]) => {
    const uniqueItems = items.filter((fact, index, array) => index === array.findIndex((candidate) => candidate.index === fact.index));
    const chronological = [...uniqueItems].sort((a, b) => a.index - b.index);
    const key = chronological.map((fact) => fact.index).join(",");
    if (chronological.length >= Math.min(3, target) && !candidates.some((candidate) => candidate.map((fact) => fact.index).join(",") === key)) candidates.push(chronological.slice(0, target));
  };
  push(ordered);
  push(ordered.slice(0, target));
  push([...ordered.slice(0, 1), ...ordered.slice(-Math.min(target - 1, ordered.length - 1))]);
  for (let start = 0; start < ordered.length; start += 1) push(ordered.slice(start, Math.min(ordered.length, start + target)));
  const highValue = [...ordered].sort((a, b) => b.novelty - a.novelty).slice(0, Math.min(4, ordered.length));
  for (const pivot of highValue) {
    const surrounding = ordered.filter((fact) => fact.index <= pivot.index).slice(-1).concat(ordered.filter((fact) => fact.index > pivot.index).slice(0, target - 2), pivot);
    push(surrounding);
  }
  const scored = candidates.map((candidate) => {
    const links = candidate.slice(0, -1).map((fact, index) => relationships.find((relation) => relation.from === fact.index && relation.to === candidate[index + 1]!.index)).filter(Boolean) as RealityRelationship[];
    const relationStrength = metric(links.reduce((sum, relation) => sum + relation.strength, 0) / Math.max(1, links.length));
    const states = buildCognitiveStates(candidate, "reframe");
    const transition = transitionFit(states);
    const novelty = metric(candidate.reduce((sum, fact) => sum + fact.novelty, 0) / candidate.length);
    const repetitionRisk = metric(candidate.some((fact, index) => index > 0 && overlap(fact.text, candidate[index - 1]!.text) >= 0.92) ? 0.95 : 0.06);
    const opportunity = opportunityScore(candidate, ordered);
    const payoffPotential = metric((ending ? 0.45 : 0.3) + (candidate.at(-1)?.novelty ?? 0.2) * 0.35 + transition * 0.2);
    const simpleBaseline = baselineQuality(candidate);
    const personality = personalityCoherence(candidate);
    const baselineLift = metric(Math.max(0, transition * 0.32 + relationStrength * 0.23 + opportunity * 0.18 + payoffPotential * 0.17 + personality * 0.1 - simpleBaseline * 0.5));
    const score = metric(relationStrength * 0.22 + transition * 0.25 + novelty * 0.14 + opportunity * 0.12 + payoffPotential * 0.16 + personality * 0.11 + baselineLift * 0.08 - repetitionRisk * 0.14);
    return { facts: candidate, relationStrength, transitionFit: transition, novelty, repetitionRisk, opportunity, payoffPotential, baselineLift, personalityCoherence: personality, score };
  });
  return scored.sort((a, b) => b.score - a.score || b.baselineLift - a.baselineLift || b.personalityCoherence - a.personalityCoherence).slice(0, 8);
}

function hypothesisFor(operation: MovieOperation, subject: string, input: AuthorBrainTruth, facts: RealityFact[], relationships: RealityRelationship[], trajectory: TrajectoryCandidate, ending: string, rank: number): MovieHypothesis {
  const ordered = [...trajectory.facts].sort((a, b) => a.index - b.index);
  const first = ordered[0] ?? ({ text: subject, index: 0, novelty: 0.2, action: false, state: false, recurring: false, type: "identity", typeConfidence: 1 } satisfies RealityFact);
  const last = ordered.at(-1) ?? first;
  const states = buildCognitiveStates(ordered, operation);
  const adjacent = ordered.slice(0, -1).map((fact, index) => relationships.find((relation) => relation.from === fact.index && relation.to === ordered[index + 1]!.index)).filter(Boolean) as RealityRelationship[];
  const linked = relationships.filter((relation) => ordered.some((fact) => fact.index === relation.from || fact.index === relation.to)).slice(0, 8);
  const relationStrength = metric(Math.max(trajectory.relationStrength, adjacent.reduce((sum, relation) => sum + relation.strength, 0) / Math.max(1, adjacent.length)));
  const causalFit = metric(0.26 + relationStrength * 0.3 + trajectory.transitionFit * 0.3 + (last.action ? 0.08 : 0) + trajectory.baselineLift * 0.06);
  const novelty = metric(0.35 + trajectory.novelty * 0.38 + trajectory.opportunity * 0.14 + trajectory.personalityCoherence * 0.08 + trajectory.baselineLift * 0.05);
  const payoffPotential = metric(0.3 + trajectory.payoffPotential * 0.42 + trajectory.transitionFit * 0.18 + (ending ? 0.1 : 0));
  const repetitionRisk = trajectory.repetitionRisk;
  const premiseBase: Record<MovieOperation, string> = {
    contrast: "A later supplied state changes the meaning of an earlier supplied state.",
    reframe: "One supplied event makes another supplied event mean something new.",
    reversal: "The apparent direction changes without changing the supplied world.",
    amplification: "A supplied detail grows in importance because later supplied events depend on it.",
    echo: "A supplied detail returns with changed meaning.",
    enclosure: "The supplied experience narrows until what is already there feels unusually complete or private.",
    reveal: "A supplied relationship was carrying more meaning than it first appeared to.",
    implication: "The strongest meaning sits inside the relationship between supplied events.",
  };
  const profile = unique(ordered.slice(0, 2).map((fact) => fact.type)).join(" + ");
  const premise = profile ? `${premiseBase[operation]} Profile: ${profile}.` : premiseBase[operation];
  const tension: Record<MovieOperation, string> = {
    contrast: `What changed between ${first.text} and ${last.text}?`,
    reframe: `Why does ${last.text} matter differently now?`,
    reversal: "What looked settled becomes the reason to keep watching?",
    amplification: `Why does ${last.text} suddenly matter this much?`,
    echo: "What does the returning detail mean now?",
    enclosure: "What becomes unusually complete while the supplied world stays closed?",
    reveal: "What was already there that we had not noticed?",
    implication: "What does this trajectory make the viewer infer without inventing facts?",
  };
  const lens = chooseLens(input, operation, facts, tension[operation]);
  const score = metric(novelty * 0.17 + causalFit * 0.3 + payoffPotential * 0.21 + trajectory.opportunity * 0.09 + trajectory.baselineLift * 0.12 + trajectory.personalityCoherence * 0.07 + lens.fit * 0.04 - repetitionRisk * 0.12 - rank * 0.002);
  return { id: `movie-${operation}-${rank}`, operation, premise, tension: tension[operation], trajectory: ordered.map((fact) => fact.text), sources: unique(ordered.map((fact) => fact.text)), relationships: linked, score, novelty, causalFit, payoffPotential, repetitionRisk, lens, states };
}

export function buildMovieCognition(input: AuthorBrainTruth, ending: string): MovieCognition {
  const subject = clean(input.subject) || "the subject";
  const facts = rankFacts(splitFacts(input), [ending], subject);
  const relationships = makeRelationships(facts);
  const operations = operationSet(input, facts, relationships);
  const trajectories = trajectoryCandidates(facts, relationships, ending);
  const viableTrajectories = trajectories.length ? trajectories : [{ facts, relationStrength: 0.4, transitionFit: 0.35, novelty: 0.3, repetitionRisk: 0.1, opportunity: 0.4, payoffPotential: 0.4, baselineLift: 0.05, personalityCoherence: personalityCoherence(facts), score: 0.3 } satisfies TrajectoryCandidate];
  const hypotheses = operations.flatMap((operation) => viableTrajectories.slice(0, 4).map((trajectory, index) => hypothesisFor(operation, subject, input, facts, relationships, trajectory, ending, index + 1))).sort((a, b) => b.score - a.score || b.causalFit - a.causalFit || b.payoffPotential - a.payoffPotential).slice(0, 12);
  const selected = hypotheses[0] ?? hypothesisFor("reframe", subject, input, facts, relationships, viableTrajectories[0]!, ending, 1);
  return { facts, relationships, hypotheses, selected, attentionQuestion: selected.tension };
}
