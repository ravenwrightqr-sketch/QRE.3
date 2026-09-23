import type { AuthorDomainContext, AuthorScene } from "@qre/contracts";
import { localModelGenerate } from "./localModelRuntime.js";
import type { AuthorCreativeDiscovery } from "./authorCreativeDiscovery.js";
import { evaluateAuthorCut } from "./authorCutFloor.js";

const clean = (value: unknown): string =>
  String(value ?? "").replace(/\s+/g, " ").trim();

const stripProductionLabel = (value: unknown): string =>
  clean(value).replace(/^[A-D]\s*:\s*/i, "").trim();

const unique = (values: readonly string[]): string[] =>
  [...new Set(values.map(clean).filter(Boolean))];

function debug(label: string, value: unknown): void {
  if (process.env.QRE_AUTHOR_DEBUG_RAW !== "true") return;
  const text = typeof value === "string"
    ? value
    : JSON.stringify(value, null, 2);
  console.log(`\n--- QRE ${label} ---\n${text}\n--- END QRE ${label} ---\n`);
}

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

export type AuthorCreativeEvent = {
  id: string;
  text: string;
};

export type AuthorBeatRole = "HOOK" | "BUILD" | "TURN" | "PAYOFF";

export type AuthorSemanticBeat = {
  order: number;
  role: AuthorBeatRole;
  eventIds: string[];
  attention: string;
  change: string;
};

export type AuthorSemanticPlan = {
  thesis: string;
  beats: AuthorSemanticBeat[];
};

export type AuthorCreativeFrame = {
  id: string;
  frame: string;
  treatment: string;
  devices: string[];
  intensity: "LIGHT" | "MEDIUM" | "STRONG";
};

export type AuthorCreativeFrameCandidate = {
  frame: string;
  reason: string;
  confidence: number;
};

const GENERIC_CREATIVE_FRAME =
  /^(?:game|journey|mission|story|experience|transformation)$/i;

function materialText(values: readonly string[]): string {
  return clean(values.join(" ")).toLowerCase();
}

function clamp01(value: number): number {
  return Number(Math.max(0, Math.min(1, value)).toFixed(3));
}

function addFrameCandidate(
  candidates: AuthorCreativeFrameCandidate[],
  frame: string,
  reason: string,
  confidence: number,
): void {
  const normalizedFrame = clean(frame).toLowerCase();
  if (!normalizedFrame || GENERIC_CREATIVE_FRAME.test(normalizedFrame)) return;
  if (candidates.some((candidate) => candidate.frame === normalizedFrame)) return;

  candidates.push({
    frame: normalizedFrame,
    reason: clean(reason),
    confidence: clamp01(confidence),
  });
}

export function deriveAuthorCreativeFrameCandidates(input: {
  subject?: string;
  suppliedReality: readonly AuthorCreativeEvent[];
  creativeDiscovery?: AuthorCreativeDiscovery;
  memory?: readonly string[];
  domainContext?: AuthorDomainContext;
}): AuthorCreativeFrameCandidate[] {
  const eventText = materialText(input.suppliedReality.map((event) => event.text));
  const discovery = input.creativeDiscovery;
  const discoveryText = materialText([
    discovery?.selected.perception,
    discovery?.selected.relationship,
    ...(discovery?.experienceShape ?? []),
  ].filter((value): value is string => typeof value === "string"));
  const memoryText = materialText(input.memory ?? []);
  const context = (input.domainContext ?? {}) as Record<string, unknown>;
  const contextText = materialText([
    context.serviceType,
    context.businessType,
    context.merchantType,
    context.category,
    context.serviceName,
  ].map((value) => clean(value)));
  const text = clean(`${eventText} ${discoveryText} ${memoryText}`);
  const textWithContext = clean(`${text} ${contextText}`);

  const candidates: AuthorCreativeFrameCandidate[] = [];
  const hasResistance =
    /\b(?:nervous|scared|shy|guarded|hesitant|resisted|resistance|hates?|refused|tried|attempted|stole|steals|fierce|stubborn|defiant|rebellion)\b/i.test(text);
  const hasStatusObject =
    /\b(?:bow|ticket|badge|approval|approved|rank|status|official|claim|claimed|selected|chosen|crown|prize)\b/i.test(text);
  const hasStateContrast =
    /\b(?:before|after|left|arrived|came in|entered|finished|completed)\b/i.test(text) &&
    /\b(?:nervous|scared|shy|approved|happy|fabulous|clean|finished|complete|done)\b/i.test(text);

  if ((hasResistance && (hasStatusObject || hasStateContrast)) || /status contest|status tension/i.test(discoveryText)) {
    addFrameCandidate(
      candidates,
      "negotiation",
      "supplied resistance or status tension makes the interaction read as a perspective contest",
      0.92,
    );
  }

  const serviceSignals =
    /\b(?:service|clean(?:ed|ing)?|repair(?:ed|ing)?|groom(?:ed|ing)?|bath|bathroom|kitchen|packed|loaded|delivered|installed|inspection|appointment)\b/i;
  const boundedWork =
    /\b(?:arrived|started|began|first|then|next|finished|completed|done|left)\b/i.test(text);
  const timeOrCount =
    /\b(?:\d{1,2}:\d{2}|\d+\s*(?:rooms?|bathrooms?|boxes?|items?|hours?|minutes?|days?)|two|three|four|five|first|last)\b/i.test(text);
  const taskSignals = input.suppliedReality.filter((event) => serviceSignals.test(event.text));
  const hasMeaningfulOperation =
    taskSignals.length >= 2 &&
    boundedWork &&
    timeOrCount &&
    serviceSignals.test(textWithContext);

  if (hasMeaningfulOperation) {
    addFrameCandidate(
      candidates,
      "operation",
      "bounded supplied work progression has enough structure to read as an operation without adding facts",
      0.84,
    );
  }

  if (
    /\b(?:missing|lost|vanished|unresolved|mystery|unknown|question|where|search|found)\b/i.test(text) &&
    /\b(?:box|object|item|key|card|record|bag|ticket|detail|thing)\b/i.test(text)
  ) {
    addFrameCandidate(
      candidates,
      "investigation",
      "an unresolved supplied object or question creates a perspective of inquiry",
      0.94,
    );
  }

  if (/\b(?:same|again|returned|return|repeated|recurring|every|sundays?|weekly|back)\b/i.test(text)) {
    const frame = /\b(?:memorial|remember|record|song|card|birthday|old|kept)\b/i.test(text)
      ? "refrain"
      : "return";
    addFrameCandidate(
      candidates,
      frame,
      "a repeated supplied detail can become the perspective anchor",
      frame === "refrain" ? 0.93 : 0.86,
    );
  }

  if (
    /\b(?:memorial|remember|old records?|birthday cards?|same song|quiet|kept every)\b/i.test(text) &&
    !hasResistance
  ) {
    addFrameCandidate(
      candidates,
      "quiet observation",
      "the memory is stronger when observed with restraint than converted into a genre",
      0.88,
    );
  }

  if (
    /\b(?:before|after|dirty|filthy|restored|cleaned|revealed|uncovered)\b/i.test(text) &&
    /\b(?:visible|looked|left|finished|done|result)\b/i.test(text)
  ) {
    addFrameCandidate(
      candidates,
      "reveal",
      "a supplied visible state change can carry a compact perspective reveal",
      0.76,
    );
  }

  return candidates
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 6);
}

export function selectAuthorCreativeFrame(input: {
  candidates: readonly AuthorCreativeFrameCandidate[];
  creativeDiscovery?: AuthorCreativeDiscovery;
}): AuthorCreativeFrameCandidate {
  const groundedCandidates = input.candidates
    .filter((candidate) => {
      const frame = clean(candidate.frame);
      return frame && !GENERIC_CREATIVE_FRAME.test(frame);
    })
    .sort((a, b) => b.confidence - a.confidence);

  if (!groundedCandidates.length) {
    return {
      frame: "NONE",
      reason: "no grounded perspective frame is available from supplied reality",
      confidence: 1,
    };
  }

  const top = groundedCandidates[0]!;
  if (top.confidence < 0.72) {
    return {
      frame: "NONE",
      reason: "no candidate materially improves the supplied reality",
      confidence: 0.76,
    };
  }

  return top;
}

export type AuthorCreativeTreatment = {
  id: string;
  treatment: string;
  devices: string[];
  intensity: "LIGHT" | "MEDIUM" | "STRONG";
};

function isBareTreatment(treatment: AuthorCreativeTreatment): boolean {
  return /\b(?:none|bare reality|natural|minimal treatment)\b/i.test(
    materialText([treatment.id, treatment.treatment, ...treatment.devices]),
  );
}

function unsupportedLensMaterialReason(input: {
  text: string;
  suppliedRealityText: string;
  selectedFrame: string;
}): string | undefined {
  const text = input.text;
  const supplied = input.suppliedRealityText;
  const selectedFrame = clean(input.selectedFrame).toLowerCase();
  const hasRecurrenceFrame = selectedFrame === "refrain" || selectedFrame === "return";
  const sourceHasRecurrence =
    /\b(?:same|again|returned|return|repeated|recurring|every|sundays?|weekly|back)\b/i.test(supplied);

  if (
    /\b(?:actual|literal|real|physical|concrete)\s+(?:spy|courtroom|lawyer|weapon|handler|enemy|boss|kingdom|quest|mission)\b/i.test(text) ||
    /\b(?:introduce|add|create|invent|include)\s+(?:a|an|the)?\s*(?:spy|courtroom|lawyer|weapon|handler|enemy|boss|kingdom|quest|mission)\b/i.test(text)
  ) {
    return "literalizes genre framing into unsupplied reality";
  }

  if (
    /\b(?:camera|visuals?|visual displays?|zooms?|lighting|music|sound effects?|chimes?|narration|voiceover|ui treatments?|charts?|graphs?|staging|scene mechanics|vignettes?)\b/i.test(text)
  ) {
    return "production implementation rather than perspective";
  }

  if (
    /\b(?:log|logs|report|reports|checklist|checklists|numbered steps|corporate|protocol language|administrative|bureaucratic)\b/i.test(text)
  ) {
    return "operation drifted into reporting or administrative language";
  }

  if (
    /\b(?:efficien\w*|precision|precise|meticulous\w*|methodical\w*|streamlined|relentless|focused effort|quiet responsibility|satisfaction|quality|competence|competent|urgency|urgent|difficulty|difficult|worker personality|professionalism|skilled|expert)\b/i.test(text)
  ) {
    return "infers quality, competence, urgency, difficulty, or personality";
  }

  if (
    /\b(?:metrics?|rankings?|scores?|deadlines?|performance measurements?|performance|kpis?|quantified|measurements?)\b/i.test(text)
  ) {
    return "creates unsupported metrics or performance measurement";
  }

  if (
    /\b(?:completed contract|signed contract|legal agreement|agreement reached|deal closed)\b/i.test(text)
  ) {
    return "invents an unsupplied legal or contractual fact";
  }

  if (
    /\b(?:cleaner|spotless|sparkling|transformation|transformed|visual result|visible result|before\/after|before after|physical state change)\b/i.test(text)
  ) {
    return "infers physical before/after state or visible result";
  }

  const claimsRealWorldRecurrence =
    /\b(?:service|visit|work|task|event|process|housekeeping)\s+(?:is|was|becomes?|became|feels?|felt)?\s*(?:routine|recurring|repeated|cyclical|weekly|ritualized|habitual)\b/i.test(text) ||
    /\b(?:service|visit|work|task|event|process|housekeeping)\s+(?:recurs?|repeats?|returns?)\b/i.test(text) ||
    /\b(?:again|weekly|every\s+\w+|returns?)\b[^.]{0,40}\b(?:service|visit|work|task|event|process|housekeeping)\b/i.test(text);

  if (!hasRecurrenceFrame && !sourceHasRecurrence && claimsRealWorldRecurrence) {
    return "infers recurrence from a single supplied event";
  }

  const claimsRealWorldTimestampRecurrence =
    /\b(?:the\s+)?(?:timestamp|time stamp|clock time|arrival time|finish time)\b\s+(?:is|was|kept|remained|became)?\s*(?:the\s+same\s+)?(?:again|weekly|recurring|repeated|repeats|recurs)\b/i.test(text) ||
    /\b(?:same time|same timestamp|same clock time)\b[^.]{0,60}\b(?:again|every|weekly|across visits?|across events?)\b/i.test(text);

  if (!sourceHasRecurrence && claimsRealWorldTimestampRecurrence) {
    return "requires unsupported timestamp recurrence";
  }

  return undefined;
}

