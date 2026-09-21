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
  /\b(list|prompt|input|record|document|format|formatting|field|fields|wording|phrasing|sentence|sentences|repetition|repeated|repeating)\b/i;

const EXPLICIT_RELATION_CLAIMS =
  /\b(priorit(?:y|ize|ized|ization)|rank(?:ed|ing)?|hierarch(?:y|ical)|curat(?:e|ed|es|ion)|deliberat(?:e|ely)|step\s+up|escalat(?:e|ed|es|ing|ion))\b/i;

function candidateCrossesDeterministicTruthFloor(
  candidate: AuthorCreativeCandidate,
  suppliedRealityText: string,
): boolean {
  const candidateText = clean([
    candidate.perception,
    candidate.relationship,
    candidate.observerInference,
  ].join(" "));

  const inventsRecordShape =
    RECORD_SHAPE_LANGUAGE.test(candidateText) &&
    !RECORD_SHAPE_LANGUAGE.test(suppliedRealityText);

  const inventsExplicitRelation =
    EXPLICIT_RELATION_CLAIMS.test(candidateText) &&
    !EXPLICIT_RELATION_CLAIMS.test(suppliedRealityText);

  return inventsRecordShape || inventsExplicitRelation;
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
          "An attempt to remove something does not prove it was removed.",
          "A subject leaving happy does not prove why the subject was happy.",
          "Nervousness before later events does not prove those later events caused the nervousness.",
          "Preserve a figurative read when a reasonable viewer would understand it as imaginative framing of supplied actions rather than a factual claim about hidden reality.",
          "Distinguish 'X was intentionally done for Y' from 'X makes the moment feel like Y.' The first needs factual support; the second can be a grounded perceptual transformation.",
          "Do not reject a candidate merely because its metaphor is not literally true. Reject it only when the metaphor promotes itself into unsupported material history, motive, cause, ownership, outcome, chronology, or hidden condition.",
          "Judge the whole candidate, not just its strongest phrase. If either perception or relationship contains an unsupported hidden premise, reject the candidate even when another part is grounded.",
          "Words such as imposed, accepted, rebelled, defied, submitted, escaped, freed, constrained, resisted, or liberated describe agency, stance, or state. They are allowed only when the supplied reality itself establishes that meaning, not merely because an action can be dramatized that way.",
          "Trying to remove an added object can support a figurative beat of resistance to that object, but it does not establish that the object was imposed, that the subject accepted it later, that removal succeeded, or that later happiness was caused by freedom from it.",
          "For every candidate, extract unsupportedClaims: each causal, motivational, agency, outcome, state-change, ranking, chronology, hidden-condition, or other real-world premise that is not established by SUPPLIED_REALITY.",
          "Also judge worthRealizing. A candidate is worth realizing only when it extracts a specific perceptual opportunity from distinctive supplied material. Generic before/after summaries, broad emotional transitions, service/process descriptions, category labels, or restatements such as 'nervous then happy is a contrast' are grounded but NOT worth realizing when they ignore more specific supplied actions, objects, tensions, oddities, or character material.",
          "A tiny specific relation can be worth realizing even when it uses only one or two events. Specificity matters more than coverage.",
          "grounded is only a truth summary. unsupportedClaims is authoritative: grounded should be true exactly when unsupportedClaims is empty.",
          "Return one verification for every candidate, in the same order.",
        ].join("\n"),
      },
      {
        role: "user",
        content: JSON.stringify({
          SUPPLIED_REALITY: input.events,
          CANDIDATES: input.candidates.map((candidate) => ({
            id: candidate.id,
            mode: candidate.mode,
            perception: candidate.perception,
            relationship: candidate.relationship,
            evidenceEventIds: candidate.evidenceEventIds,
          })),
          instruction:
            "Audit every perception and relationship clause. Put each unsupported premise in unsupportedClaims, including invented causality, motive, completed outcome, agency, acceptance, imposition, rebellion, constraint, emotional cause, hidden state, or inferred resolution. grounded must equal unsupportedClaims.length === 0. Separately set worthRealizing=true only when the candidate gives QRE a specific perceptual relation or metamorphic opportunity worth turning into an experience. Do not reward a candidate merely for being true. Generic emotional transitions, broad service summaries, category descriptions, or obvious start/end contrasts are not enough when they fail to use the distinctive supplied material.",
        }),
      },
    ],
    "json",
    {
      numPredict: 320,
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
  allowedEventIds: Set<string>;
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
          "The first discovery pass found creative possibilities, but none survived semantic grounding.",
          "Do not invent a new story. Salvage the strongest perceptual opportunity by removing the unsupported premise that poisoned it.",
          "Keep the creative leap; remove fake history.",
          "A perceptual relation may change status, significance, atmosphere, role, absurdity, intimacy, tension, ceremony, suspicion, tenderness, or another felt reading without asserting that the transformed frame literally happened.",
          "Never add motive, causality, ownership, successful outcome, hidden emotional cause, unseen condition, literal rank, literal role, or completed action.",
          "Prefer a small specific relation carried by supplied objects/actions over a broad emotional arc.",
          "Return up to two repaired candidates. If no candidate can be repaired without becoming bland or false, return an empty candidates array.",
        ].join("\n"),
      },
      {
        role: "user",
        content: JSON.stringify({
          SUPPLIED_REALITY: input.events,
          FAILED_DISCOVERY: input.candidates.map((candidate) => ({
            id: candidate.id,
            mode: candidate.mode,
            perception: candidate.perception,
            relationship: candidate.relationship,
            evidenceEventIds: candidate.evidenceEventIds,
          })),
          instruction:
            "Repair only the perceptual relation. State it as what the supplied facts can READ LIKE or FEEL LIKE, not as an explanation of why anything happened. Preserve distinctive supplied material. Do not write final cuts.",
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
  const candidates = raw
    .map((value, index) => normalizeCandidate(value, index, input.allowedEventIds))
    .filter((value): value is AuthorCreativeCandidate => Boolean(value))
    .filter((candidate) =>
      !candidateCrossesDeterministicTruthFloor(candidate, suppliedRealityText),
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
  requestedLens?: string;
  memory?: readonly string[];
  domainContext?: AuthorDomainContext;
}): Promise<{
  discovery: AuthorCreativeDiscovery;
  model: string;
  modelCalls: number;
}> {
  const requestedLens = clean(input.requestedLens);
  const allowedEventIds = new Set(input.events.map((event) => event.id));

  const system = [
    "You are QRE Creative Discovery.",
    "Reality is fixed. Interpretation is free.",
    "",
    "NOTICE WHAT IS ALIVE.",
    "Study CURRENT_REALITY and find the specific detail, contrast, character signal, excess, awkwardness, reversal, recurrence, status change, strange combination, or relationship that gives this material energy.",
    "A strong read may live in one supplied detail or in a relationship across several facts.",
    "Relationships between facts may be literal relationships established by supplied reality OR perceptual relationships created by a clearly figurative read of supplied reality.",
    "A perceptual relationship changes how the viewer experiences the supplied facts without claiming that the transformation itself literally happened.",
    "When several facts merely coexist, keep them coexisting unless supplied reality establishes order, rank, cause, urgency, preference strength, escalation, deliberateness, selection, exclusivity, or curation.",
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
    "",
    "SELECT FOR LIFE.",
    "Choose the read that feels most specific, grounded, surprising, compressible, and worth realizing.",
    "A strong selected read changes how the supplied facts feel when viewed together.",
    "Prefer a grounded perceptual leap over a bland literal summary. The leap should reveal latent character, status, tension, intimacy, absurdity, contrast, ceremony, danger, luxury, suspicion, tenderness, or another felt property already available in the supplied material.",
    "The strongest read often does not explain WHY something happened. It changes what the same facts seem to mean or resemble when experienced together.",
    "The read does not need to invent a relationship among the facts. A truthful cluster can be interesting because of its specificity, character, contrast, or odd combination alone.",
    "Give Creative something alive to play with: status, tension, contrast, reversal, character, odd specificity, excess, repetition, implication, or another felt dynamic already supported by reality. Use escalation, rivalry, rank, or sequence only when supplied reality actually establishes them.",
    "Prefer a read that creates a viewer perception over one that merely categorizes the service, workflow, process, or record.",
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
          MEMORY: (input.memory ?? []).slice(0, 12),
          BUSINESS_CONTEXT: input.domainContext,
          CREATIVE_INTENT: {
            requestedLens: requestedLens || undefined,
          },
          instruction:
            "Find four genuinely different grounded reads in the supplied reality. Treat the input only as facts about the world: do not analyze the list, phrasing, repetition of wording, formatting, field order, or the act of recording those facts. Search especially for perceptual transformations: what status, significance, atmosphere, relationship, contrast, absurdity, intimacy, tension, ceremony, or other felt meaning the SAME facts can take on without that transformation becoming a new historical fact. Keep each read concise: what you noticed, the playable perceptual relation, and its evidence. Do not manufacture literal order, ranking, causality, urgency, preference strength, deliberateness, selection, exclusivity, curation, motive, ownership, or hidden pressure. A figurative relation may change how reality feels; it may not rewrite what materially happened. Select the read with the most life and creative potential. Do not write final cuts.",
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
    .slice(0, 4);

  const semanticVerification = await verifyDiscoveryCandidates({
    candidates: deterministicCandidates,
    events: input.events,
  });

  let candidates = deterministicCandidates.filter((candidate) =>
    semanticVerification.groundedIds.has(candidate.id),
  );

  let repairModel = result.model;
  let repairModelCalls = 0;

  if (!candidates.length && deterministicCandidates.length) {
    const repair = await repairDiscoveryCandidates({
      candidates: deterministicCandidates,
      events: input.events,
      allowedEventIds,
    });
    repairModel = repair.model === "none" ? result.model : repair.model;
    repairModelCalls += repair.modelCalls;

    if (repair.candidates.length) {
      const repairedVerification = await verifyDiscoveryCandidates({
        candidates: repair.candidates,
        events: input.events,
      });
      repairModelCalls += repairedVerification.modelCalls;
      candidates = repair.candidates.filter((candidate) =>
        repairedVerification.groundedIds.has(candidate.id),
      );
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

  const requestedSelectedId = clean(parsed?.selectedCandidateId);
  const requestedSelected = candidates.find(
    (candidate) => candidate.id === requestedSelectedId,
  );

  const selected =
    requestedSelected ??
    candidates[0] ??
    fallbackCandidate;

  const selectedMatchesModelChoice =
    Boolean(requestedSelected) &&
    selected.id === requestedSelectedId;

  const selectedEvidenceSet = new Set(selected.evidenceEventIds);

  const playableEventIds = stringArray(parsed?.playableEventIds, 32)
    .filter((id) => allowedEventIds.has(id))
    .filter((id) => selectedEvidenceSet.has(id));

  const playableSet = new Set(playableEventIds);
  const requestedBackground = stringArray(parsed?.backgroundEventIds, 64)
    .filter((id) => allowedEventIds.has(id))
    .filter((id) => selectedEvidenceSet.has(id))
    .filter((id) => !playableSet.has(id));

  const backgroundEventIds = requestedBackground.length
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
