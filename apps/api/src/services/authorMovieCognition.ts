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

export type MovieHypothesis = {
  id: string;
  operation: MovieOperation;
  premise: string;
  tension: string;
  trajectory: string[];
  sources: string[];
  score: number;
  novelty: number;
  causalFit: number;
  payoffPotential: number;
  repetitionRisk: number;
};

export type MovieCognition = {
  facts: RealityFact[];
  hypotheses: MovieHypothesis[];
  selected: MovieHypothesis;
  attentionQuestion: string;
};

const ACTION = /\b(?:arrived|came|left|got|stole|found|sent|ordered|changed|ran|returned|noticed|repaired|disappeared|stayed|moved|laughed|waited|opened|closed|called|signed|checked|cleaned|placed|listed|reviewed|diagnosed|approved|emerged|departed|took|secured|settled|turned|shifted|broke|held|talked|connected|met|married|celebrated)\b/i;
const STATE = /\b(?:nervous|confident|quiet|loud|happy|sad|angry|excited|tired|ready|late|early|busy|empty|full|broken|fixed|clean|dirty|fresh|approved|rejected|missing|gone|fabulous|muddy|calm|bold|radiant|unsteady|successful|failed|resolved|unresolved|connected|proud|scared|fierce|sweet|wild)\b/i;
const RECURRENCE = /\b(?:again|returned|return|back|second|third|once more|still|temporary|until|finally)\b/i;
const CONTRAST = /\b(?:but|yet|instead|rather|despite|however|except|although|while)\b/i;
const SENSITIVE = /\b(?:memorial|funeral|grief|bereavement|passed away|death|deceased|eulogy)\b/i;

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
      0.25 +
      Math.min(0.35, tokens(text).size * 0.06) +
      (ACTION.test(text) ? 0.14 : 0) +
      (STATE.test(text) ? 0.1 : 0) +
      (CONTRAST.test(text) ? 0.12 : 0) +
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

function operationSet(input: AuthorBrainTruth, facts: RealityFact[]): MovieOperation[] {
  const text = [input.prompt, ...facts.map((fact) => fact.text)].join(" ").toLowerCase();
  if (SENSITIVE.test(text)) return ["contrast", "reframe", "echo"];
  const operations: MovieOperation[] = ["reframe", "contrast", "implication"];
  if (facts.some((fact) => fact.recurring)) operations.push("echo");
  if (facts.some((fact) => fact.state) && facts.some((fact) => fact.action)) operations.push("reversal");
  if (facts.length >= 3) operations.push("amplification");
  if (/\b(?:alone|private|together|connected|just us|intimate)\b/i.test(text)) operations.push("enclosure");
  operations.push("reveal");
  return [...new Set(operations)].slice(0, 5);
}

