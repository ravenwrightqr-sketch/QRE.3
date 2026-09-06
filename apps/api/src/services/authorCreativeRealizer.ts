/*
 * QRE CANONICAL CREATIVE REALIZER
 *
 * Cognition discovers a grounded relationship. Meaning Pressure explains why
 * that relationship has artistic charge. The Mouth discovers how to embody it.
 * Reality owns concrete truth. The artist owns form and visible language.
 * QRE binds provenance after creation and independently judges the film.
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
type ArtistDevice = {
  relationKind: string;
  mechanism: string;
  sourceEventIds: string[];
  operation: string;
  transformationModes: string[];
  languageAim: string;
};

const INTERNAL = /\b(?:cognition|planner|planning|candidate|trajectory|viewer|audience|curiosity|prediction error|state shift|sequence|author|mouth|canonical|supplied evidence|evidenceEventIds|payoff dependency|memory projection|future thread|latent movie|creative opportunity|semantic turn|semanticRealization)\b/i;
const EXPLANATION = /\b(?:this means|which means|this shows|which shows|the point is|the meaning is|in other words|reveals that|the viewer|the audience|the narrative|the experience was|the significance|let the supplied detail|the relationship between|changes what is worth noticing)\b/i;
const GENERIC = /^(?:something happened|something changed|everything changed|a moment|the moment|a feeling|the feeling|it was meaningful|it was special|it was important|the transformation was|the situation was|the experience was|the result was|worth noticing)\.?$/i;
const WORDS = /\b\w+[’'-]*\w*\b/g;
const ALLOWED_KINDS = new Set(["line", "hook", "movement", "discovery", "turn", "payoff", "afterglow"]);

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();
const unique = (values: readonly string[]): string[] => [...new Set(values.map(clean).filter(Boolean))];
const words = (text: string): string[] => clean(text).match(WORDS) ?? [];
const tokens = (text: string): Set<string> => new Set(words(text).map((word) => word.toLowerCase()).filter((word) => word.length > 2));

function subjectNames(subject: string): string[] {
  return clean(subject).split(/\s*(?:\+|&|,|\/|\band\b)\s*/i).map(clean).filter(Boolean).sort((a, b) => b.length - a.length);
}
function leadingSubject(text: string, subject: string): boolean {
  const names = subjectNames(subject); if (!names.length) return false;
  return names.some((name) => new RegExp(`^(?:the|a|an)?\\s*${name.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}(?:\\b|:)`, "i").test(clean(text)));
}
function subjectLedRatio(scenes: readonly RealizedScene[], subject: string): number {
  return scenes.length ? scenes.filter((scene) => leadingSubject(scene.text, subject)).length / scenes.length : 1;
}
function relationExists(graph: RealityGraph, ids: readonly string[]): boolean {
  const set = new Set(ids);
  return graph.relations.some((relation) => set.has(relation.from) && set.has(relation.to));
}
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
  return {
    relationKind: relation.relationKind,
    mechanism: mechanism.mechanism,
    sourceEventIds: relation.sourceEventIds,
    operation: mechanism.operation,
    transformationModes: mechanism.modes,
    languageAim: mechanism.languageAim,
  };
}
function eventText(event: RealityGraph["events"][number]): string {
  return [event.label, ...event.entities, event.place, event.time].filter(Boolean).join(" ");
}
function parseJson(text: string): Record<string, unknown> | undefined {
  const cleaned = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  try { const parsed = JSON.parse(cleaned); return parsed && typeof parsed === "object" ? parsed as Record<string, unknown> : undefined; }
  catch { const start = cleaned.indexOf("{"); const end = cleaned.lastIndexOf("}"); if (start < 0 || end <= start) return undefined; try { const parsed = JSON.parse(cleaned.slice(start, end + 1)); return parsed && typeof parsed === "object" ? parsed as Record<string, unknown> : undefined; } catch { return undefined; } }
}
function bindProvenance(rawIds: unknown, index: number, total: number, movie: LatentMovieCandidate, graph: RealityGraph): string[] {
  const valid = new Set(graph.events.map((event) => event.id));
  const supplied = Array.isArray(rawIds) ? unique(rawIds.filter((id): id is string => typeof id === "string")).filter((id) => valid.has(id)) : [];
  if (supplied.length) return supplied;
  const device = buildArtistDevice(graph, movie);
  if (index > 0 && device.sourceEventIds.length >= 2) return device.sourceEventIds;
  const anchors = unique([...movie.anchorEventIds, ...movie.trajectory.flatMap((step) => step.eventIds)].filter((id) => valid.has(id)));
  return anchors.slice(0, 1);
}
function validateSet(raw: unknown, input: { graph: RealityGraph; subject: string; movie: LatentMovieCandidate }): ValidationResult {
  if (!raw || typeof raw !== "object") return { reason: "set is not an object" };
  const row = raw as RawSet; if (!Array.isArray(row.scenes)) return { reason: "set.scenes is missing" };
  if (row.scenes.length < 2) return { reason: "film needs at least 2 cuts" }; if (row.scenes.length > 10) return { reason: "film exceeds 10 cuts" };
  const scenes: RealizedScene[] = [];
  for (const [index, item] of row.scenes.entries()) {
    if (!item || typeof item !== "object") return { reason: `cut ${index + 1} is not an object` };
    const scene = item as RawScene; const text = clean(scene.text);
    if (!text) return { reason: `cut ${index + 1} is empty` }; if (text.length > 180) return { reason: `cut ${index + 1} exceeds 180 characters` };
    if (INTERNAL.test(text)) return { reason: `cut ${index + 1} leaks internal architecture` };
    if (EXPLANATION.test(text)) return { reason: `cut ${index + 1} explains instead of dramatizing` };
    if (GENERIC.test(text)) return { reason: `cut ${index + 1} is generic` };
    const sourceEventIds = bindProvenance(scene.sourceEventIds, index, row.scenes.length, input.movie, input.graph);
    if (input.graph.events.length && !sourceEventIds.length) return { reason: `cut ${index + 1} lost provenance` };
    const kind = ALLOWED_KINDS.has(clean(scene.kind)) ? clean(scene.kind) as AuthorScene["kind"] : index === 0 ? "hook" : index === row.scenes.length - 1 ? "payoff" : "line";
    scenes.push({ text, kind, sourceEventIds, score: 0 });
  }
  const used = new Set(scenes.flatMap((scene) => scene.sourceEventIds));
  if (input.graph.events.length >= 2 && !relationExists(input.graph, input.movie.anchorEventIds)) return { reason: "selected Movie has no grounded graph relation" };
  if (input.graph.events.length >= 2 && used.size < 2) return { reason: "film uses fewer than two supplied events" };
  return { scenes };
}
function scoreSet(scenes: RealizedScene[], movie: LatentMovieCandidate, graph: RealityGraph): number { return judgeRealizedFilm({ scenes, movie, graph }).score; }

