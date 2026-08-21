import type { AuthorBrainTruth } from "@qre/contracts";

type MovieOperation =
  | "contrast"
  | "reframe"
  | "reversal"
  | "amplification"
  | "echo"
  | "enclosure"
  | "reveal"
  | "implication";

type RealityFact = {
  text: string;
  index: number;
  novelty: number;
  action: boolean;
  state: boolean;
  recurring: boolean;
};

type RelationshipKind =
  | "chronology"
  | "transition"
  | "contrast"
  | "overlap"
  | "recurrence"
  | "continuation";

type RealityRelationship = {
  from: number;
  to: number;
  kind: RelationshipKind;
  strength: number;
  reason: string;
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
};

export type MovieCognition = {
  facts: RealityFact[];
  relationships: RealityRelationship[];
  hypotheses: MovieHypothesis[];
  selected: MovieHypothesis;
  attentionQuestion: string;
};

const ACTION = /\b(?:arrived|came|left|got|stole|found|sent|ordered|changed|ran|returned|noticed|repaired|disappeared|stayed|moved|laughed|waited|opened|closed|called|signed|checked|cleaned|placed|listed|reviewed|diagnosed|approved|emerged|departed|took|secured|settled|turned|shifted|broke|held|talked|connected|met|married|celebrated|finished|started|worked|showed|served|paid)\b/i;
const STATE = /\b(?:nervous|confident|quiet|loud|happy|sad|angry|excited|tired|ready|late|early|busy|empty|full|broken|fixed|clean|dirty|fresh|approved|rejected|missing|gone|fabulous|muddy|calm|bold|radiant|unsteady|successful|failed|resolved|unresolved|connected|proud|scared|fierce|sweet|wild|open|closed|finished|ready|private|together|alone)\b/i;
const RECURRENCE = /\b(?:again|returned|return|back|second|third|once more|still|temporary|until|finally|repeated|repeat)\b/i;
const CONTRAST = /\b(?:but|yet|instead|rather|despite|however|except|although|while|before|after|early|late|first|last|only|already)\b/i;
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
  return facts.map((text, index) => {
    const later = facts.slice(index + 1);
    const repeatedLater = later.some((candidate) => overlap(text, candidate) >= 0.75);
    const novelty = metric(
      0.22 +
      Math.min(0.32, tokens(text).size * 0.06) +
      (ACTION.test(text) ? 0.16 : 0) +
      (STATE.test(text) ? 0.1 : 0) +
      (CONTRAST.test(text) ? 0.1 : 0) +
      (RECURRENCE.test(text) ? 0.08 : 0) +
      (ending && overlap(text, ending) > 0.08 ? 0.08 : 0),
    );
    return {
      text,
      index,
      novelty,
      action: ACTION.test(text),
      state: STATE.test(text),
      recurring: repeatedLater || RECURRENCE.test(text),
    };
  }).sort((a, b) => b.novelty - a.novelty || a.index - b.index);
}

function relationship(a: RealityFact, b: RealityFact): RealityRelationship | undefined {
  if (a.index === b.index) return undefined;

  const from = Math.min(a.index, b.index);
  const to = Math.max(a.index, b.index);
  const forward = a.index < b.index;
  const shared = overlap(a.text, b.text);
  const changedState = a.state !== b.state || (a.state && b.action) || (a.action && b.state);

  if (shared >= 0.45) {
    return {
      from,
      to,
      kind: "overlap",
      strength: metric(0.58 + Math.min(0.35, shared * 0.5)),
      reason: "The later fact shares concrete language with the earlier fact.",
    };
  }

  if (a.recurring || b.recurring) {
    return {
      from,
      to,
      kind: "recurrence",
      strength: metric(0.7 + (RECURRENCE.test(a.text + " " + b.text) ? 0.2 : 0)),
      reason: "A detail or state explicitly returns or repeats.",
    };
  }

  if (forward && a.action && b.action) {
    return {
      from,
      to,
      kind: "chronology",
      strength: metric(0.62 + Math.min(0.2, (b.index - a.index) * 0.04)),
      reason: "Two concrete actions form an ordered event chain.",
    };
  }

  if (forward && changedState) {
    return {
      from,
      to,
      kind: "transition",
      strength: metric(0.74 + (a.state && b.action ? 0.12 : 0)),
      reason: "The later event changes or tests the state established by the earlier one.",
    };
  }

  if (CONTRAST.test(a.text + " " + b.text) || (a.state && b.state && a.text.toLowerCase() !== b.text.toLowerCase())) {
    return {
      from,
      to,
      kind: "contrast",
      strength: metric(0.68 + (a.state && b.state ? 0.14 : 0)),
      reason: "The facts create a before/after or opposing-read relationship.",
    };
  }

  if (CAUSAL.test(b.text)) {
    return {
      from,
      to,
      kind: "continuation",
      strength: 0.66,
      reason: "The later fact contains explicit continuation or causal language.",
    };
  }

  return undefined;
}

