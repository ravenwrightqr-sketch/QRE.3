// QRE AUTHOR WIRING MIGRATOR · LATENT MOVIE → CANONICAL BEATS
// HARD RULE: NO hardcoded domain stories, names, jokes, or events.
// RealityGraph is the factual boundary; latent trajectory supplies structure.
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const target = path.join(root, "apps/api/src/services/authorBrainUniversal.ts");
if (!fs.existsSync(target)) throw new Error(`Missing canonical author brain: ${target}`);
const source = fs.readFileSync(target, "utf8");
const original = source;

function replaceOnce(input, needle, replacement, label) {
  const index = input.indexOf(needle);
  if (index < 0) throw new Error(`Cannot find ${label}; refusing unsafe rewrite`);
  return input.slice(0, index) + replacement + input.slice(index + needle.length);
}
function insertBeforeMarker(input, marker, block, label) {
  const index = input.indexOf(marker);
  if (index < 0) throw new Error(`Cannot find ${label}; refusing unsafe rewrite`);
  return input.slice(0, index) + block + "\n" + input.slice(index);
}

let next = source;
const importNeedle = 'import { localModelGenerate } from "./localModelRuntime.js";';
if (!next.includes('from "./authorLatentMovieSearch.js"')) {
  next = replaceOnce(next, importNeedle,
    importNeedle + '\nimport { searchLatentMovieCandidates } from "./authorLatentMovieSearch.js";',
    "canonical local-model import");
}

if (!next.includes("function recoverLatentMovieBeatPlan(")) {
  // Deliberately use a plain string array rather than nested template literals.
  // This migrator must itself remain syntax-safe regardless of model prompt text.
  const helper = [
    "",
    "/** Recover a truth-bound structural floor from the selected latent movie. */",
    "function recoverLatentMovieBeatPlan(",
    "  input: AuthorBrainTruth,",
    "  realityGraph: ReturnType<typeof buildAuthorRealityGraph>,",
    "): BeatPlan | undefined {",
    "  const candidates = searchLatentMovieCandidates({",
    "    graph: realityGraph, subject: clean(input.subject), lens: clean(input.lens), limit: 6,",
    "  });",
    "  const candidate = candidates[0];",
    "  if (!candidate?.trajectory?.length) return undefined;",
    "  const roleByOperation: Record<string, string> = { establish: 'arrival', contrast: 'reframe', consequence: 'consequence', reframe: 'reframe', escalate: 'escalation', recur: 'callback', converge: 'discovery', payoff: 'payoff' };",
    "  const gainByOperation: Record<string, string> = { establish: 'new_fact', contrast: 'surprise', consequence: 'consequence', reframe: 'reframe', escalate: 'escalation', recur: 'callback', converge: 'discovery', payoff: 'payoff' };",
    "  const beats: AuthorBeat[] = candidate.trajectory.map((step, index) => {",
    "    const labels = step.eventIds.map((eventId) => realityGraph.events.find((event) => event.id === eventId)?.label).filter(Boolean) as string[];",
    "    const nextStep = candidate.trajectory[index + 1];",
    "    const nextLabels = (nextStep?.eventIds ?? []).map((eventId) => realityGraph.events.find((event) => event.id === eventId)?.label).filter(Boolean) as string[];",
    "    const nextNeed = nextLabels.length ? 'What changes with ' + nextLabels.join(' + ') + '?' : step.nextQuestion;",
    "    return {",
    "      order: index + 1, role: roleByOperation[step.operation] ?? 'discovery', gainKind: gainByOperation[step.operation] ?? 'discovery',",
    "      change: clean(step.viewerChange), next: clean(nextNeed), frontier: clean(nextNeed),",
    "      necessity: index === candidate.trajectory.length - 1 ? \"Land the selected movie's supplied payoff.\" : 'Connect ' + (labels.join(' + ') || 'the supplied detail') + ' to the next supplied change.',",
    "      eventIds: [...step.eventIds], evidence: labels,",
    "    };",
    "  });",
    "  const usable = beats.filter((beat) => beat.change && beat.eventIds.length);",
    "  if (usable.length < 3) return undefined;",
    "  return {",
    "    premise: clean(candidate.hypothesis?.[0] ?? (candidate.lens + ' reading of supplied reality')),",
    "    baselineFacts: [...uniq(input.facts, 16), ...candidate.evidence],",
    "    beats: usable.slice(0, 6), closing: clean(candidate.payoff), movieId: candidate.id, movieLens: candidate.lens,",
    "  };",
    "}",
    "",
  ].join("\n");
  next = insertBeforeMarker(next, "function buildViewerMomentum(subject: string, plan: BeatPlan): SequencePlay | undefined {", helper, "canonical viewer momentum boundary");
}

