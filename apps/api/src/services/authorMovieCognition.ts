import type { AuthorBrainTruth } from "@qre/contracts";

type MovieOperation = "contrast" | "reframe" | "reversal" | "amplification" | "echo" | "enclosure" | "reveal" | "implication";
type RelationshipKind = "chronology" | "transition" | "contrast" | "overlap" | "recurrence" | "continuation";
type LensId = "neutral" | "noir" | "heist" | "courtroom" | "spy" | "horror" | "deadpan" | "absurd" | "romance" | "military" | "mockumentary" | "game";

type RealityFact = { text: string; index: number; novelty: number; action: boolean; state: boolean; recurring: boolean };
type RealityRelationship = { from: number; to: number; kind: RelationshipKind; strength: number; reason: string };
type MovieLens = { id: LensId; pressure: string; fit: number; moves: string[] };

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
  id: string; operation: MovieOperation; premise: string; tension: string; trajectory: string[]; sources: string[];
  relationships: RealityRelationship[]; score: number; novelty: number; causalFit: number; payoffPotential: number;
  repetitionRisk: number; lens: MovieLens; states: CognitiveState[];
};
export type MovieCognition = { facts: RealityFact[]; relationships: RealityRelationship[]; hypotheses: MovieHypothesis[]; selected: MovieHypothesis; attentionQuestion: string };

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
  return unique([...input.facts, ...input.sourceMoments, ...(input.memoryContext ?? []), ...(input.trajectory ?? []), ...(input.presenceSummary ?? [])].flatMap((value) => {
    const text = clean(value); if (!text) return []; return /[,;\n•]/.test(text) ? text.split(/[,;\n•]+/g).map(clean) : [text];
  }));
}

function rankFacts(facts: string[], ending: string): RealityFact[] {
  return facts.map((text, index) => ({
    text, index,
    novelty: metric(0.2 + Math.min(0.3, tokens(text).size * 0.05) + (ACTION.test(text) ? 0.15 : 0) + (STATE.test(text) ? 0.08 : 0) + (CONTRAST.test(text) ? 0.12 : 0) + (RECURRENCE.test(text) ? 0.1 : 0) + (ending && overlap(text, ending) > 0.08 ? 0.05 : 0)),
    action: ACTION.test(text), state: STATE.test(text),
    recurring: RECURRENCE.test(text) || facts.slice(index + 1).some((candidate) => overlap(text, candidate) >= 0.75),
  }));
}

