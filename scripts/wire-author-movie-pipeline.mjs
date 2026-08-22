import fs from "node:fs";

const path = "apps/api/src/services/experienceService.ts";
let source = fs.readFileSync(path, "utf8");

if (!source.includes('import { authorBrainUniversal } from "./authorBrainUniversal.js";')) {
  throw new Error("authorBrainUniversal import anchor not found");
}

source = source.replace(
  'import { authorBrainUniversal } from "./authorBrainUniversal.js";\n',
  'import { authorMoviePipeline } from "./authorMoviePipeline.js";\n',
);

const helperStart = source.indexOf("function sceneKindToBeatKind(");
const helperEnd = source.indexOf("export async function compileExperience(");
if (helperStart < 0 || helperEnd < 0 || helperEnd <= helperStart) {
  throw new Error("Could not locate legacy author beat helpers");
}

const replacementHelpers = `function planBeatKindToExperienceBeatKind(kind: "text" | "photo" | "cta"): ExperienceBeat["kind"] {
  if (kind === "photo") return "photo";
  if (kind === "cta") return "afterglow";
  return "jolt";
}

function applyMovieBeatPlan(compiled: any, plan: { beats: Array<any> }, diagnostics?: Record<string, unknown>): any {
  if (!plan.beats.length) return compiled;
  const templateScenes = Array.isArray(compiled.cinematicScenes) ? compiled.cinematicScenes : [];
  const templateMoments = Array.isArray(compiled.moments) ? compiled.moments : [];
  const baseScene = templateScenes[0] ?? {
    id: "author-scene-1",
    type: "action",
    duration: 1200,
    transition: "fade",
    visual: { theme: "cinematic", animation: "parallax" },
    meta: {},
  };

  const beats: ExperienceBeat[] = plan.beats.map((planned, index) => ({
    id: planned.id,
    text: planned.kind === "photo" ? "" : String(planned.text ?? ""),
    kind: planBeatKindToExperienceBeatKind(planned.kind),
    order: index + 1,
    attentionRole: planned.attentionRole ?? planned.kind,
    callback: planned.kind === "cta",
    durationHintMs: planned.durationHintMs ?? (planned.kind === "photo" ? 1700 : 1400),
    media: planned.media,
    meta: {
      authoredBy: "qre-author-brain",
      planner: "movie-beat-plan",
      plannerKind: planned.kind,
      sourceIds: planned.sourceIds ?? [],
      reason: planned.reason,
      silent: planned.silent ?? planned.kind === "photo",
      ...(diagnostics ?? {}),
    },
  }));

  const cinematicScenes = beats.map((beat, index) => {
    const template = templateScenes[index] ?? baseScene;
    const baseMoment = templateMoments[index] ?? template.moment ?? { type: "message", order: index, meta: {} };
    const duration = beat.durationHintMs ?? 1200;
    const isPhoto = beat.kind === "photo" && beat.media;
    return {
      ...template,
      id: `author-scene-${index + 1}`,
      order: index,
      duration,
      type: isPhoto ? "action" : index === 0 ? "intro" : index === beats.length - 1 ? "emotion" : "action",
      transition: index === 0 ? "none" : index === beats.length - 1 ? "cinematic" : "fade",
      moment: {
        ...baseMoment,
        type: isPhoto ? "media" : "message",
        order: index,
        text: isPhoto ? "" : beat.text,
        title: undefined,
        description: undefined,
        media: isPhoto ? beat.media : undefined,
        meta: {
          ...(baseMoment.meta ?? {}),
          authoredBy: "qre-author-brain",
          planner: "movie-beat-plan",
          beatId: beat.id,
          beatKind: beat.meta?.plannerKind ?? beat.kind,
          attentionRole: beat.attentionRole ?? null,
          sceneRule: isPhoto ? "silent_photo_beat" : "one_short_thought_per_beat",
          sourceIds: beat.meta?.sourceIds ?? [],
          reason: beat.meta?.reason ?? null,
        },
      },
      meta: {
        ...(template.meta ?? {}),
        authoredBy: "qre-author-brain",
        planner: "movie-beat-plan",
        beatId: beat.id,
        beatKind: beat.meta?.plannerKind ?? beat.kind,
        sceneRule: isPhoto ? "silent_photo_beat" : "one_short_thought_per_beat",
      },
    };
  });

  return {
    ...compiled,
    beats,
    moments: cinematicScenes.map((scene) => scene.moment),
    cinematicScenes,
    momentCount: cinematicScenes.length,
    estimatedDuration: cinematicScenes.reduce((sum, scene) => sum + Number(scene.duration || 1200), 0),
  };
}

`;
source = source.slice(0, helperStart) + replacementHelpers + source.slice(helperEnd);

const oldBlock = /  try \{\n    const authored = await authorBrainUniversal\(authorInput\);[\s\S]*?  \} catch \(error\) \{\n    console\.warn\("\[QRE\]\[AUTHORING\] Author Brain unavailable; preserving deterministic compiled experience\.", error\);\n    warnings\.push\("author_brain_unavailable"\);\n  \}/;

if (!oldBlock.test(source)) throw new Error("Legacy author timeline block not found");

const newBlock = `  try {
    const { authored, movieBeatPlan } = await authorMoviePipeline(authorInput);
    const qualityStatus = String(
      authored.diagnostics?.qualityStatus ??
        (authored.scenes.length ? "ACCEPTED" : "REJECTED_MODEL_OUTPUT"),
    );

    if (movieBeatPlan.beats.length > 0 && qualityStatus === "ACCEPTED") {
      compiled = applyMovieBeatPlan(compiled, movieBeatPlan, {
        qualityStatus,
        model: authored.diagnostics?.model ?? null,
        selectedScore: authored.diagnostics?.selectedScore ?? null,
        identityStateConfidence: identityState?.confidence ?? null,
        identityKind: identityState?.kind ?? null,
        identityContext: identityState?.activeContext ?? null,
      });
    } else {
      warnings.push("author_quality_rejected");
    }
  } catch (error) {
    console.warn("[QRE][AUTHORING] Author Movie Pipeline unavailable; preserving deterministic compiled experience.", error);
    warnings.push("author_movie_pipeline_unavailable");
  }`;
source = source.replace(oldBlock, newBlock);

fs.writeFileSync(path, source);
console.log(`Patched ${path}: authorMoviePipeline now owns timeline construction.`);
