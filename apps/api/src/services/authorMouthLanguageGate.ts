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
  String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();

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
  "mean means meant feel feels felt seem seems seemed read reads as carry carries carried become becomes became change changes changed shift shifts shifted turn turns turned leave leaves left remain remains remained hold holds held bring brings brought make makes made matter matters mattered signal signals hinted hints suggest suggests suggested sound sounds sounded imply implies implied look looks looked".split(/\s+/),
);

const UNIVERSAL_ACTION_EQUIVALENTS: Record<string, readonly string[]> = {
  arrive: ["come", "came", "arrive", "arrived", "enter", "entered"],
  enter: ["come", "came", "enter", "entered", "arrive", "arrived"],
  return: ["return", "returned", "came", "came back", "back"],
  depart: ["leave", "left", "depart", "departed"],
  exit: ["leave", "left", "exit", "exited"],
};

/* Universal concrete actions. Legal only when already evidenced. */
const CONCRETE_ACTION_LEMMAS = new Set(
  "bark barked barks chase chased chases growl growled growls snarl snarled snarls leap leaped leaps jump jumped jumps grab grabbed grabs snatch snatched snatches seize seized seizes run ran runs walk walked walks step stepped steps sneak sneaked sneaks crawl crawled crawls sit sat sits stand stood stands wag wagged wags lick licked licks blink blinked blinks stare stared stares smile smiled smiles laugh laughed laughs cry cried cries wave waved waves point pointed points touch touched touches pull pulled pulls push pushed pushes throw threw throws catch caught catches drop dropped drops pick picked picks open opened opens close closed closes reach reached reaches hold held holds carry carried carries hug hugged hugs kiss kissed kisses turn turned turns kneel knelt kneels bend bent bends spin spun spins shake shook shakes hide hid hides rise rose rises fall fell falls".split(/\s+/).map(stem),
);

/* Universal physical staging. Legal only when evidenced. */
const PHYSICAL_STAGE_LEMMAS = new Set(
  "eye eyes shadow claw claws fur face body head hand hands tail tongue mouth teeth paw paws shoulder shoulders gaze breath heartbeat heart skin hair coat carpet floor room door window chair table wall forest".split(/\s+/).map(stem),
);

/* Unsupported concrete identity/staging nouns are never allowed to sneak in as metaphor. */
const INVENTED_FRAME_LEMMAS = new Set(
  "beast creature dog cat animal person man woman child stranger crowd lawyer judge witness king queen monster ghost dragon hero villain forest room salon office table chair door window floor carpet shadow".split(/\s+/).map(stem),
);

/* Concrete sound claims are facts too. */
const CONCRETE_SOUND_LEMMAS = new Set(
  "roar roared roars roar echo echoed echoes whisper whispered whispers scream screamed screams bark barked barks growl growled growls snarl snarled snarls".split(/\s+/).map(stem),
);

const ANALYTIC = /\b(?:contrast(?:s|ed)?|conclusion|concludes|completes?|highlight(?:s|ed)?|demeanor|appearance|transforms?|transformation|reframe(?:s|d)?|changes? the meaning|shows? the contrast|explains?|the reveal|the result|the outcome)\b/i;
const META = /\b(?:viewer|audience|beat|strategy|operator|cognition|frontier|planner|planning|narrative|realization|writing process|author brief)\b/i;
const QUESTION = /\?/;
const COMMA_STACK = /^\S+(?:,\s*\S+){2,}[.!?]?$/;
const LABEL_FRAGMENT = /^(?:the|a|an)\s+(?:contrast|conclusion|transformation|reframe|reveal|payoff|twist|answer|result|outcome)\b/i;
const PREPOSITIONAL_FRAGMENT = /^(?:[A-Z][\w'-]*|[a-z][\w'-]*)\s+(?:to|from|into|with|against)\s+[a-z][\w'-]*(?:\s+[a-z][\w'-]*){0,3}\.?$/i;

function metric(value: number): number {
  return Number(Math.max(0, Math.min(1, value)).toFixed(3));
}

function suppliedSet(envelope: RealityEnvelope): Set<string> {
  return new Set(envelope.suppliedTerms.map(stem));
}

function entitySet(envelope: RealityEnvelope): Set<string> {
  return new Set([envelope.subject, ...envelope.suppliedEntities].flatMap(tokens).map(stem));
}

function actionSet(envelope: RealityEnvelope): Set<string> {
  const actions = new Set(envelope.suppliedActions.flatMap(tokens).map(stem));

  for (const equivalents of Object.values(UNIVERSAL_ACTION_EQUIVALENTS)) {
    const sourceActionPresent = equivalents.some((word) => actions.has(stem(word)));
    if (!sourceActionPresent) continue;
    for (const word of equivalents) actions.add(stem(word));
  }

  return actions;
}

function unsupportedConcreteActionRisk(text: string, envelope: RealityEnvelope): number {
  const source = suppliedSet(envelope);
  const entities = entitySet(envelope);
  const actions = actionSet(envelope);
  const unsupported = tokens(text).map(stem).filter(
    (word) =>
      CONCRETE_ACTION_LEMMAS.has(word) &&
      !source.has(word) &&
      !entities.has(word) &&
      !actions.has(word),
  );
  return metric(unsupported.length > 0 ? 1 : 0);
}

