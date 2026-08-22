import type { AuthorBrainTruth } from "@qre/contracts";

type MovieOperation = "contrast" | "reframe" | "reversal" | "amplification" | "echo" | "enclosure" | "reveal" | "implication";
type RelationshipKind = "chronology" | "transition" | "contrast" | "overlap" | "recurrence" | "continuation";
type LensId = "neutral" | "noir" | "heist" | "courtroom" | "spy" | "horror" | "deadpan" | "absurd" | "romance" | "military" | "mockumentary" | "game";

type RealityFact = { text: string; index: number; novelty: number; action: boolean; state: boolean; recurring: boolean };
type RealityRelationship = { from: number; to: number; kind: RelationshipKind; strength: number; reason: string };
type MovieLens = { id: LensId; pressure: string; fit: number; moves: string[] };
type TrajectoryCandidate = { facts: RealityFact[]; score: number; relationStrength: number; transitionFit: number; novelty: number; repetitionRisk: number };

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

const ACTION = /\b(?:arrived|came|left|got|stole|found|sent|ordered|changed|ran|returned|noticed|repaired|disappeared|stayed|moved|laughed|waited|opened|closed|called|signed|checked|cleaned|placed|listed|reviewed|diagnosed|approved|emerged|departed|took|secured|settled|turned|shifted|broke|held|talked|connected|met|married|celebrated|finished|started|worked|showed|served|paid)\b/i;
const STATE = /\b(?:nervous|confident|quiet|loud|happy|sad|angry|excited|tired|ready|late|early|busy|empty|full|broken|fixed|clean|dirty|fresh|approved|rejected|missing|gone|fabulous|muddy|calm|bold|radiant|unsteady|successful|failed|resolved|unresolved|connected|proud|scared|fierce|sweet|wild|open|closed|private|together|alone)\b/i;
const OUTCOME = /\b(?:fabulous|radiant|successful|fixed|resolved|approved|finished|ready|complete|clean|calm|gone|departed|left)\b/i;
const RECURRENCE = /\b(?:again|returned|return|back|second|third|once more|still|temporary|until|finally|repeated|repeat)\b/i;
const CONTRAST = /\b(?:but|yet|instead|rather|despite|however|except|although|while|before|after|early|late|first|last|only|already|suddenly|then)\b/i;
const SENSITIVE = /\b(?:memorial|funeral|tribute|grief|bereavement|passed away|death|deceased|eulogy)\b/i;
const CAUSAL = /\b(?:because|so|then|after|before|when|until|therefore|as soon as|once)\b/i;
const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();
const words = (value: string): string[] => clean(value).toLowerCase().split(/[^a-z0-9'-]+/i).filter(Boolean);
const tokens = (value: string): Set<string> => new Set(words(value).filter((word) => word.length > 2));
const metric = (value: number): number => Number(Math.max(0, Math.min(1, value)).toFixed(3));
const unique = (values: string[]): string[] => [...new Set(values.map(clean).filter(Boolean))];

function overlap(a: string, b: string): number {
  const left = tokens(a); const right = tokens(b); if (!left.size || !right.size) return 0;
  let shared = 0; for (const token of left) if (right.has(token)) shared += 1;
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

function rankFacts(facts: string[], ending: string): RealityFact[] {
  return facts.map((text, index) => ({
    text,
    index,
    novelty: metric(
      0.2 +
      Math.min(0.3, tokens(text).size * 0.05) +
      (ACTION.test(text) ? 0.15 : 0) +
      (STATE.test(text) ? 0.08 : 0) +
      (CONTRAST.test(text) ? 0.12 : 0) +
      (RECURRENCE.test(text) ? 0.1 : 0) +
      (ending && overlap(text, ending) > 0.08 ? 0.05 : 0),
    ),
    action: ACTION.test(text),
    state: STATE.test(text),
    recurring:
      RECURRENCE.test(text) ||
      facts.slice(index + 1).some((candidate) => overlap(text, candidate) >= 0.75),
  }));
}

function makeRelationships(facts: RealityFact[]): RealityRelationship[] {
  const ordered = [...facts].sort((a, b) => a.index - b.index);
  const relationships: RealityRelationship[] = [];

  for (let i = 0; i < ordered.length; i += 1) {
    for (let j = i + 1; j < ordered.length; j += 1) {
      const a = ordered[i]!;
      const b = ordered[j]!;
      const shared = overlap(a.text, b.text);
      const changedState = a.state !== b.state || (a.state && b.action) || (a.action && b.state);
      let kind: RelationshipKind = "chronology";
      let strength = 0.5;
      let reason = "The facts form an ordered sequence.";

      if (a.recurring || b.recurring) {
        kind = "recurrence";
        strength = 0.9;
        reason = "A supplied detail or state returns.";
      } else if (shared >= 0.45) {
        kind = "overlap";
        strength = 0.7 + Math.min(0.2, shared * 0.4);
        reason = "The facts share a concrete detail.";
      } else if (a.action && b.state) {
        kind = "transition";
        strength = 0.92;
        reason = "An observed action produces or accompanies a later state.";
      } else if (changedState) {
        kind = "transition";
        strength = 0.78;
        reason = "The later fact changes the earlier state.";
      } else if (CONTRAST.test(`${a.text} ${b.text}`) || (a.state && b.state)) {
        kind = "contrast";
        strength = 0.72;
        reason = "The facts create an opposing or changed read.";
      } else if (CAUSAL.test(b.text)) {
        kind = "continuation";
        strength = 0.7;
        reason = "The later fact contains causal or continuation language.";
      }

      if (j === i + 1) strength += 0.08;
      relationships.push({ from: a.index, to: b.index, kind, strength: metric(strength), reason });
    }
  }

  return relationships.sort((a, b) => b.strength - a.strength || a.from - b.from || a.to - b.to);
}

function operationSet(input: AuthorBrainTruth, facts: RealityFact[], relationships: RealityRelationship[]): MovieOperation[] {
  const text = [input.prompt, ...facts.map((fact) => fact.text)].join(" ");
  if (SENSITIVE.test(text)) return ["contrast", "reframe", "echo"];

  const operations: MovieOperation[] = ["reframe", "contrast", "implication"];
  if (relationships.some((item) => item.kind === "recurrence")) operations.push("echo");
  if (relationships.some((item) => item.kind === "transition" || item.kind === "contrast")) operations.push("reversal");
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

  return best
    ? { id: best.id, pressure: best.pressure, fit: metric(best.fit), moves: best.moves }
    : { id: "neutral", pressure: "Use the strongest natural framing already present in the movie.", fit: 0.6, moves: [] };
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
    const nextPossibility = next
      ? `What changes because of ${fact.text}?`
      : operation === "echo"
        ? "What does the supplied detail mean now?"
        : "What does the completed sequence make the ending mean?";
    const unresolvedQuestion = next ? `What happens next after ${fact.text}?` : "What remains unresolved?";
    states.push({ step: i + 1, establishedFacts, establishedStates: unique(establishedStates), stateBefore, trigger: fact.text, stateAfter, nextPossibility, unresolvedQuestion, sourceIndex: fact.index });
  }
  return states;
}

function relationshipBetween(a: RealityFact, b: RealityFact, relationships: RealityRelationship[]): RealityRelationship | undefined {
  return relationships.find((relation) => relation.from === a.index && relation.to === b.index);
}

function trajectoryCandidates(ordered: RealityFact[], relationships: RealityRelationship[], ending: string): TrajectoryCandidate[] {
  const candidates: TrajectoryCandidate[] = [];
  const maxLength = Math.min(4, ordered.length);
  const add = (facts: RealityFact[]) => {
    const uniqueFacts = facts.filter((fact, index) => index === 0 || fact.index > facts[index - 1]!.index);
    if (!uniqueFacts.length || uniqueFacts.length !== facts.length) return;
    const relationValues = uniqueFacts.slice(0, -1).map((fact, index) => relationshipBetween(fact, uniqueFacts[index + 1]!, relationships));
    const relationStrength = metric(relationValues.reduce((sum, relation) => sum + (relation?.strength ?? 0.35), 0) / Math.max(1, relationValues.length));
    const transitionFit = metric(uniqueFacts.slice(1).reduce((sum, fact, index) => {
      const previous = uniqueFacts[index]!;
      const relation = relationshipBetween(previous, fact, relationships);
      return sum + (relation?.kind === "transition" ? 1 : relation?.kind === "contrast" || relation?.kind === "continuation" ? 0.8 : relation ? 0.6 : 0.25);
    }, 0) / Math.max(1, uniqueFacts.length - 1));
    const novelty = metric(uniqueFacts.reduce((sum, fact) => sum + fact.novelty, 0) / uniqueFacts.length);
    const repetitionRisk = uniqueFacts.some((fact, index) => index > 0 && overlap(fact.text, uniqueFacts[index - 1]!.text) >= 0.9) ? 0.9 : 0.05;
    const endingFit = ending ? Math.max(...uniqueFacts.map((fact) => overlap(fact.text, ending))) : 0;
    const score = metric(relationStrength * 0.38 + transitionFit * 0.28 + novelty * 0.18 + endingFit * 0.08 + (uniqueFacts.length === maxLength ? 0.08 : 0) - repetitionRisk * 0.16);
    candidates.push({ facts: uniqueFacts, score, relationStrength, transitionFit, novelty, repetitionRisk });
  };

  if (!ordered.length) return [];
  add(ordered.slice(0, maxLength));
  add(ordered.slice(Math.max(0, ordered.length - maxLength)));
  for (let start = 0; start <= Math.max(0, ordered.length - maxLength); start += 1) add(ordered.slice(start, start + maxLength));
  if (ordered.length > 3) {
    for (let turn = 1; turn < ordered.length - 1; turn += 1) {
      add([ordered[0]!, ordered[turn]!, ordered[ordered.length - 1]!]);
    }
  }

  const deduped = new Map<string, TrajectoryCandidate>();
  for (const candidate of candidates) {
    const key = candidate.facts.map((fact) => fact.index).join(",");
    const current = deduped.get(key);
    if (!current || candidate.score > current.score) deduped.set(key, candidate);
  }
  return [...deduped.values()].sort((a, b) => b.score - a.score).slice(0, 8);
}

function hypothesisFor(operation: MovieOperation, subject: string, input: AuthorBrainTruth, facts: RealityFact[], relationships: RealityRelationship[], ending: string, rank: number): MovieHypothesis {
  const ordered = [...facts].sort((a, b) => a.index - b.index);
  const first = ordered[0] ?? { text: subject, index: 0, novelty: 0.2, action: false, state: false, recurring: false };
  const candidates = trajectoryCandidates(ordered, relationships, ending);
  const candidate = candidates[rank - 1] ?? candidates[0] ?? { facts: [first], score: 0.25, relationStrength: 0.25, transitionFit: 0.25, novelty: first.novelty, repetitionRisk: 0.2 };
  const trajectoryFacts = candidate.facts;
  const trajectory = trajectoryFacts.map((fact) => fact.text);
  const anchor = trajectoryFacts[0] ?? first;
  const turn = trajectoryFacts[Math.min(2, trajectoryFacts.length - 1)] ?? anchor;
  const support = trajectoryFacts.at(-1) ?? anchor;
  const source = unique([anchor.text, turn.text, support.text, ...trajectory]);
  const used = new Set(trajectoryFacts.map((fact) => fact.index));
  const linked = relationships.filter((relation) => used.has(relation.from) || used.has(relation.to)).slice(0, 8);

  const premiseByOperation: Record<MovieOperation, string> = {
    contrast: "A later state changes the meaning of an earlier supplied state.",
    reframe: "One supplied event makes another supplied event mean something new.",
    reversal: "The apparent direction changes without changing the supplied world.",
    amplification: "A supplied detail grows in importance because later supplied events depend on it.",
    echo: "A supplied detail returns with changed meaning.",
    enclosure: "The supplied experience narrows until what is already there feels unusually complete or private.",
    reveal: "A supplied relationship was carrying more meaning than it first appeared to.",
    implication: "The strongest meaning sits inside the relationship between supplied events.",
  };

  const tensionByOperation: Record<MovieOperation, string> = {
    contrast: "What changed between the supplied states?",
    reframe: `Why does ${turn.text} matter differently now?`,
    reversal: "What looked settled becomes the reason to keep watching?",
    amplification: `Why does ${turn.text} suddenly matter this much?`,
    echo: "What does the return mean now?",
    enclosure: "What drops away from attention while the supplied world remains?",
    reveal: "What was already there that we had not noticed?",
    implication: "What does the sequence imply without spelling it out?",
  };

  const states = buildCognitiveStates(trajectoryFacts, operation);
  const stateTransitionFit = metric(states.length <= 1 ? 0.3 : states.slice(1).reduce((sum, state, index) => {
    const previous = states[index]!;
    const sourceOrder = state.sourceIndex > previous.sourceIndex ? 1 : 0;
    const changed = state.trigger !== previous.trigger ? 1 : 0.25;
    return sum + sourceOrder * 0.55 + changed * 0.45;
  }, 0) / Math.max(1, states.length - 1));

  const lens = chooseLens(input, operation, facts, tensionByOperation[operation]);
  const novelty = metric(candidate.novelty + (candidate.transitionFit * 0.08));
  const causalFit = metric(candidate.relationStrength * 0.48 + candidate.transitionFit * 0.34 + stateTransitionFit * 0.18);
  const payoffPotential = metric(0.4 + (ending ? 0.24 : 0.08) + Math.min(0.18, candidate.transitionFit * 0.18));
  const repetitionRisk = candidate.repetitionRisk;
  const score = metric(
    candidate.score * 0.36 +
    novelty * 0.16 +
    causalFit * 0.24 +
    payoffPotential * 0.14 +
    lens.fit * 0.06 -
    repetitionRisk * 0.12 -
    rank * 0.002,
  );

  return {
    id: `movie-${operation}-${rank}`,
    operation,
    premise: premiseByOperation[operation],
    tension: tensionByOperation[operation],
    trajectory,
    sources: source,
    relationships: linked,
    score,
    novelty,
    causalFit,
    payoffPotential,
    repetitionRisk,
    lens,
    states,
  };
}

export function buildMovieCognition(input: AuthorBrainTruth, ending: string): MovieCognition {
  const subject = clean(input.subject) || "the subject";
  const facts = rankFacts(splitFacts(input), ending);
  const relationships = makeRelationships(facts);
  const operations = operationSet(input, facts, relationships);
  const trajectories = trajectoryCandidates([...facts].sort((a, b) => a.index - b.index), relationships, ending);
  const hypotheses = operations
    .flatMap((operation) => trajectories.slice(0, 3).map((_, index) => hypothesisFor(operation, subject, input, facts, relationships, ending, index + 1)))
    .sort((a, b) => b.score - a.score || b.causalFit - a.causalFit || b.payoffPotential - a.payoffPotential)
    .slice(0, 12);
  const selected = hypotheses[0] ?? hypothesisFor("reframe", subject, input, facts, relationships, ending, 1);
  return { facts, relationships, hypotheses, selected, attentionQuestion: selected.tension };
}
