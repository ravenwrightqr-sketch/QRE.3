import type { AuthorBrainTruth } from "@qre/contracts";

type MovieOperation = "contrast" | "reframe" | "reversal" | "amplification" | "echo" | "enclosure" | "reveal" | "implication";
type RelationshipKind = "chronology" | "transition" | "contrast" | "overlap" | "recurrence" | "continuation";

type RealityFact = { text: string; index: number; novelty: number; action: boolean; state: boolean; recurring: boolean };
type RealityRelationship = { from: number; to: number; kind: RelationshipKind; strength: number; reason: string };

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
const SENSITIVE = /\b(?:memorial|funeral|grief|bereavement|passed away|death|deceased|eulogy)\b/i;
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
    recurring: RECURRENCE.test(text) || facts.slice(index + 1).some((candidate) => overlap(text, candidate) >= 0.75),
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

function hypothesisFor(operation: MovieOperation, subject: string, facts: RealityFact[], relationships: RealityRelationship[], ending: string, rank: number): MovieHypothesis {
  const ordered = [...facts].sort((a, b) => a.index - b.index);
  const first = ordered[0] ?? { text: subject, index: 0, novelty: 0.2, action: false, state: false, recurring: false };
  const last = ordered.at(-1) ?? first;
  const actions = ordered.filter((fact) => fact.action && !OUTCOME.test(fact.text));
  const states = ordered.filter((fact) => fact.state);
  const recurring = ordered.filter((fact) => fact.recurring);

  let anchor = first;
  let turn = actions.at(-1) ?? ordered[1] ?? first;
  let support = last !== turn ? last : undefined;

  switch (operation) {
    case "contrast": {
      anchor = states[0] ?? first;
      turn = [...states].reverse().find((fact) => fact !== anchor) ?? actions.at(-1) ?? ordered[1] ?? first;
      support = ordered.find((fact) => fact.index > turn.index) ?? last;
      break;
    }
    case "reframe": {
      const relation = relationships[0];
      anchor = ordered.find((fact) => fact.index === relation?.from) ?? first;
      turn = ordered.find((fact) => fact.index === relation?.to) ?? actions.at(-1) ?? last;
      support = ordered.find((fact) => fact !== anchor && fact !== turn && fact.index > turn.index);
      break;
    }
    case "reversal": {
      anchor = ordered.find((fact) => fact.action) ?? first;
      turn = last;
      support = ordered.slice(1, -1).find((fact) => fact !== anchor);
      break;
    }
    case "amplification": {
      anchor = [...ordered].sort((a, b) => b.novelty - a.novelty)[0] ?? first;
      turn = [...actions].sort((a, b) => b.novelty - a.novelty)[0] ?? anchor;
      support = ordered.find((fact) => fact !== anchor && fact !== turn && fact.index > turn.index);
      break;
    }
    case "echo": {
      anchor = recurring[0] ?? first;
      const relation = relationships.find((item) => item.kind === "recurrence" && item.from === anchor.index);
      turn = ordered.find((fact) => fact.index === relation?.to) ?? last;
      support = ordered.find((fact) => fact !== anchor && fact !== turn && fact.index > anchor.index);
      break;
    }
    case "enclosure": {
      anchor = states.find((fact) => /\b(?:alone|private|together|connected)\b/i.test(fact.text)) ?? first;
      turn = ordered.find((fact) => fact !== anchor && fact.index > anchor.index) ?? last;
      support = ordered.find((fact) => fact !== anchor && fact !== turn);
      break;
    }
    case "reveal": {
      const relation = relationships[0];
      anchor = ordered.find((fact) => fact.index === relation?.from) ?? first;
      turn = ordered.find((fact) => fact.index === relation?.to) ?? last;
      support = ordered.find((fact) => fact !== anchor && fact !== turn && fact.index > turn.index);
      break;
    }
    case "implication": {
      anchor = actions[0] ?? first;
      turn = actions.at(-1) ?? last;
      support = ordered.find((fact) => fact !== anchor && fact !== turn && fact.index > turn.index);
      break;
    }
  }

  const source = unique([anchor.text, turn.text, support?.text ?? ""]);
  const used = new Set(source.map((value) => ordered.find((fact) => fact.text === value)?.index).filter((value): value is number => typeof value === "number"));
  const linked = relationships.filter((relation) => used.has(relation.from) || used.has(relation.to)).slice(0, 6);
  const relationStrength = linked[0]?.strength ?? 0.5;
  const novelty = metric(0.34 + turn.novelty * 0.42 + (support?.novelty ?? 0.2) * 0.08 + relationStrength * 0.12);
  const causalFit = metric(0.4 + relationStrength * 0.38 + (turn.action ? 0.12 : 0));
  const payoffPotential = metric(0.38 + (ending ? 0.22 : 0.06) + (operation === "reframe" || operation === "echo" || operation === "reversal" ? 0.16 : 0.08));
  const repetitionRisk = metric(source.length <= 1 ? 0.4 : source[0] === source[1] ? 0.9 : 0.08);

  const definitions: Record<MovieOperation, { premise: string; tension: string; trajectory: string[] }> = {
    contrast: { premise: "A later state changes the meaning of the earlier one.", tension: "What changed between the two states?", trajectory: [`Establish ${anchor.text}.`, `Let ${turn.text} alter that first read.`, support ? `Use ${support.text} to sharpen the contrast.` : "Let the consequence sharpen the contrast.", "Pay off the changed read."] },
    reframe: { premise: "One concrete event makes another concrete event mean something new.", tension: `Why does ${turn.text} matter differently now?`, trajectory: [`Plant ${anchor.text}.`, `Make ${turn.text} newly relevant.`, support ? `Let ${support.text} reinterpret the relationship.` : "Let the consequence reinterpret the relationship.", "Land the earned meaning."] },
    reversal: { premise: "The apparent direction turns without changing the supplied world.", tension: "What looked settled becomes the reason to keep watching.", trajectory: [`Establish ${anchor.text}.`, `Move toward ${turn.text}.`, "Reverse the interpretation, not the facts.", support ? `Let ${support.text} carry the consequence.` : "Let the next supplied event carry the consequence."] },
    amplification: { premise: "A small supplied detail grows in importance because later events depend on it.", tension: `Why does ${turn.text} suddenly matter this much?`, trajectory: [`Plant ${turn.text}.`, "Increase its relevance once.", support ? `Let ${support.text} enlarge the consequence.` : "Let the next event enlarge the consequence.", "Pay it off before unrelated material appears."] },
    echo: { premise: "A returning detail comes back with changed meaning.", tension: "What does the return mean now?", trajectory: [`Establish ${anchor.text}.`, `Let ${turn.text} change the state.`, support ? `Return to ${support.text} with the new meaning.` : "Return to the established detail with the new meaning.", "End on the changed meaning."] },
    enclosure: { premise: "The supplied experience narrows until what is already there feels unusually complete or private.", tension: "What drops away from attention?", trajectory: [`Establish ${anchor.text}.`, `Narrow attention through ${turn.text}.`, support ? `Let ${support.text} make the existing world feel self-contained.` : "Make the existing world feel self-contained.", "Pay off the intimacy."] },
    reveal: { premise: "A supplied relationship was carrying more meaning than it first appeared to.", tension: "What was already there that we had not noticed?", trajectory: [`Plant ${anchor.text}.`, "Delay the obvious reading.", `Use ${turn.text} to expose the relationship.`, support ? `Let ${support.text} complete it.` : "Let the next supplied event complete it."] },
    implication: { premise: "The strongest meaning lives inside the relationship between events, not an explanation.", tension: "What does the sequence imply without spelling it out?", trajectory: [`State ${anchor.text}.`, `Shift through ${turn.text}.`, support ? `Let ${support.text} imply the consequence.` : "Let the next event imply the consequence.", "Stop before explaining it."] },
  };

  const selected = definitions[operation];
  const score = metric(novelty * 0.34 + causalFit * 0.38 + payoffPotential * 0.28 - repetitionRisk * 0.1 - rank * 0.004);
  return { id: `movie-${operation}-${rank}`, operation, premise: selected.premise, tension: selected.tension, trajectory: selected.trajectory, sources: source, relationships: linked, score, novelty, causalFit, payoffPotential, repetitionRisk };
}

export function buildMovieCognition(input: AuthorBrainTruth, ending: string): MovieCognition {
  const subject = clean(input.subject) || "the subject";
  const facts = rankFacts(splitFacts(input), ending);
  const relationships = makeRelationships(facts);
  const operations = operationSet(input, facts, relationships);
  const hypotheses = operations.map((operation, index) => hypothesisFor(operation, subject, facts, relationships, ending, index + 1)).sort((a, b) => b.score - a.score);
  const selected = hypotheses[0] ?? {
    id: "movie-neutral-1",
    operation: "reframe" as MovieOperation,
    premise: "Let the strongest supplied relationship change meaning without adding facts.",
    tension: "What changes next?",
    trajectory: [`Establish ${subject}.`, "Find the strongest supplied relationship.", "Reframe it without adding facts.", "Land the earned consequence."],
    sources: [subject],
    relationships: [],
    score: 0,
    novelty: 0,
    causalFit: 0,
    payoffPotential: 0,
    repetitionRisk: 0,
  };
  return { facts, relationships, hypotheses, selected, attentionQuestion: selected.tension };
}
