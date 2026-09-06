/*
 * QRE CANONICAL CREATIVE REALIZER
 *
 * Cognition discovers a grounded relationship or grounded form. Meaning Pressure
 * explains why that material has artistic charge. The Mouth discovers how to embody it.
 * Reality owns concrete truth. The artist owns form and visible language.
 * QRE binds provenance after creation and independently observes the artifact.
 *
 * The rendered product is moving screen text. Each cut is one attention beat.
 * Length is artistic, not mechanical: short is usually stronger, but a longer beat
 * is valid when every added word increases the heat. Screenplay directions are not
 * part of the medium and are rejected at the realization boundary.
 */
import type { AuthorDomainContext, AuthorScene, LatentMovieCandidate, RealityGraph } from "@qre/contracts";
import { localModelGenerate } from "./localModelRuntime.js";
import { deriveMeaningPressure } from "./authorMeaningPressure.js";
import { judgeRealizedFilm, type RealizedFilmJudgment } from "./authorRealizedFilmJudge.js";

export type RealizedScene = AuthorScene & { sourceEventIds: string[]; score: number };
export type AuthorRealizationResult = {
  scenes: RealizedScene[]; score: number; model: string; modelCalls: number; rejectedSets: number;
  judgment?: RealizedFilmJudgment; reason?: string;
};

type RawScene = { text?: unknown; kind?: unknown; sourceEventIds?: unknown };
type RawSet = { scenes?: unknown };
type ValidationResult = { scenes?: RealizedScene[]; reason?: string };
type ArtistDevice = { relationKind: string; mechanism: string; sourceEventIds: string[]; operation: string; transformationModes: string[]; languageAim: string };

