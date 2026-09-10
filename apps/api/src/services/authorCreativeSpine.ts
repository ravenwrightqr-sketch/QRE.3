import type { AuthorMetamorphicRelation, AuthorMetamorphicRelationSet } from "@qre/contracts";
import { searchAuthorMetamorphicRelations } from "./authorMetamorphicSearch.js";

/**
 * UNIVERSAL CREATIVE SPINE
 *
 * One universal path from supplied reality to a realizable creative treatment.
 * Reality is never rewritten.
 * Relations are discovered first. A lens changes what becomes noticeable and
 * how it may be expressed; it never becomes a second reality authority.
 */

export type CreativeOpportunity = {
  relationId: string;
  opportunity: AuthorMetamorphicRelation["creativeOpportunity"];
  strength: number;
  whyItWorks: string;
  evidenceEventIds: string[];
};

export type LensTreatment = {
  primary: string;
  secondary?: string;
  pressure: string[];
  relationId?: string;
  feltEffect: string;
  languageAim: string;
  guardrails: string[];
};

export type AuthorCreativeSpine = {
  version: 1;
  relationSet: AuthorMetamorphicRelationSet;
  opportunities: CreativeOpportunity[];
  selectedRelationId?: string;
  lensTreatment: LensTreatment;
};

type LensProfile = {
  aliases?: readonly string[];
  framingBias: readonly string[];
  strategies: readonly string[];
  relations: readonly string[];
  guardrails: readonly string[];
  intensity: number;
};

