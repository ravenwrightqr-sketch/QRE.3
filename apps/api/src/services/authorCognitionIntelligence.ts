import type { RealityGraph } from "@qre/contracts";

export type AuthorCognitionIntelligence = {
  evidence: {
    eventCount: number;
    relationCount: number;
    mediaCount: number;
    geoCount: number;
    timeCount: number;
    sensoryCount: number;
    entityCount: number;
  };
  semanticSignals: string[];
  candidateMoves: Array<{
    move: "contrast" | "change" | "recurrence" | "convergence" | "consequence" | "recontextualization" | "continuation" | "observation";
    eventIds: string[];
    strength: number;
    reason: string;
  }>;
  compositionRules: string[];
  attention: string[];
  learnedPreferenceSignals: string[];
  decisionRules: string[];
  competitionProtocol: string[];
  antiFailureChecks: string[];
};

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();
const unique = <T>(values: readonly T[]): T[] => [...new Set(values)];

function relationMove(kind: string): AuthorCognitionIntelligence["candidateMoves"][number]["move"] {
  switch (kind) {
    case "changes":
    case "state_change": return "change";
    case "repeats": return "recurrence";
    case "contrasts": return "contrast";
    case "converges": return "convergence";
    case "causes": return "consequence";
    case "recontextualizes": return "recontextualization";
    case "before":
    case "after": return "continuation";
    default: return "observation";
  }
}

