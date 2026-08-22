import { typeRealityFact, type RealityFactType } from "./authorRealityTyping.js";

export type AuthorDomainMode = "memory" | "pet_social" | "service" | "business_media" | "generic";

export type DomainFact = {
  text: string;
  type: RealityFactType;
  role: "anchor" | "change" | "trait" | "preference" | "social" | "context" | "outcome" | "recurrence";
};

export type CognitiveTension = {
  left: string;
  right: string;
  kind: "trait_contrast" | "state_change" | "social_pull" | "meaning_shift" | "commercial_pressure";
  strength: number;
};

export type DomainOpportunity = {
  text: string;
  kind: "hook" | "character" | "callback" | "social" | "payoff" | "cta";
  strength: number;
  sources: string[];
};

export type DomainCognitionProfile = {
  mode: AuthorDomainMode;
  facts: DomainFact[];
  anchors: string[];
  tensions: CognitiveTension[];
  opportunities: DomainOpportunity[];
  identitySignals: string[];
  traitSignals: string[];
  preferenceSignals: string[];
  socialSignals: string[];
  activitySignals: string[];
  continuitySignals: string[];
  forbiddenExpansions: string[];
};

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();
const metric = (value: number): number => Number(Math.max(0, Math.min(1, value)).toFixed(3));
const unique = (values: string[]): string[] => [...new Set(values.map(clean).filter(Boolean))];

const ACTIVITY = /\b(?:walks?|runs?|plays?|eats?|sleeps?|travels?|works?|shops?|dances?|talks?|calls?|visits?|drives?|cooks?|grooms?)\b/i;
const SOCIAL = /\b(?:other dogs?|friends?|client|customer|guest|couple|partner|team|family|people|social|connect(?:ed|s|ing)?)\b/i;
const COMMERCIAL = /\b(?:offer|sale|listed|approved|review|booked|paid|price|deal|client|customer|service|appointment|order)\b/i;
const RECURRENCE = /\b(?:every day|daily|again|still|returned|return|back|each day|weekly|monthly|routine|usually|always|often)\b/i;

function roleFor(fact: DomainFact, mode: AuthorDomainMode): DomainFact["role"] {
  if (fact.type === "trait") return "trait";
  if (fact.type === "preference") return SOCIAL.test(fact.text) ? "social" : "preference";
  if (fact.type === "relationship") return "social";
  if (fact.type === "outcome") return "outcome";
  if (fact.type === "recurrence" || RECURRENCE.test(fact.text)) return "recurrence";
  if (fact.type === "identity" || fact.type === "place" || fact.type === "object") return "anchor";
  if (mode === "memory" && /\b(?:met|connected|talked|saw|remember|first|close)\b/i.test(fact.text)) return "change";
  if (mode === "pet_social" && ACTIVITY.test(fact.text)) return "change";
  return "anchor";
}

function detectMode(values: string[]): AuthorDomainMode {
  const text = values.join(" ").toLowerCase();
  if (/\b(?:dog|cat|puppy|poodle|pet|bacon|walks?|tail|grooming)\b/.test(text)) return "pet_social";
  if (/\b(?:memory|met|connected|talked until|saw each other|relationship|first night)\b/.test(text)) return "memory";
  if (COMMERCIAL.test(text) || /\b(?:housekeeping|mechanic|restaurant|wedding|lawyer|real estate|hotel|service)\b/.test(text)) return "service";
  if (/\b(?:on market|launch|sale|campaign|social media|promo|new this week)\b/.test(text)) return "business_media";
  return "generic";
}