function authorCreativeTreatmentCompatibility(input: {
  selectedFrame: AuthorCreativeFrameCandidate;
  treatment: AuthorCreativeTreatment;
  suppliedReality?: readonly AuthorCreativeEvent[];
}): {
  compatible: boolean;
  reason: string;
} {
  const selected = clean(input.selectedFrame.frame).toLowerCase();
  if (!selected || selected === "none") {
    return {
      compatible: true,
      reason: "no selected frame constraint",
    };
  }

  const candidate = materialText([
    input.treatment.id,
    input.treatment.treatment,
    ...input.treatment.devices,
  ]);

  if (isBareTreatment(input.treatment)) {
    return {
      compatible: true,
      reason: "bare reality remains a valid competitor",
    };
  }

  const suppliedRealityText = materialText((input.suppliedReality ?? []).map((event) => event.text));
  const unsupportedReason = unsupportedLensMaterialReason({
    text: candidate,
    suppliedRealityText,
    selectedFrame: selected,
  });

  if (unsupportedReason) {
    return {
      compatible: false,
      reason: unsupportedReason,
    };
  }

  return {
    compatible: true,
    reason: "compatible with selected frame treatment boundary",
  };
}

function treatmentAsMouthFrame(
  treatment: AuthorCreativeTreatment,
  selectedFrame: AuthorCreativeFrameCandidate,
): AuthorCreativeFrame {
  return {
    id: treatment.id,
    frame: isBareTreatment(treatment) ? "NONE / Bare Reality" : selectedFrame.frame,
    treatment: treatment.treatment,
    devices: treatment.devices,
    intensity: treatment.intensity,
  };
}

export type AuthorCreativeTreatmentSearchResult = {
  lensSearchEnabled: boolean;
  lensMode: "NONE" | "REQUESTED" | "AUTO_BUSINESS";
  autoBusinessLens: boolean;
  rawTreatmentResponse: string;
  model: string;
  modelCalls: number;
  selectedFrame: AuthorCreativeFrameCandidate;
  frameCandidates: AuthorCreativeFrameCandidate[];
  parsedTreatments: AuthorCreativeTreatment[];
  acceptedTreatments: AuthorCreativeFrame[];
  rejectedTreatments: Array<{
    treatment: AuthorCreativeTreatment;
    reason: string;
  }>;
};