next = replaceOnce(next,
  'type AuthorBeat = { order: number; role: string; gainKind: string; change: string; next: string; frontier: string; necessity: string };\ntype BeatPlan = { premise: string; baselineFacts: string[]; beats: AuthorBeat[]; closing?: string };',
  'type AuthorBeat = { order: number; role: string; gainKind: string; change: string; next: string; frontier: string; necessity: string; eventIds: string[]; evidence: string[] };\ntype BeatPlan = { premise: string; baselineFacts: string[]; beats: AuthorBeat[]; closing?: string; movieId?: string; movieLens?: string };',
  "canonical beat-plan types");

next = next.replace(
  '      necessity: necessity || "This moment makes the next moment more interesting.",\n    });',
  '      necessity: necessity || "This moment makes the next moment more interesting.",\n      eventIds: Array.isArray(item.eventIds) ? item.eventIds.map(clean).filter(Boolean) : [],\n      evidence: Array.isArray(item.evidence) ? item.evidence.map(clean).filter(Boolean) : [],\n    });');

next = next.replace(
  '    closing: clean(record.closing || record.continuation),\n  };',
  '    closing: clean(record.closing || record.continuation),\n    movieId: clean(record.movieId) || undefined,\n    movieLens: clean(record.movieLens) || undefined,\n  };');

next = next.replace(
  '      sourceIds: [],\n      informationGain: beat.change,',
  '      sourceIds: beat.eventIds,\n      informationGain: beat.change,');

const beatInputMarker = '  const beatMessages = buildBeatMessages({ ...input, realityGraph }, cognition);';
if (!next.includes("const recoveredBeatPlan = recoverLatentMovieBeatPlan")) {
  next = replaceOnce(next, beatInputMarker,
    '  const recoveredBeatPlan = recoverLatentMovieBeatPlan({ ...input, realityGraph }, realityGraph);\n' +
    '  const beatMessages = buildBeatMessages({ ...input, realityGraph }, cognition);\n' +
    '  if (recoveredBeatPlan) {\n' +
    '    beatMessages[0].content += "\\n\\nCANONICAL MOVIE FLOOR (preserve its event sequence; improve wording only):\\n" + JSON.stringify(recoveredBeatPlan);\n' +
    '  }',
    "beat discovery entry point");

  next = next.replace(
    '  let beatPlan = normalizeBeatPlan(parseJson<unknown>(beatPlanResult.text));\n  let beatPlanRetries = 0;',
    '  let beatPlan = normalizeBeatPlan(parseJson<unknown>(beatPlanResult.text));\n  let beatPlanRetries = 0;\n  if (recoveredBeatPlan && (!beatPlan || beatPlan.beats.length < Math.min(3, recoveredBeatPlan.beats.length))) {\n    beatPlan = recoveredBeatPlan;\n  }');
  next = next.replace(
    '    beatPlan = normalizeBeatPlan(parseJson<unknown>(beatPlanResult.text));\n  }\n\n  if (!beatPlan) {',
    '    beatPlan = normalizeBeatPlan(parseJson<unknown>(beatPlanResult.text));\n    if (recoveredBeatPlan && (!beatPlan || beatPlan.beats.length < Math.min(3, recoveredBeatPlan.beats.length))) {\n      beatPlan = recoveredBeatPlan;\n    }\n  }\n\n  if (!beatPlan) {');
}

const mouthBeatsNeedle = '    necessity: plan.beats[index]?.necessity ?? "",\n  }));';
if (next.includes(mouthBeatsNeedle)) {
  next = next.replace(mouthBeatsNeedle,
    '    necessity: plan.beats[index]?.necessity ?? "",\n    evidence: plan.beats[index]?.evidence ?? [],\n    eventIds: plan.beats[index]?.eventIds ?? [],\n  }));');
}

const mouthPromptNeedle = '        "The line must realize the supplied beat, not summarize the whole story.",';
if (next.includes(mouthPromptNeedle) && !next.includes('Each beat includes truth-bound evidence labels')) {
  next = next.replace(mouthPromptNeedle,
    mouthPromptNeedle + '\n        "Each beat includes truth-bound evidence labels; use them as the factual boundary. Never replace supplied evidence with invented concrete details.",');
}

if (next === original) throw new Error("Migrator made no changes; refusing empty rewrite");
fs.writeFileSync(target, next, "utf8");
console.log("GREEN: latent movie → canonical beat floor wired");
console.log(`UPDATED: ${path.relative(root, target)}`);
console.log("RULE: no hardcoded domain facts; RealityGraph + latent trajectory remain the source of structure");
