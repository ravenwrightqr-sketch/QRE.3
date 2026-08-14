import type { CinematicScene, ExperienceBlueprint, ExperienceMoment, FlowStep } from "@qre/contracts";
import type { UniversalMindContext } from "./universalMindContext.js";
import { resolveMemory } from "./memoryResolver.js";
import { buildWorldModel, type WorldModel } from "./worldModel.js";
import { analyzeSignificance } from "./significanceEngine.js";
import { generateCandidates } from "./creativePolicy.js";
import { selectCritically } from "./experienceCritic.js";
import { planExperience } from "./experiencePlanner.js";

export type { UniversalMindContext } from "./universalMindContext.js";
export type { WorldModel } from "./worldModel.js";

export type UniversalMindResult = {
  title: string;
  blueprint: ExperienceBlueprint;
  plan: ReturnType<typeof planExperience>["plan"];
  flowSteps: FlowStep[];
  moments: ExperienceMoment[];
  cinematicScenes: CinematicScene[];
  estimatedDuration: number;
  momentCount: number;
  world: WorldModel;
  adaptiveQuestions: string[];
  discoveries: string[];
  learningSignals: string[];
};

const clean = (value: unknown) => typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
const sentence = (value: string) => clean(value).replace(/[.!?]+$/, "");
const unique = (values: readonly string[]) => [...new Set(values.map(sentence).filter(Boolean))];
const question = (value: string) => {
  const cleaned = clean(value);
  if (!cleaned) return "";
  return `${cleaned.replace(/[.!?]+$/, "")}?`;
};
const uniqueQuestions = (values: readonly string[]) => [...new Set(values.map(question).filter(Boolean))];

function momentType(index: number, total: number): ExperienceMoment["type"] { if (total <= 1) return "completion"; if (index === 0) return "introduction"; if (index === total - 1) return "completion"; return "story"; }
function sceneType(index: number, total: number): CinematicScene["type"] { if (index === 0) return "intro"; if (index === total - 1) return "emotion"; return "action"; }
function lensVisual(lens: WorldModel["lens"], index: number): NonNullable<CinematicScene["visual"]> {
  if (lens === "horror") return { theme: "dark", animation: index % 2 ? "glitch" : "slow_zoom" };
  if (lens === "romance") return { theme: "cinematic", animation: "slow_zoom" };
  if (lens === "wild") return { theme: "cinematic", animation: "particles" };
  if (lens === "mysterious") return { theme: "dark", animation: "parallax" };
  if (lens === "comedy") return { theme: "cinematic", animation: "parallax" };
  return { theme: "cinematic", animation: index === 0 ? "slow_zoom" : "parallax" };
}
function buildMoment(planned: ReturnType<typeof planExperience>["moments"][number], index: number, total: number, world: WorldModel): ExperienceMoment {
  const type = momentType(index, total);
  return { type, component: "story", title: index === 0 ? `${world.participants.length > 1 ? world.participants.join(" + ") : world.participants[0] ?? world.entities[0] ?? "Experience"}${world.places[0] ? ` at ${world.places[0]}` : ""}` : undefined, subtitle: index === 0 && world.participants.length > 1 ? world.participants.join(" and ") : undefined, text: `${sentence(planned.text)}.`, description: `${sentence(planned.text)}.`, editable: true, demo: false, order: index, payload: { source: "universal-mind", realityEventId: planned.event.id, participants: planned.event.participants, evidence: planned.evidence, place: planned.event.place, time: planned.event.time, details: planned.event.details, beatKind: planned.kind, lens: world.lens }, meta: { source: "universal-mind", realityEventId: planned.event.id, lens: world.lens, place: planned.event.place, time: planned.event.time, duration: index === total - 1 ? 5200 : 3600 } };
}
function buildScenes(moments: ExperienceMoment[], world: WorldModel): CinematicScene[] { return moments.map((moment, index) => ({ id: `mind-scene-${index + 1}`, type: sceneType(index, moments.length), duration: Number(moment.meta?.duration ?? 3600), moment, order: index, transition: index === 0 ? "none" : world.lens === "horror" ? (index % 2 ? "fade" : "flash") : world.lens === "romance" ? "cinematic" : world.lens === "wild" ? "zoom" : "fade", visual: lensVisual(world.lens, index), preload: index < moments.length - 1 })); }
function buildFlow(moments: ExperienceMoment[]): FlowStep[] { return moments.map((moment, index) => ({ id: `mind-step-${index + 1}`, order: index, type: index === 0 ? "introduction" : index === moments.length - 1 ? "completion" : "story", payload: moment.payload })); }
function mergeMemoryContext(prompt: string, context: UniversalMindContext) {
  const resolved = resolveMemory(prompt, context);
  return { resolved, eventParticipants: unique([...(context.event?.participants ?? []), ...resolved.participants]), resolvedPlace: resolved.place };
}