function unsupportedPhysicalStageRisk(text: string, envelope: RealityEnvelope): number {
  const source = suppliedSet(envelope);
  const entities = entitySet(envelope);
  const unsupported = tokens(text).map(stem).filter(
    (word) => PHYSICAL_STAGE_LEMMAS.has(word) && !source.has(word) && !entities.has(word),
  );
  return metric(unsupported.length > 0 ? 1 : 0);
}

function unsupportedInventedFrameRisk(text: string, envelope: RealityEnvelope): number {
  const source = suppliedSet(envelope);
  const entities = entitySet(envelope);
  const unsupported = tokens(text).map(stem).filter(
    (word) => INVENTED_FRAME_LEMMAS.has(word) && !source.has(word) && !entities.has(word),
  );
  return metric(unsupported.length > 0 ? 1 : 0);
}

function unsupportedSoundRisk(text: string, envelope: RealityEnvelope): number {
  const source = suppliedSet(envelope);
  const entities = entitySet(envelope);
  const actions = actionSet(envelope);
  const unsupported = tokens(text).map(stem).filter(
    (word) =>
      CONCRETE_SOUND_LEMMAS.has(word) &&
      !source.has(word) &&
      !entities.has(word) &&
      !actions.has(word),
  );
  return metric(unsupported.length > 0 ? 1 : 0);
}

function nonLatinMismatchRisk(text: string, envelope: RealityEnvelope): number {
  const value = clean(text);
  if (!value) return 1;
  const sourceHasLatin = envelope.suppliedTerms.some((term) => /[a-z]/i.test(term));
  const hasNonLatin = /[^\x00-\x7F]/.test(value);
  return sourceHasLatin && hasNonLatin ? 1 : 0;
}

function unsupportedConcreteRisk(text: string, envelope: RealityEnvelope): number {
  const source = suppliedSet(envelope);
  const actions = actionSet(envelope);
  const entities = entitySet(envelope);
  const words = tokens(text);
  if (!words.length) return 1;

  let unsupported = 0;
  for (const raw of words) {
    const word = stem(raw);
    if (STOP.has(word) || SEMANTIC_VERBS.has(word) || source.has(word) || entities.has(word) || actions.has(word)) continue;
    unsupported += 1;
  }

  return metric(unsupported / Math.max(1, words.length));
}

function naturalnessRisk(text: string): number {
  const value = clean(text);
  const words = tokens(value);
  if (!value) return 1;
  if (words.length === 1) return 0.25;

  let risk = 0;
  if (COMMA_STACK.test(value)) risk += 0.35;
  if (LABEL_FRAGMENT.test(value)) risk += 0.45;
  if (PREPOSITIONAL_FRAGMENT.test(value)) risk += 0.25;
  if (words.length === 2 && !/[.!?]$/.test(value)) risk += 0.15;
  if (/^(?:[A-Z][^.!?]*\b(?:shift|transformation|contrast|conclusion|reframe)\b[^.!?]*)$/i.test(value)) risk += 0.3;
  return metric(risk);
}

export function evaluateMouthLanguage(text: string, envelope: RealityEnvelope): MouthLanguageEvaluation {
  const value = clean(text);
  const languageRisk = naturalnessRisk(value);

  const analyticLanguageRisk = metric(
    ANALYTIC.test(value) ? 0.8 : META.test(value) ? 0.9 : 0,
  );

  const keywordAssemblyRisk = metric(
    COMMA_STACK.test(value) || LABEL_FRAGMENT.test(value) ? 0.7 : 0,
  );

  const unsupportedRisk = unsupportedConcreteRisk(value, envelope);
  const unsupportedActionRisk = unsupportedConcreteActionRisk(value, envelope);
  const unsupportedPhysicalRisk = unsupportedPhysicalStageRisk(value, envelope);
  const unsupportedFrameRisk = unsupportedInventedFrameRisk(value, envelope);
  const unsupportedSoundRisk = unsupportedSoundRisk(value, envelope);
  const languageMismatchRisk = nonLatinMismatchRisk(value, envelope);

  const actionWords = tokens(value).filter((token) => actionSet(envelope).has(stem(token))).length;
  const entityWords = tokens(value).filter((token) => entitySet(envelope).has(stem(token))).length;

  const supportedActionRisk = actionWords === 0 ? 0 : metric(unsupportedRisk * 0.8);
  const supportedEntityRisk = entityWords === 0 ? 0 : metric(unsupportedRisk * 0.6);
  const naturalness = metric(1 - languageRisk);

  const reasons: string[] = [];
  if (languageRisk > 0.45) reasons.push("weak-natural-language");
  if (keywordAssemblyRisk > 0.45) reasons.push("keyword-assembly");
  if (analyticLanguageRisk > 0.45) reasons.push("analytic-language");
  if (unsupportedRisk > 0.45) reasons.push("unsupported-concrete-language");
  if (unsupportedActionRisk > 0) reasons.push("unsupported-concrete-action");
  if (unsupportedPhysicalRisk > 0) reasons.push("unsupported-physical-staging");
  if (unsupportedFrameRisk > 0) reasons.push("unsupported-invented-frame");
  if (unsupportedSoundRisk > 0) reasons.push("unsupported-concrete-sound");
  if (languageMismatchRisk > 0) reasons.push("language-mismatch");
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
      unsupportedActionRisk === 0 &&
      unsupportedPhysicalRisk === 0 &&
      unsupportedFrameRisk === 0 &&
      unsupportedSoundRisk === 0 &&
      languageMismatchRisk === 0 &&
      !QUESTION.test(value),
    reasons,
  };
}