function context(input: { prompt: string; subject: string; lens: string; graph: RealityGraph; movie: LatentMovieCandidate; domainContext?: AuthorDomainContext; memoryContext?: string[]; priorScenes?: string[]; creativeLearningContext?: string[] }, repairFeedback: string) {
  const relevantIds = unique([...input.movie.anchorEventIds, ...input.movie.trajectory.flatMap((step) => step.eventIds)].filter((id) => input.graph.events.some((event) => event.id === id)));
  const relevantEvents = relevantIds.map((id) => input.graph.events.find((event) => event.id === id)).filter(Boolean).map((event) => ({ id: event!.id, text: eventText(event!), entities: event!.entities, place: event!.place, time: event!.time }));
  const artistDevice = buildArtistDevice(input.graph, input.movie);
  const meaningPressure = deriveMeaningPressure({ graph: input.graph, movie: input.movie });
  return {
    creativeTask: clean(input.prompt), subjectReference: clean(input.subject), subjectRole: "factual referent only; use its name when artistically useful, omit it when the detail can carry the cut alone", frame: clean(input.lens) || "NONE",
    memory: (input.memoryContext ?? []).slice(0, 20), priorFilms: (input.priorScenes ?? []).slice(-8), creativeLearning: (input.creativeLearningContext ?? []).slice(0, 20),
    selectedStructure: { eventIds: relevantIds, relationKinds: input.movie.supportingRelationKinds, operations: input.movie.trajectory.map((step) => ({ order: step.order, operation: step.operation, eventIds: step.eventIds })) },
    sourceReality: relevantEvents,
    artistDevice,
    meaningPressure,
    repairFeedback: clean(repairFeedback),
    creativePermission: "Interpretive language is wide open. Abstract feeling, irony, metaphor, personification, status, humor, absurdity, tenderness, menace, compression, omission, fragments and unexpected grammar are all available. The boundary is concrete reality, not imagination itself.",
    artistRule: "Preserve semantic truth, never the client's sentence. The visible film is an artistic transformation of supplied reality. Concrete additions are forbidden; interpretive language is welcome when it does not quietly assert a new concrete event, object, sensory fact, chronology, dialogue or hidden psychological fact as though it were supplied.",
  };
}
function prompt(attempt: number, feedback: string): string {
  const attacks = [
    "Find the latent charge first. Then embody it. Do not announce the charge.",
    "Destroy the source wording and rebuild the film from the meaning pressure. Be bold, economical, and materially different.",
    "Make the third or fourth candidate the one you would actually remember. Take a creative risk in language while keeping reality exact.",
  ];
  return [
    "You are QRE's ONE CREATIVE REALIZER.",
    "You are a filmmaker/poet/editor creating visible language, not a reporter.",
    "The source facts are sacred. The source sentences are disposable.",
    "Meaning Pressure is the reason this reality is interesting. Artist Device is only a set of possible tools. Do not mechanically follow either one.",
    "Ask yourself: when these true details are placed together, what changes in what becomes noticeable? Make THAT change felt.",
    "Do not write the answer as an explanation. Embody it through selection, order, rhythm, omission, implication, irony, metaphor, status, repetition, collision, reversal, abstraction, or another device that feels earned.",
    "You may be funny, strange, lyrical, stark, dark, tender, absurd, or understated. Artistic personality is a feature, not a defect.",
    "Do not force every fact into the film. Do not force a fixed number of beats. Let the strongest detail win.",
    "The subject is not a required narrator or grammatical anchor. Use the subject name only when it creates artistic value.",
    "Concrete reality is the hard boundary: never invent an object, person, action, place, time, dialogue, sensory detail, bodily reaction, or specific physical circumstance.",
    "Abstract interpretation is allowed. It can express the felt charge of the real relationship without claiming hidden psychology as a fact.",
    "A transformed fact-bearing phrase is good. Exact source-sentence replay is not.",
    "Generate four materially different film candidates. Change the structural idea, not merely the adjectives. One may be spare. One may be funny. One may be lyrical. One may be severe. Choose what the reality earns.",
    "JSON ONLY: {sets:[{scenes:[{text,kind}]}]}. 2-10 cuts per candidate. No commentary. No source IDs.",
    `This is creative attack ${attempt + 1} of 3.`,
    feedback ? `The last candidates failed here: ${feedback}. Attack those failures without becoming timid.` : "No prior failure. Explore the full artistic space.",
    attacks[Math.min(attempt, attacks.length - 1)],
  ].join("\n");
}