const INTERNAL = /\b(?:cognition|planner|planning|candidate|trajectory|viewer|audience|curiosity|prediction error|state shift|sequence|author|mouth|canonical|supplied evidence|evidenceEventIds|payoff dependency|memory projection|future thread|latent movie|creative opportunity|semantic turn|semanticRealization)\b/i;
const EXPLANATION = /\b(?:this means|which means|this shows|which shows|the point is|the meaning is|in other words|reveals that|the viewer|the audience|the narrative|the experience was|the significance|let the supplied detail|the relationship between|changes what is worth noticing)\b/i;
const GENERIC = /^(?:something happened|something changed|everything changed|a moment|the moment|a feeling|the feeling|it was meaningful|it was special|it was important|the transformation was|the situation was|the experience was|the result was|worth noticing)\.?$/i;
const SCREENPLAY = /^(?:close(?:\s+in)?(?:\s+on)?|quick\s+cut|cut\s+to|sound\s*:|camera\s*:|wide\s+shot|medium\s+shot|tight\s+shot|fade(?:\s+(?:in|out|to))?|angle(?:\s+on)?|montage|dissolve(?:\s+to)?|smash\s+cut)\b/i;
const SCREENPLAY_INLINE = /\b(?:camera|close-up|wide shot|medium shot|tight shot|sound design|sound effect|sfx|voice-over|voiceover)\s*:/i;
const UNSUPPORTED_PHYSICAL = /\b(?:tail twitch(?:es|ing)?|head tilt(?:s|ting)?|shrugs?|smiles?|grins?|laughs?|cries?|whines?|sighs?|gasps?|stares?|blinks?|walks?|runs?|jumps?|turns?|waves?|nods?|halfway out the door|shadow briefly obscures)\b/i;
const WORDS = /\b\w+[’'-]*\w*\b/g;
const ALLOWED_KINDS = new Set(["line", "hook", "movement", "discovery", "turn", "payoff", "afterglow"]);
const MAX_CUTS = 24;
const MAX_BEAT_CHARS = 140;

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();
const unique = (values: readonly string[]): string[] => [...new Set(values.map(clean).filter(Boolean))];
const words = (text: string): string[] => clean(text).match(WORDS) ?? [];

function relationForMovie(graph: RealityGraph, movie: LatentMovieCandidate): { relationKind: string; sourceEventIds: string[] } {
  const preferred = new Set(movie.supportingRelationKinds.map(clean).filter(Boolean));
  for (const step of movie.trajectory) {
    const ids = unique(step.eventIds);
    if (ids.length < 2) continue;
    const relation = graph.relations.find((candidate) => ids.includes(candidate.from) && ids.includes(candidate.to) && (!preferred.size || preferred.has(candidate.kind)));
    if (relation) return { relationKind: relation.kind, sourceEventIds: [relation.from, relation.to] };
  }
  for (const relation of graph.relations) {
    if (preferred.size && !preferred.has(relation.kind)) continue;
    if (movie.anchorEventIds.includes(relation.from) || movie.anchorEventIds.includes(relation.to)) return { relationKind: relation.kind, sourceEventIds: [relation.from, relation.to] };
  }
  return { relationKind: "observation", sourceEventIds: movie.anchorEventIds.slice(0, 2) };
}
function mechanismFor(relationKind: string): { mechanism: string; operation: string; modes: string[]; languageAim: string } {
  switch (relationKind) {
    case "recontextualizes": return { mechanism: "expectation_shift", operation: "reframe", modes: ["compression", "juxtaposition", "omission", "grammatical_shift", "callback"], languageAim: "make the later fact alter the charge of the earlier one" };
    case "contrasts": return { mechanism: "contrast", operation: "contrast", modes: ["juxtaposition", "asymmetry", "fragmentation", "reversal", "silence"], languageAim: "make the difference itself carry the energy" };
    case "changes":
    case "state_change": return { mechanism: "state_shift", operation: "escalate", modes: ["before_after_compression", "status_flip", "repetition_with_mutation", "inversion"], languageAim: "make the changed state feel different without inventing the transition" };
    case "repeats": return { mechanism: "recurrence", operation: "recur", modes: ["repetition_with_mutation", "callback", "rhythmic_return", "omission"], languageAim: "return to a real detail with a changed charge" };
    case "causes": return { mechanism: "consequence", operation: "consequence", modes: ["compression", "aftermath", "causal_cut", "status_flip"], languageAim: "let the consequence land rather than explain the cause" };
    case "converges": return { mechanism: "convergence", operation: "converge", modes: ["accumulation", "collision", "fragmentation", "compression"], languageAim: "make separate supplied details arrive at one felt point" };
    case "before":
    case "after": return { mechanism: "continuation", operation: "continue", modes: ["ellipsis", "open_end", "callback", "compression"], languageAim: "leave the world moving rather than summarizing it" };
    default: return { mechanism: "observation", operation: "observe", modes: ["compression", "fragmentation", "nominalization", "silence", "unexpected_selection"], languageAim: "make one supplied detail newly charged without inventing plot" };
  }
}
function buildArtistDevice(graph: RealityGraph, movie: LatentMovieCandidate): ArtistDevice {
  const relation = relationForMovie(graph, movie);
  const mechanism = mechanismFor(relation.relationKind);
  return { relationKind: relation.relationKind, mechanism: mechanism.mechanism, sourceEventIds: relation.sourceEventIds, operation: mechanism.operation, transformationModes: mechanism.modes, languageAim: mechanism.languageAim };
}
function eventText(event: RealityGraph["events"][number]): string { return [event.label, ...event.entities, event.place, event.time].filter(Boolean).join(" "); }
function parseJson(text: string): Record<string, unknown> | undefined {
  const cleaned = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  try { const parsed = JSON.parse(cleaned); return parsed && typeof parsed === "object" ? parsed as Record<string, unknown> : undefined; }
  catch { const start = cleaned.indexOf("{"); const end = cleaned.lastIndexOf("}"); if (start < 0 || end <= start) return undefined; try { const parsed = JSON.parse(cleaned.slice(start, end + 1)); return parsed && typeof parsed === "object" ? parsed as Record<string, unknown> : undefined; } catch { return undefined; } }
}
function bindProvenance(rawIds: unknown, index: number, movie: LatentMovieCandidate, graph: RealityGraph): string[] {
  const valid = new Set(graph.events.map((event) => event.id));
  const supplied = Array.isArray(rawIds) ? unique(rawIds.filter((id): id is string => typeof id === "string")).filter((id) => valid.has(id)) : [];
  if (supplied.length) return supplied;
  const trajectoryIds = unique(movie.trajectory.flatMap((step) => step.eventIds)).filter((id) => valid.has(id));
  if (trajectoryIds.length) return [trajectoryIds[Math.min(index, trajectoryIds.length - 1)]!];
  const device = buildArtistDevice(graph, movie);
  if (device.sourceEventIds.length) return device.sourceEventIds;
  const anchors = unique(movie.anchorEventIds.filter((id) => valid.has(id)));
  return anchors.slice(0, 1);
}
function validateSet(raw: unknown, input: { graph: RealityGraph; movie: LatentMovieCandidate }): ValidationResult {
  if (!raw || typeof raw !== "object") return { reason: "set is not an object" };
  const row = raw as RawSet; if (!Array.isArray(row.scenes)) return { reason: "set.scenes is missing" };
  if (row.scenes.length < 2) return { reason: "film needs at least 2 cuts" }; if (row.scenes.length > MAX_CUTS) return { reason: `film exceeds ${MAX_CUTS} cuts` };
  const scenes: RealizedScene[] = [];
  for (const [index, item] of row.scenes.entries()) {
    if (!item || typeof item !== "object") return { reason: `cut ${index + 1} is not an object` };
    const scene = item as RawScene; const text = clean(scene.text);
    if (!text) return { reason: `cut ${index + 1} is empty` };
    if (text.length > MAX_BEAT_CHARS) return { reason: `cut ${index + 1} exceeds ${MAX_BEAT_CHARS} characters` };
    if (INTERNAL.test(text)) return { reason: `cut ${index + 1} leaks internal architecture` };
    if (EXPLANATION.test(text)) return { reason: `cut ${index + 1} explains instead of dramatizing` };
    if (GENERIC.test(text)) return { reason: `cut ${index + 1} is generic` };
    if (SCREENPLAY.test(text) || SCREENPLAY_INLINE.test(text)) return { reason: `cut ${index + 1} contains screenplay direction` };
    if (UNSUPPORTED_PHYSICAL.test(text)) return { reason: `cut ${index + 1} invents unsupported physical behavior` };
    scenes.push({ text, kind: ALLOWED_KINDS.has(clean(scene.kind)) ? clean(scene.kind) as AuthorScene["kind"] : index === 0 ? "hook" : index === row.scenes.length - 1 ? "payoff" : "line", sourceEventIds: bindProvenance(scene.sourceEventIds, index, input.movie, input.graph), score: 0 });
  }
  return { scenes };
}
function context(input: { prompt: string; subject: string; lens: string; graph: RealityGraph; movie: LatentMovieCandidate; domainContext?: AuthorDomainContext; memoryContext?: string[]; priorScenes?: string[]; creativeLearningContext?: string[] }, repairFeedback: string) {
  const spineIds = unique([...input.movie.anchorEventIds, ...input.movie.trajectory.flatMap((step) => step.eventIds)].filter((id) => input.graph.events.some((event) => event.id === id)));
  const spineEvents = spineIds.map((id) => input.graph.events.find((event) => event.id === id)).filter(Boolean).map((event) => ({ id: event!.id, text: eventText(event!), entities: event!.entities, place: event!.place, time: event!.time }));
  const availableReality = input.graph.events.map((event) => ({ id: event.id, text: eventText(event), entities: event.entities, place: event.place, time: event.time, onSelectedMovieSpine: spineIds.includes(event.id) }));
  const artistDevice = buildArtistDevice(input.graph, input.movie);
  const meaningPressure = deriveMeaningPressure({ graph: input.graph, movie: input.movie });
  return {
    creativeTask: clean(input.prompt), subjectReference: clean(input.subject), subjectRole: "factual referent only; use its name when artistically useful, omit it when the detail can carry the cut alone", frame: clean(input.lens) || "NONE",
    memory: (input.memoryContext ?? []).slice(0, 20), priorFilms: (input.priorScenes ?? []).slice(-12), creativeLearning: (input.creativeLearningContext ?? []).slice(0, 20),
    selectedStructure: { eventIds: spineIds, relationKinds: input.movie.supportingRelationKinds, operations: input.movie.trajectory.map((step) => ({ order: step.order, operation: step.operation, eventIds: step.eventIds })) },
    sourceReality: spineEvents, availableReality, artistDevice, meaningPressure, repairFeedback: clean(repairFeedback),
    creativePermission: "Interpretive language is wide open. Abstract feeling, irony, metaphor, personification, status, humor, absurdity, tenderness, menace, gamification, playful language, pop-cultural framing, impossible-seeming comparisons that are clearly metaphorical, compression, omission, fragments, sensory intensity and unexpected grammar are all available. The boundary is concrete reality, not imagination itself.",
    artistRule: "Preserve semantic truth, never the client's sentence. The selected Movie is the semantic spine, NOT an inventory lock. The entire availableReality list is fair game. Pull in ANY supplied detail when it makes the piece funnier, stranger, clearer, more moving, more kinetic, more visceral or more memorable. A minor factual detail can become the hook, a callback, a punchline, a metaphorical image, a pressure point or the payoff. Every literal world detail must remain faithful to the supplied world. Figurative language may freely bend concrete imagery without asserting that the figurative imagery literally happened.",
    sensoryRule: "When supplied reality contains sound, music, bass, silence, darkness, light, heat, cold, movement, texture, taste, smell or impact, treat that sensory material as primary creative substance. Do not flatten it into explanation. You may make the supplied sensation feel enormous through rhythm, compression, repetition, sound-language, image-language, or figurative bodily language, provided figurative intensity is not presented as an unsupported literal fact.",
    creativeTasteRule: "Creative learning and ARTIST DNA are preference signals, never source facts. Favor alive, kinetic, embodied, irreverent and surprising expression when the world supports it, but do not force one style onto every world.",
  };
}
function prompt(attempt: number, feedback: string): string {
  const attacks = ["Find the latent charge first. Then embody it. Do not announce the charge.", "Destroy the source wording and rebuild the film from the meaning pressure and the whole reality palette. Be bold, economical, playful, and materially different.", "Go for the line or structure the human will remember tomorrow. Do not choose the safest phrase. Take a creative risk while keeping the supplied world exact."];
  return [
    "You are QRE's ONE CREATIVE REALIZER.",
    "You are creating moving screen text, not a screenplay, article, treatment, caption, or shot list.",
    "The source facts are sacred. The source sentences are disposable.",
    "The selected Movie is the semantic spine. The entire supplied RealityGraph is your artistic palette.",
    "The Movie does NOT limit the material you may use. Hunt the whole reality for the weird little detail that makes the film click. Throw the apple into the film if the apple makes it better.",
    "Meaning Pressure explains why the selected relationship or grounded structure has artistic charge. Artist Device suggests possible tools. Neither is a cage.",
    "The final output is a sequence of screen text beats. ONE BEAT = ONE SCREENFUL OF ATTENTION.",
    "Do not interpret 'one beat' as one fact or one sentence. Several facts may share one beat when their collision, compression, contrast, timing, or juxtaposition creates the fire. Split them when the separation creates the fire. The Artist chooses where the screen changes.",
    "A beat can be one word, a fragment, a sentence, or several compressed clauses. Short is usually powerful. Longer is allowed when every extra word creates real artistic force. NEVER pad. NEVER shorten a line merely because of a number.",
    "Think: WOULD THIS DESERVE ITS OWN SCREEN? WOULD COMBINING THESE WORDS MAKE THE HIT STRONGER? Every word must earn its screen.",
    "The viewer sees ONLY the text. Do not describe how the film is being filmed.",
    "NEVER write screenplay directions such as CLOSE ON, QUICK CUT, CUT TO, SOUND:, CAMERA:, WIDE SHOT, MEDIUM SHOT, FADE, ANGLE, MONTAGE, DISSOLVE, or SHOT OF.",
    "Do not write camera directions, production notes, shot descriptions, sound-design instructions, SFX labels, voice-over labels, or director commentary.",
    "Do not explain what the viewer feels. Do not explain the metaphor. Do not explain why a beat works. Make the viewer feel it.",
    "Do not invent literal physical behavior, dialogue, bodily reactions, gestures, sounds, people, objects, locations, or events that the supplied reality does not support. Figurative language is welcome; fabricated literal facts are not.",
    "Search for the strongest sensory carrier and strongest active mechanic before settling for abstract commentary. Sound can drive a film. Silence can drive a film. Bass return can drive a film. Repeated work can drive a film. A house can feel like an opponent. A room can feel like an arena. An object can feel like a character. These are artistic devices, not claims that the metaphor literally happened.",
    "Do not force every fact into the film. Do not force a fixed beat count. Two brutal beats can beat ten dead beats. Rich reality may deserve more beats, but richness must come from new strong moments, not longer sentences.",
    "Do not force every beat to have the same grammar, rhythm, or length. Let rhythm change when the film needs it. Repetition is allowed when repetition itself creates meaning.",
    "Metaphor is encouraged. 'Forbidden fruit' can transform a stolen apple. 'Boss battle' can transform exhausting cleaning. 'No survivors' can be a comic metaphor for a finished task. Use such language only when the supplied reality earns it.",
    "You may be funny, strange, lyrical, stark, dark, tender, absurd, camp, dramatic, playful, deadpan, surreal, irreverent or understated. Artistic personality is a feature.",
    "CREATE SOMETHING WORTH WATCHING. The goal is entertainment media made from reality, not sanitized summaries.",
    "A transformed fact-bearing phrase is good. Exact source-sentence replay is not. A compressed collision of true facts can be excellent.",
    "Generate four genuinely different candidate films. Change the idea, rhythm, ordering, compression, point of view, joke, metaphor, callback or structure—not merely adjectives. Candidates are exploration, not compliance variants. Candidate four should be the piece you would actually ship if it remains truthful.",
    "Candidates may have any useful number of beats from 2 through 24. Do not pad, truncate, or standardize them.",
    "JSON ONLY: {sets:[{scenes:[{text,kind}]}]}. No commentary. No source IDs. Each text value is the exact text shown on one moving screen beat.",
    `This is creative attack ${attempt + 1} of 3.`,
    feedback ? `Previous attempts did not land because: ${feedback}. Do NOT become safer. Become more inventive and more specific.` : "No prior failure. Explore the full artistic space.",
    attacks[Math.min(attempt, attacks.length - 1)],
  ].join("\n");
}

export async function realizeAuthorExperience(input: { prompt: string; subject: string; lens: string; graph: RealityGraph; movie: LatentMovieCandidate; domainContext?: AuthorDomainContext; memoryContext?: string[]; priorScenes?: string[]; creativeLearningContext?: string[] }): Promise<AuthorRealizationResult> {
  let model = "fallback"; let modelCalls = 0; let rejectedSets = 0; let lastJudgment: RealizedFilmJudgment | undefined; const rejectedReasons: string[] = [];
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const feedback = rejectedReasons.slice(-4).join(" | ");
    const ctx = context(input, feedback);
    try {
      const result = await localModelGenerate([{ role: "system", content: prompt(attempt, feedback) }, { role: "user", content: JSON.stringify(ctx) }], "json", { numPredict: 4200, temperature: [1.0, 1.12, 1.04][attempt]! });
      model = result.model; modelCalls += 1;
      const parsed = parseJson(result.text); const rawSets = Array.isArray(parsed?.sets) ? parsed.sets : parsed ? [parsed] : [];
      const validSets: Array<{ scenes: RealizedScene[]; judgment: RealizedFilmJudgment }> = [];
      for (const raw of rawSets) {
        const validation = validateSet(raw, input);
        if (!validation.scenes) { rejectedSets += 1; if (validation.reason) rejectedReasons.push(validation.reason); continue; }
        const judgment = judgeRealizedFilm({ scenes: validation.scenes, movie: input.movie, graph: input.graph }); lastJudgment = judgment;
        // Artifact judgment is diagnostic. It never selects the artwork.
        validSets.push({ scenes: validation.scenes, judgment });
      }
      if (validSets.length) {
        const winner = validSets[validSets.length - 1]!;
        return { scenes: winner.scenes, score: winner.judgment.score, model, modelCalls, rejectedSets, judgment: winner.judgment, reason: rejectedReasons.length ? rejectedReasons.join(" | ") : undefined };
      }
    } catch (error) {
      rejectedSets += 1; rejectedReasons.push(error instanceof Error ? error.message : "creative realizer call failed");
    }
  }
  return { scenes: [], score: 0, model, modelCalls, rejectedSets, judgment: lastJudgment, reason: rejectedReasons.join(" | ") || "no realized film survived validation" };
}