function buildRelationships(facts: RealityFact[]): RealityRelationship[] {
  const relationships: RealityRelationship[] = [];
  const ordered = [...facts].sort((a, b) => a.index - b.index);

  for (let i = 0; i < ordered.length; i += 1) {
    for (let j = i + 1; j < ordered.length; j += 1) {
      const relation = relationship(ordered[i]!, ordered[j]!);
      if (relation) relationships.push(relation);
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
  return unique(operations).slice(0, 5) as MovieOperation[];
}

function topRelationship(relationships: RealityRelationship[], kinds?: RelationshipKind[]): RealityRelationship | undefined {
  return relationships.find((item) => !kinds || kinds.includes(item.kind));
}

function hypothesisFor(operation: MovieOperation, subject: string, facts: RealityFact[], relationships: RealityRelationship[], ending: string, rank: number): MovieHypothesis {
  const ordered = [...facts].sort((a, b) => a.index - b.index);
  const anchor = ordered[0]?.text ?? subject;
  const transition = topRelationship(relationships, ["transition", "chronology", "contrast", "recurrence"]);
  const transitionFrom = transition ? ordered.find((fact) => fact.index === transition.from) : undefined;
  const transitionTo = transition ? ordered.find((fact) => fact.index === transition.to) : undefined;
  const turn = transitionTo?.text ?? ordered[1]?.text ?? anchor;
  const linked = ordered.filter((fact) => fact.index !== ordered[0]?.index && fact.index !== transitionTo?.index);
  const support = linked[0]?.text ?? ordered.at(-1)?.text ?? turn;
  const source = unique([anchor, turn, support]);

  const definitions: Record<MovieOperation, { premise: string; tension: string; steps: string[] }> = {
    contrast: {
      premise: "An established state becomes more interesting because a later concrete event opposes it.",
      tension: "What changed between the two states?",
      steps: [`Establish ${anchor}.`, `Let ${turn} alter the expectation.`, `Use ${support} to sharpen the contrast.`, "Pay off the changed read."],
    },
    reframe: {
      premise: "A relationship between concrete events gains a second meaning as the sequence progresses.",
      tension: `Why does ${turn} matter differently after ${support}?`,
      steps: [`Plant ${anchor}.`, `Make ${turn} newly relevant.`, `Reinterpret the relationship through ${support}.`, "Land the earned meaning."],
    },
    reversal: {
      premise: "The apparent direction of the experience turns against the first expectation without adding a new event.",
      tension: "The thing that looked settled becomes the reason to keep watching.",
      steps: [`Establish ${anchor}.`, `Move through ${turn}.`, `Reverse the interpretation, not the facts.`, `Let ${support} carry the consequence.`],
    },
    amplification: {
      premise: "A small established relationship becomes increasingly important because later events depend on it.",
      tension: `Why does ${turn} suddenly matter this much?`,
      steps: [`Plant ${anchor}.`, `Let ${turn} inherit meaning from it.`, `Increase the consequence through ${support}.`, "Pay it off before introducing unrelated material."],
    },
    echo: {
      premise: "A returning detail comes back with changed meaning because of what happened between appearances.",
      tension: "What does the return mean now?",
      steps: [`Establish ${anchor}.`, `Let ${turn} change the state.`, `Bring back ${support} with a new read.`, "End on the changed meaning."],
    },
    enclosure: {
      premise: "The supplied situation narrows until the existing experience feels unusually complete or private.",
      tension: "What has dropped away from attention?",
      steps: [`Establish ${anchor}.`, `Narrow attention through ${turn}.`, `Use ${support} to make the existing world feel self-contained.`, "Pay off the intimacy."],
    },
    reveal: {
      premise: "A supplied relationship was carrying more meaning than it first appeared to.",
      tension: "What was already there that we had not noticed yet?",
      steps: [`Plant ${anchor}.`, `Delay the obvious reading.`, `Use ${turn} to expose the relationship.`, `Let ${support} complete it.`],
    },
    implication: {
      premise: "The strongest meaning sits inside the relationship between events rather than in an explanation.",
      tension: "What does the sequence imply without spelling it out?",
      steps: [`State ${anchor}.`, `Shift through ${turn}.`, `Let ${support} imply the consequence.`, "Stop before explaining it."],
    },
  };

  const selected = definitions[operation];
  const strongest = relationships.slice(0, 3);
  const relationSupport = strongest.length ? strongest.reduce((sum, item) => sum + item.strength, 0) / strongest.length : 0;
  const linkedCount = strongest.filter((item) => sourceIndices(source, ordered).includes(item.from) || sourceIndices(source, ordered).includes(item.to)).length;
  const novelty = metric(0.3 + facts.slice(0, 4).reduce((sum, fact) => sum + fact.novelty, 0) / 10 + relationSupport * 0.12);
  const causalFit = metric(0.34 + relationSupport * 0.42 + Math.min(0.16, linkedCount * 0.05));
  const payoffPotential = metric(0.34 + (ending ? 0.24 : 0.06) + (topRelationship(relationships, ["transition", "contrast", "recurrence"]) ? 0.14 : 0));
  const repetitionRisk = metric(Math.max(0, (source.length - 2) * 0.1));
  const score = metric(novelty * 0.3 + causalFit * 0.34 + payoffPotential * 0.26 - repetitionRisk * 0.1 - rank * 0.006);

  return {
    id: `movie-${operation}-${rank}`,
    operation,
    premise: selected.premise,
    tension: selected.tension,
    trajectory: selected.steps,
    sources: source,
    relationships: strongest,
    score,
    novelty,
    causalFit,
    payoffPotential,
    repetitionRisk,
  };
}

function sourceIndices(source: string[], facts: RealityFact[]): number[] {
  return source.flatMap((value) => {
    const index = facts.find((fact) => fact.text === value)?.index;
    return index === undefined ? [] : [index];
  });
}

export function buildMovieCognition(input: AuthorBrainTruth, ending: string): MovieCognition {
  const subject = clean(input.subject) || "the subject";
  const sourceFacts = splitFacts(input);
  const facts = rankFacts(sourceFacts, ending);
  const relationships = buildRelationships(facts);
  const operations = operationSet(input, facts, relationships);
  const hypotheses = operations
    .map((operation, index) => hypothesisFor(operation, subject, facts, relationships, ending, index + 1))
    .sort((a, b) => b.score - a.score);

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

  return {
    facts,
    relationships,
    hypotheses,
    selected,
    attentionQuestion: selected.tension,
  };
}