const LENSES: Record<string, LensProfile> = {
  comedy: {
    aliases: ["funny", "comedic", "humor", "humour"],
    framingBias: ["status contradiction", "understatement", "unexpected specificity", "reversal", "social collision"],
    strategies: ["contrast", "status_inversion", "understatement", "double_meaning", "reversal"],
    relations: ["contrasts", "changes", "involves"],
    guardrails: ["do not invent a punchline event", "do not literalize metaphor"],
    intensity: 0.72,
  },
  romance: {
    aliases: ["romantic", "love"],
    framingBias: ["recurrence", "restraint", "private significance", "emotional consequence", "intimacy"],
    strategies: ["callback", "implication", "understatement", "recontextualization"],
    relations: ["repeats", "recontextualizes", "converges"],
    guardrails: ["do not invent a confession", "do not invent physical intimacy"],
    intensity: 0.62,
  },
  horror: {
    aliases: ["scary", "spooky"],
    framingBias: ["ordinary wrongness", "watching", "escalating uncertainty", "unresolved signal", "absence"],
    strategies: ["implication", "recontextualization", "reversal", "understatement", "callback"],
    relations: ["recontextualizes", "contrasts", "repeats", "causes"],
    guardrails: ["do not invent violence", "do not invent supernatural events"],
    intensity: 0.82,
  },
  tenderness: {
    aliases: ["tender"],
    framingBias: ["specific detail", "restraint", "care", "quiet consequence", "private significance"],
    strategies: ["understatement", "callback", "implication", "recontextualization"],
    relations: ["converges", "repeats", "recontextualizes"],
    guardrails: ["do not manufacture affection", "do not turn generic sentiment into evidence"],
    intensity: 0.48,
  },
  nostalgia: {
    framingBias: ["recurrence", "memory echo", "changed meaning", "specific detail", "distance"],
    strategies: ["callback", "recontextualization", "understatement", "compression"],
    relations: ["repeats", "recontextualizes", "converges"],
    guardrails: ["do not invent past details", "do not invent chronology"],
    intensity: 0.56,
  },
  chaos: {
    framingBias: ["juxtaposition", "speed", "status reversal", "unexpected collision", "volatility"],
    strategies: ["contrast", "reversal", "double_meaning", "compression", "implication"],
    relations: ["contrasts", "changes", "causes", "involves"],
    guardrails: ["do not invent event collisions", "do not add object interactions"],
    intensity: 0.9,
  },
  fierce: {
    framingBias: ["status", "defiance", "attitude", "controlled escalation", "self-possession"],
    strategies: ["status_inversion", "contrast", "understatement", "reversal"],
    relations: ["contrasts", "changes"],
    guardrails: ["do not invent threats", "do not invent aggression"],
    intensity: 0.84,
  },
  absurd: {
    aliases: ["weird"],
    framingBias: ["mismatch", "deadpan juxtaposition", "double meaning", "specificity", "incongruity"],
    strategies: ["double_meaning", "contrast", "understatement", "personification", "reversal"],
    relations: ["contrasts", "recontextualizes", "involves"],
    guardrails: ["do not literalize the joke", "do not invent props"],
    intensity: 0.86,
  },
  dramatic: {
    framingBias: ["stakes", "consequence", "reversal", "earned payoff", "pressure"],
    strategies: ["recontextualization", "reversal", "contrast", "callback", "compression"],
    relations: ["changes", "causes", "contrasts", "recontextualizes"],
    guardrails: ["do not invent stakes", "do not invent a crisis"],
    intensity: 0.74,
  },
  quiet: {
    framingBias: ["restraint", "specificity", "implication", "absence", "afterimage"],
    strategies: ["understatement", "implication", "callback", "compression"],
    relations: ["converges", "recontextualizes", "repeats"],
    guardrails: ["do not embellish into drama", "do not substitute generic emotion"],
    intensity: 0.32,
  },
  negotiation: {
    framingBias: ["terms", "resistance", "concession", "status", "decision"],
    strategies: ["contrast", "status_inversion", "reversal", "understatement"],
    relations: ["contrasts", "changes", "causes"],
    guardrails: ["do not invent a literal negotiation"],
    intensity: 0.78,
  },
  operation: {
    framingBias: ["procedure", "sequence", "precision", "completion", "pressure"],
    strategies: ["compression", "accumulation", "consequence", "callback"],
    relations: ["changes", "causes", "repeats", "converges"],
    guardrails: ["do not invent procedural steps"],
    intensity: 0.64,
  },
  investigation: {
    framingBias: ["clue", "absence", "recontextualization", "pattern", "reveal"],
    strategies: ["implication", "recontextualization", "callback", "reversal"],
    relations: ["recontextualizes", "repeats", "contrasts"],
    guardrails: ["do not invent clues", "do not invent an outcome"],
    intensity: 0.8,
  },
  refrain: {
    framingBias: ["recurrence", "echo", "ritual", "return", "changed meaning"],
    strategies: ["callback", "repetition-with-mutation", "understatement", "recontextualization"],
    relations: ["repeats", "recontextualizes", "converges"],
    guardrails: ["do not invent a past recurrence"],
    intensity: 0.5,
  },
  transformation: {
    framingBias: ["before/after", "change", "reversal", "emergence", "payoff"],
    strategies: ["consequence", "contrast", "reversal", "compression"],
    relations: ["changes", "causes", "converges"],
    guardrails: ["do not invent a transformation that did not occur"],
    intensity: 0.76,
  },
  noir: {
    framingBias: ["implication", "omission", "unease", "status", "distance"],
    strategies: ["implication", "understatement", "recontextualization"],
    relations: ["recontextualizes", "contrasts", "repeats"],
    guardrails: ["do not invent crimes or threats"],
    intensity: 0.68,
  },
  heist: {
    framingBias: ["objective", "obstacle", "timing", "escape", "payoff"],
    strategies: ["compression", "escalation", "reversal", "consequence"],
    relations: ["changes", "causes", "contrasts"],
    guardrails: ["do not invent a literal heist"],
    intensity: 0.84,
  },
  game: {
    framingBias: ["progression", "status", "levels", "reward", "score"],
    strategies: ["status_inversion", "accumulation", "reversal", "payoff"],
    relations: ["changes", "contrasts", "converges"],
    guardrails: ["do not invent a literal game or score"],
    intensity: 0.8,
  },
  courtroom: {
    framingBias: ["evidence", "verdict", "contrast", "status", "closing argument"],
    strategies: ["contrast", "recontextualization", "status_inversion", "compression"],
    relations: ["contrasts", "recontextualizes", "converges"],
    guardrails: ["do not invent testimony or a verdict"],
    intensity: 0.7,
  },
  military: {
    framingBias: ["discipline", "objective", "deployment", "status", "completion"],
    strategies: ["compression", "status_inversion", "consequence", "accumulation"],
    relations: ["changes", "causes", "converges"],
    guardrails: ["do not invent combat or orders"],
    intensity: 0.74,
  },
  documentary: {
    framingBias: ["observation", "specificity", "distance", "accumulation", "detail"],
    strategies: ["compression", "understatement", "recontextualization", "callback"],
    relations: ["repeats", "recontextualizes", "converges"],
    guardrails: ["do not manufacture documentary facts"],
    intensity: 0.38,
  },
  deadpan: {
    aliases: ["dry"],
    framingBias: ["understatement", "contrast", "dry timing", "implication", "precision"],
    strategies: ["understatement", "contrast", "double_meaning", "compression"],
    relations: ["contrasts", "recontextualizes"],
    guardrails: ["do not explain the joke"],
    intensity: 0.58,
  },
  surreal: {
    framingBias: ["dislocation", "contrast", "implication", "uncertainty", "metaphor"],
    strategies: ["recontextualization", "double_meaning", "personification", "contrast"],
    relations: ["recontextualizes", "contrasts", "involves"],
    guardrails: ["keep figurative moves clearly interpretive", "do not invent literal events"],
    intensity: 0.82,
  },
  wild: {
    framingBias: ["velocity", "escalation", "compression", "surprise", "collision"],
    strategies: ["compression", "reversal", "consequence", "contrast"],
    relations: ["changes", "contrasts", "causes"],
    guardrails: ["do not invent speed or danger"],
    intensity: 0.9,
  },
};

