import type { RealityEnvelope } from "./authorRealityEnvelope.js";

export type MouthLanguageEvaluation = {
  naturalness: number;
  fragmentRisk: number;
  keywordAssemblyRisk: number;
  analyticLanguageRisk: number;
  supportedActionRisk: number;
  supportedEntityRisk: number;
  accepted: boolean;
  reasons: string[];
};

const clean = (value: unknown): string =>
  String(value ?? "").replace(/\s+/g, " ").trim();

const tokens = (value: string): string[] =>
  clean(value)
    .toLowerCase()
    .split(/[^a-z0-9'-]+/i)
    .filter((token) => token.length >= 2);

const stem = (token: string): string => {
  const value = token.toLowerCase();
  if (value.length > 6 && value.endsWith("ing")) return value.slice(0, -3);
  if (value.length > 5 && value.endsWith("ed")) return value.slice(0, -2);
  if (value.length > 5 && value.endsWith("es")) return value.slice(0, -2);
  if (value.length > 4 && value.endsWith("s")) return value.slice(0, -1);
  return value;
};

const STOP = new Set(
  "the a an and or but for to of in on at with from this that is are was were be been as into by through after before then now very just still again his her their its it's he she they them you we me my our your what when where why how one two three four five six seven eight nine ten".split(/\s+/),
);

const SEMANTIC_VERBS = new Set(
  "mean means meant feel feels felt seem seems seemed read reads reads as carry carries carried become becomes became change changes changed shift shifts shifted turn turns turned leave leaves left remain remains remained hold holds held bring brings brought make makes made matter matters mattered signal signals hinted hints suggest suggests suggested sound sounds sounded imply implies implied".split(/\s+/),
);

const ANALYTIC = /\b(?:contrast(?:s|ed)?|conclusion|concludes|completes?|highlight(?:s|ed)?|demeanor|appearance|transform(?:s|ed|ation)?|reframe(?:s|d)?|changes? the meaning|shows? the contrast|explains?|the joke|the punchline|the payoff|the reveal|the answer)\b/i;
const META = /\b(?:viewer|audience|beat|strategy|operator|cognition|frontier|planner|planning|narrative|realization|writing process|author brief)\b/i;
const QUESTION = /\?/;
const COMMA_STACK = /^\S+(?:,\s*\S+){2,}[.!?]?$/;
const LABEL_FRAGMENT = /^(?:the|a|an)\s+(?:contrast|conclusion|transformation|reframe|reveal|payoff|twist|answer|joke|punchline)\b/i;
const COPULALESS_SUBJECT_STATE = /^(?:[A-Z][\w'-]*)(?:\s+(?:is|was|became|seems|looks|feels|came|went))?\s+(?:nervous|fierce|cool|happy|sad|proud|angry|afraid|scared|quiet|calm|excited|tired|ready|fabulous|beautiful)\.?$/i;
const PREPOSITIONAL_ACTION_FRAGMENT = /^(?:[A-Z][\w'-]*|\b(?:fierce|nervous|fabulous|blue|cool)\b)\s+(?:to|from|into|with|against)\s+[a-z]+(?:\s+[a-z]+){0,3}\.?$/i;

function metric(value: number): number {
  return Number(Math.max(0, Math.min(1, value)).toFixed(3));
}

function suppliedSet(envelope: RealityEnvelope): Set<string> {
  return new Set(envelope.suppliedTerms.map(stem));
}

function entitySet(envelope: RealityEnvelope): Set<string> {
  return new Set(
    envelope.suppliedEntities.flatMap(tokens).map(stem),
  );
}

function actionSet(envelope: RealityEnvelope): Set<string> {
  return new Set(
    envelope.suppliedActions.flatMap(tokens).map(stem),
  );
}

function unsupportedConcreteRisk(
  text: string,
  envelope: RealityEnvelope,
): number {
  const source = suppliedSet(envelope);
  const actions = actionSet(envelope);
  const entities = entitySet(envelope);
  const words = tokens(text);

  let unsupported = 0;
  let concrete = 0;

  for (const raw of words) {
    const word = stem(raw);
    if (
      STOP.has(word) ||
      SEMANTIC_VERBS.has(word)
    ) {
      continue;
    }

    const supported =
      source.has(word) ||
      entities.has(word) ||
      actions.has(word);

    const looksConcrete =
      actions.has(word) ||
      entities.has(word) ||
      /^(?:[a-z]+(?:ed|ing|s)|[a-z]+)$/.test(word);

    if (looksConcrete) {
      concrete += 1;
      if (!supported) unsupported += 1;
    }
  }

  if (!concrete) return 0;
  return metric(unsupported / concrete);
}

function naturalnessRisk(text: string): number {
  const value = clean(text);
  const words = tokens(value);
  if (!value || words.length < 2) return 1;

  let risk = 0;

  if (COMMA_STACK.test(value)) risk += 0.35;
  if (LABEL_FRAGMENT.test(value)) risk += 0.45;
  if (COPULALESS_SUBJECT_STATE.test(value)) risk += 0.5;
  if (PREPOSITIONAL_ACTION_FRAGMENT.test(value)) risk += 0.4;
  if (/^\w+\s+\w+\.?$/.test(value) && words.length === 2) risk += 0.2;
  if (/^(?:[A-Z][^.!?]*\b(?:shift|transformation|contrast|conclusion|reframe)\b[^.!?]*)$/i.test(value)) risk += 0.3;

  return metric(risk);
}

export function evaluateMouthLanguage(
  text: string,
  envelope: RealityEnvelope,
): MouthLanguageEvaluation {
  const value = clean(text);
  const languageRisk = naturalnessRisk(value);
  const analyticLanguageRisk = metric(
    ANALYTIC.test(value) ? 0.8 : META.test(value) ? 0.9 : 0,
  );
  const keywordAssemblyRisk = metric(
    COMMA_STACK.test(value) || LABEL_FRAGMENT.test(value)
      ? 0.7
      : PREPOSITIONAL_ACTION_FRAGMENT.test(value)
        ? 0.55
        : 0,
  );
  const unsupportedRisk = unsupportedConcreteRisk(
    value,
    envelope,
  );

  const actionWords = tokens(value).filter((token) =>
    actionSet(envelope).has(stem(token)),
  ).length;
  const entityWords = tokens(value).filter((token) =>
    entitySet(envelope).has(stem(token)),
  ).length;

  const supportedActionRisk = actionWords === 0
    ? 0
    : metric(Math.max(0, unsupportedRisk * 0.8));

  const supportedEntityRisk = entityWords === 0
    ? 0
    : metric(Math.max(0, unsupportedRisk * 0.6));

  const naturalness = metric(1 - languageRisk);

  const reasons: string[] = [];
  if (languageRisk > 0.45) reasons.push("weak-natural-language");
  if (keywordAssemblyRisk > 0.45) reasons.push("keyword-assembly");
  if (analyticLanguageRisk > 0.45) reasons.push("analytic-language");
  if (unsupportedRisk > 0.45) reasons.push("unsupported-concrete-language");
  if (QUESTION.test(value)) reasons.push("question-leak");

  return {
    naturalness,
    fragmentRisk: languageRisk,
    keywordAssemblyRisk,
    analyticLanguageRisk,
    supportedActionRisk,
    supportedEntityRisk,
    accepted:
      naturalness >= 0.55 &&
      keywordAssemblyRisk <= 0.45 &&
      analyticLanguageRisk <= 0.45 &&
      unsupportedRisk <= 0.45 &&
      !QUESTION.test(value),
    reasons,
  };
}