function preserveMemoryPlaces(world: WorldModel, places: readonly string[]) {
  const rememberedPlaces = unique(places);
  if (!rememberedPlaces.length) return world;
  world.places = unique([...world.places, ...rememberedPlaces]);
  world.entities = unique([...world.entities, ...rememberedPlaces]);
  world.entitiesByKind = {
    ...world.entitiesByKind,
    places: unique([...world.entitiesByKind.places, ...rememberedPlaces]),
  };
  for (const place of rememberedPlaces) {
    if (!world.evidence.some((item) => item.kind === "place" && item.detail.toLowerCase() === place.toLowerCase())) {
      world.evidence.push({ id: `memory-place-${place.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`, detail: place, kind: "place", salience: 1, source: "memory", confidence: 1 });
    }
  }
  return world;
}

export function compileCognitiveExperience(prompt: string, context: UniversalMindContext = {}): UniversalMindResult {
  const memory = mergeMemoryContext(prompt, context);
  const world = preserveMemoryPlaces(buildWorldModel(prompt, { memoryMatches: memory.resolved.matches, memorySources: memory.resolved.matches.map(() => "memory"), creativePreferences: context.creativePreferences, eventParticipants: memory.eventParticipants, locationLabel: memory.resolvedPlace ?? context.location?.label, eventVenue: context.event?.venue }), memory.resolved.places);
  const significance = analyzeSignificance(world);
  const candidates = generateCandidates(world, significance, context.creativePreferences ?? [], context.feedback?.accepted ?? [], context.feedback?.rejected ?? []);
  const selected = selectCritically(world, candidates);
  const planned = planExperience(world, significance, selected);
  const moments = planned.moments.map((item, index) => buildMoment(item, index, planned.moments.length, world));
  const cinematicScenes = buildScenes(moments, world); const flowSteps = buildFlow(moments); const entities = world.entitiesByKind;
  const blueprint: ExperienceBlueprint = { title: planned.type === "story" && world.places[0] ? `${world.participants.length > 1 ? world.participants.join(" + ") : world.participants[0] ?? "Experience"} at ${world.places[0]}` : world.participants.length > 1 ? world.participants.join(" + ") : world.participants[0] ?? world.entities[0] ?? "This Experience", type: planned.type, tone: planned.tone, meaning: planned.meaning, moments, entities, cognitivePlan: planned.plan, metadata: { archetypes: [planned.type, world.lens, "universal_entity_experience"], themes: unique([...world.participants, ...world.places, ...world.times, ...significance.patterns]).slice(0, 30), dna: ["reality-first", "evidence-conserving", "memory-aware", "participant-preserving", "adaptive", "dynamic-moment-count", "critic-gated"] } };
  const feedbackSignals = unique([...(context.feedback?.accepted ?? []).map((value) => `accepted:${value}`), ...(context.feedback?.rejected ?? []).map((value) => `rejected:${value}`), ...(context.creativePreferences ?? []).map((value) => `preference:${value}`)]);
  return { title: blueprint.title, blueprint, plan: planned.plan, flowSteps, moments, cinematicScenes, estimatedDuration: moments.reduce((sum, moment) => sum + Number(moment.meta?.duration ?? 3600), 0), momentCount: moments.length, world, adaptiveQuestions: uniqueQuestions(memory.resolved.questions), discoveries: unique([...memory.resolved.matches.map((match) => `This experience connects to ${match}.`), ...significance.patterns, ...significance.continuations, ...(world.participants.length > 1 ? [`Shared experience between ${world.participants.join(" and ")}.`] : [])]), learningSignals: feedbackSignals };
}
export function messageText(moment: ExperienceMoment): string { return moment.text ?? moment.description ?? moment.title ?? (typeof moment.meta?.text === "string" ? moment.meta.text : ""); }