function hypothesisFor(operation: MovieOperation, subject: string, facts: RealityFact[], ending: string, rank: number): MovieHypothesis {
  const anchor = facts[0]?.text ?? subject;
  const turn = facts.find((fact) => fact.index !== facts[0]?.index && fact.novelty >= 0.55)?.text ?? facts[1]?.text ?? anchor;
  const support = facts.find((fact) => fact.text !== anchor && fact.text !== turn)?.text ?? facts.at(-1)?.text ?? turn;
  const source = unique([anchor, turn, support]);

  const definitions: Record<MovieOperation, { premise: string; tension: string; steps: string[] }> = {
    contrast: {
      premise: "An established detail becomes more interesting because its opposite keeps appearing.",
      tension: "What looked settled no longer reads the same way.",
      steps: [`Establish ${anchor}.`, `Introduce ${turn} as the contrast.`, `Let ${support} change the read.`, "Resolve without adding a new world fact."],
    },
    reframe: {
      premise: "A concrete detail acquires a second meaning as the sequence progresses.",
      tension: "The viewer understands the same detail differently one cut later.",
      steps: [`Plant ${anchor}.`, `Make ${turn} newly relevant.`, `Reinterpret the relationship through ${support}.`, "Land the earned meaning."],
    },
    reversal: {
      premise: "The apparent direction of the experience turns against the viewer's first expectation.",
      tension: "The thing that seemed resolved becomes the source of the next question.",
      steps: [`Establish ${anchor}.`, `Move through ${turn}.`, "Reverse the status or expectation without inventing an event.", `Use ${support} as the consequence.`],
    },
    amplification: {
      premise: "One small established detail becomes increasingly important for a reason the viewer can track.",
      tension: `Why does ${turn} suddenly matter this much?`,
      steps: [`Plant ${turn}.`, `Echo its relevance once.`, `Increase the consequence through ${support}.`, "Pay it off before introducing anything unrelated."],
    },
    echo: {
      premise: "A returning or recurring detail comes back with changed meaning.",
      tension: "What does the second appearance tell us that the first did not?",
      steps: [`Establish ${anchor}.`, `Let ${turn} move the experience.`, `Return to ${support} with new context.`, "End on the changed meaning."],
    },
    enclosure: {
      premise: "The existing situation becomes increasingly self-contained without inventing a new setting.",
      tension: "What disappears from attention as the supplied experience becomes more specific?",
      steps: [`Establish ${anchor}.`, `Narrow attention through ${turn}.`, `Make ${support} feel unusually private or complete.`, "Pay off the intimacy."],
    },
    reveal: {
      premise: "A supplied detail was carrying more meaning than it first appeared to.",
      tension: "What was hiding in plain sight?",
      steps: [`Plant ${anchor}.`, `Delay the obvious interpretation.`, `Use ${turn} to expose the relationship.`, `Let ${support} complete it.`],
    },
    implication: {
      premise: "The strongest meaning is left just beyond the literal statement.",
      tension: "What does the sequence imply without needing to explain it?",
      steps: [`State ${anchor}.`, `Shift through ${turn}.`, `Let ${support} imply the consequence.`, "Stop before explaining the joke or feeling."],
    },
  };

  const selected = definitions[operation];
  const evidenceCount = source.length;
  const novelty = metric(0.35 + facts.slice(0, 3).reduce((sum, fact) => sum + fact.novelty, 0) / 8 + (operation === "reframe" ? 0.12 : 0));
  const causalFit = metric(0.35 + Math.min(0.45, evidenceCount * 0.1) + (facts.some((fact) => fact.action && fact.state) ? 0.12 : 0));
  const payoffPotential = metric(0.35 + (ending ? 0.25 : 0.05) + (operation === "reframe" || operation === "echo" ? 0.15 : 0.08));
  const repetitionRisk = metric(Math.max(0, (source.length - 2) * 0.12));
  const score = metric(novelty * 0.34 + causalFit * 0.28 + payoffPotential * 0.28 - repetitionRisk * 0.12 - rank * 0.008);

  return {
    id: `movie-${operation}-${rank}`,
    operation,
    premise: selected.premise,
    tension: selected.tension,
    trajectory: selected.steps,
    sources: source,
    score,
    novelty,
    causalFit,
    payoffPotential,
    repetitionRisk,
  };
}

export function buildMovieCognition(input: AuthorBrainTruth, ending: string): MovieCognition {
  const subject = clean(input.subject) || "the subject";
  const sourceFacts = splitFacts(input);
  const facts = rankFacts(sourceFacts, ending);
  const operations = operationSet(input, facts);
  const hypotheses = operations
    .map((operation, index) => hypothesisFor(operation, subject, facts, ending, index + 1))
    .sort((a, b) => b.score - a.score);

  const selected = hypotheses[0] ?? {
    id: "movie-neutral-1",
    operation: "reframe" as MovieOperation,
    premise: "Let the strongest supplied detail change meaning without adding facts.",
    tension: "What changes next?",
    trajectory: [`Establish ${subject}.`, "Find the strongest supplied relationship.", "Reframe it.", "Pay it off."],
    sources: [subject],
    score: 0.5,
    novelty: 0.5,
    causalFit: 0.5,
    payoffPotential: 0.5,
    repetitionRisk: 0,
  };

  return {
    facts,
    hypotheses,
    selected,
    attentionQuestion: selected.tension,
  };
}