export async function searchAuthorCreativeLensTreatments(input: {
  subject: string;
  suppliedReality: readonly AuthorCreativeEvent[];
  plan: AuthorSemanticPlan;
  creativeOpportunity: string;
  relation: string;
  experienceMode?: string;
  requestedLens?: string;
  domainContext?: AuthorDomainContext;
  selectedFrame: AuthorCreativeFrameCandidate;
  frameCandidates: readonly AuthorCreativeFrameCandidate[];
}): Promise<AuthorCreativeTreatmentSearchResult> {
  const requestedLens = clean(input.requestedLens);
  const normalizedRequestedLens = requestedLens.toUpperCase();
  const explicitLensProvided = Boolean(requestedLens);
  const explicitLensOff = normalizedRequestedLens === "NONE";
  const selectedFrame: AuthorCreativeFrameCandidate =
    explicitLensProvided && !explicitLensOff
      ? {
          frame: requestedLens.toLowerCase(),
          reason: "explicit requested lens governs treatment search",
          confidence: 1,
        }
      : input.selectedFrame;
  const autoBusinessLens =
    !explicitLensProvided &&
    isBusinessCreativeContext(input.domainContext);
  const lensSearchEnabled =
    !explicitLensOff &&
    selectedFrame.frame !== "NONE" &&
    (explicitLensProvided || autoBusinessLens);
  const lensMode =
    explicitLensOff
      ? "NONE"
      : explicitLensProvided
        ? "REQUESTED"
        : autoBusinessLens
          ? "AUTO_BUSINESS"
          : "NONE";

  const lensResult = lensSearchEnabled
    ? await localModelGenerate(
    [
      {
        role: "system",
        content: [
          "You are QRE Creative Treatment Search.",
          "Reality is fixed. Frame identity is closed.",
          "The approved meaning and beat structure already exist. Do not rediscover the story and do not alter the semantic thesis.",
          "Do not reinterpret the source again. SELECTED_FRAME is the semantic authority for framing when it is not NONE.",
          "Do not generate, choose, rename, or compare frame identities.",
          "Generate exactly four materially different expressive treatments inside SELECTED_FRAME using only supplied reality.",
          "The four treatments must be orthogonal creative strategies, not four variants of the same operational/status idea.",
          "Vary the governing rhetorical mechanism itself: for example one may use game-like progression, another withheld/evidence-like pressure, another ceremonial or absurd importance, another bare reality. These are examples, not a required menu.",
          "Do not let more than one non-bare treatment rely primarily on the same device family such as phase labels, status updates, procedural sequencing, or progression markers.",
          "Prefer material-specific treatments the model discovers over merely cycling through a fixed genre list.",
          "A treatment is a rhetorical way to realize the selected perspective, not a new story, plot, world, scene, or fact.",
          "Genre freedom is allowed; reality freedom is not.",
          "Treat comedy, horror, romance, spy, noir, heist, courtroom, game, speedrun, royal, absurd, fierce, dramatic, quiet, and similar vocabularies as expressive grammars only.",
          "A spy treatment may make supplied work feel covert; it may not invent a handler, surveillance camera, weapon, enemy, secret room, or mission event.",
          "A courtroom treatment may make a supplied object feel like evidence; it may not invent a lawyer, judge, courtroom, testimony, or legal event.",
          "A game or speedrun treatment may use rounds, levels, boss-fight energy, checkpoints, or status language rhetorically; it may not invent an actual game system, timer, opponent, score, or victory that reality did not supply.",
          "Horror, romance, noir, heist, royal, absurd, comedy, and other lenses may change implication, status, tone, rhythm, compression, escalation, contrast, anticipation, or payoff while leaving concrete reality untouched.",
          "GENRE NAME IS NOT EVIDENCE. Never convert a genre convention into a factual claim about performance, psychology, atmosphere, secrecy, quality, competence, emotion, or physical state.",
          "Speedrun/game framing may use phase, checkpoint, round, level, status, progression, compression, or escalation language. It may NOT infer speed, efficiency, focus, skill, timer pressure, score, or victory unless supplied.",
          "Noir/spy/heist framing may use clipped language, withheld emphasis, covert-style rhetoric, suspicion, evidence-like status, or deadpan seriousness. It may NOT infer secrecy, precision, meticulousness, responsibility, surveillance, danger, criminality, or hidden actors unless supplied.",
          "Dramatic/horror/romance framing may alter pacing, tension, anticipation, contrast, or payoff. It may NOT invent unseen before/after states, satisfaction, fear, desire, atmosphere, reactions, or outcomes.",
          "Describe rhetorical mechanics only. If a treatment description contains an unsupplied worker trait, mental state, physical result, hidden condition, or performance judgment, the treatment is invalid even if the final Mouth might never say it.",
          "Describe what the LANGUAGE does, not what the worker, service, room, client, or event supposedly was like.",
          "Language may use repetition, refrain, callback, echo, or recurring phrasing within this single experience without claiming the underlying event itself recurred.",
          "SAFE: 'Use phase labels, clipped rhythm, checkpoint-like progression, and escalating status language.'",
          "UNSAFE: 'Emphasize efficiency, minimal downtime, precision, meticulous work, responsibility, satisfaction, or methodical execution.' Those are claims about performance or psychology.",
          "SAFE: 'Use evidence-like rhetoric, withheld emphasis, terse sequencing, and deadpan seriousness.'",
          "UNSAFE: 'Treat the tasks as proof of a completed contract.' A contract is a concrete fact unless supplied.",
          "Do not include forbidden concepts merely to negate them. Instead of saying 'no commentary on speed or efficiency,' omit those concepts entirely and describe the allowed rhetorical mechanics positively.",
          "Do not write final cuts. Describe the treatment Mouth should use.",
          "The selected frame is perspective authority only; treatments may vary expressive lens while remaining grounded in that frame.",
          "Lens must describe interpretive perspective only: status, tension, bounded progression, escalation, restraint, recurrence, contrast, anticipation, payoff, implication, or recontextualization.",
          "Concrete reality remains exactly the supplied reality.",
          "Do not infer quality, competence, efficiency, precision, thoroughness, urgency, difficulty, or worker personality.",
          "Do not infer physical before/after states or visual results.",
          "Do not infer recurrence, cycles, routines, rituals, or habits from a single supplied event.",
          "Distinguish rhetorical repetition from factual recurrence. You MAY repeat a phrase, motif, status marker, syntax pattern, callback, or refrain inside one bounded experience. That is a language device. You may NOT imply that the real service, visit, task, behavior, or event itself happened repeatedly, routinely, cyclically, weekly, or again unless the source supplies that recurrence.",
          "Phrases such as 'recurring phrasing', 'repeated wording', 'callback', 'refrain', 'echo', or 'repeat this line after each beat' describe language behavior and are legal inside one experience.",
          "Supplied timestamps may also be reused rhetorically as anchors, callbacks, labels, or repeated wording inside the same experience. Repeating the text '9:04' does not claim that 9:04 occurred more than once. Only claim real-world timestamp recurrence when the source supplies it.",
          "Do not create metrics, rankings, scores, deadlines, or performance measurements.",
          "Treatment may vary through rhetorical status, tone, rhythm, compression, seriousness, escalation, understatement, comedy, dread, romance, noir pressure, covert framing, game logic, speedrun energy, heist tension, courtroom rhetoric, absurd seriousness, ceremonial importance, and similar nonliteral expressive devices.",
          "Do not specify production implementation: no camera moves, visuals, visual displays, zooms, lighting, music, sound effects, chimes, narration, voiceover direction, UI treatments, charts, graphs, staging, scene mechanics, mission log entries, before/after vignettes, or visual transformations.",
          "Treatment and devices must name the expressive strategy, not how to render it.",
          "When SELECTED_FRAME is operation, operation does not inherently mean log, report, checklist, numbered steps, corporate language, protocol language, or detached administrative voice.",
          "When SELECTED_FRAME is reveal, reveal may change when and how information lands, but it may not invent an unsupplied visible before/after condition.",
          "Each treatment must remain legible as interpretation rather than asserting new physical history.",
          "Different treatments must differ in expressive strategy. They may borrow different genre grammars, but they must never invent different physical worlds.",
          "One treatment may be NONE / Bare Reality when the material itself is strongest without heavy treatment.",
          ...(autoBusinessLens ? [
            "AUTO BUSINESS MODE: this is customer-facing business/service material. Treatment Search is expected to explore treatments rather than defaulting to a literal receipt.",
            "Exactly one of the four treatments must be NONE / BARE REALITY: a natural, minimally treated realization that lets the supplied facts speak for themselves.",
            "When SELECTED_FRAME is not NONE, produce three meaningfully different treatments compatible with SELECTED_FRAME plus one NONE / Bare Reality option.",
            "NONE is a real contender, not an automatic winner. Choose treatments that could make an ordinary service memory worth receiving without inventing physical reality.",
          ] : []),
          ...(explicitLensProvided && !explicitLensOff ? [
            "A lens was explicitly requested. Honor that requested lens as the governing creative direction while still proposing materially different treatments inside it.",
          ] : []),
          "Return concise treatment descriptions and devices only. Do not return a frame field.",
        ].join("\n"),
      },
      {
        role: "user",
        content: JSON.stringify({
          SUBJECT: input.subject,
          SUPPLIED_REALITY: input.suppliedReality,
          APPROVED_THESIS: input.plan.thesis,
          APPROVED_BEATS: input.plan.beats,
          CREATIVE_OPPORTUNITY: input.creativeOpportunity,
          RELATION: input.relation,
          EXPERIENCE_MODE: clean(input.experienceMode) || undefined,
          LENS_MODE: lensMode,
          REQUESTED_LENS: requestedLens || undefined,
          SELECTED_FRAME: selectedFrame,
          instruction:
            "Find four distinct reality-legal treatments inside SELECTED_FRAME. Use genre as rhetorical grammar only. Describe only what the language should do: rhythm, compression, emphasis, status, tension, contrast, anticipation, payoff, callback, implication, or recontextualization. Never characterize the worker, service, client, room, or event with unsupplied performance, psychology, quality, secrecy, or physical-state claims. Do not mention forbidden concepts just to negate them. Preserve the approved meaning. Do not write viewer-facing cuts, invent a literal world, invent before/after conditions, or choose a new frame.",
        }),
      },
    ],
    "json",
    {
      numPredict: 520,
      temperature: 0.88,
      jsonSchema: {
        type: "object",
        additionalProperties: false,
        required: ["treatments"],
        properties: {
          treatments: {
            type: "array",
            minItems: 4,
            maxItems: 4,
            items: {
              type: "object",
              additionalProperties: false,
              required: ["id", "treatment", "devices", "intensity"],
              properties: {
                id: { type: "string", maxLength: 32 },
                treatment: { type: "string", maxLength: 220 },
                devices: {
                  type: "array",
                  minItems: 1,
                  maxItems: 6,
                  items: { type: "string", maxLength: 48 },
                },
                intensity: {
                  type: "string",
                  enum: ["LIGHT", "MEDIUM", "STRONG"],
                },
              },
            },
          },
        },
      },
    },
  )
    : {
        text: "",
        model: "none",
      };

  const parsedLens = lensSearchEnabled
    ? parseJson(lensResult.text)
    : undefined;
  const rawTreatments = Array.isArray(parsedLens?.treatments) ? parsedLens.treatments : [];
  const parsedTreatments: AuthorCreativeTreatment[] = rawTreatments
    .map((value, index): AuthorCreativeTreatment | undefined => {
      if (!value || typeof value !== "object") return undefined;
      const record = value as Record<string, unknown>;
      const treatment = clean(record.treatment);
      const devices = Array.isArray(record.devices)
        ? unique(
            record.devices
              .filter((device): device is string => typeof device === "string")
              .map(clean)
              .filter(Boolean),
          ).slice(0, 6)
        : [];
      const rawIntensity = clean(record.intensity).toUpperCase();
      const intensity: AuthorCreativeFrame["intensity"] =
        rawIntensity === "LIGHT" || rawIntensity === "STRONG"
          ? rawIntensity
          : "MEDIUM";

      if (!treatment || !devices.length) return undefined;

      return {
        id: clean(record.id) || `treatment-${index + 1}`,
        treatment,
        devices,
        intensity,
      };
    })
    .filter((value): value is AuthorCreativeTreatment => Boolean(value))
    .slice(0, 4);

  const treatmentResults = parsedTreatments.map((treatment) => ({
    treatment,
    result: authorCreativeTreatmentCompatibility({
      selectedFrame,
      treatment,
      suppliedReality: input.suppliedReality,
    }),
  }));
  const acceptedTreatmentRecords =
    selectedFrame.frame === "NONE"
      ? []
      : treatmentResults
          .filter(({ result }) => result.compatible)
          .map(({ treatment }) => treatment);
  const rejectedTreatments =
    selectedFrame.frame === "NONE"
      ? []
      : treatmentResults
          .filter(({ result }) => !result.compatible)
          .map(({ treatment, result }) => ({
            treatment,
            reason: result.reason,
          }));
  const distinctTreatments = (treatments: readonly AuthorCreativeTreatment[]): AuthorCreativeTreatment[] => {
    const seen = new Set<string>();
    return treatments.filter((treatment) => {
      const key = materialText([treatment.treatment, ...treatment.devices]);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };
  const acceptedTreatments =
    !lensSearchEnabled || selectedFrame.frame === "NONE"
      ? []
      : distinctTreatments(acceptedTreatmentRecords)
          .slice(0, 4)
          .map((treatment) => treatmentAsMouthFrame(treatment, selectedFrame));

  return {
    lensSearchEnabled,
    lensMode,
    autoBusinessLens,
    rawTreatmentResponse: lensSearchEnabled ? lensResult.text : "SKIPPED",
    model: lensResult.model,
    modelCalls: lensSearchEnabled ? 1 : 0,
    selectedFrame,
    frameCandidates: [...input.frameCandidates],
    parsedTreatments,
    acceptedTreatments,
    rejectedTreatments,
  };
}

function presentationAffordance(domainContext?: AuthorDomainContext): string {
  const contextRecord = (domainContext ?? {}) as Record<string, unknown>;
  const contextText = clean(JSON.stringify(contextRecord)).toLowerCase();
  const isDogTag =
    /\bdog[\s_-]*tag\b/.test(contextText) ||
    /\bliving[\s_-]*dog[\s_-]*tag\b/.test(contextText);
  const experienceMode = clean(contextRecord.experienceMode).toUpperCase();
  const isIdentity = experienceMode === "IDENTITY";

  if (!isDogTag || !isIdentity) return "";

  return [
    "DOG TAG IDENTITY PRESENTATION:",
    "Preferences and stable character facts may become thought-like reactions, fixation, wanting, direct voice, tiny questions, callbacks, or playful self-presentation.",
    "Wanting is not happening. A love of walks does not mean a walk occurred. A love of bacon does not mean bacon is present.",
    "Do not add species clichés, body actions, associated settings, or stereotypical pet imagery.",
    "The viewer should meet the subject through supplied truths, not hear a profile summary.",
    "When multiple stable preferences are supplied together, synthesize their combination into character. Do not output one dressed-up line per preference. Let the viewer infer something about the subject that was not literally typed.",
  ].join("\n");
}

function isBusinessCreativeContext(domainContext?: AuthorDomainContext): boolean {
  const context = (domainContext ?? {}) as Record<string, unknown>;
  const serviceType = clean(context.serviceType);
  const businessType = clean(context.businessType);
  const merchantType = clean(context.merchantType);
  const category = clean(context.category).toUpperCase();

  return Boolean(serviceType || businessType || merchantType) ||
    /\b(?:SERVICE|BUSINESS|COMMERCE|RETAIL|RESTAURANT|HOSPITALITY|GROOMING)\b/.test(category);
}

function normalizeRole(value: unknown, index: number, total: number): AuthorBeatRole {
  const role = clean(value).toUpperCase();
  if (role === "HOOK" || role === "BUILD" || role === "TURN" || role === "PAYOFF") {
    return role;
  }
  if (index === 0) return "HOOK";
  if (index === total - 1) return "PAYOFF";
  return "BUILD";
}

function normalizePlan(
  value: Record<string, unknown> | undefined,
  allowedEventIds: Set<string>,
): AuthorSemanticPlan | undefined {
  const rawBeats = Array.isArray(value?.beats) ? value!.beats : [];
  const beats: AuthorSemanticBeat[] = [];

  for (const [index, raw] of rawBeats.entries()) {
    if (!raw || typeof raw !== "object") continue;
    const record = raw as Record<string, unknown>;
    const eventIds = Array.isArray(record.eventIds)
      ? unique(
          record.eventIds
            .filter((id): id is string => typeof id === "string")
            .filter((id) => allowedEventIds.has(id)),
        )
      : [];

    if (!eventIds.length) continue;

    beats.push({
      order: beats.length + 1,
      role: normalizeRole(record.role, index, rawBeats.length),
      eventIds,
      attention: clean(record.attention),
      change: clean(record.change),
    });
  }

  if (!beats.length) return undefined;

  return {
    thesis: clean(value?.thesis),
    beats: beats.slice(0, 6),
  };
}

function enforceMemoryStructure(
  plan: AuthorSemanticPlan,
  selectedEvidence: readonly AuthorCreativeEvent[],
): AuthorSemanticPlan {
  if (
    selectedEvidence.length === 4 &&
    plan.beats.length === 3
  ) {
    const plannedIds = plan.beats.flatMap((beat) => beat.eventIds);
    const selectedIds = selectedEvidence.map((event) => event.id);
    const sameEvidenceSet =
      plannedIds.length === selectedIds.length &&
      new Set(plannedIds).size === selectedIds.length &&
      selectedIds.every((id) => plannedIds.includes(id));

    if (sameEvidenceSet) {
      return {
        ...plan,
        beats: selectedEvidence.map((event, index) => ({
          order: index + 1,
          role:
            index === 0
              ? "HOOK"
              : index === selectedEvidence.length - 1
                ? "PAYOFF"
                : index === selectedEvidence.length - 2
                  ? "TURN"
                  : "BUILD",
          eventIds: [event.id],
          attention: "",
          change: "",
        })),
      };
    }
  }

  if (selectedEvidence.length < 4) {
    return {
      ...plan,
      beats: plan.beats.map((beat, index) => ({
        ...beat,
        order: index + 1,
        role:
          index === 0
            ? "HOOK"
            : index === plan.beats.length - 1
              ? "PAYOFF"
              : beat.role === "TURN"
                ? "TURN"
                : "BUILD",
      })),
    };
  }

  const targetBeatCount = Math.min(
    4,
    Math.max(3, Math.ceil(selectedEvidence.length / 2)),
  );

  if (plan.beats.length >= 3) {
    return {
      ...plan,
      beats: plan.beats.map((beat, index) => ({
        ...beat,
        order: index + 1,
        role:
          index === 0
            ? "HOOK"
            : index === plan.beats.length - 1
              ? "PAYOFF"
              : beat.role === "TURN"
                ? "TURN"
                : "BUILD",
      })),
    };
  }

  const groups: string[][] = Array.from(
    { length: targetBeatCount },
    () => [],
  );

  selectedEvidence.forEach((event, index) => {
    const groupIndex = Math.min(
      targetBeatCount - 1,
      Math.floor(index * targetBeatCount / selectedEvidence.length),
    );
    groups[groupIndex].push(event.id);
  });

  return {
    ...plan,
    beats: groups
      .filter((eventIds) => eventIds.length > 0)
      .map((eventIds, index, all) => ({
        order: index + 1,
        role:
          index === 0
            ? "HOOK"
            : index === all.length - 1
              ? "PAYOFF"
              : "BUILD",
        eventIds,
        attention: "",
        change: "",
      })),
  };
}

function fallbackPlan(
  events: readonly AuthorCreativeEvent[],
  discovery: AuthorCreativeDiscovery,
): AuthorSemanticPlan {
  const selected = new Set(discovery.selected.evidenceEventIds);
  const preferred = events.filter((event) => selected.has(event.id));
  const source = preferred.length ? preferred : [...events];
  const limited = source.slice(0, Math.min(5, source.length));

  return {
    thesis:
      discovery.selected.id === "reality-direct"
        ? "Use supplied reality directly."
        : discovery.selected.perception || discovery.selected.relationship,
    beats: limited.map((event, index) => ({
      order: index + 1,
      role:
        index === 0
          ? "HOOK"
          : index === limited.length - 1
            ? "PAYOFF"
            : "BUILD",
      eventIds: [event.id],
      attention: "Make this supplied evidence felt without adding a new event.",
      change: event.text,
    })),
  };
}

function beatKind(role: AuthorBeatRole, index: number, total: number): AuthorScene["kind"] {
  if (role === "HOOK" || index === 0) return "hook";
  if (role === "PAYOFF" || index === total - 1) return "payoff";
  if (role === "TURN") return "turn";
  return "line";
}


function replayTokens(value: string): string[] {
  return clean(value)
    .toLowerCase()
    .split(/[^a-z0-9'’-]+/i)
    .map((token) => {
      if (token === "tried" || token === "tries" || token === "attempted" || token === "attempt") return "try";
      if (token === "removal" || token === "removed" || token === "removing") return "remove";
      if (token.length > 5 && token.endsWith("ing")) return token.slice(0, -3);
      if (token.length > 4 && token.endsWith("ed")) return token.slice(0, -2);
      if (token.length > 4 && token.endsWith("es")) return token.slice(0, -2);
      if (token.length > 3 && token.endsWith("s")) return token.slice(0, -1);
      return token;
    })
    .filter((token) =>
      token.length >= 3 &&
      !new Set(["the", "and", "for", "with", "from", "that", "this", "just", "was", "were", "got", "had", "has"]).has(token)
    );
}

function sourceReplayPenalty(text: string, beatFacts: readonly string[]): number {
  const candidate = replayTokens(text);
  if (!candidate.length) return 0;

  const source = new Set(replayTokens(beatFacts.join(" ")));
  const overlap = candidate.filter((token) => source.has(token)).length / candidate.length;

  if (overlap >= 0.8) return 0.18;
  if (overlap >= 0.6) return 0.12;
  if (overlap >= 0.4) return 0.06;
  return 0;
}

function temporalAnchorTokens(value: string): string[] {
  const text = clean(value).toLowerCase();
  const tokens = new Set<string>();

  for (const match of text.matchAll(/\b\d+(?:\.\d+)?\b/g)) {
    tokens.add(match[0]);
  }

  for (const match of text.matchAll(
    /\b(?:second|seconds|minute|minutes|hour|hours|day|days|week|weeks|month|months|year|years|morning|afternoon|evening|night|today|tomorrow|yesterday|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/g,
  )) {
    tokens.add(match[0]);
  }

  if (/\bnext\s+(?:day|week|month|year|morning|afternoon|evening|night)\b/.test(text)) {
    tokens.add("next");
  }
  if (/\b(?:again|returned|return|revisit|revisited|back)\b/.test(text)) {
    tokens.add("recurrence");
  }

  return [...tokens];
}

function temporalAnchorAdjustment(text: string, beatFacts: readonly string[]): number {
  const sourceAnchors = temporalAnchorTokens(beatFacts.join(" "));
  if (!sourceAnchors.length) return 0;

  const candidateAnchors = new Set(temporalAnchorTokens(text));
  const preserved = sourceAnchors.filter((anchor) => candidateAnchors.has(anchor));

  if (preserved.length === sourceAnchors.length) return 0.14;
  if (preserved.length > 0) return 0.04;
  return -0.22;
}

function hasSpecificTemporalAnchor(value: string): boolean {
  const text = clean(value).toLowerCase();
  return (
    /\b\d+(?:\.\d+)?\b/.test(text) ||
    /\b(?:second|seconds|minute|minutes|hour|hours|day|days|week|weeks|month|months|year|years|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/.test(text) ||
    /\bnext\s+(?:day|week|month|year|morning|afternoon|evening|night)\b/.test(text)
  );
}

function preservesSpecificTemporalAnchor(
  text: string,
  beatFacts: readonly string[],
): boolean {
  const sourceText = beatFacts.join(" ");
  if (!hasSpecificTemporalAnchor(sourceText)) return true;

  const sourceAnchors = temporalAnchorTokens(sourceText)
    .filter((anchor) => anchor !== "recurrence");
  const candidateAnchors = new Set(temporalAnchorTokens(text));

  return sourceAnchors.some((anchor) => candidateAnchors.has(anchor));
}

function variantScore(
  text: string,
  beatFacts: readonly string[],
  semanticAuthority: readonly string[],
  subject: string,
  prior: readonly string[],
): { accepted: boolean; score: number; reasons: string[] } {
  const policy = evaluateAuthorCut(text, {
    subject,
    facts: beatFacts,
    semanticAuthority,
  });

  if (!policy.accepted) {
    return { accepted: false, score: 0, reasons: policy.reasons };
  }

  const normalized = clean(text).toLowerCase();
  const repeated = prior.some((value) => clean(value).toLowerCase() === normalized);
  const replayPenalty = sourceReplayPenalty(text, beatFacts);
  const anchorAdjustment = temporalAnchorAdjustment(text, beatFacts);
  const score = Math.max(
    0,
    policy.score -
      (repeated ? 0.35 : 0) -
      replayPenalty +
      anchorAdjustment,
  );

  return {
    accepted: !repeated,
    score,
    reasons: repeated ? ["repetition"] : [],
  };
}

function lockPlanToApprovedMeaning(
  plan: AuthorSemanticPlan,
  events: readonly AuthorCreativeEvent[],
  discovery: AuthorCreativeDiscovery,
): AuthorSemanticPlan {
  const selected = discovery.selected;
  const allowEvidenceCallback = discovery.experienceShape.some((hint) =>
    /callback|recurrence|repetition|echo/i.test(clean(hint)),
  );
  const seenEventIds = new Set<string>();
  const uniquePlanBeats = plan.beats
    .map((beat) => ({
      ...beat,
      eventIds: beat.eventIds.filter((id) => {
        const key = clean(id);
        if (allowEvidenceCallback) return true;
        if (seenEventIds.has(key)) return false;
        seenEventIds.add(key);
        return true;
      }),
    }))
    .filter((beat) => beat.eventIds.length > 0);
  const planWithUniqueEvidence = {
    ...plan,
    beats: uniquePlanBeats,
  };
  const approvedMeaning = clean(selected.perception || selected.relationship);
  const approvedRelation = clean(selected.relationship);
  const realityDirect = clean(selected.id).toLowerCase() === "reality-direct";

  if (realityDirect) {
    return {
      thesis: "Use supplied reality directly.",
      beats: planWithUniqueEvidence.beats.map((beat) => ({
        ...beat,
        attention: beat.eventIds
          .map((id) => events.find((event) => event.id === id)?.text ?? "")
          .map(clean)
          .filter(Boolean)
          .join(" | "),
        change: "Advance only supplied reality; do not add a hidden explanation.",
      })),
    };
  }

  const authorizedEventIds = new Set(
    (
      discovery.playableEventIds.length
        ? discovery.playableEventIds
        : selected.evidenceEventIds
    ).map(clean).filter(Boolean),
  );

  const scopedBeats = planWithUniqueEvidence.beats
    .map((beat) => ({
      ...beat,
      eventIds: beat.eventIds.filter((id) => authorizedEventIds.has(clean(id))),
    }))
    .filter((beat) => beat.eventIds.length > 0);

  const beats = scopedBeats.length
    ? scopedBeats
    : fallbackPlan(
        events.filter((event) => authorizedEventIds.has(clean(event.id))),
        discovery,
      ).beats;

  return {
    thesis: approvedMeaning || approvedRelation || "Approved grounded perception.",
    beats: beats.map((beat, index) => {
      const isFirst = index === 0;
      const isLast = index === beats.length - 1;
      const attention = beat.eventIds
        .map((id) => events.find((event) => event.id === id)?.text ?? "")
        .map(clean)
        .filter(Boolean)
        .join(" | ");

      const change = beats.length === 1
        ? approvedMeaning || approvedRelation || "Realize this supplied evidence."
        : isFirst
          ? "Establish only this beat's supplied evidence. Do not import later evidence or state the full relation yet."
          : isLast
            ? approvedMeaning || approvedRelation || "Land the approved relation using only this beat and prior established evidence."
            : "Advance the approved relation using only this beat and already-established prior evidence. Do not import later evidence.";

      return {
        ...beat,
        order: index + 1,
        attention,
        change,
      };
    }),
  };
}

function ensurePostLockMemoryCanvas(
  plan: AuthorSemanticPlan,
  selectedEvidence: readonly AuthorCreativeEvent[],
): AuthorSemanticPlan {
  if (selectedEvidence.length < 4 || plan.beats.length >= 3) {
    return {
      ...plan,
      beats: plan.beats.map((beat, index, all) => ({
        ...beat,
        order: index + 1,
        role:
          index === 0
            ? "HOOK"
            : index === all.length - 1
              ? "PAYOFF"
              : beat.role === "TURN"
                ? "TURN"
                : "BUILD",
      })),
    };
  }

  const targetBeatCount = Math.min(
    4,
    Math.max(3, Math.ceil(selectedEvidence.length / 2)),
  );
  const groups: string[][] = Array.from({ length: targetBeatCount }, () => []);

  selectedEvidence.forEach((event, index) => {
    const groupIndex = Math.min(
      targetBeatCount - 1,
      Math.floor(index * targetBeatCount / selectedEvidence.length),
    );
    groups[groupIndex].push(event.id);
  });

  return {
    ...plan,
    beats: groups
      .filter((eventIds) => eventIds.length > 0)
      .map((eventIds, index, all) => ({
        order: index + 1,
        role:
          index === 0
            ? "HOOK"
            : index === all.length - 1
              ? "PAYOFF"
              : "BUILD",
        eventIds,
        attention: "",
        change: "",
      })),
  };
}

function memoryPayoffReplayPenalty(
  text: string,
  beatFacts: readonly string[],
  isMemoryMode: boolean,
  isFinalBeat: boolean,
  semanticMove: string,
): number {
  if (!isMemoryMode || !isFinalBeat || !clean(semanticMove)) return 0;
  const candidate = replayTokens(text);
  if (!candidate.length) return 0;
  const source = new Set(replayTokens(beatFacts.join(" ")));
  const overlap = candidate.filter((token) => source.has(token)).length / candidate.length;
  if (overlap >= 0.8) return 0.24;
  if (overlap >= 0.6) return 0.16;
  return 0;
}

type MemorySequenceCandidate = {
  variantIndex: number;
  lines: Array<{
    beat: AuthorSemanticBeat;
    beatFacts: string[];
    text: string;
    accepted: boolean;
    score: number;
    reasons: string[];
  }>;
  accepted: boolean;
  score: number;
  reasons: string[];
};

function scoreMemorySequence(
  variantIndex: number,
  plan: AuthorSemanticPlan,
  variantsByOrder: Map<number, string[]>,
  suppliedReality: readonly AuthorCreativeEvent[],
  subject: string,
): MemorySequenceCandidate {
  const prior: string[] = [];
  const lines = plan.beats.map((beat, index) => {
    const beatFacts = beat.eventIds
      .map((id) => suppliedReality.find((event) => event.id === id)?.text ?? "")
      .map(clean)
      .filter(Boolean);
    const text = clean(variantsByOrder.get(beat.order)?.[variantIndex] ?? "");
    const base = variantScore(
      text,
      beatFacts,
      [beat.change].map(clean).filter(Boolean),
      subject,
      prior,
    );
    const payoffPenalty = memoryPayoffReplayPenalty(
      text,
      beatFacts,
      true,
      index === plan.beats.length - 1,
      beat.change,
    );
    const dropsSpecificTimeAnchor =
      !preservesSpecificTemporalAnchor(text, beatFacts);
    const line = {
      beat,
      beatFacts,
      text,
      ...base,
      accepted: base.accepted && !dropsSpecificTimeAnchor,
      score: Math.max(0, base.score - payoffPenalty),
      reasons: [
        ...base.reasons,
        ...(payoffPenalty > 0 ? ["memory-payoff-replay"] : []),
        ...(dropsSpecificTimeAnchor ? ["drops-specific-time-anchor"] : []),
      ],
    };
    if (text) prior.push(text);
    return line;
  });

  const acceptedLines = lines.filter((line) => line.accepted && line.text);
  const completeness = plan.beats.length
    ? acceptedLines.length / plan.beats.length
    : 0;
  const meanScore = acceptedLines.length
    ? acceptedLines.reduce((sum, line) => sum + line.score, 0) / acceptedLines.length
    : 0;
  const normalizedLines = lines
    .map((line) => clean(line.text).toLowerCase())
    .filter(Boolean);
  const uniqueRatio = normalizedLines.length
    ? new Set(normalizedLines).size / normalizedLines.length
    : 0;
  const payoff = lines.length ? lines[lines.length - 1] : undefined;
  const payoffStrength = payoff?.accepted ? payoff.score : 0;
  const payoffDropsSpecificTime = Boolean(
    payoff &&
    !preservesSpecificTemporalAnchor(payoff.text, payoff.beatFacts),
  );
  const rejected = lines.length - acceptedLines.length;

  const score = Math.max(
    0,
    meanScore * 0.5 +
      completeness * 0.25 +
      payoffStrength * 0.2 +
      uniqueRatio * 0.05 -
      rejected * 0.2,
  );

  const reasons: string[] = [];
  if (completeness < 1) reasons.push("incomplete-sequence");
  if (uniqueRatio < 1) reasons.push("repeated-line");
  if ((payoff?.reasons ?? []).includes("memory-payoff-replay")) {
    reasons.push("weak-payoff-replay");
  }
  if (payoffDropsSpecificTime) {
    reasons.push("payoff-drops-specific-time-anchor");
  }

  return {
    variantIndex,
    lines,
    accepted: completeness === 1 && !payoffDropsSpecificTime,
    score: Number(score.toFixed(3)),
    reasons,
  };
}

async function repairNominatedMemoryProduction(input: {
  production: MemorySequenceCandidate;
  plan: AuthorSemanticPlan;
  suppliedReality: readonly AuthorCreativeEvent[];
  subject: string;
  thesis: string;
}): Promise<{
  replacements: Map<number, string>;
  model: string;
  modelCalls: number;
}> {
  const failed = input.production.lines
    .map((line, index) => ({ line, index }))
    .filter(({ line }) => !line.accepted || !clean(line.text));

  if (!failed.length) {
    return {
      replacements: new Map<number, string>(),
      model: "none",
      modelCalls: 0,
    };
  }

  const result = await localModelGenerate(
    [
      {
        role: "system",
        content: [
          "You are QRE Memory Production Repair.",
          "The creative conception has already been chosen. Preserve it.",
          "Repair ONLY the failed cuts. Do not rewrite successful cuts.",
          "Stay inside each failed beat's supplied evidence plus meaning already established by earlier successful cuts.",
          "Keep the production's voice, rhythm, attitude, and trajectory.",
          "Prefer a bold grounded transformation over literal replay.",
          "Preserve distinctive source anchors when useful.",
          "Nonliteral title-like framing, metaphor, status, attitude, compression, and recontextualization are welcome.",
          "Do not add new actors, body parts, sensory details, scenery, actions, motives, causes, outcomes, or chronology.",
          "Do not carry an earlier emotional or physical state forward into a later event unless supplied reality explicitly establishes continuity. Use callback/recontextualization instead of asserting persistence.",
          "A repair should feel like the line the original production was trying to write, only grounded.",
          "Return one replacement for every failed beat and nothing else.",
        ].join("\n"),
      },
      {
        role: "user",
        content: JSON.stringify({
          SUBJECT: input.subject,
          APPROVED_THESIS: input.thesis,
          FULL_PRODUCTION: input.production.lines.map((line, index) => ({
            order: line.beat.order,
            text: line.text,
            accepted: line.accepted,
            reasons: line.reasons,
            suppliedEvidence: line.beatFacts,
            semanticMove: line.beat.change,
            keepExactly: line.accepted,
            priorLines: input.production.lines
              .slice(0, index)
              .map((prior) => prior.text)
              .filter(Boolean),
          })),
          FAILED_BEATS: failed.map(({ line }) => ({
            order: line.beat.order,
            rejectedText: line.text,
            reasons: line.reasons,
            suppliedEvidence: line.beatFacts,
            semanticMove: line.beat.change,
          })),
          instruction:
            "Repair only FAILED_BEATS. Keep the same production conception and creative energy. Return short viewer-facing replacements, normally 2-7 words.",
        }),
      },
    ],
    "json",
    {
      numPredict: Math.max(220, failed.length * 90),
      temperature: 0.72,
      jsonSchema: {
        type: "object",
        additionalProperties: false,
        required: ["repairs"],
        properties: {
          repairs: {
            type: "array",
            minItems: failed.length,
            maxItems: failed.length,
            items: {
              type: "object",
              additionalProperties: false,
              required: ["order", "text"],
              properties: {
                order: { type: "integer", minimum: 1, maximum: 6 },
                text: { type: "string", maxLength: 120 },
              },
            },
          },
        },
      },
    },
  );

  const parsed = parseJson(result.text);
  const rawRepairs = Array.isArray(parsed?.repairs) ? parsed.repairs : [];
  const failedOrders = new Set(failed.map(({ line }) => line.beat.order));
  const replacements = new Map<number, string>();

  for (const raw of rawRepairs) {
    if (!raw || typeof raw !== "object") continue;
    const record = raw as Record<string, unknown>;
    const order = Number(record.order);
    const text = clean(record.text);
    if (!Number.isInteger(order) || !failedOrders.has(order) || !text) continue;
    replacements.set(order, text);
  }

  return {
    replacements,
    model: result.model,
    modelCalls: 1,
  };
}

function safeFallbackText(
  beat: AuthorSemanticBeat,
  events: readonly AuthorCreativeEvent[],
): string {
  return (
    beat.eventIds
      .map((id) => events.find((event) => event.id === id)?.text ?? "")
      .map(clean)
      .find(Boolean) ?? ""
  );
}

export async function createAuthorExperience(input: {
  subject: string;
  suppliedReality: readonly AuthorCreativeEvent[];
  creativeDiscovery: AuthorCreativeDiscovery;
  requestedLens?: string;
  memory?: readonly string[];
  domainContext?: AuthorDomainContext;
}): Promise<{
  scenes: Array<AuthorScene & { sourceEventIds: string[] }>;
  model: string;
  modelCalls: number;
  diagnostics: {
    plan: AuthorSemanticPlan;
    creativeFrames: AuthorCreativeFrame[];
    variantsByBeat: Array<{ order: number; variants: string[] }>;
    choices: Array<{
      order: number;
      beat: AuthorSemanticBeat;
      beatFacts: string[];
      candidates: Array<{ text: string; accepted: boolean; score: number; reasons: string[] }>;
      selected: string;
    }>;
  };
}> {
  const allowedEventIds = new Set(input.suppliedReality.map((event) => event.id));
  const presentationContext = presentationAffordance(input.domainContext);
  const selected = input.creativeDiscovery.selected;
  const realityDirect =
    clean(selected.id).toLowerCase() === "reality-direct" ||
    clean(selected.risk).toLowerCase() === "no_grounded_discovery_candidate";
  const contextRecord = (input.domainContext ?? {}) as Record<string, unknown>;
  const experienceMode = clean(contextRecord.experienceMode).toUpperCase();
  const playableIds = new Set(
    (
      input.creativeDiscovery.playableEventIds.length
        ? input.creativeDiscovery.playableEventIds
        : selected.evidenceEventIds
    ).map(clean).filter(Boolean),
  );
  const selectedEvidence = input.suppliedReality.filter((event) =>
    playableIds.has(clean(event.id)),
  );
  const useDeterministicSparsePlan =
    selectedEvidence.length > 0 && selectedEvidence.length <= 3;
  const useIdentityClusterPlan =
    useDeterministicSparsePlan &&
    experienceMode === "IDENTITY" &&
    selectedEvidence.length > 1;
  const isMemoryMode = experienceMode === "MEMORY";

  const planResult = useDeterministicSparsePlan
    ? {
        text: "",
        model: "deterministic-sparse-plan",
      }
    : await localModelGenerate(
    [
      {
        role: "system",
        content: [
          "You are QRE Bare Author Structure Planner.",
          "Discovery already owns meaning. You own ONLY evidence grouping and sequence shape.",
          "Return 2 to 5 beats using only supplied authorized event IDs.",
          "You may fuse adjacent or tightly related evidence into one beat or omit evidence that does not need screen time.",
          "Do not write a thesis, interpretation, psychology, causality, motive, emotional explanation, or viewer-facing language.",
          "Do not invent or rename events. Output structure only.",
          "Use each evidence event ID at most once unless EXPERIENCE_SHAPE explicitly calls for callback, recurrence, repetition, or echo.",
          ...(isMemoryMode ? [
            "MEMORY STRUCTURE: give a substantial lived memory enough screen space to feel remembered, not summarized.",
            "When 4 or more authorized evidence events carry the selected memory, usually prefer 3 to 4 beats. Compress only when the grouping creates a stronger experience.",
            "When exactly 4 authorized events form a temporal progression with a distinct before-state, lived middle, after-state, and later recurrence/return, prefer 4 beats. Do not fuse the lived middle into the before-state merely to shorten the sequence.",
            "A supplied duration or substantial activity between states can deserve its own beat because it gives the later contrast weight; preserve it structurally without claiming it caused the later state.",
            "When authorized evidence contains an explicit supplied state contrast, preserve both sides of that contrast in the plan. Do not omit the later state merely because the causal explanation is unknown.",
            "When supplied recurrence or return contributes to the approved perception, preserve that recurrence as available payoff material.",
            "Avoid stuffing 3 or more distinct moments into one beat merely to shorten the sequence. Preserve room for setup, development, turn, and payoff.",
          ] : []),
          ...(presentationContext ? [presentationContext] : []),
        ].join("\n"),
      },
      {
        role: "user",
        content: JSON.stringify({
          SUBJECT: input.subject,
          AUTHORIZED_EVIDENCE: selectedEvidence,
          EXPERIENCE_SHAPE: input.creativeDiscovery.experienceShape,
          instruction:
            "Return only the structural beat sequence. Use authorized evidence IDs only. Group evidence when useful; do not explain meaning.",
        }),
      },
    ],
    "json",
    {
      numPredict: 260,
      temperature: 0.18,
      jsonSchema: {
        type: "object",
        additionalProperties: false,
        required: ["beats"],
        properties: {
          beats: {
            type: "array",
            minItems: 1,
            maxItems: 6,
            items: {
              type: "object",
              additionalProperties: false,
              required: ["order", "role", "eventIds"],
              properties: {
                order: { type: "integer", minimum: 1, maximum: 6 },
                role: { type: "string", enum: ["HOOK", "BUILD", "TURN", "PAYOFF"] },
                eventIds: {
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

  const rawPlan = useIdentityClusterPlan
    ? {
        thesis: selected.perception || selected.relationship,
        beats: [{
          order: 1,
          role: "PAYOFF" as AuthorBeatRole,
          eventIds: selectedEvidence.map((event) => event.id),
          attention: selectedEvidence.map((event) => event.text).join(" | "),
          change: selected.perception || selected.relationship,
        }],
      }
    : useDeterministicSparsePlan
      ? fallbackPlan(selectedEvidence, input.creativeDiscovery)
      : normalizePlan(parseJson(planResult.text), allowedEventIds) ??
      fallbackPlan(input.suppliedReality, input.creativeDiscovery);

  const structurallySafePlan = isMemoryMode
    ? enforceMemoryStructure(rawPlan, selectedEvidence)
    : rawPlan;

  const initiallyLockedPlan = lockPlanToApprovedMeaning(
    structurallySafePlan,
    input.suppliedReality,
    input.creativeDiscovery,
  );

  const postLockPlan = isMemoryMode
    ? ensurePostLockMemoryCanvas(initiallyLockedPlan, selectedEvidence)
    : initiallyLockedPlan;

  const plan = postLockPlan === initiallyLockedPlan
    ? initiallyLockedPlan
    : lockPlanToApprovedMeaning(
        postLockPlan,
        input.suppliedReality,
        input.creativeDiscovery,
      );

  debug("BARE-AUTHOR-PLAN", {
    mode: useIdentityClusterPlan
      ? "DETERMINISTIC_IDENTITY_CLUSTER"
      : useDeterministicSparsePlan
        ? "DETERMINISTIC_SPARSE"
        : "MODEL_STRUCTURE",
    raw: useDeterministicSparsePlan ? "SKIPPED_MODEL_PLAN" : planResult.text,
    memoryStructureAdjusted:
      isMemoryMode &&
      (
        JSON.stringify(structurallySafePlan.beats.map((beat) => beat.eventIds)) !==
          JSON.stringify(rawPlan.beats.map((beat) => beat.eventIds)) ||
        JSON.stringify(plan.beats.map((beat) => beat.eventIds)) !==
          JSON.stringify(initiallyLockedPlan.beats.map((beat) => beat.eventIds))
      ),
    selectedPlan: plan,
  });

  const requestedLens = clean(input.requestedLens);
  const normalizedRequestedLens = requestedLens.toUpperCase();
  const explicitLensProvided = Boolean(requestedLens);
  const explicitLensOff = normalizedRequestedLens === "NONE";
  const frameCandidates = deriveAuthorCreativeFrameCandidates({
    subject: input.subject,
    suppliedReality: input.suppliedReality,
    creativeDiscovery: input.creativeDiscovery,
    memory: input.memory,
    domainContext: input.domainContext,
  });
  const selectedFrame = explicitLensOff
    ? {
        frame: "NONE",
        reason: "an explicit NONE lens preserves natural realization",
        confidence: 1,
      }
    : selectAuthorCreativeFrame({
        candidates: frameCandidates,
        creativeDiscovery: input.creativeDiscovery,
      });
  const lensSearch = await searchAuthorCreativeLensTreatments({
    subject: input.subject,
    suppliedReality: input.suppliedReality,
    plan,
    creativeOpportunity: selected.perception,
    relation: selected.relationship,
    experienceMode,
    requestedLens,
    domainContext: input.domainContext,
    selectedFrame,
    frameCandidates,
  });
  const autoBusinessLens = lensSearch.autoBusinessLens;
  const lensSearchEnabled = lensSearch.lensSearchEnabled;
  const lensMode = lensSearch.lensMode;
  const framesForMouth = lensSearch.acceptedTreatments;
  const lensProductionContractComplete =
    !lensSearch.lensSearchEnabled || framesForMouth.length === 4;

  debug("CREATIVE-LENS-SEARCH", {
    mode: lensMode,
    requestedLens: requestedLens || (autoBusinessLens ? "AUTO" : "NONE"),
    selectedFrame: lensSearch.selectedFrame,
    frameCandidates,
    lensSearchEnabled,
    rawTreatmentResponse: lensSearch.rawTreatmentResponse,
    treatments: framesForMouth,
    rejectedTreatments: lensSearch.rejectedTreatments,
    productionContractComplete: lensProductionContractComplete,
  });

  if (!lensProductionContractComplete) {
    throw new Error(
      `QRE Creative Lens contract incomplete: expected 4 accepted treatments, got ${framesForMouth.length}`,
    );
  }

  const mouthResult = await localModelGenerate(
    [
      {
        role: "system",
        content: [
          "You are QRE Mouth.",
          "The Author already chose the semantic beats. Do not re-plan the story and do not invent a second meaning.",
          "SEMANTIC AUTHORITY IS BEAT-SCOPED: a beat may use only its semanticMove plus evidence already established by earlier beats. Never pull a later beat's fact, reaction, payoff, or relation backward into an earlier cut.",
          "Generate four radically different short realizations for every approved beat.",
          "Most candidates should be 2 to 7 words. A tiny one-word attitude beat is allowed when it lands.",
          "Concrete reality comes ONLY from the beat's supplied event labels.",
          "Do not invent scenery, weather, light, temperature, body parts, gestures, sensory details, objects, people, places, causes, motives, outcomes, or successful completion.",
          "An attempt remains an attempt. Do not turn trying into freedom, escape, removal, victory, or success.",
          "Do not add comparative duration or temporal compression unless supplied. Avoid words like brief, briefly, long, quickly, suddenly, promptly, instantly, finally, or still when the beat facts do not establish that timing relation.",
          "A stated duration is not a countdown or deadline. Do not say 'time's up', 'clock ran out', 'deadline', or imply a timer merely because a duration is supplied.",
          "Do not invent manner of movement. A supplied walk does not authorize ambled, trotted, bounded, dragged, hurried, strolled, or another gait/manner unless supplied.",
          "An emotion/state does not authorize wagging, smiling, trembling, shaking, jumping, posture, heartbeat, or another bodily manifestation.",
          "Creative freedom is high for phrasing: implication, attitude, metaphor, personification, status, understatement, absurd seriousness, compressed voice, callback, and recontextualization.",
          "Use the supplied material as the cast. Do not replace it with generic atmosphere.",
          "Prefer source-specific cleverness over prettiness.",
          ...(realityDirect ? [
            "REALITY-DIRECT MODE: Discovery found no grounded hidden relation worth realizing. Do not manufacture a hidden thesis here. This does NOT disable the assigned Creative Lens.",
            "In REALITY-DIRECT MODE, every concrete noun, action, condition, result, physical property, manner, and object must already be explicit in that beat's supplied evidence. Do not infer what cleaning probably involved, what a room probably contained, or what the result probably looked like.",
            "Creative freedom remains high for NONLITERAL expression. You may use metaphor, title-like framing, status language, personification, absurd seriousness, ceremony, noir pressure, game logic, callback, implication, compression, rhythm, omission, and recontextualization when they clearly operate as rhetoric rather than new material facts.",
            "A phrase may transform how a supplied fact FEELS without claiming a new event happened. Reality-direct means no hidden explanation, not no imagination.",
            "Do not turn 'cleaned' into scrubbed, wiped, polished, spotless, pristine, sterile, tidy, shiny, or another stronger physical claim unless supplied. Do not introduce surfaces, tiles, mirrors, scent, silence, tools, grime, or other typical service details unless supplied.",
            "When in doubt, preserve the supplied predicate rather than decorating it with plausible physical detail.",
          ] : []),
          ...(isMemoryMode ? [
            "UNIVERSAL AUTHOR LAW: Identity synthesizes simultaneous truths into character. Memory synthesizes accumulated truths into experience. Same Author intelligence; different temporal shape.",
            "MEMORY REALIZATION: these beats are parts of ONE remembered experience, not independent caption slots. Make the sequence accumulate meaning across cuts.",
            "The accumulated facts already created ONE approved memory perception upstream. Your job is to reveal that one perception through time, not to invent a new interpretation for each cut.",
            "Think of the supplied events the same way Identity treats multiple traits: raw material may fuse. A fact may become setup, texture, contrast, callback, or disappear from direct wording while still supporting the whole.",
            "Do not make each cut correspond mechanically to one input fact. Follow the approved production shape and let facts combine when that strengthens the whole experience.",
            "THINK PRODUCT, NOT LINES. The finished sequence is the product. Every cut is one component of that product and must earn its place by setting up, deepening, turning, or landing the SAME experience.",
            "A cut does not need to be impressive alone. It needs to make the surrounding cuts stronger. Prefer a sequence whose parts depend on each other over a stack of individually clever captions.",
            "Read each production vertically before choosing it: CUT 1 changes what CUT 2 means; CUT 2 changes what CUT 3 means; the last cut should make the earlier cuts feel more intentional in retrospect.",
            "Use restraint strategically. One cut may be simple so another can hit harder. Do not make every cut compete for attention.",
            "The viewer should feel one authored object unfolding through time, not several captions placed next to each other.",
            "OPERATIONAL/SERVICE MEMORIES: do not default to a ledger, checklist, work log, or receipt voice merely because the facts are tasks, counts, and timestamps. Exact anchors may remain visible, but the sequence still needs one perceptual treatment that accumulates across cuts.",
            "CUSTOMER-FACING SERVICE MEMORIES: preserve recognizable event identity and enough substance that the recipient can understand what actually happened even when they did not supply the original facts.",
            "You may fuse related supplied events when that makes the memory stronger, but do not compress several distinct moments into vague atmosphere merely to sound clever.",
            "In service or receipt contexts, creativity must remain decipherable to the recipient. A playful transformation should still let them recover the underlying event without needing access to the original notes.",
            "Favor a substantial customer-facing memory over an aggressively compressed summary when multiple distinct moments were supplied. Do not mechanically map one fact to one cut; preserve enough distinct moments for the experience to feel worth receiving.",
            "Avoid solving every beat as FACT + punctuation + completion label. At least some cuts should transform the supplied action, count, or timing rhetorically while staying materially true; preserve anchors without making the whole product read like status reporting.",
            "A service memory may feel precise, ceremonial, game-like, severe, playful, compact, or otherwise authored only when that treatment comes from the supplied sequence itself—not from invented worker psychology, unseen mess, difficulty, or client reaction.",
            "Neutral encounters may become juxtaposition, texture, density, oddity, accumulation, contrast, or title-like framing, but do not turn that framing into a literal claim about the subject's internal state or behavior.",
            "TITLE-LIKE FRAMING VS MATERIAL CLAIM: 'Squirrelly distraction.' can function as playful framing of a supplied squirrel encounter; 'Milo was distracted by the squirrels.' asserts a real attentional state and requires support. Prefer the first kind of freedom when it helps.",
            "When a supplied fact is explicitly positive, negative, praised, criticized, liked, feared, or otherwise valenced, do not flatten away that valence merely to sound clever.",
            "The final beat is a payoff for the whole approved memory. If its local fact is a timestamp, duration, count, or other measurement, use it as material for the payoff rather than merely restating the measurement.",
            "Do not produce a final-beat candidate that is only a literal replay of the local fact when semanticMove asks you to land a broader approved relation.",
            "Across the whole sequence, prefer progression: establish -> enrich -> land. Do not make three interchangeable labels.",
            "WRITE FOUR COMPLETE PRODUCTIONS VERTICALLY. Finish Production A from first cut to payoff, then Production B, then C, then D. Do not generate four alternatives for beat 1 and then four alternatives for beat 2. Each production is one coherent object.",
            ...(lensSearchEnabled ? [
              ...(autoBusinessLens ? [
                "AUTO BUSINESS LENS: this business/service experience is intentionally exploring creative treatments. One production may be NONE / Bare Reality; the others should materially transform how the same supplied facts are experienced.",
                "Do not reward NONE merely for being safest. Judge all four complete productions by coherence, specificity, surprise, payoff, usefulness to the recipient, and whether the treatment earns its presence while remaining true.",
              ] : []),
              "CREATIVE_FRAMES assigns one selected-frame treatment to each production A-D. Treat that treatment as expressive permission and production identity, NOT as literal world facts.",
              "PRODUCTION IDENTITY IS FIXED: Production A must realize CREATIVE_FRAMES production A, B must realize B, C must realize C, and D must realize D. Never swap treatments between variant positions.",
              "There must be exactly four assigned CREATIVE_FRAMES when Lens is active. If a frame slot is missing, do not silently shift later treatments into earlier letters.",
              "If one assigned treatment is NONE / Bare Reality, that production must remain genuinely bare: direct supplied reality with minimal rhetorical transformation. Do not turn the bare slot into a pun, metaphor, title, or alternate creative treatment.",
              "Before nominating a production, verify that every cut in that production actually expresses its assigned treatment. Do not nominate a production under the name of a treatment it failed to realize.",
              "A selected deterministic frame is a perspective only. It is never a plot, event list, hidden cause, or viewer-facing text.",
              "Apply each assigned treatment across the whole production so its cuts share one conception, rhythm, and attitude. Do not merely sprinkle genre vocabulary onto otherwise identical lines.",
              "A treatment may transform status, metaphor, rhythm, compression, callback, ceremony, absurd seriousness, or attitude. It may NEVER manufacture a person, object, action, place, outcome, chronology, bodily reaction, motive, or hidden condition.",
              "If a treatment would require an unsupplied concrete world element to work, realize the treatment more abstractly instead of inventing that element.",
              "Give the four productions genuinely different creative approaches because their assigned treatments are genuinely different. Do not make four near-synonymous productions.",
            ] : [
              "NO CREATIVE LENS IS REQUESTED. Realize the approved meaning directly. Do not impose a genre skin, procedural gimmick, or stylistic universe just to make the material sound authored.",
              "The four productions should still explore genuinely different phrasings and sequence strategies, but they must emerge from supplied reality and approved meaning rather than from an invented genre frame.",
            ]),
            "Within each production, later cuts should feel aware of what earlier cuts established. Build progression, contrast, callback, accumulation, or recontextualization instead of isolated labels.",
            "PRESERVE DISTINCTIVE ANCHORS. A multi-event beat should not dissolve into generic atmosphere. Keep recognizable source-specific anchors—an animal, object, number, quoted evaluation, action, time, or other distinctive detail—unless the production has already established that anchor strongly enough for a clear callback.",
            "QUANTITATIVE/TIME ANCHORS ARE EXPENSIVE TO LOSE. If a supplied beat contains a specific duration, count, clock time, day, week, or other numeric/time marker and that marker materially distinguishes the memory, preserve it directly or transform it recognizably somewhere in the production. Do not replace 'two hours' with generic atmosphere.",
            "RECURRENCE PAYOFF SHOULD LAND THE SUPPLIED RETURN. When the final evidence is 'again', 'next week', 'returned', another visit, or equivalent recurrence, make that recurrence itself legible. Prefer a concrete callback to the supplied return over generic labels like 'pattern', 'cycle', 'seamless', or 'predictable'.",
            "If the recurrence includes a specific time anchor such as next week, three days later, Friday, or another supplied interval/date, keep that time anchor recognizably alive in the payoff. 'Again' alone is weaker when the supplied WHEN is part of what makes the return hit.",
            "The later return may make the earlier encounter feel newly significant in retrospect, but do not explain why the return happened.",
            "Specificity is fuel. Transform it; do not erase it.",
            "POSITIVE CREATIVE PATTERNS:",
            "SUPPLIED: saw a pigeon. STRONG TITLE-LIKE FRAMING: 'Unexpected management.' The phrase changes perception without claiming the pigeon literally managed anything.",
            "SUPPLIED: three friends arrived, then one brought cake. STRONG PROGRESSION: early cuts can establish the arrivals; the later cake cut can make the gathering feel newly significant without inventing why the cake came.",
            "SUPPLIED: a task lasted 42 minutes. WEAK PAYOFF: '42 minutes.' STRONGER PAYOFF BEHAVIOR: use the duration as weight, punctuation, scale, or recontextualization of what the earlier cuts already established without labeling it objectively long or short.",
            "SUPPLIED: someone was explicitly praised. Preserve the praise as positive evidence; do not flatten it into a neutral 'opinion'.",
            "Aim for the transformation pattern, not these exact words.",
            "Do not play safe merely because a fact is neutral. Neutral facts may still become funny, strange, ceremonial, suspicious, grand, tiny, absurdly official, or otherwise perceptually transformed as long as the transformation is clearly nonliteral and does not rewrite material reality.",
          ] : []),
          ...(isMemoryMode ? [
            "OUTPUT SHAPE MATTERS: return four production objects A-D. Each production contains its own ordered cuts from beginning to payoff. Do not transpose the matrix into four variants per beat.",
          ] : []),
          "Do not explain the joke or meaning.",
          "Do not mention receipts, prompts, models, beats, grounding, Author, Mouth, viewers, or internal process.",
          ...(presentationContext ? [presentationContext] : []),
        ].join("\n"),
      },
      {
        role: "user",
        content: JSON.stringify({
          SUBJECT: input.subject,
          SUPPLIED_REALITY: input.suppliedReality,
          APPROVED_THESIS: plan.thesis,
          APPROVED_BEATS: plan.beats.map((beat, index) => ({
            order: beat.order,
            role: beat.role,
            eventIds: beat.eventIds,
            attentionEvidence: beat.attention,
            semanticMove: beat.change,
            mayUseFullRelation: index === plan.beats.length - 1,
          })),
          CREATIVE_OPPORTUNITY: selected.perception,
          RELATION: selected.relationship,
          REALITY_DIRECT: realityDirect,
          LENS_MODE: lensMode,
          REQUESTED_LENS: requestedLens || (autoBusinessLens ? "AUTO" : "NONE"),
          CREATIVE_FRAMES: framesForMouth.map((frame, index) => ({
            production: String.fromCharCode(65 + index),
            frame: frame.frame,
            treatment: frame.treatment,
            devices: frame.devices,
            intensity: frame.intensity,
          })),
          instruction: useIdentityClusterPlan
            ? "This is one IDENTITY character cluster, not a checklist. Return four short candidate realizations that synthesize the combination into character. Do not enumerate every supplied preference or simply restate them. The viewer should infer personality from the combination. Do not invent an event."
            : isMemoryMode
              ? realityDirect
                ? "Return four complete candidate productions in PRODUCTION-MAJOR form. Complete A from first cut to payoff, then B, then C, then D. Discovery found no grounded hidden relation, so stay in REALITY-DIRECT MODE: do not invent a hidden thesis, but fully realize each assigned CREATIVE_FRAME through nonliteral rhetoric. Use the treatment's own grammar—metaphor, title-like status, ceremonial weight, noir pressure, game logic, callback, compression, implication, rhythm, or other non-material transformation—while keeping concrete reality fixed. Do not add any concrete noun, action, condition, physical result, physical quality, object, manner, scenery detail, or typical service detail that is not explicit in the supplied beat evidence. Preserve enough recognizable reality that the recipient can recover what happened. Nominate the strongest whole production by number 1-4."
                : "Return four complete candidate productions in PRODUCTION-MAJOR form. Apply the universal law: MEMORY = accumulated truths -> one experience perception. Complete Production A from first cut to payoff before writing Production B, then C, then D. Treat each production as one finished QRE object unfolding cut by cut, not as separate lines. The accumulated facts are shared raw material for the whole production, not one-fact-per-line assignments. Each cut should perform a different job in the same experience: establish, deepen, turn, or land. When supplied reality contains a before-state / lived middle / after-state / recurrence shape, preserve the shape and make the contrast felt without claiming the middle caused the after-state or the earlier encounter caused the return. Preserve distinctive source anchors while transforming them. If the memory supplies a specific duration/count/time marker that gives the middle its identity, keep that marker legible somewhere in the production. If the payoff is a supplied recurrence such as again/next week/return, make the return itself legible and let it retrospectively recontextualize the earlier cuts without inventing motive. The final cut must land the approved memory relation using its local evidence plus already-established prior evidence. Then nominate the strongest complete production by number 1-4 based on whole-product coherence, specificity, progression, surprise, payoff, and how alive it feels—not on whether every individual line sounds impressive. Keep factual reality inside supplied event IDs, but make each production feel authored rather than enumerated."
              : "Return four candidate lines per beat. The semantic plan controls meaning; the supplied event IDs control factual reality.",
        }),
      },
    ],
    "json",
    {
      numPredict: 1050,
      temperature: isMemoryMode ? 0.9 : 0.78,
      jsonSchema: {
        type: "object",
        additionalProperties: false,
        required: isMemoryMode
          ? ["productions", "selectedProduction", "selectionReason"]
          : ["variantsByBeat"],
        properties: {
          productions: {
            type: "array",
            minItems: 4,
            maxItems: 4,
            items: {
              type: "object",
              additionalProperties: false,
              required: ["production", "lines"],
              properties: {
                production: { type: "string", enum: ["A", "B", "C", "D"] },
                lines: {
                  type: "array",
                  minItems: plan.beats.length,
                  maxItems: plan.beats.length,
                  items: {
                    type: "object",
                    additionalProperties: false,
                    required: ["order", "text"],
                    properties: {
                      order: { type: "integer", minimum: 1, maximum: 6 },
                      text: { type: "string", maxLength: 120 },
                    },
                  },
                },
              },
            },
          },
          variantsByBeat: {
            type: "array",
            minItems: plan.beats.length,
            maxItems: plan.beats.length,
            items: {
              type: "object",
              additionalProperties: false,
              required: ["order", "variants"],
              properties: {
                order: { type: "integer", minimum: 1, maximum: 6 },
                variants: {
                  type: "array",
                  minItems: 4,
                  maxItems: 4,
                  items: { type: "string", maxLength: 120 },
                },
              },
            },
          },
          selectedProduction: { type: "integer", minimum: 1, maximum: 4 },
          selectionReason: { type: "string", maxLength: 220 },
        },
      },
    },
  );

  debug("MOUTH-CANDIDATES", mouthResult.text);

  const parsedMouth = parseJson(mouthResult.text);
  const variantsByOrder = new Map<number, string[]>();

  if (isMemoryMode && Array.isArray(parsedMouth?.productions)) {
    for (const beat of plan.beats) {
      variantsByOrder.set(beat.order, ["", "", "", ""]);
    }

    for (const rawProduction of parsedMouth.productions) {
      if (!rawProduction || typeof rawProduction !== "object") continue;
      const productionRecord = rawProduction as Record<string, unknown>;
      const production = clean(productionRecord.production).toUpperCase();
      const variantIndex = ["A", "B", "C", "D"].indexOf(production);
      if (variantIndex < 0 || !Array.isArray(productionRecord.lines)) continue;

      for (const rawLine of productionRecord.lines) {
        if (!rawLine || typeof rawLine !== "object") continue;
        const lineRecord = rawLine as Record<string, unknown>;
        const order = Number(lineRecord.order);
        const text = stripProductionLabel(lineRecord.text);
        if (!Number.isInteger(order) || !text) continue;

        const variants = [...(variantsByOrder.get(order) ?? ["", "", "", ""])];
        while (variants.length < 4) variants.push("");
        variants[variantIndex] = text;
        variantsByOrder.set(order, variants.slice(0, 4));
      }
    }
  } else {
    const rawVariants = Array.isArray(parsedMouth?.variantsByBeat)
      ? parsedMouth!.variantsByBeat
      : [];

    for (const raw of rawVariants) {
      if (!raw || typeof raw !== "object") continue;
      const record = raw as Record<string, unknown>;
      const order = Number(record.order);
      const variants = Array.isArray(record.variants)
        ? unique(
            record.variants
              .filter((value): value is string => typeof value === "string")
              .map(stripProductionLabel)
              .filter(Boolean),
          ).slice(0, 4)
        : [];

      if (Number.isInteger(order) && variants.length) {
        variantsByOrder.set(order, variants);
      }
    }
  }

  const scenes: Array<AuthorScene & { sourceEventIds: string[] }> = [];
  let memoryRepairModelCalls = 0;
  const choices: Array<{
    order: number;
    beat: AuthorSemanticBeat;
    beatFacts: string[];
    candidates: Array<{ text: string; accepted: boolean; score: number; reasons: string[] }>;
    selected: string;
  }> = [];

  if (isMemoryMode && plan.beats.length > 1) {
    const productions = [0, 1, 2, 3]
      .map((variantIndex) =>
        scoreMemorySequence(
          variantIndex,
          plan,
          variantsByOrder,
          input.suppliedReality,
          input.subject,
        ),
      )
      .sort((a, b) => {
        if (a.accepted !== b.accepted) return a.accepted ? -1 : 1;
        return b.score - a.score;
      });

    const nominatedProductionNumber = Number(parsedMouth?.selectedProduction);
    const nominatedAny = Number.isInteger(nominatedProductionNumber)
      ? productions.find(
          (production) =>
            production.variantIndex === nominatedProductionNumber - 1,
        )
      : undefined;

    let repairedNomination: MemorySequenceCandidate | undefined;

    if (nominatedAny && !nominatedAny.accepted) {
      const repair = await repairNominatedMemoryProduction({
        production: nominatedAny,
        plan,
        suppliedReality: input.suppliedReality,
        subject: input.subject,
        thesis: plan.thesis,
      });
      memoryRepairModelCalls += repair.modelCalls;

      if (repair.replacements.size) {
        const repairedVariantsByOrder = new Map<number, string[]>(
          [...variantsByOrder.entries()].map(([order, variants]) => [
            order,
            [...variants],
          ]),
        );

        for (const [order, replacement] of repair.replacements.entries()) {
          const variants = [...(repairedVariantsByOrder.get(order) ?? [])];
          while (variants.length < 4) variants.push("");
          variants[nominatedAny.variantIndex] = replacement;
          repairedVariantsByOrder.set(order, variants);
        }

        const rescored = scoreMemorySequence(
          nominatedAny.variantIndex,
          plan,
          repairedVariantsByOrder,
          input.suppliedReality,
          input.subject,
        );

        debug("MEMORY-PRODUCTION-REPAIR", {
          production: String.fromCharCode(65 + nominatedAny.variantIndex),
          before: nominatedAny.lines.map((line) => ({
            text: line.text,
            accepted: line.accepted,
            reasons: line.reasons,
          })),
          replacements: [...repair.replacements.entries()].map(([order, text]) => ({
            order,
            text,
          })),
          after: rescored.lines.map((line) => ({
            text: line.text,
            accepted: line.accepted,
            reasons: line.reasons,
          })),
          accepted: rescored.accepted,
          score: rescored.score,
        });

        if (rescored.accepted) {
          repairedNomination = rescored;
        }
      }
    }

    const nominatedProduction = nominatedAny?.accepted
      ? nominatedAny
      : repairedNomination;
    const topScoringProduction = productions[0];
    const winner =
      nominatedProduction &&
      topScoringProduction &&
      nominatedProduction.score >= topScoringProduction.score
        ? nominatedProduction
        : topScoringProduction ?? nominatedProduction;

    debug("MEMORY-PRODUCTIONS", {
      modelNomination: Number.isInteger(nominatedProductionNumber)
        ? String.fromCharCode(64 + nominatedProductionNumber)
        : "NONE",
      modelSelectionReason: clean(parsedMouth?.selectionReason),
      winner: winner
        ? String.fromCharCode(65 + winner.variantIndex)
        : "NONE",
      productions: productions.map((production) => ({
      production: String.fromCharCode(65 + production.variantIndex),
      accepted: production.accepted,
      score: production.score,
      reasons: production.reasons,
        lines: production.lines.map((line) => line.text),
      })),
    });

    for (const [index, beat] of plan.beats.entries()) {
      const beatFacts = beat.eventIds
        .map((id) => input.suppliedReality.find((event) => event.id === id)?.text ?? "")
        .map(clean)
        .filter(Boolean);

      const alternatives = productions.map((production) => {
        const line = production.lines[index];
        return {
          text: line?.text ?? "",
          accepted: line?.accepted ?? false,
          score: line?.score ?? 0,
          reasons: line?.reasons ?? ["missing-production-line"],
        };
      });

      const winnerLine = winner?.lines[index];
      const selectedText = winnerLine?.accepted && winnerLine.text
        ? winnerLine.text
        : alternatives
            .filter((candidate) => candidate.accepted)
            .sort((a, b) => b.score - a.score)[0]?.text ??
          safeFallbackText(beat, input.suppliedReality);

      debug(`MOUTH-BEAT-${beat.order}-CHOICE`, {
        beat,
        beatFacts,
        candidates: alternatives,
        selectedProduction: winner
          ? String.fromCharCode(65 + winner.variantIndex)
          : "NONE",
        selected: selectedText || "FACT-FALLBACK",
      });

      choices.push({
        order: beat.order,
        beat,
        beatFacts,
        candidates: alternatives,
        selected: selectedText,
      });

      if (!selectedText) continue;
      scenes.push({
        text: selectedText,
        kind: beatKind(beat.role, index, plan.beats.length),
        sourceEventIds: beat.eventIds,
      });
    }
  } else {
    const prior: string[] = [];

    for (const [index, beat] of plan.beats.entries()) {
      const beatFacts = beat.eventIds
        .map((id) => input.suppliedReality.find((event) => event.id === id)?.text ?? "")
        .map(clean)
        .filter(Boolean);

      const evaluated = (variantsByOrder.get(beat.order) ?? [])
        .map((text) => {
          const base = variantScore(
            text,
            beatFacts,
            [beat.change].map(clean).filter(Boolean),
            input.subject,
            prior,
          );
          const payoffPenalty = memoryPayoffReplayPenalty(
            text,
            beatFacts,
            isMemoryMode,
            index === plan.beats.length - 1,
            beat.change,
          );
          return {
            text,
            ...base,
            score: Math.max(0, base.score - payoffPenalty),
            reasons: payoffPenalty > 0
              ? [...base.reasons, "memory-payoff-replay"]
              : base.reasons,
          };
        });

      const ranked = evaluated
        .filter((candidate) => candidate.accepted)
        .sort((a, b) => b.score - a.score);

      const selectedText = ranked[0]?.text ?? safeFallbackText(beat, input.suppliedReality);

      debug(`MOUTH-BEAT-${beat.order}-CHOICE`, {
        beat,
        beatFacts,
        candidates: evaluated,
        selected: selectedText || "FACT-FALLBACK",
      });

      choices.push({
        order: beat.order,
        beat,
        beatFacts,
        candidates: evaluated,
        selected: selectedText,
      });

      if (!selectedText) continue;

      scenes.push({
        text: selectedText,
        kind: beatKind(beat.role, index, plan.beats.length),
        sourceEventIds: beat.eventIds,
      });
      prior.push(selectedText);
    }
  }

  return {
    scenes,
    model: mouthResult.model || (lensSearchEnabled ? lensSearch.model : "") || planResult.model,
    modelCalls:
      (useDeterministicSparsePlan ? 1 : 2) +
      lensSearch.modelCalls +
      memoryRepairModelCalls,
    diagnostics: {
      plan,
      creativeFrames: framesForMouth,
      variantsByBeat: [...variantsByOrder.entries()]
        .sort(([a], [b]) => a - b)
        .map(([order, variants]) => ({ order, variants })),
      choices,
    },
  };
}
