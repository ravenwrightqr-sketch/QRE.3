import type { AuthorRealityProvenance } from "@qre/contracts";
import { provenanceForbids } from "./authorRealityProvenance.js";

type GateFact = {
  text: string;
  provenance: AuthorRealityProvenance;
};

export type ProvenanceViolation = {
  line: number;
  reason:
    | "unsupported_place"
    | "unsupported_object"
    | "unsupported_person"
    | "unsupported_relationship"
    | "unsupported_body_detail"
    | "unsupported_literal_event"
    | "unsupported_chronology"
    | "unsupported_private_fact";
  detail: string;
};

const PLACE = /\b(?:street|office|room|chair|table|bed|floor|counter|dresser|park|restaurant|hotel|house|kitchen|bathroom|store|shop|court|church|school|hospital|lobby|door|window|hallway|garage|yard|living room|bedroom|dining room|desk|countertop|sink|trash|mirror|bar|venue|backyard|front yard|sidewalk|trail|beach|park)\b/i;
const OBJECT = /\b(?:towel|towels|bow|bows|ball|balls|tennis ball|toy|toys|bone|bones|treat|treats|bowl|bowls|cup|glass|plate|dish|key|keys|phone|camera|mirror|photograph|photo|letter|note|bag|box|gift|shoes|shirt|dress|ring|flowers|candle|candles|menu|carpet|pillow|blanket|soap|brush|comb|leash|collar|receipt|contract|clause|document|paper|tool|engine|wheel|tire|warning light|ribbon|ribbons|stick|sticks|food|book|books|hat|hats|jacket|coat|umbrella|chair|table|lamp|wallet|watch)\b/i;
const PERSON = /\b(?:man|woman|boy|girl|person|people|customer|client|owner|guest|buyer|seller|agent|doctor|nurse|lawyer|groomer|housekeeper|mechanic|barber|photographer|friend|partner|husband|wife|girlfriend|boyfriend|sister|brother|mother|father|son|daughter)\b/i;
const BODY = /\b(?:tail|tails|legs|leg|ears|ear|paws|paw|eyes|eye|mouth|teeth|face|head|hands|hand|feet|foot|shoulder|hair|skin|body|gaze)\b/i;
const CHRONOLOGY = /\b(?:before|after|earlier|later|first|next|then|finally|already|again|returned|back)\b/i;
const PRIVATE = /\b(?:secretly|privately|deep down|inside|felt that|wanted|hated|loved them|dated|married|divorced|owned|rented|lived)\b/i;
const PREFERENCE = /\b(?:love|loves|like|likes|prefer|prefers|favorite|enjoy|enjoys|hate|hates|dislike|dislikes)\b/i;

const tokens = (value: string): Set<string> =>
  new Set(
    value
      .toLowerCase()
      .split(/[^a-z0-9'-]+/)
      .filter((v) => v.length > 2),
  );

const overlap = (a: string, b: string): number => {
  const left = tokens(a);
  const right = tokens(b);
  if (!left.size || !right.size) return 0;
  let shared = 0;
  for (const token of left) if (right.has(token)) shared += 1;
  return shared / Math.max(left.size, right.size);
};

function factSupportsLine(line: string, fact: GateFact): boolean {
  const lineTokens = tokens(line);
  const factTokens = tokens(fact.text);
  if (!lineTokens.size || !factTokens.size) return false;

  // A subject-prefixed realization such as "Coco loves bacon" is still
  // grounded by the source fact "loves bacon" because the complete fact
  // phrase is contained in the generated line.
  const factContained = [...factTokens].every((token) => lineTokens.has(token));
  return factContained || overlap(line, fact.text) >= 0.6;
}

function isPreferenceUse(line: string, match: string): boolean {
  // A preference like "loves bacon" is not an object invention merely
  // because the preferred thing is also physically describable.
  return match.toLowerCase() === "bacon" && PREFERENCE.test(line);
}

function hasForbiddenKind(
  line: string,
  facts: GateFact[],
  pattern: RegExp,
  expansion: AuthorRealityProvenance["forbiddenExpansions"][number],
): boolean {
  const match = line.match(pattern)?.[0];
  if (!match) return false;
  if (expansion === "invent_object" && isPreferenceUse(line, match)) return false;

  const supporting = facts.some(
    (fact) =>
      factSupportsLine(line, fact) &&
      !provenanceForbids(fact.provenance, expansion),
  );

  return !supporting;
}

export function validateAuthorProvenance(
  lines: string[],
  facts: GateFact[],
): ProvenanceViolation[] {
  const violations: ProvenanceViolation[] = [];
  let lastFactIndex = -1;

  lines.forEach((line, index) => {
    if (hasForbiddenKind(line, facts, PLACE, "invent_place")) {
      violations.push({
        line: index + 1,
        reason: "unsupported_place",
        detail: "line introduces a place not authorized by its supporting facts",
      });
    }

    if (hasForbiddenKind(line, facts, OBJECT, "invent_object")) {
      violations.push({
        line: index + 1,
        reason: "unsupported_object",
        detail: "line introduces an object not authorized by its supporting facts",
      });
    }

    if (hasForbiddenKind(line, facts, PERSON, "invent_person")) {
      violations.push({
        line: index + 1,
        reason: "unsupported_person",
        detail: "line introduces a person not authorized by its supporting facts",
      });
    }

    if (hasForbiddenKind(line, facts, BODY, "invent_body_detail")) {
      violations.push({
        line: index + 1,
        reason: "unsupported_body_detail",
        detail: "line introduces a body detail not authorized by its supporting facts",
      });
    }

    if (
      PRIVATE.test(line) &&
      facts.every((fact) =>
        provenanceForbids(fact.provenance, "invent_private_fact"),
      )
    ) {
      violations.push({
        line: index + 1,
        reason: "unsupported_private_fact",
        detail: "line asserts private/internal information not observed in the source",
      });
    }

    const matchedIndex = facts.findIndex((fact) => factSupportsLine(line, fact));
    if (matchedIndex >= 0) {
      const provenance = facts[matchedIndex]!.provenance;
      if (
        CHRONOLOGY.test(line) &&
        !provenance.permissions.includes("reorder")
      ) {
        if (matchedIndex < lastFactIndex) {
          violations.push({
            line: index + 1,
            reason: "unsupported_chronology",
            detail: "line changes the supplied event order",
          });
        }
      }
      lastFactIndex = Math.max(lastFactIndex, matchedIndex);
    }
  });

  return violations;
}

export function provenanceGatePasses(
  lines: string[],
  facts: GateFact[],
): boolean {
  return validateAuthorProvenance(lines, facts).length === 0;
}
