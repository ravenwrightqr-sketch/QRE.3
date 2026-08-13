import type { PhraseInventionV10 } from "./phraseInventorV10.js";

export type CreativeLearningObservationV11 = {
  domain: string;
  operation: string;
  anchors: string[];
  phrase: string;
  confidence: number;
  novelty: number;
  quality: number;
  accepted: boolean;
};

export type CreativeLearningSignalV11 = {
  key: string;
  value: string;
  count: number;
  score: number;
  lastQuality: number;
};

export type CreativeLearningProfileV11 = {
  version: "v11";
  observations: number;
  acceptedObservations: number;
  domains: Record<string, {
    observations: number;
    operations: CreativeLearningSignalV11[];
    anchors: CreativeLearningSignalV11[];
    patterns: CreativeLearningSignalV11[];
  }>;
};

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const clean = (value: string) => value.replace(/\s+/g, " ").trim();
const clamp = (value: number) => Math.max(0, Math.min(1, value));

function signalScore(previous: CreativeLearningSignalV11 | undefined, quality: number, novelty: number, countDelta = 1): number {
  const prior = previous?.score ?? 0;
  const reinforcement = quality * 0.65 + novelty * 0.2 + Math.min(1, (previous?.count ?? 0) / 10) * 0.15;
  return clamp(prior * 0.7 + reinforcement * 0.3 + Math.min(0.08, countDelta * 0.01));
}

function addSignal(
  map: Map<string, CreativeLearningSignalV11>,
  value: string,
  quality: number,
  novelty: number,
  keyPrefix: string,
): void {
  const text = clean(value);
  const keyValue = normalize(text);
  if (!keyValue) return;
  const key = `${keyPrefix}:${keyValue}`;
  const previous = map.get(key);
  map.set(key, {
    key,
    value: text,
    count: (previous?.count ?? 0) + 1,
    score: signalScore(previous, quality, novelty),
    lastQuality: quality,
  });
}

function domainState(profile: CreativeLearningProfileV11, domain: string) {
  return profile.domains[domain] ?? { observations: 0, operations: [], anchors: [], patterns: [] };
}

function rank(signals: CreativeLearningSignalV11[]): CreativeLearningSignalV11[] {
  return [...signals].sort((a, b) => b.score - a.score || b.count - a.count || a.value.localeCompare(b.value));
}

function observationQuality(invention: PhraseInventionV10, accepted = true): number {
  const concrete = Math.min(1, invention.anchors.length / 2);
  const base = invention.confidence * 0.35 + invention.noveltyScore * 0.35 + concrete * 0.2 + (accepted ? 0.1 : 0);
  return clamp(base);
}

export function createCreativeLearningProfileV11(): CreativeLearningProfileV11 {
  return { version: "v11", observations: 0, acceptedObservations: 0, domains: {} };
}

export function observeCreativeInventionV11(
  profile: CreativeLearningProfileV11,
  observation: CreativeLearningObservationV11,
): CreativeLearningProfileV11 {
  const domain = clean(observation.domain || "generic").toLowerCase();
  const quality = clamp(observation.quality);
  const novelty = clamp(observation.novelty);
  const current = domainState(profile, domain);
  const operations = new Map(current.operations.map((item) => [item.key, { ...item }]));
  const anchors = new Map(current.anchors.map((item) => [item.key, { ...item }]));
  const patterns = new Map(current.patterns.map((item) => [item.key, { ...item }]));

  addSignal(operations, observation.operation, quality, novelty, "operation");
  for (const anchor of observation.anchors) addSignal(anchors, anchor, quality, novelty, "anchor");

  const pattern = normalize(observation.phrase)
    .replace(/\b(?:coco|maria|patty|the moment|the house)\b/g, "<subject>")
    .replace(/\b\d{1,2}(?::\d{2})?\s?(?:am|pm)\b/g, "<time>");
  if (pattern) addSignal(patterns, pattern, quality, novelty, "pattern");

  return {
    version: "v11",
    observations: profile.observations + 1,
    acceptedObservations: profile.acceptedObservations + (observation.accepted ? 1 : 0),
    domains: {
      ...profile.domains,
      [domain]: {
        observations: current.observations + 1,
        operations: rank([...operations.values()]),
        anchors: rank([...anchors.values()]),
        patterns: rank([...patterns.values()]),
      },
    },
  };
}

export function learnFromInventionsV11(
  profile: CreativeLearningProfileV11,
  domain: string,
  inventions: PhraseInventionV10[],
  accepted = true,
): CreativeLearningProfileV11 {
  let next = profile;
  for (const invention of inventions) {
    next = observeCreativeInventionV11(next, {
      domain,
      operation: invention.operation,
      anchors: invention.anchors,
      phrase: invention.text,
      confidence: invention.confidence,
      novelty: invention.noveltyScore,
      quality: observationQuality(invention, accepted),
      accepted,
    });
  }
  return next;
}

export function suggestCreativeStrategyV11(profile: CreativeLearningProfileV11, domain: string): {
  operation?: string;
  anchors: string[];
  patterns: string[];
} {
  const state = domainState(profile, clean(domain).toLowerCase());
  return {
    operation: state.operations[0]?.value,
    anchors: state.anchors.slice(0, 6).map((signal) => signal.value),
    patterns: state.patterns.slice(0, 4).map((signal) => signal.value),
  };
}

export function mergeCreativeLearningV11(
  left: CreativeLearningProfileV11,
  right: CreativeLearningProfileV11,
): CreativeLearningProfileV11 {
  let merged = createCreativeLearningProfileV11();
  const allDomains = new Set([...Object.keys(left.domains), ...Object.keys(right.domains)]);
  for (const domain of allDomains) {
    const observations = [
      ...(left.domains[domain]?.operations ?? []),
      ...(right.domains[domain]?.operations ?? []),
    ];
    const anchors = [
      ...(left.domains[domain]?.anchors ?? []),
      ...(right.domains[domain]?.anchors ?? []),
    ];
    const patterns = [
      ...(left.domains[domain]?.patterns ?? []),
      ...(right.domains[domain]?.patterns ?? []),
    ];
    const seed = domainState(merged, domain);
    merged = {
      ...merged,
      observations: merged.observations + Math.max(left.domains[domain]?.observations ?? 0, right.domains[domain]?.observations ?? 0),
      acceptedObservations: merged.acceptedObservations + Math.max(
        left.domains[domain]?.observations ?? 0,
        right.domains[domain]?.observations ?? 0,
      ),
      domains: {
        ...merged.domains,
        [domain]: {
          observations: Math.max(left.domains[domain]?.observations ?? 0, right.domains[domain]?.observations ?? 0),
          operations: rank([...seed.operations, ...observations]),
          anchors: rank([...seed.anchors, ...anchors]),
          patterns: rank([...seed.patterns, ...patterns]),
        },
      },
    };
  }
  return merged;
}
