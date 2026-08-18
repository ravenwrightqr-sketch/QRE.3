import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const target = path.join(
  repoRoot,
  "apps/api/src/services/authorBrainUniversal.ts",
);

if (!fs.existsSync(target)) {
  throw new Error(`Missing target: ${target}`);
}

const original = fs.readFileSync(target, "utf8");

if (
  original.includes(
    'from "./authorEnterpriseMouth.js"',
  ) &&
  original.includes(
    "const enterpriseBeats",
  )
) {
  console.log("Enterprise mouth integration already present.");
  process.exit(0);
}

const importAnchor =
  'import { localModelGenerate } from "./localModelRuntime.js";';

if (!original.includes(importAnchor)) {
  throw new Error(
    "Could not find the localModelGenerate import anchor. File shape is not the expected canonical Brain.",
  );
}

const functionStart =
  "async function realizeMouth(";
const functionEnd =
  "export async function authorBrainUniversal";

const start = original.indexOf(functionStart);
const end = original.indexOf(functionEnd, start);

if (start < 0 || end < 0 || end <= start) {
  throw new Error(
    "Could not locate the canonical realizeMouth function boundary. Refusing to patch.",
  );
}

const backup = `${target}.pre-enterprise-${new Date()
  .toISOString()
  .replace(/[:.]/g, "-")}.bak`;
fs.writeFileSync(backup, original, "utf8");

const nextImports = original.replace(
  importAnchor,
  `${importAnchor}\nimport { realizeEnterpriseMouth } from "./authorEnterpriseMouth.js";`,
);