export async function realizeAuthorExperience(input: { prompt: string; subject: string; lens: string; graph: RealityGraph; movie: LatentMovieCandidate; domainContext?: AuthorDomainContext; memoryContext?: string[]; priorScenes?: string[]; creativeLearningContext?: string[] }): Promise<AuthorRealizationResult> {
  let model = "fallback"; let modelCalls = 0; let rejectedSets = 0; let lastJudgment: RealizedFilmJudgment | undefined; const rejectedReasons: string[] = [];
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const feedback = rejectedReasons.slice(-4).join(" | ");
    const ctx = context(input, feedback);
    try {
      const result = await localModelGenerate([{ role: "system", content: prompt(attempt, feedback) }, { role: "user", content: JSON.stringify(ctx) }], "json", { numPredict: 3000, temperature: [0.98, 1.08, 1.0][attempt]! });
      model = result.model; modelCalls += 1;
      const parsed = parseJson(result.text); const rawSets = Array.isArray(parsed?.sets) ? parsed.sets : parsed ? [parsed] : [];
      const judged: Array<{ scenes: RealizedScene[]; judgment: RealizedFilmJudgment }> = [];
      for (const raw of rawSets) {
        const validation = validateSet(raw, input);
        if (!validation.scenes) { rejectedSets += 1; if (validation.reason) rejectedReasons.push(validation.reason); continue; }
        const judgment = judgeRealizedFilm({ scenes: validation.scenes, movie: input.movie, graph: input.graph }); lastJudgment = judgment;
        if (!judgment.accepted) { rejectedSets += 1; rejectedReasons.push(`film judge: ${judgment.reasons.join("; ")}`); continue; }
        judged.push({ scenes: validation.scenes, judgment });
      }
      if (judged.length) {
        judged.sort((a, b) => b.judgment.score - a.judgment.score);
        const winner = judged[0]!;
        return { scenes: winner.scenes, score: winner.judgment.score, model, modelCalls, rejectedSets, judgment: winner.judgment, reason: rejectedReasons.length ? rejectedReasons.join(" | ") : undefined };
      }
    } catch (error) {
      rejectedSets += 1; rejectedReasons.push(error instanceof Error ? error.message : "creative realizer call failed");
    }
  }
  return { scenes: [], score: 0, model, modelCalls, rejectedSets, judgment: lastJudgment, reason: rejectedReasons.join(" | ") || "no realized film survived validation" };
}
