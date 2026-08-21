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
      let strength = 0.55;
      let reason = "The facts form an ordered sequence.";

      if (a.recurring || b.recurring) {
        kind = "recurrence";
        strength = 0.86;
        reason = "A supplied detail or state returns.";
      } else if (shared >= 0.45) {
        kind = "overlap";
        strength = 0.65 + Math.min(0.25, shared * 0.45);
        reason = "The facts share a concrete detail.";
      } else if (changedState) {
        kind = "transition";
        strength = 0.72 + (a.action && b.state ? 0.12 : 0);
        reason = "The later fact changes the state established by the earlier fact.";
      } else if (CONTRAST.test(a.text + " " + b.text) || (a.state && b.state)) {
        kind = "contrast";
        strength = 0.7;
        reason = "The facts create a changed or opposing read.";
      } else if (CAUSAL.test(b.text)) {
        kind = "continuation";
        strength = 0.68;
        reason = "The later fact contains continuation or causal language.";
      }

      if (j === i + 1) strength = metric(Math.min(1, strength + 0.08));
      relationships.push({ from: a.index, to: b.index, kind, strength: metric(strength), reason });
    }
  }

  return relationships.sort((a, b) => b.strength - a.strength || a.from - b.from || a.to - b.to);
}

function operationSet(input: AuthorBrainTruth, facts: RealityFact[], relationships: RealityRelationship[]): MovieOperation[] {
  const text = [input.prompt, ...facts.map((fact) => fact.text)].join(" ").toLowerCase();
  if (SENSITIVE.test(text)) return ["contrast", "reframe", "echo"];
  const operations: MovieOperation[] = ["reframe", "contrast", "implication"];
  if (relationships.some((item) => item.kind === "recurrence")) operations.push("echo");
  if (relationships.some((item) => item.kind === "transition" || item.kind === "contrast")) operations.push("reversal");
  if (relationships.length >= 2) operations.push("amplification");
  if (/\b(?:alone|private|together|connected|just us|intimate)\b/i.test(text)) operations.push("enclosure");
  operations.push("reveal");
  return [...new Set(operations)].slice(0, 5) as MovieOperation[];
}

function selectTrajectoryFacts(facts: RealityFact[], relationships: RealityRelationship[]): { anchor: RealityFact; turn: RealityFact; support?: RealityFact; relation?: RealityRelationship } {
  const ordered = [...facts].sort((a, b) => a.index - b.index);
  const anchor = ordered[0]!;
  const candidates = ordered.filter((fact) => fact.index > anchor.index);

  const scored = candidates.map((fact) => {
    const incoming = relationships.filter((relation) => relation.to === fact.index);
    const outgoing = relationships.filter((relation) => relation.from === fact.index);
    const relationStrength = Math.max(0, ...incoming.concat(outgoing).map((relation) => relation.strength));
    const consequenceSignal = fact.action ? 0.18 : 0;
    const outcomePenalty = fact.index === ordered.at(-1)?.index && OUTCOME.test(fact.text) ? 0.16 : 0;
    const surprise = fact.novelty * 0.45 + relationStrength * 0.35 + consequenceSignal - outcomePenalty;
    return { fact, surprise, bestRelation: incoming[0] ?? outgoing[0] };
  });

  const winner = scored.sort((a, b) => b.surprise - a.surprise || a.fact.index - b.fact.index)[0]?.fact ?? candidates[0] ?? anchor;
  const support = candidates
    .filter((fact) => fact.index > winner.index && fact.text !== winner.text)
    .sort((a, b) => b.novelty - a.novelty || a.index - b.index)[0];
  const relation = relationships.find((item) => item.from === winner.index || item.to === winner.index);

  return { anchor, turn: winner, support, relation };
}

