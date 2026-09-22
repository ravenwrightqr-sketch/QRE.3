import type { AuthorDomainContext, AuthorScene } from "@qre/contracts";
import { localModelGenerate } from "./localModelRuntime.js";

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
  scenes: Array<AuthorScene & { sourceEventIds: string[] }>;
  suppliedReality: readonly { id: string; text: string }[];
  semanticAuthority?: readonly string[];
  domainContext?: AuthorDomainContext;
}): Promise<{
  scenes: Array<AuthorScene & { sourceEventIds: string[] }>;
  model: string;
  modelCalls: number;
}> {
  if (!input.scenes.length) {
    return {
      scenes: [],
      model: "none",
      modelCalls: 0,
    };
  }

  const atomicClauses = input.scenes.flatMap((scene, sceneIndex) =>
    beatClauses(scene.text).map((text, clauseIndex) => ({
      sceneIndex,
      clauseIndex,
      text,
      groundingHint: scene.sourceEventIds,
    })),
  );

  const system = [
    "You are QRE Atomic Semantic Grounding.",
    "Reality is authority.",
    "",
    "You receive ATOMIC_CLAUSES plus the full SEQUENCE. Audit every clause independently, but interpret each clause pragmatically in the context of the full sequence.",
    "Distinguish MATERIAL REALITY from STORY TEXTURE.",
    "MATERIAL REALITY includes actors, deliberate actions, body actions, objects materially introduced into the event, ownership, motive, causality, chronology, success/failure, completed outcomes, relational status, and physical state changes. Material reality must be directly established by SUPPLIED_REALITY or be an unavoidable semantic paraphrase.",
    "STORY TEXTURE may be allowed only when a clause is a nonliteral or hyperbolic rendering of the physical envelope already inherent in an explicitly supplied event. WORLD_CONTEXT may help interpret that texture but cannot supply missing scenery or physical details.",
    "Story texture must not change what happened. It cannot add a new actor, deliberate action, body action, ownership, motive, causal relation, successful outcome, chronology, or consequential state.",
    "Typicality alone is not enough for material reality, but ordinary event texture can support non-material creative language. Example: in a supplied bath inside grooming context, 'Water. Everywhere.' can function as hyperbolic texture around the bath; it does not mean QRE knows a literal flood occurred.",
    "By contrast, a supplied bath does not establish that the subject shook, wagged, escaped, resisted, liked it, hated it, or became free.",
    "Do not convert emotion into body behavior. Happy does not establish wagging, smiling, jumping, posture, movement, or excitement.",
    "PARAPHRASE must preserve predicate type. An emotion/state may paraphrase to another emotion/state word, but never to a physical action. A physical action may paraphrase to another description of that same action, but not to a merely associated action.",
    "Do not decide by vocabulary alone. A bodily phrase can function as expressive embodiment rather than historical reporting. If a reasonable viewer reads a phrase such as 'Pulse quickens.' as stylized felt language for supplied nervousness, it may be FIGURATIVE and need not assert a measured physical event. But a concrete bodily action that reads as something the subject literally did—such as 'Tail wags', 'she jumped', or 'he paced the room'—is MATERIAL REALITY and requires support.",
    "Near-completion language still makes a material claim. Words such as almost, nearly, about to, close to, or on the verge of an outcome require reality to establish that trajectory toward the outcome. An attempted action does not by itself establish that success was nearly achieved.",
    "Comparative or compressed timing is also a claim when it changes how long something lasted or how abruptly it happened. Words such as brief, briefly, long, quickly, suddenly, promptly, instantly, finally, or still require supplied reality or sequence context that genuinely supports that timing relation. Do not excuse them as texture when they label duration or abruptness not established by the facts.",
    "A supplied duration establishes elapsed duration, not a timer, deadline, countdown, schedule limit, or forced stopping condition. 'Time’s up', 'clock ran out', or equivalent deadline language is UNSUPPORTED unless such a timer/deadline is supplied.",
    "A supplied walk establishes walking, not manner of gait. Words such as ambled, trotted, bounded, hurried, dragged, wandered, or strolled add physical manner unless supplied and must be rejected when used literally.",
    "Do not convert an attempted action into motive, ownership, success, completion, release, freedom, rebellion, resistance, or preference unless reality explicitly establishes that claim.",
    "Do not convert chronology or an ending into causality, resolution, finally, freedom, relief, acceptance, or a reason for the later state unless reality explicitly establishes it.",
    "Do not carry a state forward across time merely because it was established earlier in the sequence. If a person was lighter afterward and then met someone again the next week, the later meeting does not establish that the person was still lighter, relieved, unburdened, calm, happy, nervous, or in any other prior state unless continuity is explicitly supplied.",
    "A later beat may CALLBACK to an earlier state as earlier context, but it may not re-assert that state as contemporaneous with the later event. Distinguish 'Echo of lightness. Return.' from 'Returned unburdened.' The first can be figurative callback; the second claims state continuity.",
    "An associated place, object, body part, sensory property, actor, physical consequence, scenery element, weather condition, or lighting element is a new concrete claim unless supplied.",
    "Do not use CONTEXTUAL_TEXTURE as a generic mood generator for emotions or states. A supplied state such as happy, nervous, sad, calm, or relieved does not authorize invented sun, breeze, warmth, darkness, rain, tail, paws, eyes, heartbeat, room, street, or other environmental/body imagery. Texture must attach to an event whose supplied physical envelope actually supports it.",
    "Preserve object identity. Figurative language may react to or characterize a supplied object, but it must not silently replace that object with a different concrete object. A supplied bow may be ridiculous, dramatic, ceremonial, or treated like a crown in attitude, but stating that it was literally a crown, hat, flower, costume, or other object changes material reality unless that object is supplied.",
    "Distinguish performed attitude from asserted motive. A line can sound defiant, annoyed, proud, dramatic, or possessive as voice without establishing that the subject actually held that motive. But abstract labels such as rebellion, revenge, surrender, liberation, defiance, acceptance, or victory should be rejected when they function as factual explanations of why an action happened rather than obvious performed framing.",
    "",
    "Creative figurative language may survive when a reasonable viewer reads it as nonliteral framing of supplied reality and it carries no unsupported concrete premise.",
    "APPROVED_SEMANTIC_AUTHORITY is upstream non-factual meaning already accepted by QRE Discovery. It may authorize abstract framing, implication, status language, metaphor, performed attitude, or relation words that express that approved meaning. It NEVER authorizes a new actor, object, body action, physical action, location, cause, chronology, motive, ownership fact, completed outcome, or other concrete occurrence.",
    "Voice and personification may use words that would be material if read literally, but only when the full sequence makes the nonliteral performance clear. Example: a character-like 'Mine.' can be FIGURATIVE voice anchored to interaction with a supplied object without asserting legal or factual ownership. Do not call that PARAPHRASE. If the sequence instead reads as a factual ownership claim, reject it.",
    "Questions, reactions, fragments, attitude, metaphor, understatement, and exaggeration are allowed only when they do not assert hidden reality.",
    "Words such as always, never, still, already, yet, first, or last are not violations by vocabulary alone. Decide whether the clause actually asserts unsupported chronology or an absolute material history. Performed preference, emphasis, or compressed voice may use them nonliterally.",
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
          SEQUENCE: input.scenes.map((scene, sceneIndex) => ({
            sceneIndex,
            text: scene.text,
          })),
          ATOMIC_CLAUSES: atomicClauses,
          instruction:
            "Audit every atomic clause independently, but read the whole SEQUENCE before deciding what each clause pragmatically means. A numeric duration does not authorize a countdown or 'time's up'. A walk does not authorize a specific gait such as ambled or trotted. Protect material truth while preserving imaginative story texture and performed voice. Treat APPROVED_SEMANTIC_AUTHORITY as permission for nonliteral framing only; do not require its abstract relation words to be literally present in SUPPLIED_REALITY, and never let it authorize a concrete event. Keep your own fields logically consistent: supported=true requires unsupportedClaims=[]. 'Nerves' is a clean PARAPHRASE of supplied nervousness. 'Joy' or 'content' may paraphrase supplied happiness when wording does not add cause or event. Do not classify by surface vocabulary alone: a bodily phrase may be FIGURATIVE felt embodiment when a reasonable viewer reads it as expressive language, but a specific body-part action or movement that reads as something literally happening requires support. An attempted action cannot imply near-success or a hidden motive. Preserve object identity: styling a supplied object is allowed, silently replacing it with another concrete object is not. Performed attitude may be FIGURATIVE, but motive labels such as rebellion, revenge, liberation, surrender, acceptance, or victory are UNSUPPORTED when they explain the action rather than merely dramatize it. 'Water. Everywhere.' may be CONTEXTUAL_TEXTURE around a supplied bath because water is inherent in the supplied event. By contrast, a supplied emotional state does not authorize unrelated scenery, weather, light, body parts, or sensory imagery; 'Sunbeam tail.' is UNSUPPORTED if the only anchor is 'left happy'. A playful 'Mine.' may be FIGURATIVE performed voice when the sequence makes it clearly nonliteral and anchored to a supplied object interaction; it must not be labeled PARAPHRASE or treated as factual ownership. WORLD_CONTEXT helps interpret texture and vocabulary but never becomes historical evidence.",
        }),
      },
    ],
    "json",
    {
      numPredict: Math.max(420, atomicClauses.length * 90),
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

  const allowedIds = new Set(input.suppliedReality.map((event) => event.id));
  const suppliedRealityText = input.suppliedReality
    .map((event) => event.text)
    .join(" ");

  const verificationByClause = new Map<string, AtomicVerification>();

  for (const value of raw) {
    if (!value || typeof value !== "object") continue;
    const item = value as AtomicVerification;
    const sceneIndex = Number(item.sceneIndex);
    const clauseIndex = Number(item.clauseIndex);
    if (!Number.isInteger(sceneIndex) || !Number.isInteger(clauseIndex)) continue;
    verificationByClause.set(`${sceneIndex}:${clauseIndex}`, item);
  }

  const unsupportedTemporalComparison =
    /\b(?:long|short|brief|briefly|quick|quickly|slow|slowly|fast|faster|slower|sudden|suddenly|prompt|promptly|instant|instantly|immediate|immediately|final|finally|still)\b/i;
  const suppliedTemporalComparison = unsupportedTemporalComparison.test(suppliedRealityText);

  const scenes = input.scenes.flatMap((scene, sceneIndex) => {
    const fragments = beatClauseFragments(scene.text);
    const clauses = beatClauses(scene.text);
    const supportedIds = new Set<string>();
    const supportedFragments: string[] = [];

    for (let clauseIndex = 0; clauseIndex < clauses.length; clauseIndex += 1) {
      const item = verificationByClause.get(`${sceneIndex}:${clauseIndex}`);
      if (!item) continue;

      const rawUnsupportedClaims = Array.isArray(item.unsupportedClaims)
        ? item.unsupportedClaims
            .filter((claim): claim is string => typeof claim === "string")
            .map(clean)
            .filter(Boolean)
        : [];

      const concreteClaims = Array.isArray(item.concreteClaims)
        ? item.concreteClaims
            .filter((claim): claim is string => typeof claim === "string")
            .map(clean)
            .filter(Boolean)
        : [];

      const supportKind = clean(item.supportKind).toUpperCase();
      const allowedSupportKind =
        supportKind === "DIRECT" ||
        supportKind === "PARAPHRASE" ||
        supportKind === "FIGURATIVE" ||
        supportKind === "CONTEXTUAL_TEXTURE";

      const unsupportedClaims = reconciledUnsupportedClaims({
        clauseText: clauses[clauseIndex] ?? "",
        supported: item.supported,
        supportKind,
        concreteClaims,
        unsupportedClaims: rawUnsupportedClaims,
      });

      const contradictoryConcreteFraming =
        (supportKind === "FIGURATIVE" || supportKind === "CONTEXTUAL_TEXTURE") &&
        concreteClaims.length > 0;

      if (
        item.supported !== true ||
        !allowedSupportKind ||
        unsupportedClaims.length ||
        contradictoryConcreteFraming
      ) {
        continue;
      }

      const sourceEventIds = Array.isArray(item.sourceEventIds)
        ? unique(
            item.sourceEventIds
              .filter((id): id is string => typeof id === "string")
              .filter((id) => allowedIds.has(id)),
          )
        : [];

      if (!sourceEventIds.length) continue;

      const fragment = fragments[clauseIndex];
      if (!fragment) continue;
      if (
        unsupportedTemporalComparison.test(fragment) &&
        !suppliedTemporalComparison
      ) {
        continue;
      }

      supportedFragments.push(fragment);
      sourceEventIds.forEach((id) => supportedIds.add(id));
    }

    if (!supportedFragments.length || !supportedIds.size) return [];

    const text = clean(supportedFragments.join(" "));

    if (hasUnsupportedSensoryClaim(text, suppliedRealityText)) return [];

    return [{
      ...scene,
      text,
      sourceEventIds: [...supportedIds],
    }];
  });

  return {
    scenes,
    model: result.model,
    modelCalls: 1,
  };
}

