/** QRE AUTHOR CRITIC · sentence-level cognitive judge */
import { localModelGenerate } from "./localModelRuntime.js";

export type MouthFailureCode =
  | "invented_concrete_detail"
  | "invented_reaction"
  | "invented_event"
  | "invented_identity"
  | "beat_poisoned"
  | "weak_beat_fit"
  | "generic_summary"
  | "overexplained"
  | "repetitive"
  | "weak_specificity"
  | "weak_creative_force"
  | "weak_afterimage"
  | "weak_attention_pull"
  | "weak_delight"
  | "anchor_collage"
  | "non_exact_endpoint"
  | "too_long";

export type MouthCritique = {
  decision: "accept" | "reject" | "retry";
  bestIndex: number;
  reason: string;
  failureCodes?: MouthFailureCode[];
  repairDirective?: string;
  scores?: {
    truth: number;
    beatFit: number;
    specificity: number;
    creativeForce: number;
    compression: number;
    character: number;
    surprise: number;
    afterimage: number;
    attentionPull: number;
    delight: number;
  }[];
};

function clean(value: unknown): string {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalize(value: string): string {
  return clean(value)
    .replace(/[.!?]+$/g, "")
    .toLowerCase();
}

function exactEndpoint(
  beat: unknown,
  candidate: string,
): boolean | undefined {
  if (!beat || typeof beat !== "object") {
    return undefined;
  }

  const value = beat as Record<
    string,
    unknown
  >;
  const paysOff = Array.isArray(
    value.paysOff,
  )
    ? value.paysOff
        .map(clean)
        .filter(Boolean)
    : [];

  if (!paysOff.length) {
    return undefined;
  }

  return paysOff.some(
    (endpoint) =>
      normalize(candidate) ===
      normalize(endpoint),
  );
}

function relationBeat(
  beat: unknown,
): boolean {
  if (!beat || typeof beat !== "object") {
    return false;
  }

  const value = beat as Record<
    string,
    unknown
  >;
  const mode = clean(
    value.realizationMode,
  ).toLowerCase();

  return [
    "reframe",
    "contrast",
    "turn",
    "callback",
    "reversal",
    "meaning",
  ].some((token) =>
    mode.includes(token),
  );
}

function parse(raw: string):
  | MouthCritique
  | undefined {
  const text = clean(raw)
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();

  try {
    const value = JSON.parse(
      text,
    ) as MouthCritique;

    if (
      !value ||
      typeof value !==
        "object"
    ) {
      return undefined;
    }

    if (
      !Number.isInteger(
        value.bestIndex,
      )
    ) {
      return undefined;
    }

    if (
      ![
        "accept",
        "reject",
        "retry",
      ].includes(
        value.decision,
      )
    ) {
      return undefined;
    }

    if (
      value.failureCodes &&
      !Array.isArray(
        value.failureCodes,
      )
    ) {
      return undefined;
    }

    return value;
  } catch {
    return undefined;
  }
}

export async function critiqueMouthCandidates(
  input: {
    prompt: string;
    lens?: string;
    subject?: string;
    facts: string[];
    moments: string[];
    memory: string[];
    moviePremise?: string;
    beat: unknown;
    candidates: string[];
    previousFailure?: string;
  },
): Promise<MouthCritique> {
  const endpointLines = input.beat &&
    typeof input.beat === "object"
    ? (
        Array.isArray(
          (input.beat as Record<
            string,
            unknown
          >).paysOff,
        )
          ? (input.beat as Record<
              string,
              unknown
            >).paysOff
              .map(clean)
              .filter(Boolean)
          : []
      )
    : [];

  const system = [
    "You are QRE's AUTHOR CRITIC for short-form realization.",
    "You judge whether each candidate completes the approved cognitive job, remains inside source truth, and fits the cumulative sequence.",
    "Do not invent new facts while judging.",
    "SOURCE TRUTH IS ABSOLUTE: reject any concrete person, object, action, location, setting, dialogue, outcome, body position, wardrobe placement, event, or social reaction not supported by supplied evidence.",
    "APPROVED EVIDENCE is the only material that may be asserted as concrete reality. A creative opportunity is an interpretation, not a factual event.",
    "Do not punish metaphor, idiom, implication, juxtaposition, wordplay, personification, status language, understatement, or comic framing when they reinterpret supplied reality without creating a new concrete event.",
    "SEMANTIC CONTRACT: for a relational beat, mentioning two supplied anchors is not enough. The sentence must make their relationship, changed reading, or consequence felt.",
    "Anchor collage such as 'A; B' is a failure when it merely enumerates two evidence items without performing the approved meaning change.",
    "The final supplied endpoint is inviolable. When the beat contains paysOff, the candidate must equal the supplied endpoint after punctuation normalization. No prefix, suffix, context clause, or added earlier evidence is allowed.",
    "A line may be excellent even when it uses only one or two source details. Reward compression and semantic force, not checklist coverage.",
    "Specificity means the line could plausibly have been written from this exact source.",
    "Creative force means a grounded double meaning, reversal, status turn, sly understatement, comic compression, or memorable afterimage.",
    "Compression: prefer 3-7 words; modestly longer lines are acceptable only when the meaning materially improves.",
    "After the subject is established, name omission is preferred unless the name materially improves the line.",
    "Reject generic summaries that merely restate supplied emotion or context.",
    "If all candidates are weak, decision=retry and bestIndex=-1. Never choose a least-bad invalid candidate.",
    "Return JSON exactly with decision, bestIndex, reason, failureCodes, repairDirective, and scores.",
    "failureCodes may include: invented_concrete_detail, invented_reaction, invented_event, invented_identity, beat_poisoned, weak_beat_fit, generic_summary, overexplained, repetitive, weak_specificity, weak_creative_force, weak_afterimage, weak_attention_pull, weak_delight, anchor_collage, non_exact_endpoint, too_long.",
    "repairDirective must identify the dominant failure and tell the next realization attempt what to change without inventing content.",
  ].join("\n");

  const user = JSON.stringify({
    prompt: input.prompt,
    lens: input.lens ?? "",
    subject: input.subject ?? "",
    moviePremise:
      input.moviePremise ?? "",
    SUPPLIED_EVIDENCE: {
      facts: input.facts,
      moments: input.moments,
      memory: input.memory,
    },
    GROUNDED_BEAT:
      input.beat,
    PAYOFF_CONTRACT:
      endpointLines.length
        ? {
            exact: true,
            endpoints:
              endpointLines,
          }
        : null,
    RELATIONAL_BEAT:
      relationBeat(
        input.beat,
      ),
    CANDIDATES:
      input.candidates,
    PREVIOUS_FAILURE:
      input.previousFailure ?? "",
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
        numPredict: 380,
        temperature: 0.14,
      },
    );

  const parsed =
    parse(result.text);

  if (!parsed) {
    return {
      decision: "retry",
      bestIndex: -1,
      reason:
        "critic output could not be parsed",
      failureCodes: [
        "weak_attention_pull",
      ],
      repairDirective:
        "Generate a short, source-specific line that completes the approved semantic job without inventing a concrete fact.",
    };
  }

  const candidateAtBest =
    parsed.bestIndex >= 0 &&
    parsed.bestIndex <
      input.candidates.length
      ? input.candidates[
          parsed.bestIndex
        ]
      : "";

  const endpointCheck =
    endpointLines.length
      ? exactEndpoint(
          input.beat,
          candidateAtBest,
        )
      : undefined;

  if (
    endpointCheck === false
  ) {
    return {
      ...parsed,
      decision: "retry",
      bestIndex: -1,
      reason:
        "candidate violates the exact supplied endpoint contract",
      failureCodes: [
        ...new Set([
          ...(parsed.failureCodes ?? []),
          "non_exact_endpoint" as const,
        ]),
      ],
      repairDirective:
        `Use the supplied endpoint exactly: ${endpointLines.join(" / ")}. Add nothing before or after it.`,
    };
  }

  return parsed;
}
