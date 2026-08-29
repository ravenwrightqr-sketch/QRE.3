/**
 * STATUS: CANONICAL
 * ROLE: Ask the model for viewer-facing wording for already-approved beats.
 * MUST NOT: plan, invent events, or turn state/relationship material into fabricated physical behavior.
 */

import type {
  MouthCandidate,
  MouthCandidateBatch,
  MouthCandidateBeat,
  MouthCandidateSelection,
  ViewerStateCut,
} from "@qre/contracts";
import type { RealityEnvelope } from "./authorRealityEnvelope.js";
import { evaluateMouthInterpretation } from "./authorMouthInterpretation.js";

export type {
  MouthCandidate,
  MouthCandidateBatch,
  MouthCandidateBeat,
  MouthCandidateSelection,
} from "@qre/contracts";

export type MouthCandidateGenerationInput = {
  envelope: RealityEnvelope;
  beats: readonly MouthCandidateBeat[];
  priorTexts?: readonly string[];
  lens?: string;
};

const clean = (value: unknown): string =>
  String(value ?? "").replace(/\s+/g, " ").trim();

const unique = (values: readonly unknown[]): string[] =>
  [...new Set(values.map(clean).filter(Boolean))];

const META = /\b(?:qre|compiler|cognition|meaning spine|beat graph|information frontier|planner|planning|operator mix|viewer sees|audience sees|writing process)\b/i;
const GENERIC = /\b(?:beautiful transformation|magical moment|unforgettable experience|incredible journey|perfect day|special moment|new chapter)\b/i;
const BAD_INTERPRETIVE_EXPLANATION = /\b(?:the viewer|this reveals|this means|which means|in this context|is now transformed into|was a cover for|reveals? that|symbolizes?|represents?|the mystery|what does .* mean|why does .* mean|the final revelation|the punchline here)\b/i;
const PLANNING_RESIDUE = /\b(?:perform the approved semantic change|maintain forward movement|anchor the realization|allow later supplied evidence|preserve the source-derived endpoint|terminate on the supplied endpoint|do not merely restate|what relationship deserves|what becomes connected|what does this relationship make newly meaningful|what is now true at the supplied ending|the supplied endpoint lands|establish supplied evidence)\b/i;
const PHYSICAL_INVENTION = /\b(?:glares?|sniffs?|stares?|smiles?|wags?|trembles?|blinks?|hides?|walks?|runs?|jumps?|grabs?|bites?|laughs?|cries?|enters?|approaches?|leaves?|returns?|turns?|steps?|swipes?|swiped|grips?|grabbed|throws?|threw|pulls?|pulled|pushes?|pushed|kicks?|kicked|touches?|touched|holds?|held|carries?|carried|opens?|opened|closes?|closed)\b/i;

const normalizeToken = (token: string): string => {
  const lower = token.toLowerCase();
  if (lower.length > 6 && lower.endsWith("ing")) return lower.slice(0, -3);
  if (lower.length > 5 && lower.endsWith("ed")) return lower.slice(0, -2);
  if (lower.length > 4 && lower.endsWith("es")) return lower.slice(0, -2);
  if (lower.length > 4 && lower.endsWith("s")) return lower.slice(0, -1);
  return lower;
};