export function buildDomainCognition(values: string[], subject = "", mode: AuthorDomainMode = "generic"): DomainCognitionProfile {
  const resolvedMode = mode === "generic" ? detectMode(values) : mode;
  const typed = values.map((value) => {
    const typedFact = typeRealityFact(value, subject);
    const domainFact = { text: clean(value), type: typedFact.type, role: "anchor" as DomainFact["role"] };
    domainFact.role = roleFor(domainFact, resolvedMode);
    return domainFact;
  }).filter((fact) => fact.text);

  const identitySignals = unique(typed.filter((fact) => fact.type === "identity").map((fact) => fact.text));
  const traitSignals = unique(typed.filter((fact) => fact.role === "trait").map((fact) => fact.text));
  const preferenceSignals = unique(typed.filter((fact) => fact.role === "preference").map((fact) => fact.text));
  const socialSignals = unique(typed.filter((fact) => fact.role === "social").map((fact) => fact.text));
  const activitySignals = unique(typed.filter((fact) => ACTIVITY.test(fact.text) || (resolvedMode === "pet_social" && fact.type === "event")).map((fact) => fact.text));
  const continuitySignals = unique(typed.filter((fact) => fact.role === "recurrence" || RECURRENCE.test(fact.text)).map((fact) => fact.text));

  const tensions: CognitiveTension[] = [];
  for (let i = 0; i < traitSignals.length; i += 1) {
    for (let j = i + 1; j < traitSignals.length; j += 1) {
      const left = traitSignals[i]!;
      const right = traitSignals[j]!;
      if (left.toLowerCase() !== right.toLowerCase()) tensions.push({ left, right, kind: "trait_contrast", strength: 0.78 });
    }
  }
  if (traitSignals.length && socialSignals.length) tensions.push({ left: traitSignals[0]!, right: socialSignals[0]!, kind: "social_pull", strength: 0.74 });
  if (resolvedMode === "memory" && continuitySignals.length) tensions.push({ left: typed.find((fact) => fact.role === "change")?.text ?? typed[0]?.text ?? "first encounter", right: continuitySignals[0]!, kind: "meaning_shift", strength: 0.86 });
  if (resolvedMode === "service") {
    const outcome = typed.find((fact) => fact.role === "outcome")?.text;
    const anchor = typed.find((fact) => fact.role === "anchor")?.text;
    if (anchor && outcome) tensions.push({ left: anchor, right: outcome, kind: "state_change", strength: 0.82 });
  }
  if (resolvedMode === "business_media" && COMMERCIAL.test(values.join(" "))) tensions.push({ left: "attention", right: "action", kind: "commercial_pressure", strength: 0.8 });

  const opportunities: DomainOpportunity[] = [];
  identitySignals.forEach((text) => opportunities.push({ text, kind: "hook", strength: 0.76, sources: [text] }));
  traitSignals.forEach((text) => opportunities.push({ text, kind: "character", strength: 0.86, sources: [text] }));
  preferenceSignals.forEach((text) => opportunities.push({ text, kind: "character", strength: 0.83, sources: [text] }));
  socialSignals.forEach((text) => opportunities.push({ text, kind: "social", strength: 0.82, sources: [text] }));
  continuitySignals.forEach((text) => opportunities.push({ text, kind: "callback", strength: 0.88, sources: [text] }));
  tensions.forEach((tension) => opportunities.push({ text: `${tension.left} ↔ ${tension.right}`, kind: tension.kind === "meaning_shift" ? "payoff" : "character", strength: tension.strength, sources: [tension.left, tension.right] }));

  const anchors = unique([
    ...identitySignals,
    ...typed.filter((fact) => fact.role === "anchor").map((fact) => fact.text),
  ]).slice(0, 8);

  const forbiddenExpansions = resolvedMode === "pet_social"
    ? ["no invented owners", "no invented home or neighborhood", "no invented body traits", "no invented dialogue", "no invented literal outings or events"]
    : resolvedMode === "memory"
      ? ["no invented relationship status", "no invented private feelings", "no invented dialogue", "no invented future events"]
      : ["no invented people", "no invented locations", "no invented objects", "no invented relationships", "no invented literal events"];

  return {
    mode: resolvedMode,
    facts: typed,
    anchors,
    tensions: tensions.sort((a, b) => b.strength - a.strength).slice(0, 12),
    opportunities: opportunities.sort((a, b) => b.strength - a.strength).slice(0, 16),
    identitySignals,
    traitSignals,
    preferenceSignals,
    socialSignals,
    activitySignals,
    continuitySignals,
    forbiddenExpansions,
  };
}

export function personalitySignature(profile: DomainCognitionProfile): string {
  const parts = [
    profile.identitySignals[0],
    profile.traitSignals.slice(0, 3).join(" + "),
    profile.preferenceSignals.slice(0, 3).join(" + "),
    profile.socialSignals.slice(0, 2).join(" + "),
  ].filter(Boolean);
  return clean(parts.join(" | "));
}

export function strongestDomainOpportunity(profile: DomainCognitionProfile): DomainOpportunity | undefined {
  return profile.opportunities[0];
}