const CUSTOM_DEFAULT: LensProfile = {
  framingBias: ["specificity", "implication", "contrast", "unexpected selection"],
  strategies: ["implication", "recontextualization", "compression", "contrast"],
  relations: ["recontextualizes", "contrasts", "converges"],
  guardrails: ["do not invent concrete reality", "do not use generic filler"],
  intensity: 0.6,
};

const STRATEGY_TO_RELATIONS: Record<string, readonly string[]> = {
  contrast: ["contrasts"],
  status_inversion: ["contrasts", "changes"],
  understatement: ["converges", "recontextualizes"],
  double_meaning: ["contrasts", "recontextualizes"],
  reversal: ["contrasts", "changes"],
  callback: ["repeats"],
  "repetition-with-mutation": ["repeats", "changes"],
  recontextualization: ["recontextualizes"],
  implication: ["recontextualizes", "contrasts"],
  consequence: ["causes", "changes"],
  compression: ["converges", "changes"],
  accumulation: ["repeats", "converges", "changes"],
  personification: ["involves", "converges"],
  escalation: ["changes", "causes"],
  payoff: ["converges", "changes"],
};

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();
const unique = <T>(values: readonly T[]): T[] => [...new Set(values)];

function parseLens(value: string | undefined): { primary: string; secondary?: string; profile: LensProfile } {
  const parts = clean(value || "none")
    .split(/\s*(?:\+|>|\/|,|\band\b)\s*/i)
    .map((part) => clean(part).toLowerCase())
    .filter(Boolean);
  const primaryRaw = parts[0] || "none";
  if (primaryRaw === "none" || primaryRaw === "let qre decide") {
    return { primary: "none", secondary: undefined, profile: { ...CUSTOM_DEFAULT, framingBias: [], strategies: [], relations: [], guardrails: [], intensity: 0 } };
  }
  const findKey = (raw: string): string | undefined => {
    if (LENSES[raw]) return raw;
    return Object.entries(LENSES).find(([, profile]) => profile.aliases?.includes(raw))?.[0];
  };
  const primary = findKey(primaryRaw) || primaryRaw;
  const profile = LENSES[primary] ?? {
    ...CUSTOM_DEFAULT,
    framingBias: parts.slice(0, 8),
  };
  const secondaryRaw = parts[1];
  const secondaryKey = secondaryRaw ? (findKey(secondaryRaw) || secondaryRaw) : undefined;
  return { primary, secondary: secondaryKey, profile };
}