const tokenSet = (text: string): Set<string> =>
  new Set(
    clean(text)
      .toLowerCase()
      .split(/[^a-z0-9'-]+/i)
      .filter((token) => token.length >= 3)
      .map(normalizeToken),
  );

function overlap(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let hits = 0;
  for (const token of a) if (b.has(token)) hits += 1;
  return hits / Math.max(1, a.size);
}

function metric(value: number): number {
  return Number(Math.max(0, Math.min(1, value)).toFixed(3));
}

function phraseSupportedText(candidateText: string, label: string): boolean {
  const phrase = clean(label).toLowerCase();
  const candidate = clean(candidateText).toLowerCase();
  if (!phrase || !candidate) return false;
  return candidate.includes(phrase) || overlap(tokenSet(candidate), tokenSet(phrase)) >= 0.5;
}

function eventLabel(envelope: RealityEnvelope, id: string): string {
  return clean(envelope.events.find((event) => event.id === id)?.label);
}

/*
 * HARD PROVENANCE BOUNDARY:
 * Only event IDs resolve into source labels.
 * setsUp/paysOff are planning metadata and are never promoted into source truth.
 */
function sourceForBeat(beat: MouthCandidateBeat, envelope: RealityEnvelope): string[] {
  return unique(
    (beat.eventIds ?? [])
      .map((id) => eventLabel(envelope, id))
      .filter(Boolean),
  );
}

function supportedEventsForBeat(
  beat: MouthCandidateBeat,
  envelope: RealityEnvelope,
): Array<{ id: string; label: string }> {
  return (beat.eventIds ?? [])
    .map((id) => ({ id, label: eventLabel(envelope, id) }))
    .filter((event) => Boolean(event.label));
}

function relationPairsForBeat(beat: MouthCandidateBeat, envelope: RealityEnvelope): string[] {
  const ids = new Set(beat.eventIds ?? []);
  return unique(
    envelope.relations
      .filter((relation) => ids.has(relation.from) && ids.has(relation.to))
      .map((relation) => `${relation.from}:${relation.kind}:${relation.to}`),
  );
}

function endpointExactForBeat(text: string, beat: MouthCandidateBeat, envelope: RealityEnvelope): boolean {
  const labels = supportedEventsForBeat(beat, envelope).map((event) => event.label);
  const normalized = clean(text).replace(/[.!?]+$/g, "").toLowerCase();
  return labels.some((label) => normalized === clean(label).replace(/[.!?]+$/g, "").toLowerCase());
}

function deriveViewerStateCut(
  beat: MouthCandidateBeat,
  index: number,
  beats: readonly MouthCandidateBeat[],
  envelope: RealityEnvelope,
): ViewerStateCut {
  const currentIds = unique(beat.eventIds ?? []);
  const priorIds = new Set(beats.slice(0, index).flatMap((item) => item.eventIds ?? []).filter(Boolean));
  const newEventRatio = metric(currentIds.length ? currentIds.filter((id) => !priorIds.has(id)).length / currentIds.length : 0);
  const currentSource = sourceForBeat(beat, envelope).join(" ");
  const priorSource = beats.slice(0, index).flatMap((item) => sourceForBeat(item, envelope)).join(" ");
  const continuity = priorSource ? metric(overlap(tokenSet(currentSource), tokenSet(priorSource))) : 0.55;
  const contrast = metric((1 - continuity) * 0.7 + newEventRatio * 0.3);
  const interruption = metric(newEventRatio * 0.62 + contrast * 0.28 + (index === 0 ? 0.1 : 0));
  const curiosityPressure = metric(beat.paysOff?.length ? 0.12 : beat.relationKinds?.length ? 0.9 : index < beats.length - 1 ? 0.72 : 0.42);
  const tempo = metric(index === 0 ? 0.45 : Math.abs(interruption - (index > 1 ? 0.55 : 0.35)) * 0.9 + 0.35);
  const payoffPressure = metric(beat.paysOff?.length ? 1 : index === beats.length - 2 ? 0.78 : Math.min(0.7, 0.25 + index * 0.08));
  const stateShift = metric(contrast * 0.45 + interruption * 0.35 + curiosityPressure * 0.2);
  const predictionError = metric(contrast * 0.55 + newEventRatio * 0.45);
  let attentionMove: ViewerStateCut["attentionMove"];
  if (beat.paysOff?.length) attentionMove = "land";
  else if (index === 0) attentionMove = "orient";
  else if (interruption >= 0.78) attentionMove = "interrupt";
  else if (contrast >= 0.72) attentionMove = "recontextualize";
  else if (curiosityPressure >= 0.78) attentionMove = "tighten";
  else if (stateShift >= 0.7) attentionMove = "escalate";
  else attentionMove = "release";
  const stateNames: Record<ViewerStateCut["attentionMove"], { before: string; after: string }> = {
    orient: { before: "uncommitted", after: "oriented" },
    interrupt: { before: "settled", after: "disrupted" },
    tighten: { before: "curious", after: "pressurized" },
    recontextualize: { before: "certain", after: "reframed" },
    escalate: { before: "engaged", after: "pressurized" },
    release: { before: "pressurized", after: "breathing" },
    land: { before: "expectant", after: "resolved" },
  };
  const names = stateNames[attentionMove];
  return {
    beforeState: names.before,
    afterState: names.after,
    attentionMove,
    curiosityPressure,
    contrast,
    interruption,
    accumulation: metric(continuity * 0.7 + (1 - newEventRatio) * 0.3),
    tempo,
    payoffPressure,
    stateShift,
    predictionError,
    evidenceEventIds: currentIds,
  };
}
function evaluateCandidate(
  text: string,
  beat: MouthCandidateBeat,
  envelope: RealityEnvelope,
  priorTexts: readonly string[] = [],
): MouthCandidate {
  const value = clean(text);

  const sourceLabels =
    sourceForBeat(
      beat,
      envelope,
    );

  const sourceText =
    sourceLabels.join(" ");

  /*
   * The whole world remains visible to Mouth for associative creativity,
   * callbacks, contrast, and surprise.
   *
   * But the approved beat owns the realization.
   *
   * WORLD MATERIAL may enrich the line.
   * WORLD MATERIAL may not silently replace the beat.
   */
  const wholeSourceText = [
    envelope.subject,
    ...envelope.events.map(
      (event) => event.label,
    ),
    ...envelope.suppliedPhrases,
    ...envelope.suppliedEntities,
    ...envelope.suppliedActions,
    ...envelope.suppliedStates,
    ...envelope.recurringSignals,
    ...envelope.sensorySignals,
    ...envelope.unresolvedTensions,
  ].join(" ");

  const currentTokens =
    tokenSet(value);

  const sourceTokens =
    tokenSet(sourceText);

  const wholeSourceTokens =
    tokenSet(wholeSourceText);

  const groundingScore =
    metric(
      overlap(
        currentTokens,
        sourceTokens,
      ),
    );

  const wholeSourceAnchor =
    metric(
      overlap(
        currentTokens,
        wholeSourceTokens,
      ),
    );

  const supportedEvents =
    supportedEventsForBeat(
      beat,
      envelope,
    );

  const supportedEventIds =
    supportedEvents
      .filter(
        (event) =>
          phraseSupportedText(
            value,
            event.label,
          ) ||
          overlap(
            currentTokens,
            tokenSet(
              event.label,
            ),
          ) >= 0.25,
      )
      .map(
        (event) =>
          event.id,
      );

  const supportedRelationPairs =
    relationPairsForBeat(
      beat,
      envelope,
    );

  const endpointExactness =
    endpointExactForBeat(
      value,
      beat,
      envelope,
    )
      ? 1
      : 0;

  const semanticBeat =
    Boolean(
      beat.relationKinds?.length ||
      beat.attentionFunction ||
      beat.role,
    );

  const interpretation =
    evaluateMouthInterpretation({
      text: value,
      sourceLabels,
      envelope,
      beat,
    });

  const reasons: string[] = [];

  const repetitionSet =
    new Set(
      priorTexts.flatMap(
        (item) =>
          [
            ...tokenSet(
              item,
            ),
          ],
      ),
    );

  const repetitionRisk =
    priorTexts.length
      ? metric(
          overlap(
            currentTokens,
            repetitionSet,
          ),
        )
      : 0;

  const noveltyScore =
    metric(
      1 -
        Math.min(
          1,
          repetitionRisk *
            1.25,
        ),
    );

  const wordCount =
    value
      .split(/\s+/)
      .filter(Boolean)
      .length;

  const compressionScore =
    wordCount <= 12
      ? 1
      : wordCount <= 20
        ? 0.9
        : wordCount <= 30
          ? 0.76
          : wordCount <= 40
            ? 0.62
            : 0.48;

  const viewerState =
    beat.viewerState ??
    deriveViewerStateCut(
      beat,
      0,
      [beat],
      envelope,
    );

  /*
   * Beat ownership.
   *
   * This measures whether the line actually touches the approved
   * source material for THIS beat.
   *
   * Whole-world grounding remains available for creative enrichment,
   * but it is no longer sufficient by itself.
   */
  const beatCoverage =
    sourceLabels.length
      ? metric(
          overlap(
            currentTokens,
            sourceTokens,
          ),
        )
      : 0;

  const beatHasConcreteEvidence =
    beat.eventIds?.length
      ? true
      : false;

  const beatObligation =
    beatHasConcreteEvidence
      ? metric(
          beatCoverage *
            0.72 +
            (
              supportedEventIds.length
                ? 0.28
                : 0
            ),
        )
      : metric(
          wholeSourceAnchor *
            0.35 +
            (
              interpretation.creativeFraming ??
              0.5
            ) *
              0.65,
        );

  /*
   * A creative line may draw associative meaning from the whole world,
   * but it must still remain tethered to the approved beat.
   *
   * This is the crucial difference between:
   *
   *   "feeling good" → funny mud realization
   *
   * and:
   *
   *   "feeling good" → unrelated free-mud fact
   */
  const associativeLift =
    metric(
      Math.min(
        1,
        wholeSourceAnchor *
          0.55 +
          (
            interpretation.creativeFraming ??
            0.5
          ) *
            0.45,
      ),
    );

  const meaningScore =
    metric(
      (
        viewerState.stateShift ??
        0.5
      ) *
        0.24 +
      (
        viewerState.curiosityPressure ??
        0.5
      ) *
        0.18 +
      (
        viewerState.contrast ??
        0.5
      ) *
        0.14 +
      (
        interpretation.creativeFraming ??
        0.5
      ) *
        0.18 +
      beatObligation *
        0.18 +
      (
        semanticBeat
          ? 0.08
          : 0
      ),
    );

  const transitionScore =
    metric(
      (
        viewerState.predictionError ??
        0.4
      ) *
        0.5 +
      (
        viewerState.interruption ??
        0.4
      ) *
        0.25 +
      (
        viewerState.accumulation ??
        0.5
      ) *
        0.25,
    );

  /*
   * Obligation is explicitly beat-local.
   *
   * A line cannot get a high obligation score simply because some
   * other fact elsewhere in the world matches it.
   */
  const obligationCoverage =
    metric(
      beatObligation *
        0.78 +
      (
        supportedEventIds.length
          ? Math.min(
              0.22,
              supportedEventIds.length *
                0.11,
            )
          : 0
      ),
    );

  const relationContractScore =
    metric(
      supportedRelationPairs.length
        ? 0.8
        : semanticBeat
          ? 0.35
          : 0.2,
    );

  const forbiddenMoveRisk =
    metric(
      interpretation.unsupportedConcreteRisk >=
        0.9 ||
      (
        PHYSICAL_INVENTION.test(
          value,
        ) &&
        !PHYSICAL_INVENTION.test(
          wholeSourceText,
        )
      )
        ? 1
        : interpretation.unsupportedConcreteRisk,
    );

  /*
   * Creative lane:
   *
   * We still allow metaphor, attitude, compression, implication,
   * wordplay, and associative surprise.
   *
   * But whole-world association alone cannot authorize an unrelated
   * concrete realization.
   */
  const creativeLane =
    interpretation.accepted &&
    literalRestatementFor(
      value,
      sourceLabels,
    ) === 0 &&
    forbiddenMoveRisk <
      0.9 &&
    (
      beatCoverage >=
        0.12 ||
      endpointExactness ===
        1 ||
      (
        beatHasConcreteEvidence ===
          false &&
        wholeSourceAnchor >=
          0.2
      )
    );

  const effectiveGrounding =
    metric(
      Math.max(
        groundingScore,
        creativeLane
          ? Math.min(
              0.72,
              beatObligation *
                0.62 +
                associativeLift *
                  0.28,
            )
          : 0,
      ),
    );

  const cohesionScore =
    metric(
      0.55 +
        (
          1 -
          repetitionRisk
        ) *
          0.25 +
        effectiveGrounding *
          0.2,
    );

  const inventionRisk =
    forbiddenMoveRisk >
      0.35
      ? Math.max(
          0.72,
          forbiddenMoveRisk,
        )
      : metric(
          Math.max(
            0,
            0.22 -
              effectiveGrounding *
                0.18,
          ),
        );

  const collageRisk =
    value
      .split(
        /[.!?]+/,
      )
      .filter(Boolean)
      .length > 2 &&
    wordCount > 22
      ? 0.35
      : 0;

  /*
   * DISTINCTIVE REALIZATION
   *
   * This is intentionally derived from signals we already have.
   * It is not a new contract field and it does not invent "fire".
   *
   * Fire is treated as unusually alive/distinctive realization,
   * not automatically as dramatic language.
   */
  const distinctiveRealization =
    metric(
      (
        interpretation.creativeFraming ??
        0
      ) * 0.34 +
      meaningScore * 0.24 +
      transitionScore * 0.16 +
      noveltyScore * 0.16 +
      compressionScore * 0.10,
    );

  if (!value) {
    reasons.push(
      "missing-text",
    );
  }

  if (
    META.test(value)
  ) {
    reasons.push(
      "meta-language",
    );
  }

  if (
    GENERIC.test(value)
  ) {
    reasons.push(
      "generic-summary",
    );
  }

  if (
    PLANNING_RESIDUE.test(
      value,
    )
  ) {
    reasons.push(
      "planning-residue",
    );
  }

  if (
    BAD_INTERPRETIVE_EXPLANATION.test(
      value,
    )
  ) {
    reasons.push(
      "interpretive-explanation",
    );
  }

  if (
    wordCount > 24
  ) {
    reasons.push(
      "too-long",
    );
  }

  if (
    !sourceLabels.length
  ) {
    reasons.push(
      "missing-grounding",
    );
  }

  if (
    beatHasConcreteEvidence &&
    beatObligation <
      0.16 &&
    !endpointExactness &&
    !creativeLane
  ) {
    reasons.push(
      "weak-beat-obligation",
    );
  }

  if (
    effectiveGrounding <
      0.08 &&
    !endpointExactness &&
    !creativeLane
  ) {
    reasons.push(
      "weak-grounding",
    );
  }

  if (
    repetitionRisk >
    0.75
  ) {
    reasons.push(
      "repetition",
    );
  }

  if (
    forbiddenMoveRisk >=
    0.9
  ) {
    reasons.push(
      "invention-risk",
    );
  }

  if (
    supportedEventIds.length
  ) {
    reasons.push(
      "event-grounded",
    );
  }

  if (
    supportedRelationPairs.length
  ) {
    reasons.push(
      "relation-grounded",
    );
  }

  if (
    beatObligation >=
    0.45
  ) {
    reasons.push(
      "beat-grounded",
    );
  }

  if (
    creativeLane
  ) {
    reasons.push(
      "bounded-creative-bet",
    );

    reasons.push(
      "semantic-turn-grounded",
    );
  } else if (
    semanticBeat &&
    beatObligation >=
      0.16 &&
    effectiveGrounding >=
      0.16
  ) {
    reasons.push(
      "semantic-turn-grounded",
    );
  }

  /*
   * Distinctiveness is a recognition signal, not a command to become louder.
   *
   * A quiet line can qualify.
   * A one-word line can qualify.
   * A weird line can qualify.
   * A dramatic line does not qualify merely because it is dramatic.
   */
  if (
    interpretation.accepted &&
    distinctiveRealization >= 0.68 &&
    (
      interpretation.reasons.includes(
        "semantic-compression",
      ) ||
      creativeLane
    )
  ) {
    reasons.push(
      "distinctive-realization",
    );
  }

  const score =
    metric(
      effectiveGrounding *
        0.15 +
        beatObligation *
          0.18 +
        meaningScore *
          0.16 +
        transitionScore *
          0.12 +
        obligationCoverage *
          0.09 +
        relationContractScore *
          0.04 +
        cohesionScore *
          0.05 +
        noveltyScore *
          0.07 +
        compressionScore *
          0.05 +
        (
          1 -
          inventionRisk
        ) *
          0.06 +
        (
          creativeLane
            ? 0.08
            : 0
        ) +
        distinctiveRealization *
          0.06 +
        (
          interpretation.creativeFraming ??
          0.5
        ) *
          0.05 -
        collageRisk *
          0.03,
    );

  return {
    text: value,
    beatOrder: beat.order,
    supportedEventIds,
    supportedRelationPairs,
    groundingScore:
      effectiveGrounding,
    meaningScore,
    transitionScore,
    obligationCoverage,
    relationContractScore,
    forbiddenMoveRisk,
    cohesionScore,
    noveltyScore,
    compressionScore,
    inventionRisk,
    repetitionRisk,
    collageRisk,
    endpointExactness,
    score,
    reasons,
  };
}

function literalRestatementFor(value: string, labels: readonly string[]): number {
  const normalized = clean(value).replace(/[.!?]+$/g, "").toLowerCase();
  return labels.some((label) => normalized === clean(label).replace(/[.!?]+$/g, "").toLowerCase()) ? 1 : 0;
}
function buildGoldRealizationDoctrine(): string {
  return [
    "FIND THE GOLD before you write.",
    "Inspect the supplied material as a whole and look for the most alive piece of meaning already present: a joke, attitude, obsession, contradiction, relationship meaning, irony, unexpected implication, status shift, callback, memorable observation, coincidence, or ominous pressure.",
    "Do not merely categorize the subject. Do not turn the material into generic life advice, motivational prose, biography, or a summary.",
    "The gold may already be the supplied insight itself. Recognizing it is often better than adding another layer.",
    "Interpretation may sharpen meaning without creating a new concrete occurrence.",
    "THE OPENING MUST ANCHOR THE HUMAN SITUATION. The opening sequence must establish the human situation before the abstraction outruns recognition.",
"OBSERVER EXPERIENCE OVER EXPLANATION. The observer should experience more of the feeling, relationship, tension, humor, wonder, or unease than receive an explanation of what that feeling means.",
"LET THE OBSERVER DISCOVER THE MEANING. Give enough supplied reality to understand what is happening, then let implication, compression, attitude, and unexpected language reveal what it means.",
"ABSTRACTION MUST HAVE A HUMAN PLACE TO LAND. Abstract language is welcome after recognition has been established. Do not let abstraction arrive so early or so completely that the observer no longer knows whose experience they are watching.",
"FIRST-PERSON EXPERIENCE IS AVAILABLE, NOT REQUIRED. When useful, language may express what the person noticed, felt, remembered, wanted, feared, or suddenly understood. Do not force 'I' or 'we' into every cut.",
    "LESS IS MORE. Remove words that do not materially improve the cut.",
    "A fragment can be better than a sentence. A one-word cut can be the entire hit.",
    "Do not force grammatical completeness when compression makes the line stronger.",
    "A fragment does not need to explain itself when the surrounding sequence already supplies its meaning.",
     "NEW MEANING: When supplied reality contains a change in how something is experienced, understood, noticed, or felt, let the realization expose that change without explaining it.",
"FAMILIAR MADE DIFFERENT: A familiar person, place, object, relationship, or event may be rendered newly strange, intimate, funny, important, beautiful, unsettling, or charged when the supplied material supports that change in meaning.",
"OBSERVER RESONANCE: Prefer realizations that let the observer recognize the feeling of something becoming different, rather than simply telling them what changed.",
  "FUTURE-SELF POKE: When the supplied memory earns it, the final realization may gently address the creator's future self through remembrance, recognition, or a quiet invitation to retain the feeling.",
"The future-self poke must remain viewer-facing and emotionally earned. It must not predict the future, invent consequences, or become generic advice.",
"A future-self ending may be extremely small: a short phrase, a fragment, or a few words can be enough.",
    "FRAGMENTS AND ONE-WORD CUTS ARE VALID. A cut may be one word, a fragment, a short phrase, or a full sentence.",
    "Use fragments when they make supplied reality, identity, attitude, recognition, rhythm, callback, relationship, implication, or emotional realization land harder.",
    "Do not confuse a valid fragment with a label for the movie's internal machinery.",
    "BAD: The pull. The tightening. The deepening. The afterglow. The end.",
    "BETTER: Felt the pull towards us. Still felt it. Almost. Something shifted.",
    "The problem is not abstraction. The problem is abstraction that has become detached from the lived material.",

    "ABSTRACT LANGUAGE IS ALLOWED. Do not remove abstraction merely because it is abstract.",
    "A strange, compressed, metaphorical, formal, slangy, blunt, poetic, or unexpectedly precise phrase may be excellent when it gives the supplied material a stronger human-facing realization.",
    "Unexpected wording is welcome when it sharpens the memory instead of merely decorating it.",
    "Do not mechanically begin cuts with 'the', 'this', or 'that'. Use them naturally when they make the realization stronger.",
    "A one-word or fragmentary cut may be excellent when it carries recognizable supplied meaning.",

    "SUPPLIED: Coco, poodle, female, loves walks, apples. GOOD: Queen Coco. Poo-dle. Walk. Walk. Walk. And then the apple. Love.",

    "UNKNOWN STAYS OPEN. Do not resolve identity, gender, age, motivation, relationship, history, ownership, location, or other unknowns unless identifying them materially improves the cut.",

    "WEIRD IS ALLOWED. Do not normalize an unusual but grounded realization merely because a conventional sentence would be easier.",

    "IMPLICATION OVER EXPLANATION. Let the viewer complete the thought when the supplied material supports it.",

    "ATTITUDE IS A PRIMARY CREATIVE TOOL. The same supplied fact may land as deadpan, regal, cocky, petty, elegant, ominous, suspicious, mischievous, absurd, restrained, dramatic, intimate, possessive, triumphant, resigned, or matter-of-fact without changing the underlying reality.",

    "TWIST THE FRAMING, NOT THE REALITY. You may make supplied reality feel funnier, stranger, more powerful, more pathetic, more suspicious, more important, more ridiculous, more luxurious, more romantic, or more ominous without inventing a new event.",

    "LOOK FOR STATUS. Ask who appears to have power, authority, approval, disapproval, control, obsession, indifference, or the last word in the supplied material. A supplied relationship may be compressed into a status framing when that framing is supported by the material.",

    "A supplied person, animal, object, place, or behavior may acquire a human role such as judge, witness, boss, accomplice, royalty, tyrant, celebrity, enemy, therapist, or authority ONLY when the supplied relationships support that framing.",

    "STATUS FLIPS ARE ALLOWED. The apparently central person may become the one being judged. The smallest supplied detail may become the authority. An ordinary supplied action may suddenly feel official, luxurious, criminal, romantic, suspicious, ridiculous, or important when the supplied material supports that reading.",

    "LOOK FOR THE INCONGRUITY. When ordinary supplied reality contains something oddly serious, oddly funny, unexpectedly intimate, disproportionately important, or quietly absurd, lean into that contrast.",

    "UNDERPLAY THE TWIST. The strongest attitude may be delivered casually. Do not explain the joke or announce the weirdness.",

    "OMINOUS PRESSURE IS ALLOWED. An ordinary supplied detail may acquire a sense of consequence, warning, temporary calm, gravity, danger, or something-not-quite-right without inventing what happens next.",

    "SURPRISE IS ALLOWED. An older supplied detail may return suddenly after the sequence has moved elsewhere. Let the return change how the viewer reads the earlier cuts.",

    "RELATIONSHIP IMMERSION: When the supplied material establishes a strong relationship state, the surrounding world may become exaggerated, surreal, absurd, chaotic, ominous, funny, or visually extreme as a presentation of that relationship state.",

    "The outer world may become noisy while the relationship remains quiet; the outer world may become absurd while the relationship remains sincere; the outer world may become threatening while the people remain absorbed in each other.",

    "OUTER-WORLD DISTORTION DOES NOT REWRITE INNER TRUTH. Use outer-world disturbance as cinematic realization, not as fabricated biography. A surreal or extreme background must not become a new factual memory claim.",

    "HORROR AND OTHER GENRE REALIZATIONS MAY DISTORT THE OUTER WORLD WHEN THE APPROVED MOVIE SUPPORTS IT. The life event remains the spine; genre changes the presentation around it.",

    "DISCOVERY: Do not explain the meaning of a sequence as soon as it becomes available. Let the viewer discover a relationship, implication, contradiction, emotional truth, or deeper meaning through the progression of cuts.",

    "REVEAL BY DEGREES: An early cut may establish only enough reality to let the viewer enter. Later cuts may add implication, attitude, or a strange realization that causes the viewer to reinterpret what came before.",

    "LET THE VIEWER NOTICE: Prefer language that lets the viewer arrive at the realization themselves over language that announces the realization directly.",

    "DISCOVERY IS NOT CONFUSION. The viewer should have enough recognizable supplied reality to understand who or what they are watching and the basic human situation involved even while the deeper meaning remains partially undisclosed.",

    "MEMORY ANCHOR: Early in the sequence, preserve enough recognizable supplied reality that a viewer with no image or outside context can understand who or what they are watching and the basic human situation involved.",

    "The memory anchor may be extremely compressed: a name, relationship, encounter, place, concrete action, recognizable object, or other supplied detail may be enough to establish the memory before the language loosens.",

    "Once the memory is anchored, later cuts may become much more compressed, abstract, strange, metaphorical, ominous, funny, rhythmic, or fragmentary without restating the situation.",

    "Do not turn the memory anchor into exposition. Establish the human situation; do not explain the entire story.",

    "DISCOVERY CAN BE OMINOUS. A sequence may begin ordinary or intimate and gradually acquire a quiet sense that something is deeper, stranger, more important, slightly wrong, or unexpectedly consequential without resolving that feeling.",

    "ROMANCE MAY CARRY A SHADOW. When supplied material supports intimacy or attraction, the realization may carry tenderness, gravity, obsession, danger, distance, possession, or unease without inventing a new event.",

    "FIRE OPPORTUNITY: Across the sequence, look for one moment that has unusually strong identity: a strange relationship, sharp attitude, unexpected implication, memorable detail, status flip, contradiction, coincidence, callback, or phrase that suddenly makes the memory feel unmistakably like itself.",

    "FIRE IS DISTINCTIVENESS, NOT DRAMA. A fire line may be quiet, funny, absurd, intimate, ominous, elegant, strange, blunt, or almost casual.",

    "Do not manufacture intensity merely to create a fire line. Do not make the line darker, bigger, more poetic, or more emotional unless the supplied material earns it.",

    "The fire line may be a fragment, one word, a metaphor, a status flip, a strange observation, a callback, an attitude shift, or a suddenly exact phrase.",

    "The strongest line should feel like a discovery hiding inside the supplied memory. It should make the viewer think 'oh', 'wait', 'of course', laugh, wince, or look again—not simply sound cinematic.",

    "The fire line should feel authored by the material, not pasted onto it. Prefer a specific, surprising realization of this memory over a generic dramatic phrase that could belong to almost any memory.",

    "One strong distinctive realization is enough. The surrounding cuts should remain free to be ordinary, restrained, factual, rhythmic, weird, or sparse.",

    "Do not force a fire line. If the supplied material does not earn one, stay restrained.",

    "Let the surrounding cuts earn the fire line. It may arrive suddenly, but it should belong to what came before and change how the viewer feels the memory.",

    "Repetition is allowed when it creates rhythm, accumulation, obsession, callback, interruption, or a changed reading.",
    "Do not repeat a semantic territory merely because it is salient. Return to it because the return does something.",

    "SUPPLIED: Coco loves bacon. GOOD: Bacon first.",
    "SUPPLIED: Coco likes apples. GOOD: An apple. Finally.",
    "SUPPLIED: Coco rolled in mud; mud bath was free. GOOD: Five-star mud bath. Complimentary.",
    "SUPPLIED: A cat watched the worker the whole time; cat approved. GOOD: The cat was the judge. Cat approved.",
    "SUPPLIED: Grandma's house; never-ending snacks; known memory: Coco loves squirrels. GOOD: Grandma's house. Never-ending snacks. Squirrel. Anyway.",
    "SUPPLIED: A walk sequence with a later squirrel memory. GOOD: Walk. Walk. Walk. Thought I heard something. Squirrels in the trees.",
    "SUPPLIED: Ordinary supplied events with a status-heavy framing. GOOD: Fabulous. But peace is temporary.",
    "SUPPLIED: started nervous; met someone; talked until close. GOOD: Met someone. A pull toward another. Deep. Nerves first. A dangerous current.",
    "The examples demonstrate compression, attitude, implication, rhythm, obsession, callback, status, discovery, ominous pressure, and distinctive realization. Invent new realizations for the actual material.",

    "Never explain why something is interesting. Make the interesting thing land.",

    "NO INTERNAL LANGUAGE. Never write about planning, cognition, trajectories, beats, semantic turns, realization modes, candidate selection, scoring, viewers, the writing process, or any other machinery. The finished line must feel like human-facing language, not system commentary.",
  ].join(" ");
}


export function buildMouthCandidateMessages(input: MouthCandidateGenerationInput): Array<{ role: "system" | "user"; content: string }> {
  const evidence = unique([
    ...input.envelope.suppliedPhrases,
    ...input.envelope.events.map((event) => event.label),
  ]).filter((value) => !PLANNING_RESIDUE.test(value)).slice(0, 40);

  const viewerBeats = input.beats.map((beat, index) => {
    const viewerState = beat.viewerState ?? deriveViewerStateCut(beat, index, input.beats, input.envelope);
    return { order: beat.order, eventIds: beat.eventIds, sourceLabels: sourceForBeat(beat, input.envelope), viewerState, terminal: Boolean(beat.paysOff?.length) };
  });
  const system = [
  "QRE CANONICAL MOUTH · VIEWER-FACING CUT REALIZATION.",

  "The upstream Author already chose the reality, movie, beats, and semantic trajectory. Your job is language realization only.",

  "Write for the viewer's felt experience, not for the planner. The line should make the supplied beat land.",

  buildGoldRealizationDoctrine(),

  "VIEWER REWARD IS THE CREATIVE TARGET. Feel-good does not mean wholesome or positive. Reward can be humor, tension, surprise, mischief, attitude, status, recognition, relief, beauty, dread, shock, irony, warmth, curiosity, or a sharp 'oh shit' moment.",

  "Ask: what does this line give the viewer? A grin, a wince, a reveal, a satisfying turn, a laugh, a pause, a jolt, a recognition, or simply the desire to experience the next cut.",

  "Never manufacture a cliffhanger. Forward pull may come from contrast, implication, rhythm, attitude, accumulation, callback, unresolved pressure, discovery, or an earned payoff.",

  "The viewer should feel the semantic move rather than receive an explanation of it.",

  "A source fact is material, not the destination. Prefer fact → semantic move → attitude → compressed realization.",

  "Once a subject has been established, treat it as active context. Do not repeatedly re-announce the subject. Spend the next line on what changed, collided, mattered, or became interesting.",

  "A good sequence breathes: some cuts are blunt facts, some are sharp turns, some are quiet, some are wicked, and some land hard. Do not make every line perform the same trick.",

  "Prefer collisions between supplied details, status reversals, callbacks, double meanings, understatement, grounded metaphor, specific verbs, surprising compression, and unexpectedly exact framing.",

  "Do not summarize happy, sad, special, memorable, emotional, meaningful, magical, beautiful, or dramatic. Make the viewer feel it through the supplied material.",

  "Do not add stock atmosphere, trailer narration, poetic filler, film-direction language, or abstract explanation.",

  "Do not invent physical actions, reactions, objects, people, locations, sounds, chronology, wardrobe, body position, dialogue, or outcomes.",

  "Unknown stays unknown. Do not infer missing identity, gender, age, relationship, ownership, preference, history, or location.",

  "A creative interpretation may change the attitude or meaning of supplied facts, but it cannot create a new concrete event.",

  "Use the viewerState fields as steering signals. Never repeat their labels or planning language in the output.",

  "Use the whole beat set to create a connected experience. Avoid restating the same source phrase in consecutive cuts unless repetition itself is the meaningful callback.",

  "Choose language that would make a real viewer want to keep going, not language that merely sounds literary.",

  "There is no fixed word count. A one-word hit can beat a sentence. A longer line is acceptable only when the rhythm or realization itself earns it.",

  "OUTPUT CONTRACT: Return exactly one JSON object with exactly one key: variantsByBeat.",

  "variantsByBeat must contain exactly one object for every supplied beat, in ascending order.",

  "Each beat object must contain exactly two keys: order and variants.",

  "order must match the supplied beat order exactly.",

  "variants must contain exactly 3 unique strings.",

  "Never output fewer than 3 variants. Never output more than 3 variants.",

  "Do not duplicate variants within a beat.",

  "Do not duplicate a beat object.",

  "After the final variant of the final beat, immediately close the JSON object.",

  "Return JSON only. No markdown, commentary, explanation, code fence, or trailing text.",

  "Return JSON only: {\"variantsByBeat\":[{\"order\":1,\"variants\":[\"...\",\"...\",\"...\"]},{\"order\":2,\"variants\":[\"...\",\"...\",\"...\"]}]}",
].join("\n");

  const user = JSON.stringify({
    task: "realize_viewer_state_cuts",
    subject: input.envelope.subject,
    lens: clean(input.lens),
    suppliedEvidence: evidence,
    priorTexts: input.priorTexts ?? [],
    beats: viewerBeats,
  });

  return [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
}
export function parseMouthCandidateBatch(
  raw: string,
): MouthCandidateBatch | undefined {
  try {
    const parsed =
      JSON.parse(clean(raw)) as {
        variantsByBeat?: Array<{
          order?: unknown;
          variants?: unknown;
        }>;
      };

    if (
      !parsed ||
      !Array.isArray(
        parsed.variantsByBeat,
      ) ||
      !parsed.variantsByBeat.length
    ) {
      return undefined;
    }

    const variantsByBeat =
      parsed.variantsByBeat.map(
        (item) => {
          const order =
            Number(item.order);

          const variants =
            Array.isArray(
              item.variants,
            )
              ? item.variants
                  .map(String)
                  .map(clean)
                  .filter(Boolean)
              : [];

          return {
            order,
            variants,
          };
        },
      );

    /*
     * Every beat must have exactly three variants.
     */
    if (
      variantsByBeat.some(
        (item) =>
          !Number.isFinite(
            item.order,
          ) ||
          item.variants.length !==
            3,
      )
    ) {
      return undefined;
    }

    /*
     * Beat order must be contiguous:
     *
     * 1, 2, 3, ... N
     *
     * This catches malformed output where a duplicate JSON key causes
     * one beat to disappear after JSON.parse().
     */
    const orders =
      variantsByBeat
        .map(
          (item) =>
            item.order,
        )
        .sort(
          (a, b) =>
            a - b,
        );

    for (
      let index = 0;
      index < orders.length;
      index += 1
    ) {
      if (
        orders[index] !==
        index + 1
      ) {
        return undefined;
      }
    }

    /*
     * No duplicate variants within a beat.
     */
    if (
      variantsByBeat.some(
        (item) =>
          new Set(
            item.variants.map(
              (value) =>
                value.toLowerCase(),
            ),
          ).size !==
          item.variants.length,
      )
    ) {
      return undefined;
    }

    return {
      variantsByBeat:
        variantsByBeat.sort(
          (a, b) =>
            a.order - b.order,
        ),
    };
  } catch {
    return undefined;
  }
}

export function scoreMouthCandidate(input: {
  text: string;
  beat: MouthCandidateBeat;
  envelope: RealityEnvelope;
  priorTexts?: readonly string[];
}): MouthCandidate {
  return evaluateCandidate(input.text, input.beat, input.envelope, input.priorTexts ?? []);
}