function makeRelationships(facts: RealityFact[]): RealityRelationship[] {
  const ordered = [...facts].sort((a, b) => a.index - b.index); const relationships: RealityRelationship[] = [];
  for (let i = 0; i < ordered.length; i += 1) for (let j = i + 1; j < ordered.length; j += 1) {
    const a = ordered[i]!; const b = ordered[j]!; const shared = overlap(a.text, b.text); const changedState = a.state !== b.state || (a.state && b.action) || (a.action && b.state);
    let kind: RelationshipKind = "chronology"; let strength = 0.5; let reason = "The facts form an ordered sequence.";
    if (a.recurring || b.recurring) { kind = "recurrence"; strength = 0.9; reason = "A supplied detail or state returns."; }
    else if (shared >= 0.45) { kind = "overlap"; strength = 0.7 + Math.min(0.2, shared * 0.4); reason = "The facts share a concrete detail."; }
    else if (a.action && b.state) { kind = "transition"; strength = 0.92; reason = "An observed action produces or accompanies a later state."; }
    else if (changedState) { kind = "transition"; strength = 0.78; reason = "The later fact changes the earlier state."; }
    else if (CONTRAST.test(`${a.text} ${b.text}`) || (a.state && b.state)) { kind = "contrast"; strength = 0.72; reason = "The facts create an opposing or changed read."; }
    else if (CAUSAL.test(b.text)) { kind = "continuation"; strength = 0.7; reason = "The later fact contains causal or continuation language."; }
    if (j === i + 1) strength += 0.08;
    relationships.push({ from: a.index, to: b.index, kind, strength: metric(strength), reason });
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
  const requested = clean((input as AuthorBrainTruth & { lens?: string }).lens).toLowerCase(); const text = `${input.prompt} ${facts.map((fact) => fact.text).join(" ")} ${tension}`.toLowerCase();
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
  if (requested && catalog.some((item) => item.id === requested)) { const match = catalog.find((item) => item.id === requested)!; return { id: match.id, pressure: match.pressure, fit: metric(Math.min(1, match.fit + 0.12)), moves: match.moves }; }
  let best: { id: LensId; pressure: string; fit: number; moves: string[] } | undefined;
  for (const item of catalog) { const hits = (text.match(item.terms) ?? []).length; const operationFit = operation === "echo" && item.id === "noir" ? 0.08 : operation === "contrast" && item.id === "deadpan" ? 0.06 : 0; const score = item.fit + Math.min(0.16, hits * 0.04) + operationFit; if (!best || score > best.fit) best = { id: item.id, pressure: item.pressure, fit: score, moves: item.moves }; }
  return best ? { id: best.id, pressure: best.pressure, fit: metric(best.fit), moves: best.moves } : { id: "neutral", pressure: "Use the strongest natural framing already present in the movie.", fit: 0.6, moves: [] };
}

function stateLabel(fact: RealityFact): string {
  const match = fact.text.match(STATE); return match ? match[0].toLowerCase() : fact.state ? clean(fact.text) : "established";
}

function buildCognitiveStates(trajectoryFacts: RealityFact[], operation: MovieOperation): CognitiveState[] {
  const states: CognitiveState[] = [];
  for (let i = 0; i < trajectoryFacts.length; i += 1) {
    const fact = trajectoryFacts[i]!;
    const previous = trajectoryFacts[i - 1];
    const stateBefore = previous ? stateLabel(previous) : "starting reality";
    const stateAfter = stateLabel(fact);
    const establishedFacts = trajectoryFacts.slice(0, i + 1).map((item) => item.text);
    const establishedStates = trajectoryFacts.slice(0, i + 1).filter((item) => item.state).map(stateLabel);
    const next = trajectoryFacts[i + 1];
    const nextPossibility = next ? `What changes because of ${fact.text}?` : operation === "echo" ? "What does the supplied detail mean now?" : "What does the completed sequence make the ending mean?";
    const unresolvedQuestion = next ? `What happens next after ${fact.text}?` : "What remains unresolved?";
    states.push({ step: i + 1, establishedFacts, establishedStates: unique(establishedStates), stateBefore, trigger: fact.text, stateAfter, nextPossibility, unresolvedQuestion, sourceIndex: fact.index });
  }
  return states;
}

function hypothesisFor(operation: MovieOperation, subject: string, input: AuthorBrainTruth, facts: RealityFact[], relationships: RealityRelationship[], ending: string, rank: number): MovieHypothesis {
  const ordered = [...facts].sort((a, b) => a.index - b.index);
  const first = ordered[0] ?? { text: subject, index: 0, novelty: 0.2, action: false, state: false, recurring: false };
  const last = ordered.at(-1) ?? first;
  const actions = ordered.filter((fact) => fact.action && !OUTCOME.test(fact.text));
  const states = ordered.filter((fact) => fact.state);
  const recurring = ordered.filter((fact) => fact.recurring);
  let anchor = first; let turn = actions.at(-1) ?? ordered[1] ?? first; let support = last !== turn ? last : undefined;
  switch (operation) {
    case "contrast": anchor = states[0] ?? first; turn = [...states].reverse().find((fact) => fact !== anchor) ?? actions.at(-1) ?? ordered[1] ?? first; support = ordered.find((fact) => fact.index > turn.index) ?? last; break;
    case "reframe": { const relation = relationships[rank - 1] ?? relationships[0]; anchor = ordered.find((fact) => fact.index === relation?.from) ?? first; turn = ordered.find((fact) => fact.index === relation?.to) ?? actions.at(-1) ?? last; support = ordered.find((fact) => fact !== anchor && fact !== turn && fact.index > turn.index); break; }
    case "reversal": anchor = ordered.find((fact) => fact.action) ?? first; turn = last; support = ordered.slice(1, -1).find((fact) => fact !== anchor); break;
    case "amplification": anchor = [...ordered].sort((a, b) => b.novelty - a.novelty)[0] ?? first; turn = actions[(rank - 1) % Math.max(1, actions.length)] ?? anchor; support = ordered.find((fact) => fact !== anchor && fact !== turn && fact.index > turn.index); break;
    case "echo": anchor = recurring[rank - 1] ?? recurring[0] ?? first; turn = ordered.find((fact) => fact.index > anchor.index && fact.text !== anchor.text) ?? last; support = ordered.find((fact) => fact !== anchor && fact !== turn && fact.index > turn.index); break;
    case "enclosure": anchor = states.find((fact) => /\b(?:alone|private|together|connected)\b/i.test(fact.text)) ?? first; turn = ordered.find((fact) => fact !== anchor && fact.index > anchor.index) ?? last; support = ordered.find((fact) => fact !== anchor && fact !== turn); break;
    case "reveal": { const relation = relationships[rank] ?? relationships[0]; anchor = ordered.find((fact) => fact.index === relation?.from) ?? first; turn = ordered.find((fact) => fact.index === relation?.to) ?? last; support = ordered.find((fact) => fact !== anchor && fact !== turn && fact.index > turn.index); break; }
    case "implication": anchor = actions[(rank - 1) % Math.max(1, actions.length)] ?? first; turn = actions.at(-1) ?? last; support = ordered.find((fact) => fact !== anchor && fact !== turn && fact.index > turn.index); break;
  }
  const focusedIndexes = new Set([anchor.index, turn.index, support?.index].filter((value): value is number => typeof value === "number"));
  const trajectoryFacts = ordered.filter((fact) => focusedIndexes.has(fact.index) || facts.length <= 4);
  const trajectory = trajectoryFacts.slice(0, 4).map((fact) => fact.text);
  const source = unique([anchor.text, turn.text, support?.text ?? "", ...trajectory]);
  const used = new Set(trajectoryFacts.map((fact) => fact.index));
  const linked = relationships.filter((relation) => used.has(relation.from) || used.has(relation.to)).slice(0, 6);
  const adjacentLinks = trajectoryFacts.slice(0, -1).map((fact, index) => relationships.find((relation) => relation.from === fact.index && relation.to === trajectoryFacts[index + 1]!.index)).filter((value): value is RealityRelationship => Boolean(value));
  const relationStrength = metric(Math.max(linked[0]?.strength ?? 0.5, adjacentLinks.reduce((sum, relation) => sum + relation.strength, 0) / Math.max(1, adjacentLinks.length)));
  const novelty = metric(0.34 + turn.novelty * 0.42 + (support?.novelty ?? 0.2) * 0.08 + relationStrength * 0.12);
  const causalFit = metric(0.4 + relationStrength * 0.38 + (turn.action ? 0.12 : 0) + adjacentLinks.length * 0.05);
  const payoffPotential = metric(0.38 + (ending ? 0.22 : 0.06) + (operation === "reframe" || operation === "echo" || operation === "reversal" ? 0.16 : 0.08));
  const repetitionRisk = metric(trajectory.length <= 1 ? 0.4 : trajectory.some((value, index) => index > 0 && value === trajectory[index - 1]) ? 0.9 : 0.08);
  const premiseByOperation: Record<MovieOperation, string> = {
    contrast: "A later state changes the meaning of an earlier supplied state.", reframe: "One supplied event makes another supplied event mean something new.", reversal: "The apparent direction changes without changing the supplied world.",
    amplification: "A supplied detail grows in importance because later supplied events depend on it.", echo: "A supplied detail returns with changed meaning.", enclosure: "The supplied experience narrows until what is already there feels unusually complete or private.",
    reveal: "A supplied relationship was carrying more meaning than it first appeared to.", implication: "The strongest meaning sits inside the relationship between supplied events.",
  };
  const tensionByOperation: Record<MovieOperation, string> = {
    contrast: "What changed between the supplied states?", reframe: `Why does ${turn.text} matter differently now?`, reversal: "What looked settled becomes the reason to keep watching?", amplification: `Why does ${turn.text} suddenly matter this much?`,
    echo: "What does the return mean now?", enclosure: "What drops away from attention while the supplied world remains?", reveal: "What was already there that we had not noticed?", implication: "What does the sequence imply without spelling it out?",
  };
  const states = buildCognitiveStates(trajectoryFacts, operation);
  const lens = chooseLens(input, operation, facts, tensionByOperation[operation]);
  const score = metric(novelty * 0.26 + causalFit * 0.38 + payoffPotential * 0.22 + lens.fit * 0.08 - repetitionRisk * 0.1 - rank * 0.004);
  return { id: `movie-${operation}-${rank}`, operation, premise: premiseByOperation[operation], tension: tensionByOperation[operation], trajectory, sources: source, relationships: linked, score, novelty, causalFit, payoffPotential, repetitionRisk, lens, states };
}

export function buildMovieCognition(input: AuthorBrainTruth, ending: string): MovieCognition {
  const subject = clean(input.subject) || "the subject"; const facts = rankFacts(splitFacts(input), ending); const relationships = makeRelationships(facts); const operations = operationSet(input, facts, relationships);
  const hypotheses = operations.map((operation, index) => hypothesisFor(operation, subject, input, facts, relationships, ending, index + 1)).sort((a, b) => b.score - a.score);
  const selected = hypotheses[0] ?? hypothesisFor("reframe", subject, input, facts, relationships, ending, 1);
  return { facts, relationships, hypotheses, selected, attentionQuestion: selected.tension };
}