const enterpriseRealizeMouth = `async function realizeMouth(
  input: AuthorBrainTruth,
  sequence: SequencePlay,
  plan: BeatPlan,
  cognition: ReturnType<typeof buildAuthorCognitivePlan>,
  truthNotes: TruthNote[],
  risk: string,
): Promise<{
  texts: string[];
  attentionEdit: ReturnType<typeof editAttentionSequence>;
  attentionRetry: number;
  cutRepair: number;
}> {
  const graph =
    input.realityGraph ??
    buildAuthorRealityGraph({
      prompt: clean(input.prompt),
      subject: clean(input.subject),
      place: clean(input.place),
      facts: [...input.facts],
      sourceMoments: [...input.sourceMoments],
      memoryContext: [...(input.memoryContext ?? [])],
      trajectory: [...(input.trajectory ?? [])],
    });

  const realizationMode = (
    beat?: AuthorBeat,
  ): string => {
    const move = clean(
      beat?.creativeMove,
    ).toLowerCase();
    const attention = clean(
      beat?.attentionFunction,
    ).toLowerCase();

    switch (move) {
      case "contrast":
        return "semantic_contrast";
      case "status_inversion":
        return "status_reversal";
      case "callback":
        return "callback_compression";
      case "recontextualization":
        return "meaning_reframe";
      case "understatement":
        return "understatement";
      case "double_meaning":
        return "double_meaning";
      case "personification":
        return "personification";
      case "implication":
        return "implication";
      default:
        switch (attention) {
          case "turn":
            return "meaning_turn";
          case "reframe":
            return "meaning_reframe";
          case "escalation":
            return "grounded_escalation";
          case "callback":
            return "callback_compression";
          case "payoff":
            return "payoff_compression";
          case "release":
            return "clean_release";
          default:
            return "direct_grounded_realization";
        }
    }
  };

  const enterpriseBeats =
    sequence.cuts.map(
      (cut, index) => {
        const beat = plan.beats[index];

        return {
          order: index + 1,
          role: cut.role,
          attentionFunction:
            beat?.attentionFunction,
          creativeMove:
            beat?.creativeMove,
          realizationMode:
            realizationMode(beat),
          eventIds: uniq([
            ...(cut.sourceIds ?? []),
            ...(beat?.eventIds ?? []),
          ], 12),
          change:
            cut.informationGain,
          next:
            cut.nextPromise,
          frontier:
            cut.momentum?.after
              .informationFrontier
              ?.frontier,
          setsUp:
            beat?.setsUp ?? [],
          paysOff:
            beat?.paysOff ?? [],
        };
      },
    );

  const first =
    await realizeEnterpriseMouth({
      graph,
      subject: clean(input.subject),
      lens: clean(input.lens),
      beats: enterpriseBeats,
      temperature:
        risk === "safe"
          ? 0.58
          : 0.72,
    });

  debug(
    "MOUTH-ENTERPRISE-CANDIDATES",
    JSON.stringify({
      beamScore: first.beamScore,
      texts: first.texts,
      candidates: first.candidates,
    }),
  );

  let texts = first.texts;
  let attentionEdit =
    editAttentionSequence({
      beats:
        buildAttentionBeatInputs(
          sequence,
          texts,
          plan,
        ),
      evidence: [
        ...input.facts,
        ...input.sourceMoments,
        ...(input.memoryContext ?? []),
      ],
    });

  let attentionRetry = 0;
  let cutRepair = 0;

  if (
    attentionEdit.rewriteNeeded
  ) {
    attentionRetry = 1;

    const revisionGuidance =
      attentionEdit.rewriteInstructions ?? [];

    const retry =
      await realizeEnterpriseMouth({
        graph,
        subject: clean(input.subject),
        lens: clean(input.lens),
        beats: enterpriseBeats,
        priorTexts: texts,
        revisionGuidance,
        temperature:
          risk === "safe"
            ? 0.58
            : 0.68,
      });

    debug(
      "MOUTH-ENTERPRISE-ATTENTION-RETRY",
      JSON.stringify({
        beamScore: retry.beamScore,
        texts: retry.texts,
        candidates: retry.candidates,
      }),
    );

    const retryAttention =
      editAttentionSequence({
        beats:
          buildAttentionBeatInputs(
            sequence,
            retry.texts,
            plan,
          ),
        evidence: [
          ...input.facts,
          ...input.sourceMoments,
          ...(input.memoryContext ?? []),
        ],
      });

    if (
      retry.texts.length ===
        sequence.cuts.length &&
      (
        retryAttention.accepted ||
        retryAttention.sequenceScore >
          attentionEdit.sequenceScore
      )
    ) {
      texts = retry.texts;
      attentionEdit =
        retryAttention;
    }
  }

  let sequenceResult =
    scenesFromSequence(
      sequence,
      texts,
      input,
      cognition,
    );

  if (
    sequenceResult.rejected > 0 ||
    texts.length !==
      sequence.cuts.length
  ) {
    cutRepair = 1;

    const repairGuidance = [
      "Final cut repair: return exactly one line for every approved beat.",
      "Remove unsupported concrete actions, objects, settings, reactions, and outcomes.",
      "Preserve the approved Meaning Spine and supplied event anchors.",
      "Use 3-7 words per line.",
      ...Object.entries(
        sequenceResult.rejectionReasons,
      ).map(
        ([reason, count]) =>
          `Observed gate failure ${reason}: ${count}.`,
      ),
      ...truthNotes.flatMap(
        (note) =>
          note.forbiddenClaims.map(
            (claim) =>
              `Forbidden claim for beat ${note.order}: ${claim}`,
          ),
      ),
    ];

    const repair =
      await realizeEnterpriseMouth({
        graph,
        subject: clean(input.subject),
        lens: clean(input.lens),
        beats: enterpriseBeats,
        priorTexts: texts,
        revisionGuidance:
          repairGuidance,
        temperature:
          risk === "safe"
            ? 0.55
            : 0.62,
      });

    debug(
      "MOUTH-ENTERPRISE-CUT-REPAIR",
      JSON.stringify({
        beamScore: repair.beamScore,
        texts: repair.texts,
        candidates: repair.candidates,
      }),
    );

    if (
      repair.texts.length ===
      sequence.cuts.length
    ) {
      const repairAttention =
        editAttentionSequence({
          beats:
            buildAttentionBeatInputs(
              sequence,
              repair.texts,
              plan,
            ),
          evidence: [
            ...input.facts,
            ...input.sourceMoments,
            ...(input.memoryContext ?? []),
          ],
        });

      const repairResult =
        scenesFromSequence(
          sequence,
          repair.texts,
          input,
          cognition,
        );

      if (
        repairResult.rejected <
        sequenceResult.rejected ||
        (
          repairResult.rejected ===
            sequenceResult.rejected &&
          repairAttention.sequenceScore >
            attentionEdit.sequenceScore
        )
      ) {
        texts =
          repair.texts;
        attentionEdit =
          repairAttention;
        sequenceResult =
          repairResult;
      }
    }
  }

  return {
    texts,
    attentionEdit,
    attentionRetry,
    cutRepair,
  };
}
`;

const beforeFunction = nextImports.slice(0, start);
const afterFunction = nextImports.slice(end);

const patched =
  `${beforeFunction}${enterpriseRealizeMouth}${afterFunction}`;

if (patched === original) {
  throw new Error("Integration produced no change; refusing to write.");
}

fs.writeFileSync(target, patched, "utf8");

console.log(`Enterprise mouth integration applied to ${target}`);
console.log(`Backup created at ${backup}`);