export function buildAuthorCognitionIntelligence(
  graph: RealityGraph,
  returning = false,
  creativeLearningContext: string[] = [],
): AuthorCognitionIntelligence {
  const mediaCount = 0;
  const geoCount = graph.events.filter((event) => Boolean(event.place)).length;
  const timeCount = graph.events.filter((event) => Boolean(event.time)).length;
  const sensoryCount = graph.sensorySignals.length;
  const entityCount = unique(graph.events.flatMap((event) => event.entities)).length;

  const relationMoves = graph.relations.map((relation) => ({
    move: relationMove(relation.kind),
    eventIds: unique([relation.from, relation.to]),
    strength: Math.max(0, Math.min(1, relation.strength)),
    reason: clean(relation.kind),
  }));

  // A useful creative structure can exist even when the graph has no explicit pair relation.
  // Ordered real-world actions already contain stages, territory, repetition, constraints and endpoints.
  // Surface those runs to cognition without pretending they are relationships that the source never asserted.
  const actionMoves = graph.events.length >= 2
    ? graph.events.slice(0, 12).map((event, index, events) => {
        const next = events[index + 1];
        return next
          ? {
              move: "observation" as const,
              eventIds: [event.id, next.id],
              strength: 0.68,
              reason: "ordered action run: test active structures such as stages, rounds, territory, mission, speedrun, countdown, accumulation, completion, transformation, interruption, recovery or status shift when the supplied work supports them",
            }
          : undefined;
      }).filter((value): value is NonNullable<typeof value> => Boolean(value))
    : [];

  const candidateMoves = [...relationMoves, ...actionMoves]
    .sort((a, b) => b.strength - a.strength)
    .slice(0, 20);

  const semanticSignals = unique([
    graph.relations.length ? `${graph.relations.length} grounded relationship(s) are available for semantic composition.` : "No strong pair relation is required; inspect event-level distinctiveness instead.",
    graph.events.length >= 3 ? "The supplied events may form an action run: ordered work can carry stages, territory, rounds, accumulation, escalation, interruption, recovery, completion, transformation, or a speedrun-like structure without inventing an opponent or obstacle." : "Do not manufacture an action structure from too little supplied material.",
    graph.events.length >= 2 ? "Concrete nouns can become expressive actors without becoming literal falsehoods: food can feel like a cast, a car can feel like a contender, a room can feel like an arena, a house can feel like a character, a tool can feel like a weapon, a machine can feel like an opponent, and an object can feel like a relic, trophy, boss, witness or wildcard when its supplied behavior or context supports the metaphor." : "Do not personify material that lacks enough supplied context to carry the move.",
    graph.patterns?.length ? `${graph.patterns.length} recurring or structural pattern signal(s) are present.` : "No recurring pattern is established.",
    graph.unresolvedTensions.length ? `${graph.unresolvedTensions.length} unresolved tension signal(s) are present.` : "No explicit unresolved tension is established.",
    sensoryCount ? `${sensoryCount} sensory signal(s) are available as realization material.` : "No sensory signal is available.",
    geoCount ? `${geoCount} event(s) carry place context; place can frame the experience without consuming semantic story capacity.` : "Place is supporting context unless the reality makes it meaningful.",
    timeCount ? `${timeCount} event(s) carry time; time is supporting context unless the reality makes chronology itself meaningful.` : "Time is supporting context unless explicitly meaningful.",
    returning ? "This is a return: prefer changed meaning, callback, continuation, or contrast over replaying prior structure." : "This is a first encounter: establish identity economically, then move toward the strongest unusual, active, materially expressive, or consequential structure.",
  ]);

  const compositionRules = [
    "The story earns its own length from semantic value. Do not shorten it to accommodate media, geo, timestamps, receipts, or attachments.",
    "Time, geo, and media are additive experience material. They may surround, attach to, or sit between story beats without becoming story beats automatically.",
    "Do not spend a story beat merely stating a timestamp or location unless the supplied reality makes that datum itself meaningful.",
    "Do not convert every event into one sentence. Prefer cross-event meaning, recontextualization, contrast, consequence, recurrence, active task structure, material agency, or another grounded viewer-state change when available.",
    "When relations are sparse, prefer a distinctive observation or an earned action structure over a fabricated plot. Sparse reality is allowed to remain sparse.",
    "A lens may intensify a grounded semantic move but may not create the move.",
    "When the supplied facts form a real sequence of tasks, search operational/game/mission structure before defaulting to rhythm or atmosphere: stages can become rounds, rooms can become territory, repeated work can become a run, the finish can become a final target, and a real interruption can become the obstacle. Do not invent an opponent, failure, deadline, danger, or consequence that the source does not contain.",
    "When concrete material has distinctive identity, test whether it can carry agency metaphorically: a dish may enter like a character, a car may square off with another car, a building may loom like a boss room, or a tool may become the hero's signature weapon. The metaphor changes presentation, not reality.",
    returning ? "Use prior experience only to create a new reading, not to repeat the same movie with different adjectives." : "Avoid defaulting to a generic routine, recap, chronological montage, or passive poetic treatment when the action or material itself has structure.",
  ];

  const learnedPreferenceSignals = unique(creativeLearningContext)
    .map(clean)
    .filter(Boolean)
    .filter((line) => /(?:LEARNED_|AUTO_LEARNED_|RECENT_FEEDBACK|PREFERENCE|WEAKNESS|WINNER|AVOID|PREFERRED|LIKED)/i.test(line))
    .slice(0, 30);

  const decisionRules = [
    "First decide what the experience is actually about; never assume the input is a story just because multiple facts were supplied.",
    "Prefer semantic relationships over event coverage, but do not require an explicit graph relation before searching for form. The sequence of real actions may itself create a grounded creative structure.",
    "A Movie step must justify its existence by changing attention, expectation, interpretation, status, curiosity, consequence, recognition, or emotional reading.",
    "A sequence with one near-paraphrase per source event is a caption reel and must lose to a smaller sequence with stronger semantic movement.",
    "A sequence that merely restates timestamps, locations, attachments, or completion status is metadata narration, not a Movie.",
    "When a run of concrete work has a beginning, ordered stages, repeated operations, distinct territories, accumulation, an interruption, recovery, or a clear finish, explicitly test active forms: mission, campaign, rounds, territory, race, speedrun, countdown, contest, hunt, showdown, boss room, elimination, rescue, repair, transformation, before/after, or status flip. These are expressive hypotheses, not literal claims.",
    "A mundane service is not artistically boring by default. Cleaning can become a campaign, a car wash can become a transformation, a repair job can become a rescue, a move can become an extraction, a queue can become a race, and a malfunction can become an interruption when the supplied details support that reading.",
    "When a distinctive physical thing is present, search for material-character form before abstract atmosphere: food, cars, rooms, houses, tools, machines, clothing, signs, furniture, objects and places can become the cast, stage, rival, relic, boss, mascot, witness, trophy or wildcard through metaphorical language when the supplied facts support it.",
    "Food is not automatically decoration. A supplied dish, ingredient, plate, order or kitchen object may become the center of action, comic tension, competition, seduction, invasion, procession, showdown, transformation or payoff when its concrete context earns that treatment.",
    "Personification must remain visibly figurative when the underlying object did not literally act, speak, move, think, fight or choose. Give the material agency in language without rewriting the world.",
    "Prefer competing interpretations when several grounded readings exist; select for semantic gain, evidence coverage, novelty, and low repetition risk.",
    "Do not reward length by itself. Do not reward shortness by itself. Reward meaningful information density and kinetic or interpretive movement when the reality provides it.",
    "When evidence supports only one meaningful observation, make that observation excellent instead of manufacturing escalation.",
    "When prior experience is available, search for what changed in the world or in the reading before considering repetition.",
    "Learn presentation preference from accepted/rejected work, never facts about the world from creative preference.",
  ];

  const competitionProtocol = [
    "Generate 6–10 materially different semantic hypotheses internally before selecting one when the reality is rich enough to support competition.",
    "Vary the mechanism: contrast, change, recurrence, consequence, convergence, recontextualization, continuation, distinctive observation, active mission, staged campaign, race, transformation, interruption, reversal, accumulation, status shift, material agency, personification, object-as-character, or object-as-stage.",
    "When a real run of actions supports it, at least one hypothesis must attack the material as active structure rather than treating the work as atmosphere or routine. If the facts do not support active pressure, do not fake it.",
    "When strong physical details exist, at least one hypothesis should test whether the material itself can carry the drama: food, cars, rooms, houses, tools, machines, signs or objects may become an expressive cast or arena through metaphorical framing.",
    "Vary presentation stance as well as mechanism: kinetic, comic, deadpan, game-like, dramatic, stark, lyrical, procedural, surreal, affectionate, ominous, understated, absurd, mythic, or irreverent.",
    "Attack every hypothesis for genericity, caption-reel risk, template dependence, unsupported inference, weak grounding, repetition, fake escalation, passive poetic defaulting, and dead material treatment.",
    "Prefer a surprising interpretation only when the supplied evidence can carry it without invention.",
    "Treat candidate length as a consequence of semantic movement, never as a quality signal by itself.",
    "The Artist chooses the visible form. Deterministic diagnostics may observe quality but may not select artistic taste.",
    "Rejected hypotheses are internal diagnostics only. Never leak alternatives, scoring, planner language, or selection mechanics to the Mouth.",
  ];

  const antiFailureChecks = [
    "CAPTION_REEL: each story beat cannot merely paraphrase a different source event.",
    "CHECKLIST_RECAP: event count must not determine story length.",
    "METADATA_NARRATION: time/geo/media do not become beats unless semantically necessary.",
    "GENRE_TEMPLATE: lens cannot determine the Movie or manufacture plot.",
    "PSYCHOLOGICAL_FILL_IN: preference/routine/coincidence does not prove inner state or motive.",
    "PASSIVE_POETRY_DEFAULT: do not choose ritual, melancholy, dust, breath, echoes, or generic atmosphere simply because the source is a routine service when the concrete action sequence supports a more active form.",
    "DEAD_MATERIAL: do not treat distinctive food, vehicles, architecture, tools, machines or objects as inert scenery when their supplied properties can carry the creative mechanism.",
    "FAKE_ACTION: never invent opponents, danger, failures, deadlines, victories, dialogue, or consequences merely to make a mundane service exciting.",
    "LITERAL_PERSONIFICATION: metaphor may animate an object artistically, but never report figurative agency as a literal source event.",
    "RETURN_REPLAY: returning context cannot simply replay the previous structure with new adjectives.",
    "SUBJECT_MISPLACEMENT: an arena, venue, service, object, or receipt cannot silently replace the explicit subject as protagonist.",
    "MOUTH_LEAK: cognition may never emit customer-facing prose, scene direction, invented dialogue, or fake events.",
    "TRUTH_DRIFT: learned taste and creative framing may never modify source evidence, chronology, actors, places, or outcomes.",
  ];

  const attention = unique([
    "Maximize information density, not minimum word count.",
    "Prefer the supplied detail that changes how an earlier detail is understood.",
    "When reality contains concrete work verbs, ordered tasks, territories, interruptions, repetitions, constraints, or a finish, treat those verbs as potential engines for the experience rather than background bookkeeping.",
    "When reality contains distinctive physical material, ask what role it could play in the art: object, actor, opponent, relic, mascot, trophy, arena, weapon, witness, joke, threshold, or payoff.",
    "Preserve strong nouns, distinctive objects, concrete actions, and real relationships as anchors for the Mouth.",
    "Use the ending for the strongest landing available in the evidence, not a generic 'done' statement.",
    ...learnedPreferenceSignals.slice(0, 6).map((line) => `LEARNED TASTE: ${line}`),
    ...(returning ? ["A return should make the remembered world feel updated, not merely revisited."] : []),
  ]);

  return {
    evidence: { eventCount: graph.events.length, relationCount: graph.relations.length, mediaCount, geoCount, timeCount, sensoryCount, entityCount },
    semanticSignals,
    candidateMoves,
    compositionRules,
    attention,
    learnedPreferenceSignals,
    decisionRules,
    competitionProtocol,
    antiFailureChecks,
  };
}