function hypothesisFor(operation: MovieOperation, subject: string, facts: RealityFact[], relationships: RealityRelationship[], ending: string, rank: number): MovieHypothesis {
  const { anchor, turn, support } = selectTrajectoryFacts(facts, relationships);
  const source = unique([anchor.text, turn.text, support?.text ?? ""]);
  const linked = relationships.filter((relation) => source.includes(facts.find((fact) => fact.index === relation.from)?.text ?? "") || source.includes(facts.find((fact) => fact.index === relation.to)?.text ?? "")).slice(0, 6);

  const definitions: Record<MovieOperation, { premise: string; tension: string; trajectory: string[] }> = {
    contrast: { premise: "An established state becomes more interesting because a later event opposes it.", tension: "What changed between the two states?", trajectory: [`Establish ${anchor.text}.`, `Let ${turn.text} alter the expectation.`, support ? `Use ${support.text} to sharpen the contrast.` : "Let the established consequence sharpen the contrast.", "Pay off the changed read."] },
    reframe: { premise: "A relationship between concrete events gains a second meaning as the sequence progresses.", tension: `Why does ${turn.text} matter differently after what came before?`, trajectory: [`Plant ${anchor.text}.`, `Make ${turn.text} newly relevant.`, support ? `Reinterpret the relationship through ${support.text}.` : "Let the consequence change the read.", "Land the earned meaning."] },
    reversal: { premise: "The apparent direction turns against the first expectation without changing the supplied facts.", tension: "What looked settled becomes the reason to keep watching.", trajectory: [`Establish ${anchor.text}.`, `Move through ${turn.text}.`, "Reverse the interpretation, not the world.", support ? `Let ${support.text} carry the consequence.` : "Let the next supplied event carry the consequence."] },
    amplification: { premise: "A small established relationship becomes more important because later events depend on it.", tension: `Why does ${turn.text} suddenly matter this much?`, trajectory: [`Plant ${turn.text}.`, "Increase its relevance once.", support ? `Let ${support.text} make the consequence larger.` : "Let the next supplied event make the consequence larger.", "Pay it off before introducing unrelated material."] },
    echo: { premise: "A returning detail comes back with changed meaning because of what happened between appearances.", tension: "What does the return mean now?", trajectory: [`Establish ${anchor.text}.`, `Let ${turn.text} change the state.`, support ? `Return to ${support.text} with a new read.` : "Return to the established detail with a new read.", "End on the changed meaning."] },
    enclosure: { premise: "The supplied situation narrows until the existing experience feels unusually complete or private.", tension: "What has dropped away from attention?", trajectory: [`Establish ${anchor.text}.`, `Narrow attention through ${turn.text}.`, support ? `Use ${support.text} to make the existing world feel self-contained.` : "Make the existing world feel self-contained.", "Pay off the intimacy."] },
    reveal: { premise: "A supplied relationship was carrying more meaning than it first appeared to.", tension: "What was already there that we had not noticed yet?", trajectory: [`Plant ${anchor.text}.`, "Delay the obvious reading.", `Use ${turn.text} to expose the relationship.`, support ? `Let ${support.text} complete it.` : "Let the next supplied event complete it."] },
    implication: { premise: "The strongest meaning sits inside the relationship between events rather than an explanation.", tension: "What does the sequence imply without spelling it out?", trajectory: [`State ${anchor.text}.`, `Shift through ${turn.text}.`, support ? `Let ${support.text} imply the consequence.` : "Let the next supplied event imply the consequence.", "Stop before explaining it."] },
  };

  const selected = definitions[operation];
  const strongest = linked.slice(0, 3).reduce((sum, relation) => sum + relation.strength, 0) / Math.max(1, Math.min(3, linked.length));
  const novelty = metric(0.3 + turn.novelty * 0.45 + (support ? support.novelty * 0.1 : 0) + strongest * 0.12);
  const causalFit = metric(0.35 + strongest * 0.42 + (turn.action ? 0.08 : 0));
  const payoffPotential = metric(0.35 + (ending ? 0.24 : 0.06) + (operation === "reframe" || operation === "echo" ? 0.14 : 0.08));
  const repetitionRisk = metric(Math.max(0, (source.length - 2) * 0.08));
  const score = metric(novelty * 0.3 + causalFit * 0.34 + payoffPotential * 0.26 - repetitionRisk * 0.1 - rank * 0.006);

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
    trajectory: [`Establish ${subject}.`, "Find the strongest supplied relationship.", "Reframe it.", "Pay it off."],
    sources: [subject],
    relationships: [],
    score: 0.5,
    novelty: 0.5,
    causalFit: 0.5,
    payoffPotential: 0.5,
    repetitionRisk: 0,
  };
  return { facts, relationships, hypotheses, selected, attentionQuestion: selected.tension };
}
