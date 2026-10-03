import type { AuthorDomainContext, AuthorScene } from "@qre/contracts";
import { localModelGenerate } from "./localModelRuntime.js";
import type { AuthorDerivedMeaning } from "./authorDerivedMeaning.js";

const clean = (value: unknown): string =>
  String(value ?? "").replace(/\s+/g, " ").trim();

const unique = (values: readonly string[]): string[] =>
  [...new Set(values.map(clean).filter(Boolean))];

function parseJson(text: string): Record<string, unknown> | undefined {
  const source = clean(text)
    .replace(/^\`\`\`(?:json)?/i, "")
    .replace(/\`\`\`$/i, "")
    .trim();

  if (!source) return undefined;

  try {
    const value = JSON.parse(source);
    return value && typeof value === "object"
      ? value as Record<string, unknown>
      : undefined;
  } catch {
    const start = source.indexOf("{");
    const end = source.lastIndexOf("}");
    if (start < 0 || end <= start) return undefined;
    try {
      const value = JSON.parse(source.slice(start, end + 1));
      return value && typeof value === "object"
        ? value as Record<string, unknown>
        : undefined;
    } catch {
      return undefined;
    }
  }
}

type AtomicVerification = {
  sceneIndex?: unknown;
  clauseIndex?: unknown;
  supported?: unknown;
  supportKind?: unknown;
  sourceEventIds?: unknown;
  concreteClaims?: unknown;
  unsupportedClaims?: unknown;
};

export type AuthorGroundingSupportKind =
  | "DIRECT"
  | "PARAPHRASE"
  | "FIGURATIVE"
  | "CONTEXTUAL_TEXTURE"
  | "UNSUPPORTED";

export type AuthorGroundingAuditClassification =
  | "SUPPORTED_REALITY"
  | "KEEP_EXPRESSION"
  | "UNSUPPORTED_REALITY";

export type AuthorGroundingAuditSpan = {
  exactText: string;
  classification: AuthorGroundingAuditClassification;
  sourceEventIds: string[];
};

export type AuthorGroundingScene = AuthorScene & {
  sourceEventIds: string[];
  auditSpans?: readonly AuthorGroundingAuditSpan[];
};

export type AuthorGroundingAtomicClause = {
  sceneIndex: number;
  clauseIndex: number;
  text: string;
  groundingHint: string[];
  priorAudit?: AuthorGroundingAuditSpan;
};

export type AuthorGroundingAtomicAuthority = {
  sceneIndex: number;
  clauseIndex: number;
  text: string;
  groundingHint: string[];
  supported: boolean;
  supportKind?: AuthorGroundingSupportKind;
  sourceEventIds: string[];
  concreteClaims: string[];
  unsupportedClaims: string[];
};

function beatClauseFragments(text: string): string[] {
  const fragments = clean(text)
    .split(/(?<=[.!?])\s+|\s*[;|]\s*/g)
    .map((part) => clean(part))
    .filter(Boolean);

  return fragments.length ? fragments.slice(0, 12) : [clean(text)].filter(Boolean);
}

function beatClauses(text: string): string[] {
  return beatClauseFragments(text)
    .map((part) => clean(part.replace(/[.!?]+$/g, "")))
    .filter(Boolean);
}

function auditSpanForFragment(
  fragment: string,
  auditSpans: readonly AuthorGroundingAuditSpan[] | undefined,
): AuthorGroundingAuditSpan | undefined {
  const matches = (auditSpans ?? []).filter(
    (span) => clean(span.exactText) === clean(fragment),
  );
  if (matches.length !== 1) return undefined;
  const match = matches[0]!;
  return {
    exactText: match.exactText,
    classification: match.classification,
    sourceEventIds: unique(match.sourceEventIds),
  };
}

export function buildAuthorGroundingAtomicClauses(
  scenes: readonly AuthorGroundingScene[],
): AuthorGroundingAtomicClause[] {
  return scenes.flatMap((scene, sceneIndex) => {
    const fragments = beatClauseFragments(scene.text);
    const clauses = beatClauses(scene.text);
    return clauses.map((text, clauseIndex) => {
      const fragment = fragments[clauseIndex] ?? "";
      const priorAudit = auditSpanForFragment(fragment, scene.auditSpans);
      return {
        sceneIndex,
        clauseIndex,
        text,
        groundingHint: scene.sourceEventIds,
        ...(priorAudit ? { priorAudit } : {}),
      };
    });
  });
}

function supportKindFrom(value: unknown): AuthorGroundingSupportKind | undefined {
  const supportKind = clean(value).toUpperCase();
  if (
    supportKind === "DIRECT" ||
    supportKind === "PARAPHRASE" ||
    supportKind === "FIGURATIVE" ||
    supportKind === "CONTEXTUAL_TEXTURE" ||
    supportKind === "UNSUPPORTED"
  ) {
    return supportKind;
  }
  return undefined;
}

function cleanStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value
        .filter((item): item is string => typeof item === "string")
        .map(clean)
        .filter(Boolean)
    : [];
}

function applyAuthorGroundingVerificationsWithAuthority(input: {
  scenes: readonly AuthorGroundingScene[];
  suppliedReality: readonly { id: string; text: string }[];
  verifications: readonly unknown[];
}): {
  scenes: AuthorGroundingScene[];
  atomicAuthority: AuthorGroundingAtomicAuthority[];
} {
  const allowedIds = new Set(input.suppliedReality.map((event) => event.id));
  const suppliedRealityText = input.suppliedReality
    .map((event) => event.text)
    .join(" ");

  const verificationByClause = new Map<string, AtomicVerification>();

  for (const value of input.verifications) {
    if (!value || typeof value !== "object") continue;
    const item = value as AtomicVerification;
    const sceneIndex = Number(item.sceneIndex);
    const clauseIndex = Number(item.clauseIndex);
    if (!Number.isInteger(sceneIndex) || !Number.isInteger(clauseIndex)) continue;
    verificationByClause.set(`${sceneIndex}:${clauseIndex}`, item);
  }

  const authorityByClause = new Map<string, AuthorGroundingAtomicAuthority>();

  for (const clause of buildAuthorGroundingAtomicClauses(input.scenes)) {
    const item = verificationByClause.get(`${clause.sceneIndex}:${clause.clauseIndex}`);
    const supportKind = supportKindFrom(item?.supportKind);
    const supportKindText = supportKind ?? clean(item?.supportKind).toUpperCase();
    const concreteClaims = cleanStringArray(item?.concreteClaims);
    const rawUnsupportedClaims = cleanStringArray(item?.unsupportedClaims);
    const unsupportedClaims = reconciledUnsupportedClaims({
      clauseText: clause.text,
      supported: item?.supported,
      supportKind: supportKindText,
      concreteClaims,
      unsupportedClaims: rawUnsupportedClaims,
    });
    const allowedSupportKind =
      supportKind === "DIRECT" ||
      supportKind === "PARAPHRASE" ||
      supportKind === "FIGURATIVE" ||
      supportKind === "CONTEXTUAL_TEXTURE";
    const contradictoryConcreteFraming =
      (supportKind === "FIGURATIVE" || supportKind === "CONTEXTUAL_TEXTURE") &&
      concreteClaims.length > 0;
    const rawSourceEventIds = item?.sourceEventIds;
    const sourceEventIds = Array.isArray(rawSourceEventIds)
      ? unique(
          rawSourceEventIds
            .filter((id): id is string => typeof id === "string")
            .filter((id) => allowedIds.has(id)),
        )
      : [];
    const fragment =
      beatClauseFragments(input.scenes[clause.sceneIndex]?.text ?? "")[clause.clauseIndex] ?? "";
    const unsupportedSensoryClaim =
      hasUnsupportedSensoryClaim(fragment, suppliedRealityText) &&
      supportKind !== "FIGURATIVE" &&
      supportKind !== "CONTEXTUAL_TEXTURE";
    const supported =
      item?.supported === true &&
      allowedSupportKind &&
      !unsupportedClaims.length &&
      !contradictoryConcreteFraming &&
      sourceEventIds.length > 0 &&
      Boolean(fragment) &&
      !unsupportedSensoryClaim;

    authorityByClause.set(`${clause.sceneIndex}:${clause.clauseIndex}`, {
      sceneIndex: clause.sceneIndex,
      clauseIndex: clause.clauseIndex,
      text: clause.text,
      groundingHint: [...clause.groundingHint],
      supported,
      ...(supportKind ? { supportKind } : {}),
      sourceEventIds: supported ? sourceEventIds : [],
      concreteClaims,
      unsupportedClaims,
    });
  }

  // Timing words are interpreted semantically by the verifier model and unsupported-claim reconciliation.
  // There is no second vocabulary-level veto here.
  const scenes = input.scenes.flatMap((scene, sceneIndex) => {
    const fragments = beatClauseFragments(scene.text);
    const clauses = beatClauses(scene.text);
    const supportedIds = new Set<string>();
    const supportedFragments: string[] = [];

    for (let clauseIndex = 0; clauseIndex < clauses.length; clauseIndex += 1) {
      const authority = authorityByClause.get(`${sceneIndex}:${clauseIndex}`);
      if (!authority?.supported) continue;

      const fragment = fragments[clauseIndex];
      if (!fragment) continue;

      supportedFragments.push(fragment);
      authority.sourceEventIds.forEach((id) => supportedIds.add(id));
    }

    if (!supportedFragments.length || !supportedIds.size) return [];

    const text = clean(supportedFragments.join(" "));

    return [{
      ...scene,
      text,
      sourceEventIds: [...supportedIds],
    }];
  });

  return {
    scenes,
    atomicAuthority: [...authorityByClause.values()],
  };
}

export function applyAuthorGroundingVerifications(input: {
  scenes: readonly AuthorGroundingScene[];
  suppliedReality: readonly { id: string; text: string }[];
  verifications: readonly unknown[];
}): AuthorGroundingScene[] {
  return applyAuthorGroundingVerificationsWithAuthority(input).scenes;
}

const SENSORY_CLAIM_LANGUAGE =
  /\b(smell|smells|smelled|scent|scents|scented|taste|tastes|tasted|flavor|flavors|sound|sounds|sounded|noise|noises|texture|textures|touch|touches|touched|feel|feels|felt)\b/i;

function hasUnsupportedSensoryClaim(
  sceneText: string,
  suppliedRealityText: string,
): boolean {
  const sceneMatches = clean(sceneText).match(
    new RegExp(SENSORY_CLAIM_LANGUAGE.source, "ig"),
  );
  if (!sceneMatches?.length) return false;

  const reality = clean(suppliedRealityText).toLowerCase();
  return sceneMatches.some((claim) => !reality.includes(claim.toLowerCase()));
}


function comparableClaim(value: unknown): string {
  return clean(value)
    .toLowerCase()
    .replace(/[.!?;:,"'’“”()[\]{}]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function reconciledUnsupportedClaims(input: {
  clauseText: string;
  supported: unknown;
  supportKind: string;
  concreteClaims: string[];
  unsupportedClaims: string[];
}): string[] {
  if (
    input.supported !== true ||
    input.supportKind === "UNSUPPORTED" ||
    input.concreteClaims.length > 0
  ) {
    return input.unsupportedClaims;
  }

  const clause = comparableClaim(input.clauseText);
  return input.unsupportedClaims.filter((claim) => {
    const normalized = comparableClaim(claim);
    return Boolean(normalized) && normalized !== clause;
  });
}

export async function verifyAuthorCreativeGrounding(input: {
  scenes: AuthorGroundingScene[];
  suppliedReality: readonly { id: string; text: string }[];
  semanticAuthority?: readonly string[];
  derivedMeaning?: AuthorDerivedMeaning;
  domainContext?: AuthorDomainContext;
}): Promise<{
  scenes: AuthorGroundingScene[];
  atomicAuthority: AuthorGroundingAtomicAuthority[];
  model: string;
  modelCalls: number;
}> {
  if (!input.scenes.length) {
    return {
      scenes: [],
      atomicAuthority: [],
      model: "none",
      modelCalls: 0,
    };
  }

  const atomicClauses = buildAuthorGroundingAtomicClauses(input.scenes);

  const system = [
    "You are QRE Atomic Semantic Grounding.",
    "Reality is authority.",
    "",
    "You receive ATOMIC_CLAUSES plus the full SEQUENCE. Audit every clause independently, but interpret each clause pragmatically in the context of the full sequence.",
    "Distinguish MATERIAL REALITY from STORY TEXTURE.",
    "MATERIAL REALITY includes entities, actions, states, relationships, ownership, motive, causality, chronology, success or failure, completed outcomes, measurements, quantities, colors, temperatures, materials, sensory properties, physical attributes, physical manifestations, methods, components, environmental details, and concrete state changes. Material reality must be directly established by SUPPLIED_REALITY or be an unavoidable semantic paraphrase.",
    "Reality is closed; discourse is open. New language, generalized reference, rhetorical POV, personification, implication, metaphor, and derived significance may be grounded when they create no additional world commitment.",
    "DERIVED_MEANING contains previously checked alternative interpretations. It may inform reading of expression, but it never authorizes additional material reality; audit concrete claims against SUPPLIED_REALITY alone.",
    "Mention is not participation. A category, role, group, narrator, institution, object voice, place voice, or social class may appear in expressive language without becoming a factual participant in the occurrence.",
    "POV licenses voice, not events. A rhetorical speaker is not automatically a literal actor, observer, thinker, or source of additional history.",
    "Universal authority test: strip away rhetoric, metaphor, POV, personification, generalized reference, abstraction, comparison, implication, interpretation, attitude, and discovered significance; then ask what additional thing the viewer must believe actually happened.",
    "A supplied object, entity, event, action, state, or relationship licenses that supplied reality only.",
    "Existence does not establish properties. A supplied event or object does not establish an unreported measurement, quantity, color, temperature, material, sensory property, physical attribute, physical manifestation, method, component, environmental detail, cause, outcome, mental state, preference, motive, or other concrete specificity.",
    "A supplied specificity becomes usable reality, but it does not unlock neighboring properties.",
    "Do not infer details from common sense, world knowledge, domain familiarity, likelihood, typical consequences, implication, association, narrative convention, or what usually happens.",
    "An action does not establish its method, manner, tool, component, motive, preference, success, failure, ownership, or outcome unless supplied.",
    "A state or emotion does not establish bodily behavior, visible manifestation, private thought, preference, cause, or later continuity unless supplied.",
    "Chronology does not establish causality, resolution, transition mechanism, urgency, or duration beyond what is supplied.",
    "Audit every material qualifier as well as the main action. In concreteClaims include timing, manner, degree, and continuity asserted by the clause; support for the action alone does not support its modifiers.",
    "An ordered sequence establishes order, not immediacy. A timing qualifier that asserts how soon an action happened needs supplied timing evidence even when the action itself is supplied.",
    "A recurrence establishes only the supplied recurrence, not predictability, routine, habit, inevitability, cadence, or cause unless supplied.",
    "PARAPHRASE must preserve predicate type. A state may paraphrase to the same supplied state type, an action to the same supplied action type, and a property to the same supplied property type. It may not cross into a neighboring concrete or mental fact.",
    "Do not decide by vocabulary alone. Decide whether the clause is nonliteral framing of supplied reality or whether it asserts an additional concrete or mental fact.",
    "Near-completion, comparative timing, compressed timing, and continuity language make material claims when they change trajectory, duration, abruptness, persistence, or sequence. Those claims require supplied evidence.",
    "STORY TEXTURE may be allowed only when it is nonliteral framing of the supplied reality itself. WORLD_CONTEXT may help interpret vocabulary, but it cannot supply missing specifics.",
    "A supplied duration establishes elapsed duration, not a timer, deadline, countdown, schedule limit, felt duration, or forced stopping condition unless those specifics are supplied.",
    "Do not convert a supplied action into unsupplied manner, method, motive, ownership, success, completion, release, resistance, preference, or outcome.",
    "Do not convert chronology or an ending into causality, resolution, transition, relief, acceptance, or a reason for the later state unless reality explicitly establishes it.",
    "A supplied before-state and after-state establish contrast, not the mechanism of transition. Even when phrased figuratively, reject language that adds an unseen transition mechanism unless supplied.",
    "A state-change metaphor is not automatically harmless texture. Ask whether it merely renders the supplied state itself, or whether it smuggles in an unseen transition mechanism between states.",
    "Do not carry a state forward across time merely because it was established earlier in the sequence. Continuity must be explicitly supplied.",
    "A later beat may callback to an earlier state as earlier context, but it may not re-assert that state as contemporaneous with the later event unless supplied.",
    "Do not strengthen a supplied state into a different unsupported condition.",
    "An associated place, object, body part, sensory property, actor, physical consequence, scenery element, weather condition, or lighting element is a new concrete claim unless supplied.",
    "Do not use CONTEXTUAL_TEXTURE as a generic mood generator for emotions or states. Texture must attach to supplied reality without adding hidden world material.",
    "Preserve object identity. Figurative language may react to or characterize a supplied object, but it must not silently replace that object or turn one supplied property into another unsupplied property.",
    "Distinguish performed attitude from asserted motive. A line can sound evaluative or dramatic without establishing that the subject actually held a motive, preference, decision, or private state.",
    "",
    "Creative figurative language may survive when a reasonable viewer reads it as nonliteral framing of supplied reality and it carries no unsupported concrete premise.",
    "Figurative language and derived meaning are grounded when their meaning can be derived from SUPPLIED_REALITY without requiring an unsupplied hidden concrete occurrence.",
    "Derived meaning may say a supplied event mattered, changed how another supplied event reads, became setup, became payoff, felt less accidental, or gained significance, provided it does not add an unsupplied event, action, participant, object, place, physical state, mental state, cause, chronology, outcome, property, measurement, sensory detail, or state change.",
    "A rhetorical role may be applied to a supplied fact without creating a world fact. Reject rhetorical pressure when it crosses into a material entity, event, property, state, cause, method, measurement, or outcome.",
    "Generalized category commentary may survive when it does not require a specific unsupplied member to have existed, acted, interacted, observed, felt, caused, received, occupied a concrete relation, or changed the world.",
    "A clause is UNSUPPORTED when understanding it requires the viewer to believe that an unsupplied concrete occurrence exists, happened, persisted, caused something, felt something, observed something, or was present outside SUPPLIED_REALITY.",
    "Nonliteral wording does not make hidden entities, hidden states, hidden causes, hidden observers, hidden routines, hidden traces, or hidden outcomes safe.",
    "APPROVED_SEMANTIC_AUTHORITY is upstream non-factual meaning already accepted by QRE Discovery. It may authorize abstract framing, implication, status language, metaphor, performed attitude, or relation words that express that approved meaning. It NEVER authorizes a new entity, object, action, location, cause, chronology, motive, ownership fact, physical property, measurement, sensory detail, completed outcome, or other concrete occurrence.",
    "Voice and personification may use words that would be material if read literally, but only when the full sequence makes the nonliteral performance clear. Do not call that PARAPHRASE. If the sequence instead reads as a factual claim, reject it.",
    "Questions, reactions, fragments, attitude, metaphor, understatement, and exaggeration are allowed only when they do not assert hidden reality.",
    "A hidden mental proposition is hidden reality too. Do not accept an unspoken question, expectation, test, evaluation, decision, near-miss, almost-outcome, or latent relationship state unless SUPPLIED_REALITY establishes that premise. Do not treat derived significance or relation words by themselves as hidden mental propositions when they introduce no new concrete occurrence.",
    "Figurative language may transform supplied events, but it may not invent what someone was privately asking, expecting, testing, deciding, hoping, almost doing, or nearly becoming.",
    "FIGURATIVE, PARAPHRASE, and CONTEXTUAL_TEXTURE cannot sanitize an embedded unsupported concrete or mental proposition.",
    "Words are not violations by vocabulary alone. Decide whether the clause actually asserts unsupported material reality or only amplifies supplied reality.",
    "",
    "For each atomic clause:",
    "1. extract concreteClaims: every material real-world claim or relational premise carried by the clause;",
    "2. choose supportKind: DIRECT, PARAPHRASE, FIGURATIVE, CONTEXTUAL_TEXTURE, or UNSUPPORTED;",
    "3. list unsupportedClaims: every material claim not established by SUPPLIED_REALITY;",
    "4. cite sourceEventIds that anchor the clause;",
    "5. set supported=true only when supportKind is not UNSUPPORTED, unsupportedClaims is empty, and at least one supplied event semantically anchors the clause.",
    "Your fields must agree. If supported=true, unsupportedClaims MUST be []. If any unsupported material claim exists, set supported=false and supportKind=UNSUPPORTED.",
    "If supportKind is FIGURATIVE or CONTEXTUAL_TEXTURE, concreteClaims should normally be [] because the clause is being accepted as nonliteral framing rather than as a material assertion. Do not label a metaphorical word itself as a concrete claim while also accepting it as figurative texture.",
    "Do not put the clause itself into unsupportedClaims merely because it is compressed, figurative, or contextual texture. unsupportedClaims is only for material claims that exceed reality.",
    "CONTEXTUAL_TEXTURE is allowed only for non-material scene texture. Never use it to excuse a new action, body behavior, outcome, motive, ownership, cause, chronology, or state change.",
    "",
    "groundingHint is only a clue from the writer. Never treat it as evidence by itself.",
    "priorAudit is upstream Claim Auditor context attached to an exact surviving authored span when available. It is not evidence, proof, support, or a bypass.",
    "Never set supported=true because priorAudit.classification is KEEP_EXPRESSION or SUPPORTED_REALITY.",
    "Never treat priorAudit.sourceEventIds as proof. Supplied reality remains the truth authority.",
    "Unsupported concrete or mental reality must still be rejected even if priorAudit classified the span as KEEP_EXPRESSION.",
    "Return exactly one verification for every atomic clause, preserving sceneIndex and clauseIndex.",
  ].join("\n");

  const result = await localModelGenerate(
    [
      { role: "system", content: system },
      {
        role: "user",
        content: JSON.stringify({
          SUPPLIED_REALITY: input.suppliedReality,
          WORLD_CONTEXT: input.domainContext,
          APPROVED_SEMANTIC_AUTHORITY: input.semanticAuthority ?? [],
          DERIVED_MEANING: input.derivedMeaning ?? { kind: "DERIVED_MEANING", relations: [] },
          SEQUENCE: input.scenes.map((scene, sceneIndex) => ({
            sceneIndex,
            text: scene.text,
          })),
          ATOMIC_CLAUSES: atomicClauses,
          instruction:
            "Audit every atomic clause independently, but read the whole SEQUENCE before deciding what each clause pragmatically means. Protect material truth while preserving imaginative story texture and performed voice. FIGURATIVE, generalized reference, rhetorical POV, personification, implication, and derived meaning are grounded when their meaning comes from SUPPLIED_REALITY and requires no additional participation; if understanding the clause requires a hidden entity, observer, concrete or mental state, material cause, outcome, persistence, routine, trace, presence, or other new concrete occurrence, mark it UNSUPPORTED. Treat APPROVED_SEMANTIC_AUTHORITY as permission for nonliteral framing only; do not require its abstract relation words to be literally present in SUPPLIED_REALITY, and never let it authorize a concrete event. Keep fields logically consistent: supported=true requires unsupportedClaims=[]. Preserve object identity, predicate type, sequence, duration, recurrence, and source evidence. WORLD_CONTEXT helps interpret texture and vocabulary but never becomes historical evidence.",
        }),
      },
    ],
    "json",
    {
      numPredict: Math.max(420, atomicClauses.length * 90),
      openRouterMaxTokens: 1200,
      temperature: 0.06,
      jsonSchema: {
        type: "object",
        additionalProperties: false,
        required: ["verifications"],
        properties: {
          verifications: {
            type: "array",
            minItems: atomicClauses.length,
            maxItems: atomicClauses.length,
            items: {
              type: "object",
              additionalProperties: false,
              required: [
                "sceneIndex",
                "clauseIndex",
                "supported",
                "supportKind",
                "sourceEventIds",
                "concreteClaims",
                "unsupportedClaims",
              ],
              properties: {
                sceneIndex: {
                  type: "integer",
                  minimum: 0,
                  maximum: Math.max(0, input.scenes.length - 1),
                },
                clauseIndex: {
                  type: "integer",
                  minimum: 0,
                  maximum: 11,
                },
                supported: { type: "boolean" },
                supportKind: {
                  type: "string",
                  enum: ["DIRECT", "PARAPHRASE", "FIGURATIVE", "CONTEXTUAL_TEXTURE", "UNSUPPORTED"],
                },
                sourceEventIds: {
                  type: "array",
                  maxItems: 32,
                  items: { type: "string", maxLength: 64 },
                },
                concreteClaims: {
                  type: "array",
                  maxItems: 12,
                  items: { type: "string", maxLength: 120 },
                },
                unsupportedClaims: {
                  type: "array",
                  maxItems: 12,
                  items: { type: "string", maxLength: 120 },
                },
              },
            },
          },
        },
      },
    },
  );

  const parsed = parseJson(result.text);
  const raw = Array.isArray(parsed?.verifications)
    ? parsed.verifications
    : [];

  const grounded = applyAuthorGroundingVerificationsWithAuthority({
    scenes: input.scenes,
    suppliedReality: input.suppliedReality,
    verifications: raw,
  });

  return {
    scenes: grounded.scenes,
    atomicAuthority: grounded.atomicAuthority,
    model: result.model,
    modelCalls: 1,
  };
}