function lensProfileFor(value: string | undefined): LensProfile {
  const parsed = parseLens(value);
  return parsed.profile;
}

function relationFit(relation: AuthorMetamorphicRelation, profile: LensProfile): number {
  const kind = clean(relation.type).toLowerCase();
  const direct = profile.relations.includes(kind) ? 1 : 0;
  const strategyHits = profile.strategies.filter((strategy) => (STRATEGY_TO_RELATIONS[strategy] ?? []).includes(kind)).length;
  const strategyScore = strategyHits / Math.max(1, profile.strategies.length);
  return Math.min(1, direct * 0.65 + strategyScore * 0.35);
}

function rankOpportunities(
  relationSet: AuthorMetamorphicRelationSet,
  returning: boolean,
  lens?: string,
): CreativeOpportunity[] {
  const { profile } = parseLens(lens);
  return relationSet.relations
    .map((relation) => {
      const lensFit = profile.relations.length ? relationFit(relation, profile) : 0;
      const continuity = returning && relation.type.includes("callback") ? 0.08 : 0;
      const strength = Math.min(1, relation.score + continuity + lensFit * profile.intensity * 0.22);
      return {
        relationId: relation.id,
        opportunity: relation.creativeOpportunity,
        strength,
        whyItWorks: `${relation.feltEffect}; ${relation.viewerShift}.`,
        evidenceEventIds: relation.evidenceEventIds,
      };
    })
    .sort((a, b) => b.strength - a.strength || a.relationId.localeCompare(b.relationId))
    .slice(0, 8);
}

function treatmentFor(lens: string | undefined, relation?: AuthorMetamorphicRelation): LensTreatment {
  const parsed = parseLens(lens);
  const secondary = parsed.secondary;
  const secondaryProfile = secondary ? lensProfileFor(secondary) : undefined;
  const pressure = unique([
    ...parsed.profile.framingBias,
    ...parsed.profile.strategies,
    ...(secondaryProfile?.framingBias ?? []),
    ...(secondaryProfile?.strategies ?? []),
  ]).slice(0, 12);
  const guardrails = unique([
    "the supplied reality remains the only concrete authority",
    "the lens may change framing, rhythm, implication, metaphor, omission, or emphasis",
    "the lens may not create a new person, object, action, place, time, outcome, or physical detail",
    ...(parsed.profile.guardrails ?? []),
    ...(secondaryProfile?.guardrails ?? []),
  ]).slice(0, 10);

  return {
    primary: parsed.primary,
    secondary,
    pressure,
    relationId: relation?.id,
    feltEffect: relation?.feltEffect ?? "Make the supplied reality newly noticeable.",
    languageAim:
      parsed.primary === "none"
        ? "Let the reality choose the treatment. Do not force a genre."
        : `Express the selected relationship through ${parsed.primary} pressure without explaining the relationship.`,
    guardrails,
  };
}

export function buildAuthorCreativeSpine(input: {
  graph: Parameters<typeof searchAuthorMetamorphicRelations>[0]["graph"];
  subject?: string;
  lens?: string;
  returning?: boolean;
}): AuthorCreativeSpine {
  const relationSet = searchAuthorMetamorphicRelations({
    graph: input.graph,
    subject: input.subject,
    limit: 16,
  });
  const opportunities = rankOpportunities(relationSet, Boolean(input.returning), input.lens);
  const selectedRelationId = opportunities[0]?.relationId ?? relationSet.strongestRelationId;
  const selectedRelation = relationSet.relations.find((relation) => relation.id === selectedRelationId);
  return {
    version: 1,
    relationSet,
    opportunities,
    selectedRelationId,
    lensTreatment: treatmentFor(input.lens || "none", selectedRelation),
  };
}
