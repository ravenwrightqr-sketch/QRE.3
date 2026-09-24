import type { AuthorDomainContext } from "@qre/contracts";
import { localModelGenerate } from "./localModelRuntime.js";

const clean = (value: unknown): string =>
  String(value ?? "").replace(/\s+/g, " ").trim();

const unique = (values: readonly string[]): string[] =>
  [...new Set(values.map(clean).filter(Boolean))];

function parseJson(text: string): Record<string, unknown> | undefined {
  const source = clean(text)
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
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

const clamp = (value: unknown, fallback = 0): number => {
  const number = Number(value);
  return Number.isFinite(number)
    ? Number(Math.max(0, Math.min(1, number)).toFixed(3))
    : fallback;
};

function stringArray(value: unknown, limit: number): string[] {
  return Array.isArray(value)
    ? unique(
        value
          .filter((item): item is string => typeof item === "string")
          .map(clean)
          .filter(Boolean),
      ).slice(0, limit)
    : [];
}

export type AuthorDiscoveryRelation = {
  from: string;
  to: string;
  kind: string;
  strength: number;
};

export type AuthorCreativeCandidate = {
  id: string;
  mode: "RELATIONAL" | "METAMORPHIC";
  perception: string;
  relationship: string;
  observerInference: string;
  evidenceEventIds: string[];
  whyItHits: string;
  risk: string;
};

export type AuthorCreativeDiscovery = {
  candidates: AuthorCreativeCandidate[];
  selectedCandidateId: string;
  selected: AuthorCreativeCandidate;
  playableEventIds: string[];
  backgroundEventIds: string[];
  experienceShape: string[];
  lens: string;
  confidence: number;
  selectionReason: string;
  risk: string;
};

function normalizeMode(value: unknown): "RELATIONAL" | "METAMORPHIC" {
  return clean(value).toUpperCase() === "METAMORPHIC"
    ? "METAMORPHIC"
    : "RELATIONAL";
}

const RECORD_SHAPE_LANGUAGE =
  /\b(?:list|prompt|input|record(?:ed|ing|s)?|document(?:ed|ing|s)?|audit(?:ed|ing|s)?|log(?:ged|ging|s)?|format(?:ting)?|field|fields|wording|phrasing|sentence|sentences|presentation)\b/i;

const TEMPORAL_EVALUATION_LANGUAGE =
  /\b(?:compressed timeframe|intense|intensity|sprint|rapid|rapidly|rushed|rush|fast|faster|quick|quickly|brief|briefly|slow|slowly|urgent|urgency|burst)\b/i;

const EVIDENCE_TOKEN_STOP = new Set([
  "the", "and", "with", "from", "that", "this", "into", "then", "were", "was",
  "are", "for", "at", "arrived", "finished", "cleaned", "event", "events",
]);

function evidenceTokens(text: string): Set<string> {
  return new Set(
    clean(text)
      .toLowerCase()
      .split(/[^a-z0-9]+/g)
      .filter((token) => token.length >= 4 && !EVIDENCE_TOKEN_STOP.has(token)),
  );
}

function candidateReferencesUncitedEvidence(
  candidate: AuthorCreativeCandidate,
  events: ReadonlyArray<{ id: string; text: string }>,
): boolean {
  const cited = new Set(candidate.evidenceEventIds.map(clean));
  const candidateTokens = evidenceTokens([
    candidate.perception,
    candidate.relationship,
    candidate.observerInference,
  ].join(" "));

  if (!candidateTokens.size) return false;

  return events
    .filter((event) => !cited.has(clean(event.id)))
    .some((event) => {
      const tokens = evidenceTokens(event.text);
      return [...tokens].some((token) => candidateTokens.has(token));
    });
}

function candidateCrossesUnsupportedTemporalEvaluation(
  candidate: AuthorCreativeCandidate,
  suppliedRealityText: string,
): boolean {
  const candidateText = clean([
    candidate.perception,
    candidate.relationship,
    candidate.observerInference,
  ].join(" "));

  return (
    TEMPORAL_EVALUATION_LANGUAGE.test(candidateText) &&
    !TEMPORAL_EVALUATION_LANGUAGE.test(suppliedRealityText)
  );
}

const OPERATIONAL_TRAIT_INFERENCE =
  /\b(?:meticulous(?:ness)?|diligen(?:ce|t)|efficien(?:cy|t)|devotion|devoted|obsess(?:ion|ive|ively)|disciplin(?:e|ed)|methodical|systematic|careful(?:ness)?|focused|focus|work ethic|dedication|dedicated)\b/i;

const UNSUPPORTED_ORDER_EVALUATION =
  /\b(?:priorit(?:y|ize|ized|ization)|hierarchy|higher priority|lower priority|more important|less important|demands? more attention|requires? more attention|deserves? more attention|takes? precedence|primary over|secondary to)\b/i;

function isBusinessCreativeContext(domainContext?: AuthorDomainContext): boolean {
  const context = (domainContext ?? {}) as Record<string, unknown>;
  const serviceType = clean(context.serviceType);
  const businessType = clean(context.businessType);
  const merchantType = clean(context.merchantType);
  const category = clean(context.category).toUpperCase();

  return Boolean(serviceType || businessType || merchantType) ||
    /\b(?:SERVICE|BUSINESS|COMMERCE|RETAIL|RESTAURANT|HOSPITALITY|GROOMING)\b/.test(category);
}

function isServiceContext(domainContext?: AuthorDomainContext): boolean {
  const context = (domainContext ?? {}) as Record<string, unknown>;
  const category = clean(context.category).toUpperCase();
  const serviceType = clean(context.serviceType).toUpperCase();

  return Boolean(serviceType) ||
    category.includes("SERVICE") ||
    category.includes("GROOMING");
}

function isMemoryContext(domainContext?: AuthorDomainContext): boolean {
  const context = (domainContext ?? {}) as Record<string, unknown>;
  return clean(context.experienceMode).toUpperCase() === "MEMORY";
}

function candidateIsBusinessLensMaterialHandoff(
  candidate: AuthorCreativeCandidate,
  eventCount: number,
): boolean {
  if (eventCount <= 2) return true;

  const text = clean([
    candidate.perception,
    candidate.relationship,
    candidate.observerInference,
  ].join(" "));

  const preStyledUniverse =
    /\b(?:ritual(?:istic)?|ceremony|ceremonial|performance|surgical|surgery|experiment|mission|game|noir|heist|courtroom|clinical|intimate|detached|crucial phase|robotic|ballet|protocol)\b/i.test(text);

  const tooNarrowForServiceMemory =
    candidate.evidenceEventIds.length < Math.min(3, eventCount);

  return !preStyledUniverse && !tooNarrowForServiceMemory;
}

function candidateCrossesOperationalServiceTruthFloor(
  candidate: AuthorCreativeCandidate,
  suppliedRealityText: string,
  domainContext?: AuthorDomainContext,
): boolean {
  if (!isServiceContext(domainContext)) return false;

  const candidateText = clean([
    candidate.perception,
    candidate.relationship,
    candidate.observerInference,
  ].join(" "));

  if (!OPERATIONAL_TRAIT_INFERENCE.test(candidateText)) return false;

  return !OPERATIONAL_TRAIT_INFERENCE.test(suppliedRealityText);
}

function candidateCrossesDeterministicTruthFloor(
  candidate: AuthorCreativeCandidate,
  suppliedRealityText: string,
): boolean {
  const candidateText = clean([
    candidate.perception,
    candidate.relationship,
    candidate.observerInference,
  ].join(" "));

  // Deterministic Discovery rejection is intentionally structural only.
  // Semantic words such as curation, rank, rebellion, resistance, ceremony,
  // priority, or liberation can be either figurative framing or factual claims.
  // The semantic verifier decides which. Do not blacklist meaning by vocabulary.
  return (
    (
      RECORD_SHAPE_LANGUAGE.test(candidateText) &&
      !RECORD_SHAPE_LANGUAGE.test(suppliedRealityText)
    ) ||
    (
      UNSUPPORTED_ORDER_EVALUATION.test(candidateText) &&
      !UNSUPPORTED_ORDER_EVALUATION.test(suppliedRealityText)
    )
  );
}

function normalizeCandidate(
  value: unknown,
  index: number,
  allowedEventIds: Set<string>,
): AuthorCreativeCandidate | undefined {
  if (!value || typeof value !== "object") return undefined;

  const record = value as Record<string, unknown>;
  const perception = clean(record.perception);
  const relationship = clean(record.relationship);
  const observerInference = clean(record.observerInference);

  if (!perception && !relationship && !observerInference) return undefined;

  return {
    id: clean(record.id) || `candidate-${index + 1}`,
    mode: normalizeMode(record.mode),
    perception,
    relationship,
    observerInference,
    evidenceEventIds: stringArray(record.evidenceEventIds, 32)
      .filter((id) => allowedEventIds.has(id)),
    whyItHits: clean(record.whyItHits),
    risk: clean(record.risk),
  };
}

async function verifyDiscoveryCandidates(input: {
  candidates: readonly AuthorCreativeCandidate[];
  events: ReadonlyArray<{ id: string; text: string }>;
  relations?: readonly AuthorDiscoveryRelation[];
  domainContext?: AuthorDomainContext;
}): Promise<{ groundedIds: Set<string>; modelCalls: number }> {
  if (!input.candidates.length) {
    return { groundedIds: new Set(), modelCalls: 0 };
  }

  const result = await localModelGenerate(
    [
      {
        role: "system",
        content: [
          "You are QRE Discovery Semantic Grounding.",
          "Reality is authority.",
          "Judge whether each candidate's perception and relationship are grounded perceptual transformations of SUPPLIED_REALITY.",
          "A candidate may be figurative, playful, compressed, personified, metaphorical, or status-bearing.",
          "Do not require a perceptual relation to be a literal real-world relation. The question is whether the supplied facts can reasonably be EXPERIENCED through that framing without making the framing into a new historical fact.",
          "A candidate may say that reality reads like ceremony, status, privacy, contest, evidence, promotion, intrusion, absurd authority, intimacy, menace, or another perception when those words function as framing rather than claims that such a literal event or intention existed.",
          "But it must be rejected if it turns sequence into causality, a later state into the result of an earlier event, an action into motive, an attempt into a completed outcome, or supplied facts into an unseen condition, backstory, preference strength, agency claim, constraint, liberation, ownership, ranking, or emotional cause that reality does not establish.",
          "Chronology permits before/after only when the supplied events establish it; chronology alone does not establish because/therefore.",
          "Chronology or list order also does not establish priority, hierarchy, relative importance, relative attention, precedence, or which item demanded more work. Treat those as unsupported unless supplied reality explicitly establishes them.",
          "An attempt to remove something does not prove it was removed.",
          "A subject leaving happy does not prove why the subject was happy.",
          "Nervousness before later events does not prove those later events caused the nervousness.",
          "A supplied before-state and after-state establish contrast, not transformation mechanism. Do not accept language that says the earlier state dissolved, was shed, unlocked, released, resolved, or revealed a new hidden trait unless reality establishes that mechanism or trait.",
          "A supplied emotional state does not establish the FUNCTION of that state. Nervousness does not by itself prove protection, defense, armor, caution, self-protection, preparation, or another purpose; those are hidden explanations unless reality supplies them.",
          "Do not upgrade one supplied state into a different relational or emotional condition. 'Felt lighter afterward' does not by itself establish comfort, ease, trust, safety, effortlessness, confidence, intimacy, or reassurance.",
          "Recurrence establishes that something happened again. Recurrence alone does not establish urgency, persistence as motive, deliberateness, ritual, attraction, intimacy, importance, relationship status, or a desire to continue.",
          "One supplied recurrence also does not establish predictability, routine, habit, inevitability, cadence, regularity, or that the earlier encounter prompted/caused the return. Those require additional evidence.",
          "STATE CONTINUITY IS NOT IMPLIED BY RECURRENCE. If a state is supplied after an earlier event and a later event occurs, do not accept claims that the later event is a continuation of that state, carries that state forward, or occurred with that same state unless reality explicitly establishes persistence. The earlier state may recontextualize the later return as a callback, but it may not become the later event's current state.",
          "A duration between two states establishes elapsed time or activity, not that the duration caused the later state, deepened a bond, created familiarity, made someone a confidante, or produced emotional safety.",
          "Do not invent a hidden mental proposition just to give the sequence meaning. An unspoken question, expectation, decision, test, evaluation, reconsideration, near-miss, almost-outcome, or latent relationship state is still an unsupported premise unless supplied reality establishes it.",
          "Figurative framing may make recurrence feel like echo, return, callback, orbit, loop, or another nonliteral shape. It may not smuggle in what anyone was privately asking, expecting, testing, deciding, hoping, almost doing, or nearly becoming.",
          "Words such as armor, shield, harbor, opening, unlocking, release, relief, familiarity, connection, and openness may be valid figurative framing only when they do not smuggle in a hidden state-change mechanism, relational status, or personality conclusion.",
          "Preserve a figurative read when a reasonable viewer would understand it as imaginative framing of supplied actions rather than a factual claim about hidden reality.",
          "Distinguish 'X was intentionally done for Y' from 'X makes the moment feel like Y.' The first needs factual support; the second can be a grounded perceptual transformation.",
          "Do not reject a candidate merely because its metaphor is not literally true. Reject it only when the metaphor promotes itself into unsupported material history, motive, cause, ownership, outcome, chronology, or hidden condition.",
          "Do not decide by trigger words. Terms such as curated, priority, rank, ceremony, rebellion, resistance, liberation, or status may be valid figurative framing. Reject them only when the candidate uses them as unsupported literal history, intent, hierarchy, agency, or outcome.",
          "Judge the whole candidate, not just its strongest phrase. If either perception or relationship contains an unsupported hidden premise, reject the candidate even when another part is grounded.",
          "Words such as imposed, accepted, rebelled, defied, submitted, escaped, freed, constrained, resisted, or liberated describe agency, stance, or state. They are allowed only when the supplied reality itself establishes that meaning, not merely because an action can be dramatized that way.",
          "Trying to remove an added object can support a figurative beat of resistance to that object, but it does not establish that the object was imposed, that the subject accepted it later, that removal succeeded, or that later happiness was caused by freedom from it.",
          "Do not promote neutral encounters into approval, praise, acceptance, validation, success, or positivity. Seeing an animal, meeting another animal or person, or merely co-occurring with something is neutral unless reality supplies the positive evaluation. Explicit praise such as 'two people said Milo was cute' can support validation; squirrels and dog encounters cannot be counted as validation just because they happened on the same walk.",
          "Duration numbers establish duration, not shortness, brevity, intensity, density, or unusualness by themselves. A duration may contribute to a perceptual read only when the candidate does not pretend an unsupported baseline makes it objectively short or long.",
          "Operational completion plus timestamps do not establish a worker's personality, psychology, motive, or work ethic. Do not infer obsession, ritual, devotion, meticulousness, discipline, solitude, urgency, focus, efficiency, or similar traits unless supplied reality or an explicit comparison supports them.",
          "Exact timestamps may support a perceptual sense of clocked rhythm, boundedness, sequence, or precision in the RECORD OF EVENTS itself, but do not convert that formal shape into a hidden trait of the person performing the work.",
          "Completed service tasks may be transformed figuratively as tasks/status moments, but do not infer the unseen prior condition of the space, the worker's internal state, or the quality/intensity of effort unless supplied.",
          "For every candidate, extract unsupportedClaims: each causal, motivational, agency, outcome, state-change, ranking, chronology, hidden-condition, or other real-world premise that is not established by SUPPLIED_REALITY.",
          "Also judge worthRealizing. A candidate is worth realizing only when it extracts a specific perceptual opportunity from distinctive supplied material. Generic before/after summaries, broad emotional transitions, service/process descriptions, category labels, or restatements such as 'nervous then happy is a contrast' are grounded but NOT worth realizing when they ignore more specific supplied actions, objects, tensions, oddities, or character material.",
          "A tiny specific relation can be worth realizing even when it uses only one or two events. Specificity matters more than coverage.",
          "IDENTITY MODE: stable supplied preferences and traits are character evidence. A candidate may make a clearly perceptual character inference from their specificity or combination—such as reading the pattern as curated, precise, particular, discerning, indulgent, or having a recognizable taste—without that inference becoming literal biography. Do NOT put 'infers personality/character/taste' into unsupportedClaims merely because it was not typed verbatim. This is the point of Identity Discovery.",
          "IDENTITY MODE still may not invent an event, chronology, physical action, hidden history, diagnosis, literal motive, causal explanation, or claim that the subject consciously selected or deliberately arranged the supplied traits. 'Reads like a curated collection' can be framing; 'Milo deliberately curated these preferences' is a factual intentionality claim.",
          "A desire, need, intention, or reason remains a motive claim and needs evidence even in IDENTITY mode.",
          "MEMORY MODE: structural descriptions of supplied co-occurrence are allowed. If one lived event contains several supplied observations or encounters, it may truthfully read as a sequence, accumulation, cluster, mix, run, series, contrast, recurrence, or return without implying that anyone deliberately curated, gathered, arranged, or caused them. Do not manufacture intentionality merely from structural shape.",
          "MEMORY MODE may preserve the shape of the lived event across multiple facts while keeping unknown causes and motives unknown. A supplied state-before / lived-middle / state-after / recurrence pattern is itself meaningful structure. It may be realized through juxtaposition and callback without claiming what caused the state change or why the recurrence happened.",
          "RECURRENCE CAN BE PAYOFF. A later supplied return may retrospectively change how the earlier encounter reads simply because it happened again. This recontextualization is allowed even when motive, attraction, success, importance, and causality remain unknown.",
          "Reject invented praise, success, excitement, motive, causal connection, persistence of state, intimacy, urgency, deliberation, or relationship status; do not reject neutral structural compression simply because it groups supplied events.",
          "grounded is only a truth summary. unsupportedClaims is authoritative: grounded should be true exactly when unsupportedClaims is empty.",
          "Return one verification for every candidate, in the same order.",
        ].join("\n"),
      },
      {
        role: "user",
        content: JSON.stringify({
          SUPPLIED_REALITY: input.events,
          SUPPLIED_RELATIONS: input.relations ?? [],
          EXPERIENCE_MODE: clean((input.domainContext as Record<string, unknown> | undefined)?.experienceMode).toUpperCase() || undefined,
          CANDIDATES: input.candidates.map((candidate) => ({
            id: candidate.id,
            mode: candidate.mode,
            perception: candidate.perception,
            relationship: candidate.relationship,
            evidenceEventIds: candidate.evidenceEventIds,
          })),
          instruction:
            "Audit every perception and relationship clause. Put each unsupported MATERIAL premise in unsupportedClaims, including invented causality, motive, completed outcome, agency, acceptance, imposition, constraint, emotional cause, hidden state, inferred resolution, invented approval/validation from neutral encounters, or unsupported claims that a supplied duration is objectively short/long. In MEMORY mode, a sequence/accumulation/cluster of supplied encounters is structural compression and does NOT imply deliberate curation or gathering unless the candidate explicitly claims intent. In IDENTITY mode, do not treat grounded perceptual character inference from stable preferences as unsupported merely because the personality word was not supplied verbatim. grounded must equal unsupportedClaims.length === 0. Separately set worthRealizing=true only when the candidate gives QRE a specific perceptual relation or metamorphic opportunity worth turning into an experience. Do not reward a candidate merely for being true. Generic emotional transitions, broad service summaries, category descriptions, or obvious start/end contrasts are not enough when they fail to use the distinctive supplied material.",
        }),
      },
    ],
    "json",
    {
      numPredict: Math.max(420, input.candidates.length * 105),
      temperature: 0.08,
      jsonSchema: {
        type: "object",
        additionalProperties: false,
        required: ["verifications"],
        properties: {
          verifications: {
            type: "array",
            minItems: input.candidates.length,
            maxItems: input.candidates.length,
            items: {
              type: "object",
              additionalProperties: false,
              required: ["candidateId", "grounded", "worthRealizing", "unsupportedClaims"],
              properties: {
                candidateId: { type: "string", maxLength: 48 },
                grounded: { type: "boolean" },
                worthRealizing: { type: "boolean" },
                unsupportedClaims: {
                  type: "array",
                  maxItems: 16,
                  items: { type: "string", maxLength: 140 },
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

  const candidateIds = new Set(input.candidates.map((candidate) => candidate.id));
  const groundedIds = new Set<string>();

  for (const value of raw) {
    if (!value || typeof value !== "object") continue;
    const record = value as Record<string, unknown>;
    const candidateId = clean(record.candidateId);
    const unsupportedClaims = Array.isArray(record.unsupportedClaims)
      ? record.unsupportedClaims
          .filter((claim): claim is string => typeof claim === "string")
          .map(clean)
          .filter(Boolean)
      : [];

    if (
      !unsupportedClaims.length &&
      record.grounded === true &&
      record.worthRealizing === true &&
      candidateIds.has(candidateId)
    ) {
      groundedIds.add(candidateId);
    }
  }

  return { groundedIds, modelCalls: 1 };
}

async function repairDiscoveryCandidates(input: {
  candidates: readonly AuthorCreativeCandidate[];
  events: ReadonlyArray<{ id: string; text: string }>;
  relations?: readonly AuthorDiscoveryRelation[];
  allowedEventIds: Set<string>;
  domainContext?: AuthorDomainContext;
}): Promise<{ candidates: AuthorCreativeCandidate[]; model: string; modelCalls: number }> {
  if (!input.candidates.length) {
    return { candidates: [], model: "none", modelCalls: 0 };
  }

  const result = await localModelGenerate(
    [
      {
        role: "system",
        content: [
          "You are QRE Creative Discovery Repair.",
          "Reality is fixed. Interpretation is free.",
          "A discovery candidate contained creative value but did not survive semantic grounding.",
          "Do not invent a new story. Salvage the strongest perceptual opportunity by removing the unsupported premise that poisoned it.",
          "Keep the creative leap; remove fake history.",
          "A perceptual relation may change status, significance, atmosphere, role, absurdity, intimacy, tension, ceremony, suspicion, tenderness, or another felt reading without asserting that the transformed frame literally happened.",
          "Never add motive, causality, ownership, successful outcome, hidden emotional cause, unseen condition, literal rank, literal role, or completed action.",
          "Prefer a specific relation carried by supplied reality over a vague generic emotional summary.",
          "Do NOT confuse a generic emotional arc with an explicitly supplied state contrast. If reality supplies one state before an encounter and another state afterward, that contrast is real evidence and may be creatively important even though the cause of the change is unknown.",
          "When a memory contains a supplied before-state, an intervening lived event, a supplied after-state, and later recurrence/return, preserve those load-bearing anchors when they carry the perception. Remove invented because/therefore logic; do not delete the true contrast to make the repair safer.",
          "A repaired perception may say the sequence changes how the encounter reads, or that the before/after contrast recontextualizes what came between, without claiming that the middle event caused the later state.",
          "If recurrence follows an earlier state change, describe the recurrence as return/callback/recontextualization. Do not call the later event a continuation of the earlier state or imply the state persisted into the later event unless persistence is supplied.",
          "Do not repair unsupported motive by replacing it with another invisible mental construct. Avoid invented questions, expectations, tests, evaluations, decisions, near-misses, almost-outcomes, or latent relationship states. Repair toward perceptual shape in the supplied sequence itself.",
          "Do not repair a supplied state into a hidden function or stronger relational state. Preserve nervousness as nervousness-shaped material and lightness as lightness-shaped material without turning them into protection, comfort, trust, safety, confidence, or effortlessness unless supplied.",
          "A later supplied recurrence may land as recurrence/callback/recontextualization, but do not make it predictable, routine, inevitable, or caused by the earlier encounter unless reality establishes that.",
          "For IDENTITY material, preserve grounded character inference from stable preferences; do not repair it down into generic 'shared experiences' or 'simple pleasures' merely because the character word was not typed verbatim.",
          "For MEMORY material with several supplied events, preserve the shape of the lived event across multiple relevant facts when possible. Do not repair a multi-fact memory down to one isolated quirky detail unless that detail genuinely carries the memory by itself. Prefer neutral structural patterns such as accumulation, variety, juxtaposition, sequence, recurrence, contrast, or density over invented evaluation.",
          "Return up to two repaired candidates. If no candidate can be repaired without becoming bland or false, return an empty candidates array.",
        ].join("\n"),
      },
      {
        role: "user",
        content: JSON.stringify({
          SUPPLIED_REALITY: input.events,
          SUPPLIED_RELATIONS: input.relations ?? [],
          EXPERIENCE_MODE: clean((input.domainContext as Record<string, unknown> | undefined)?.experienceMode).toUpperCase() || undefined,
          FAILED_DISCOVERY: input.candidates.map((candidate) => ({
            id: candidate.id,
            mode: candidate.mode,
            perception: candidate.perception,
            relationship: candidate.relationship,
            evidenceEventIds: candidate.evidenceEventIds,
          })),
          instruction:
            "Repair only the perceptual relation. State it as what the supplied facts can READ LIKE or FEEL LIKE, not as an explanation of why anything happened. Preserve distinctive supplied material. If the failed read depended on a supplied before/after state contrast, preserve BOTH supplied state anchors and remove only the unsupported causal explanation between them. If later recurrence/return is supplied and contributes to the read, preserve that anchor too. Do not replace unsupported motive or causality with an invisible mental placeholder such as an unspoken question, expectation, test, evaluation, decision, near-miss, almost-outcome, or latent relationship state. For MEMORY material, do not add unsupported duration labels or temporal compression such as brief, briefly, long, quick, quickly, sudden, suddenly, prompt, promptly, instant, instantly, final, finally, or still unless the supplied reality establishes that relation. Preserve the multi-event shape when it carries the memory. Do not write final cuts.",
        }),
      },
    ],
    "json",
    {
      numPredict: 360,
      temperature: 0.46,
      jsonSchema: {
        type: "object",
        additionalProperties: false,
        required: ["candidates"],
        properties: {
          candidates: {
            type: "array",
            maxItems: 2,
            items: {
              type: "object",
              additionalProperties: false,
              required: ["id", "mode", "perception", "relationship", "evidenceEventIds"],
              properties: {
                id: { type: "string", maxLength: 48 },
                mode: { type: "string", enum: ["RELATIONAL", "METAMORPHIC"] },
                perception: { type: "string", maxLength: 180 },
                relationship: { type: "string", maxLength: 140 },
                evidenceEventIds: {
                  type: "array",
                  minItems: 1,
                  maxItems: 32,
                  items: { type: "string", maxLength: 64 },
                },
              },
            },
          },
        },
      },
    },
  );

  const parsed = parseJson(result.text);
  const raw = Array.isArray(parsed?.candidates) ? parsed.candidates : [];
  const suppliedRealityText = clean(input.events.map((event) => event.text).join(" "));
  const experienceMode = clean(
    (input.domainContext as Record<string, unknown> | undefined)?.experienceMode,
  ).toUpperCase();

  const candidates = raw
    .map((value, index) => normalizeCandidate(value, index, input.allowedEventIds))
    .filter((value): value is AuthorCreativeCandidate => Boolean(value))
    .map((candidate) => {
      if (experienceMode !== "MEMORY") return candidate;

      const originalId = clean(candidate.id).replace(/-repair(?:ed)?$/i, "");
      const original = input.candidates.find(
        (failed) => clean(failed.id) === originalId,
      );
      if (!original) return candidate;

      return {
        ...candidate,
        evidenceEventIds: unique([
          ...original.evidenceEventIds,
          ...candidate.evidenceEventIds,
        ]).filter((id) => input.allowedEventIds.has(id)),
      };
    })
    .filter((candidate) =>
      !candidateCrossesDeterministicTruthFloor(candidate, suppliedRealityText),
    )
    .filter((candidate) =>
      !candidateCrossesOperationalServiceTruthFloor(
        candidate,
        suppliedRealityText,
        input.domainContext,
      ),
    )
    .filter((candidate) =>
      !candidateCrossesUnsupportedTemporalEvaluation(
        candidate,
        suppliedRealityText,
      ),
    )
    .filter((candidate) =>
      !candidateReferencesUncitedEvidence(candidate, input.events),
    )
    .slice(0, 2);

  return {
    candidates,
    model: result.model,
    modelCalls: 1,
  };
}

export async function discoverAuthorCreativeDirection(input: {
  events: ReadonlyArray<{ id: string; text: string }>;
  relations?: readonly AuthorDiscoveryRelation[];
  requestedLens?: string;
  memory?: readonly string[];
  domainContext?: AuthorDomainContext;
}): Promise<{
  discovery: AuthorCreativeDiscovery;
  model: string;
  modelCalls: number;
}> {
  const requestedLens = clean(input.requestedLens);
  const normalizedRequestedLens = requestedLens.toUpperCase();
  const businessCreativeContext = isBusinessCreativeContext(input.domainContext);
  const lensStageOwnsFraming =
    businessCreativeContext &&
    normalizedRequestedLens !== "NONE";
  const allowedEventIds = new Set(input.events.map((event) => event.id));

  // In business/service MEMORY with downstream Creative Lens active,
  // Discovery must not spend a model call inventing an interpretation the
  // Lens will replace. Hand the full supplied memory corridor forward
  // deterministically. This keeps truth ownership here and creative search
  // downstream where it belongs.
  if (
    lensStageOwnsFraming &&
    isMemoryContext(input.domainContext) &&
    input.events.length > 0
  ) {
    const evidenceEventIds = input.events.map((event) => event.id);
    const selected: AuthorCreativeCandidate = {
      id: "reality-direct",
      mode: "RELATIONAL",
      perception:
        "Use the supplied memory corridor directly as creative material; no hidden relationship is asserted upstream.",
      relationship: "",
      observerInference: "",
      evidenceEventIds,
      whyItHits: "",
      risk: "downstream_lens_owns_creative_interpretation",
    };

    return {
      discovery: {
        candidates: [],
        selectedCandidateId: selected.id,
        selected,
        playableEventIds: evidenceEventIds,
        backgroundEventIds: [],
        experienceShape: [],
        lens: requestedLens || "NONE",
        confidence: 1,
        selectionReason:
          "Deterministic business-memory handoff to downstream Creative Lens.",
        risk: selected.risk,
      },
      model: "deterministic-business-memory-handoff",
      modelCalls: 0,
    };
  }

  const system = [
    "You are QRE Creative Discovery.",
    "Reality is fixed. Interpretation is free.",
    "",
    "NOTICE WHAT IS ALIVE.",
    "Study CURRENT_REALITY and find the specific detail, contrast, character signal, excess, awkwardness, reversal, recurrence, status change, strange combination, or relationship that gives this material energy.",
    "A strong read may live in one supplied detail or in a relationship across several facts.",
    "Relationships between facts may be literal relationships established by supplied reality OR perceptual relationships created by a clearly figurative read of supplied reality.",
    "SUPPLIED_RELATIONS are graph-backed structural evidence. Use them as anchors when combining events. They establish connection, not motive or cause unless the relation explicitly says causes.",
    "A perceptual relationship changes how the viewer experiences the supplied facts without claiming that the transformation itself literally happened.",
    "When several facts merely coexist, keep them coexisting unless supplied reality establishes order, rank, cause, urgency, preference strength, escalation, deliberateness, selection, exclusivity, or curation.",
    "Sequence establishes sequence only. 'Kitchen, then bathrooms' does not by itself establish priority, hierarchy, importance, relative attention, what demanded more work, or what mattered more. If those evaluations are not supplied, keep the sequence neutral and hand the raw structure downstream.",
    "Coexistence itself can be creatively meaningful. Several specific likes, traits, objects, or memories may form character, contrast, texture, or a strange combination without any one being stronger, later, chosen, or more important.",
    "Use the supplied entities and actions as the creative cast.",
    "Treat logistics as background context unless the logistics themselves are genuinely distinctive.",
    "Prefer ideas that remain interesting even if the same facts are formatted differently.",
    "Read CURRENT_REALITY as facts about the world, not as a document, list, prompt, sentence pattern, writing style, record, or presentation artifact.",
    "Never make the formatting, repetition of wording, ordering of fields, existence of a list, or act of someone recording the facts into the discovered subject. Discover something about the supplied world itself.",
    "",
    "CREATE FOUR DIFFERENT READS.",
    "Keep each one concise.",
    "perception = what you noticed.",
    "relationship = the playable creative relation or status shift.",
    "RELATIONAL means supplied facts change how other supplied facts are read.",
    "METAMORPHIC means supplied reality supports a clearly figurative change in perceived status, significance, scale, role, atmosphere, or relationship. It answers: what can these facts FEEL LIKE or BECOME AS A PERCEPTION without becoming a new concrete fact?",
    "A metamorphic relation should be stated as perception, not fake history. Prefer language such as 'reads like', 'feels like', 'turns X into', 'gives X the status of', or equivalent conceptual framing when needed to keep the transformation clearly perceptual.",
    "Figurative freedom does not create literal rank, sequence, choice, causality, motive, ownership, or preference strength.",
    "",
    "GROUND EACH READ.",
    "Cite the supplied event IDs that carry the idea.",
    "Build the read from what is actually supplied.",
    "Let actions establish that the action happened; do not treat an action by itself as proof of an unseen prior condition, motive, or backstory.",
    "Let timestamps establish time and duration; do not turn precision alone into deadline, pressure, urgency, or external demand unless supplied reality supports it.",
    "When a read needs status or drama, create it figuratively from the supplied action instead of converting it into an unsupported literal before-state.",
    "Literal claims stay inside supplied reality; figurative meaning can range widely.",
    "BUSINESS_CONTEXT may clarify vocabulary.",
    ...(lensStageOwnsFraming ? [
      "",
      "BUSINESS CREATIVE HANDOFF:",
      "A downstream Creative Lens stage owns genre, stylistic universe, and rhetorical treatment for this business/service memory.",
      "Discovery must NOT pre-solve the style by calling the service a ballet, ritual, audit, mission, game, ceremony, noir scene, courtroom, performance, protocol, operation, or another creative universe.",
      "Instead identify the strongest GROUNDED MATERIAL OPPORTUNITY the Lens can transform: distinctive action sequence, count, exact time anchors, recurrence, contrast, object, quote, customer reaction, unusual combination, or other supplied structure.",
      "Keep perception and relationship structurally descriptive enough that several radically different Lens treatments could all realize them truthfully.",
      "Do not throw away distinctive middle service events merely because start/end timing is easy to dramatize. Preserve the evidence corridor that makes this specific service memory recognizable.",
      "The Discovery output itself does not need to sound clever. Its job here is to hand Lens good material, not steal Lens's job.",
      "For a multi-event service MEMORY, do not collapse the handoff to one timestamp or one isolated task when the recognizable service is carried by several supplied events. Preserve the service corridor unless one detail truly dominates by supplied evidence.",
      "If every candidate needs a genre-like metaphor or hidden evaluation to feel interesting, prefer reality-direct handoff over inventing a mini-theme. Lens will supply the creative treatment downstream.",
    ] : []),
    "",
    "SELECT FOR LIFE.",
    ...(lensStageOwnsFraming ? [
      "Choose the read that preserves the strongest specific grounded material for downstream creative framing. Prefer useful structural opportunity over a pre-styled metaphor.",
    ] : [
      "Choose the read that feels most specific, grounded, surprising, compressible, and worth realizing.",
    ]),
    "A strong selected read changes how the supplied facts feel when viewed together.",
    "Prefer a grounded perceptual leap over a bland literal summary. The leap should reveal latent character, status, tension, intimacy, absurdity, contrast, ceremony, danger, luxury, suspicion, tenderness, or another felt property already available in the supplied material.",
    "The strongest read often does not explain WHY something happened. It changes what the same facts seem to mean or resemble when experienced together.",
    "The read does not need to invent a relationship among the facts. A truthful cluster can be interesting because of its specificity, character, contrast, or odd combination alone.",
    "Give Creative something alive to play with: status, tension, contrast, reversal, character, odd specificity, excess, repetition, implication, or another felt dynamic already supported by reality. Use escalation, rivalry, rank, or sequence only when supplied reality actually establishes them.",
    "Prefer a read that creates a viewer perception over one that merely categorizes the service, workflow, process, or record.",
    "UNIVERSAL AUTHOR LAW: Identity synthesizes simultaneous truths into character. Memory synthesizes accumulated truths into experience. Same Author intelligence; different temporal shape.",
    "IDENTITY MODE: when BUSINESS_CONTEXT says experienceMode=IDENTITY, stable likes/traits are character material, not a list to decorate. Ask: what ONE character perception appears only because these truths are seen together? Prefer a read that discovers a distinctive preference signature, specificity, contrast, taste, fixation, or character implication across the supplied traits. A generic statement that the likes are interconnected, comforting, simple pleasures, or a collection is weaker than a grounded read that lets the viewer infer personality. Do not invent an event.",
    "MEMORY MODE: lived facts are accumulated experience material, not sequential list items to decorate. Ask: what ONE experience perception appears because these facts accumulated in the same lived event? The answer may emerge from density, variety, juxtaposition, interruption, recurrence, contrast, rhythm, social texture, an odd little pattern, or another grounded relation across the facts.",
    "MEMORY MODE should discover the memory AS A WHOLE before deciding what deserves screen time. Do not assign one interpretation per event. Individual facts may disappear, fuse, become setup, become callback, or support a later payoff.",
    "MEMORY MODE is not required to summarize every event. It must preserve enough distinctive reality that the resulting perception still belongs to this memory and not any generic outing.",
    "Keep neutral encounters neutral unless reality supplies praise, harm, success, fear, enjoyment, approval, or another valence. Do not call a duration brief/long/fast/slow without a supplied comparison or baseline.",
    "A tiny odd detail can beat a broad interpretation when it has more energy.",
    "Prefer the read that gives Creative the strongest thing to play with.",
    "",
    "HANDOFF:",
    "evidenceEventIds = the supplied facts carrying the selected idea.",
    "playableEventIds = any evidence that clearly deserves direct screen presence.",
    "backgroundEventIds = the remaining selected evidence.",
    "experienceShape = up to five optional semantic hints such as character, contrast, reversal, callback, expansion, compression, or implication. Use escalation only when reality actually establishes escalation.",
    "",
    "Use the requested lens when one is supplied; otherwise return NONE.",
    "Return only the requested structured object.",
  ].join("\n");

  const result = await localModelGenerate(
    [
      { role: "system", content: system },
      {
        role: "user",
        content: JSON.stringify({
          CURRENT_REALITY: input.events,
          SUPPLIED_RELATIONS: input.relations ?? [],
          MEMORY: (input.memory ?? []).slice(0, 12),
          BUSINESS_CONTEXT: input.domainContext,
          CREATIVE_INTENT: {
            requestedLens: requestedLens || undefined,
          },
          instruction:
            lensStageOwnsFraming
              ? "This business/service memory will go through Creative Lens Search after Discovery. Find four grounded MATERIAL reads, not four stylistic treatments. Preserve the most distinctive supplied structure and evidence corridor that Lens can transform: actions, counts, exact time anchors, recurrence, contrast, quotes, objects, reactions, or unusual combinations. Do not name a genre, creative universe, performance metaphor, ritual, ballet, audit, mission, game, ceremony, protocol, operation, or other treatment here. Do not discard distinctive middle events merely to focus on start/end timing. Select the read that gives Lens the richest truthful raw material. Do not write final cuts."
              : "Find four genuinely different grounded reads in the supplied reality. Apply the universal law: IDENTITY = simultaneous truths -> one character perception; MEMORY = accumulated truths -> one experience perception. In IDENTITY mode, do not merely bundle the traits into a nicer list; look for the character signal created by their specificity or combination. In MEMORY mode, do not interpret each event separately and then summarize them. First find the single perception created by the accumulated event as a whole, then identify which facts carry that perception. Prefer grounded patterns such as variety, accumulation, density, juxtaposition, recurrence, rhythm, social texture, oddity, or contrast over invented positivity/negativity; neutral encounters stay neutral unless the facts supply valence. Treat the input only as facts about the world: do not analyze the list, phrasing, repetition of wording, formatting, field order, or the act of recording those facts. Search especially for perceptual transformations: what status, significance, atmosphere, relationship, contrast, absurdity, intimacy, tension, ceremony, or other felt meaning the SAME facts can take on without that transformation becoming a new historical fact. Keep each read concise: what you noticed, the playable perceptual relation, and its evidence. Do not manufacture literal order, ranking, causality, urgency, preference strength, deliberateness, selection, exclusivity, curation, motive, ownership, or hidden pressure. A figurative relation may change how reality feels; it may not rewrite what materially happened. Select the read with the most life and creative potential. Do not write final cuts.",
        }),
      },
    ],
    "json",
    {
      numPredict: 700,
      temperature: 0.82,
      jsonSchema: {
        type: "object",
        additionalProperties: false,
        required: [
          "candidates",
          "selectedCandidateId",
          "playableEventIds",
          "backgroundEventIds",
          "experienceShape",
          "lens",
          "confidence",
          "selectionReason",
          "risk",
        ],
        properties: {
          candidates: {
            type: "array",
            minItems: 4,
            maxItems: 4,
            items: {
              type: "object",
              additionalProperties: false,
              required: [
                "id",
                "mode",
                "perception",
                "relationship",
                "evidenceEventIds",
              ],
              properties: {
                id: { type: "string", maxLength: 48 },
                mode: { type: "string", enum: ["RELATIONAL", "METAMORPHIC"] },
                perception: { type: "string", maxLength: 180 },
                relationship: { type: "string", maxLength: 140 },
                evidenceEventIds: {
                  type: "array",
                  maxItems: 32,
                  items: { type: "string", maxLength: 64 },
                },
              },
            },
          },
          selectedCandidateId: { type: "string", maxLength: 48 },
          playableEventIds: {
            type: "array",
            maxItems: 32,
            items: { type: "string", maxLength: 64 },
          },
          backgroundEventIds: {
            type: "array",
            maxItems: 64,
            items: { type: "string", maxLength: 64 },
          },
          experienceShape: {
            type: "array",
            maxItems: 5,
            items: { type: "string", maxLength: 40 },
          },
          lens: { type: "string", maxLength: 80 },
          confidence: { type: "number" },
          selectionReason: { type: "string", maxLength: 220 },
          risk: { type: "string", maxLength: 180 },
        },
      },
    },
  );

  const parsed = parseJson(result.text);
  const rawCandidates = Array.isArray(parsed?.candidates) ? parsed.candidates : [];
  const suppliedRealityText = clean(input.events.map((event) => event.text).join(" "));
  const deterministicCandidates = rawCandidates
    .map((value, index) => normalizeCandidate(value, index, allowedEventIds))
    .filter((value): value is AuthorCreativeCandidate => Boolean(value))
    .filter((candidate) =>
      !candidateCrossesDeterministicTruthFloor(candidate, suppliedRealityText),
    )
    .filter((candidate) =>
      !candidateCrossesOperationalServiceTruthFloor(
        candidate,
        suppliedRealityText,
        input.domainContext,
      ),
    )
    .filter((candidate) =>
      !candidateCrossesUnsupportedTemporalEvaluation(
        candidate,
        suppliedRealityText,
      ),
    )
    .filter((candidate) =>
      !candidateReferencesUncitedEvidence(candidate, input.events),
    )
    .slice(0, 4);

  const handoffCandidates =
    businessCreativeContext && isMemoryContext(input.domainContext)
      ? deterministicCandidates.filter((candidate) =>
          candidateIsBusinessLensMaterialHandoff(candidate, input.events.length),
        )
      : deterministicCandidates;

  const semanticVerification = await verifyDiscoveryCandidates({
    candidates: handoffCandidates,
    events: input.events,
    relations: input.relations,
    domainContext: input.domainContext,
  });

  let candidates = handoffCandidates.filter((candidate) =>
    semanticVerification.groundedIds.has(candidate.id),
  );

  const requestedSelectedId = clean(parsed?.selectedCandidateId);
  const modelPlayableEventIds = stringArray(parsed?.playableEventIds, 32)
    .filter((id) => allowedEventIds.has(id));
  const modelBackgroundEventIds = stringArray(parsed?.backgroundEventIds, 64)
    .filter((id) => allowedEventIds.has(id));
  const experienceMode = clean(
    (input.domainContext as Record<string, unknown> | undefined)?.experienceMode,
  ).toUpperCase();

  let repairModel = result.model;
  let repairModelCalls = 0;
  let usedRepair = false;

  const modelSelectedCandidate = deterministicCandidates.find(
    (candidate) => candidate.id === requestedSelectedId,
  );
  const modelSelectedSurvived = candidates.some(
    (candidate) => candidate.id === requestedSelectedId,
  );

  const repairTargets =
    modelSelectedCandidate && !modelSelectedSurvived
      ? [modelSelectedCandidate]
      : !candidates.length
        ? handoffCandidates
        : [];

  if (repairTargets.length) {
    const repair = await repairDiscoveryCandidates({
      candidates: repairTargets,
      events: input.events,
      relations: input.relations,
      allowedEventIds,
      domainContext: input.domainContext,
    });
    repairModel = repair.model === "none" ? result.model : repair.model;
    repairModelCalls += repair.modelCalls;
    usedRepair = repair.modelCalls > 0;

    if (repair.candidates.length) {
      const repairedVerification = await verifyDiscoveryCandidates({
        candidates: repair.candidates,
        events: input.events,
        relations: input.relations,
        domainContext: input.domainContext,
      });
      repairModelCalls += repairedVerification.modelCalls;

      const groundedRepairs = repair.candidates.filter((candidate) =>
        repairedVerification.groundedIds.has(candidate.id),
      );

      candidates = unique([
        ...groundedRepairs.map((candidate) => candidate.id),
        ...candidates.map((candidate) => candidate.id),
      ])
        .map((id) =>
          groundedRepairs.find((candidate) => candidate.id === id) ??
          candidates.find((candidate) => candidate.id === id),
        )
        .filter((candidate): candidate is AuthorCreativeCandidate => Boolean(candidate));
    }
  }

  const fallbackCandidate: AuthorCreativeCandidate = {
    id: "reality-direct",
    mode: "RELATIONAL",
    perception: "Use the supplied reality directly; no additional hidden relationship is established.",
    relationship: "",
    observerInference: "",
    evidenceEventIds: input.events.map((event) => event.id),
    whyItHits: "",
    risk: "no_grounded_discovery_candidate",
  };

  const requestedSelected = !usedRepair
    ? candidates.find((candidate) => candidate.id === requestedSelectedId)
    : undefined;

  const repairedSelected = usedRepair
    ? candidates.find((candidate) => {
        const baseId = clean(candidate.id).replace(/-repair(?:ed)?$/i, "");
        return baseId === requestedSelectedId;
      })
    : undefined;

  const selected =
    requestedSelected ??
    repairedSelected ??
    candidates[0] ??
    fallbackCandidate;

  const selectedMatchesModelChoice =
    Boolean(requestedSelected) &&
    selected.id === requestedSelectedId;

  const selectedRepairsModelChoice = Boolean(repairedSelected) &&
    selected.id === repairedSelected?.id;

  const selectedEvidenceSet = new Set(selected.evidenceEventIds);

  const preserveChosenMemoryCorridor =
    experienceMode === "MEMORY" &&
    (selectedMatchesModelChoice || selectedRepairsModelChoice);

  const chosenMemoryCorridor = preserveChosenMemoryCorridor
    ? unique([
        ...selected.evidenceEventIds,
        ...modelPlayableEventIds,
        ...modelBackgroundEventIds,
      ]).filter((id) => allowedEventIds.has(id))
    : [];

  const selectedChangedAfterModelChoice =
    !selectedMatchesModelChoice && !selectedRepairsModelChoice;

  const playableEventIds = preserveChosenMemoryCorridor
    ? chosenMemoryCorridor
    : selectedChangedAfterModelChoice
      ? selected.evidenceEventIds.filter((id) => allowedEventIds.has(id))
      : modelPlayableEventIds
          .filter((id) => selectedEvidenceSet.has(id));

  const playableSet = new Set(playableEventIds);

  const requestedBackground = selectedChangedAfterModelChoice ||
    preserveChosenMemoryCorridor
    ? []
    : modelBackgroundEventIds
        .filter((id) => selectedEvidenceSet.has(id))
        .filter((id) => !playableSet.has(id));

  const backgroundEventIds = preserveChosenMemoryCorridor
    ? []
    : selectedChangedAfterModelChoice
      ? selected.evidenceEventIds.filter((id) => !playableSet.has(id))
      : requestedBackground.length
        ? requestedBackground
        : selected.evidenceEventIds.filter((id) => !playableSet.has(id));

  return {
    discovery: {
      candidates,
      selectedCandidateId: selected.id,
      selected,
      playableEventIds,
      backgroundEventIds,
      experienceShape: stringArray(parsed?.experienceShape, 5),
      lens: requestedLens || "NONE",
      confidence: clamp(parsed?.confidence, 0.65),
      selectionReason: selectedMatchesModelChoice
        ? clean(parsed?.selectionReason)
        : selected.perception || selected.relationship,
      risk: selectedMatchesModelChoice
        ? clean(parsed?.risk) || selected.risk
        : selected.risk,
    },
    model: repairModel,
    modelCalls: 1 + semanticVerification.modelCalls + repairModelCalls,
  };
}
