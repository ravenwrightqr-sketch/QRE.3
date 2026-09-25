/**
 * QRE AUTHOR BEAT TRUTH GATE
 *
 * Epistemic firewall between a generative movie planner and final realization.
 * The upstream beat is a hypothesis. Supplied evidence is the only source of
 * concrete reality. The gate may select evidence and describe allowed
 * relationships, but it never upgrades interpretation into fact.
 */

import { localModelGenerate } from "./localModelRuntime.js";

export type GroundedBeat = {
  order: number;
  role: string;
  gainKind: string;
  approvedEvidence: string[];
  creativeOpportunity: string;
  forbiddenClaims: string[];
  sourceBoundary: string;
};

function clean(value: unknown): string {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function words(value: string): Set<string> {
  return new Set(
    clean(value)
      .toLowerCase()
      .split(/[^a-z0-9'-]+/i)
      .filter(
        (word) => word.length >= 3,
      ),
  );
}

function parse(raw: string): {
  evidenceIndices?: unknown;
  creativeOpportunity?: unknown;
  forbiddenClaims?: unknown;
} | undefined {
  const text = clean(raw)
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();

  try {
    const value = JSON.parse(text) as Record<
      string,
      unknown
    >;

    return value &&
      typeof value === "object"
      ? value
      : undefined;
  } catch {
    return undefined;
  }
}

function normalizeIndices(
  value: unknown,
  size: number,
): number[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return [
    ...new Set(
      value
        .map((item) =>
          Number(item),
        )
        .filter(
          (item) =>
            Number.isInteger(
              item,
            ) &&
            item >= 0 &&
            item < size,
        ),
    ),
  ];
}

function normalizeEvidence(
  evidence: string[],
): string[] {
  return [
    ...new Set(
      evidence
        .map(clean)
        .filter(Boolean),
    ),
  ].slice(0, 16);
}

export async function groundAuthorBeat(
  input: {
    subject?: string;
    facts: string[];
    moments: string[];
    memory: string[];
    beat: {
      order: number;
      role: string;
      gainKind?: string;
      change?: string;
      frontier?: string;
      nextNeed?: string;
      necessity?: string;
    };
  },
): Promise<GroundedBeat> {
  const normalizedBeat = {
    order: input.beat.order,
    role:
      clean(input.beat.role) ||
      "discovery",
    gainKind:
      clean(input.beat.gainKind) ||
      "discovery",
    change: clean(
      input.beat.change,
    ),
    frontier: clean(
      input.beat.frontier,
    ),
    nextNeed: clean(
      input.beat.nextNeed,
    ),
    necessity: clean(
      input.beat.necessity,
    ),
  };

  const rawEvidence =
    normalizeEvidence([
      ...input.facts,
      ...input.moments,
      ...input.memory,
    ]);

  /*
   * Identity attributes stay attached to the subject. They do not become an
   * independent story entity unless the supplied prompt or evidence makes
   * them materially relevant to the selected movie.
   */
  const identityPattern =
    /^(?:male|female|man|woman|boy|girl|gender|he|she|him|her|his|hers)$/i;

  const identityEvidence =
    rawEvidence.filter((item) =>
      identityPattern.test(item),
    );

  const narrativeEvidence =
    rawEvidence.filter(
      (item) =>
        !identityPattern.test(item),
    );

  const system = [
    "You are QRE's AUTHOR BEAT TRUTH GATE.",
    "This is an epistemic firewall between a generative movie planner and final realization.",
    "The upstream beat is a HYPOTHESIS, never evidence. Treat every concrete claim inside it as untrusted until licensed by SUPPLIED_EVIDENCE.",
    "Select evidence only by integer index from SUPPLIED_EVIDENCE. Never create, merge, embellish, or paraphrase a new fact.",
    "Do not delete source evidence. SUPPLIED_EVIDENCE is the complete available truth set. The creative author decides which evidence matters for the line.",
    "Stable identity attributes are subject metadata by default, not a second character, plot device, theme, conflict, romance, or identity narrative unless the source explicitly makes them relevant.",
    "Preserve all factual material even when the current beat does not use it. Evidence selection is relevance, not truth deletion.",
    "Breed, color, name, size, role, category, location, or other stable attributes remain context unless the supplied reality or prompt makes them materially relevant to the selected movie.",
    "Classify unsupported upstream claims as forbiddenClaims whenever they upgrade separate evidence items into a new concrete event or relationship that the source never asserted.",
    "Example rule: separate supplied details do not automatically authorize a new combined event. A pair of related objects does not mean they were used together; an action and object do not mean the object participated in that action; a reaction is not implied merely because an event seems surprising.",
    "creativeOpportunity is NOT a scene description. It is only a relationship between supplied evidence: collision, contrast, double meaning, status tension, repetition, callback, recontextualization, implication, or character-specific absurdity.",
    "creativeOpportunity must NOT assert a new action, event, location, body position, reaction, outcome, dialogue, chronology, or causal explanation.",
    "Do not judge the final sentence. Preserve the strongest creative possibility that remains true.",
    "If the upstream beat is poisoned, discard the poisoned claim. Do NOT rescue it by guessing what probably happened.",
    "Return JSON with evidenceIndices, creativeOpportunity, forbiddenClaims.",
  ].join("\n");

  const user = JSON.stringify({
    SUBJECT:
      input.subject ?? "",
    SUPPLIED_EVIDENCE:
      rawEvidence.map(
        (text, index) => ({
          index,
          text,
        }),
      ),
    NARRATIVE_EVIDENCE:
      narrativeEvidence,
    IDENTITY_METADATA:
      identityEvidence,
    UPSTREAM_BEAT:
      normalizedBeat,
  });

  const result =
    await localModelGenerate(
      [
        {
          role: "system",
          content: system,
        },
        {
          role: "user",
          content: user,
        },
      ],
      "json",
      {
        numPredict: 360,
        temperature: 0.05,
      },
    );

  const parsed = parse(
    result.text,
  );

  const indices =
    normalizeIndices(
      parsed?.evidenceIndices,
      rawEvidence.length,
    );

  /*
   * Preserve the complete supplied truth set. Model indices only identify
   * which evidence is narratively strongest for this beat.
   */
  const approvedEvidence =
    rawEvidence;

  const selectedNarrative =
    indices
      .map(
        (index) =>
          rawEvidence[index],
      )
      .filter(Boolean)
      .filter(
        (item) =>
          !identityPattern.test(
            item,
          ),
      );

  const modelOpportunity = clean(
    parsed?.creativeOpportunity,
  );

  const forbiddenIdentityPattern =
    /\b(?:male|female|man|woman|boy|girl|gender|masquerade|pride|romantic relationship|gender conflict)\b/i;

  const concreteClaimPattern =
    /\b(?:wears?|wearing|dances?|dancing|holds?|holding|walks?|walking|runs?|running|sits?|sitting|stands?|standing|arrives?|arriving|everyone|someone|nobody|surprised|shocked|laughs?|laughing|catches?|caught|ties?\s+(?:a|the)\s+\w+)\b/i;

  const fallbackPool =
    selectedNarrative.length
      ? selectedNarrative
      : narrativeEvidence;

  const creativeOpportunity =
    modelOpportunity &&
    !concreteClaimPattern.test(
      modelOpportunity,
    ) &&
    !forbiddenIdentityPattern.test(
      modelOpportunity,
    )
      ? modelOpportunity
      : `Find the sharpest relationship among: ${fallbackPool.join("; ")}`;

  const forbiddenClaims =
    Array.isArray(
      parsed?.forbiddenClaims,
    )
      ? parsed!.forbiddenClaims
          .map(clean)
          .filter(Boolean)
          .slice(0, 16)
      : [];

  return {
    order:
      normalizedBeat.order,
    role:
      normalizedBeat.role,
    gainKind:
      normalizedBeat.gainKind,
    approvedEvidence,
    creativeOpportunity,
    forbiddenClaims,
    sourceBoundary:
      "Approved evidence is the complete supplied truth set. Stable identity metadata is subject context by default, not an independent character or plot driver. The upstream beat is never evidence. Creative phrasing may reinterpret relationships but may not add concrete events, actions, physical states, reactions, or outcomes.",
  };
}
