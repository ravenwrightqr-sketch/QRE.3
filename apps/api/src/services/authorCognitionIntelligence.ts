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

  const candidateMoves = graph.relations
    .map((relation) => ({
      move: relationMove(relation.kind),
      eventIds: unique([relation.from, relation.to]),
      strength: Math.max(0, Math.min(1, relation.strength)),
      reason: clean(relation.kind),
    }))
    .sort((a, b) => b.strength - a.strength)
    .slice(0, 20);

  const semanticSignals = unique([
    graph.relations.length ? `${graph.relations.length} grounded relationship(s) are available for semantic composition.` : "No strong pair relation is required; inspect event-level distinctiveness instead.",
    graph.patterns?.length ? `${graph.patterns.length} recurring or structural pattern signal(s) are present.` : "No recurring pattern is established.",
    graph.unresolvedTensions.length ? `${graph.unresolvedTensions.length} unresolved tension signal(s) are present.` : "No explicit unresolved tension is established.",
    sensoryCount ? `${sensoryCount} sensory signal(s) are available as realization material.` : "No sensory signal is available.",
    geoCount ? `${geoCount} event(s) carry place context; place can frame the experience without consuming semantic story capacity.` : "Place is supporting context unless the reality makes it meaningful.",
    timeCount ? `${timeCount} event(s) carry time; time is supporting context unless the reality makes chronology itself meaningful.` : "Time is supporting context unless explicitly meaningful.",
    returning ? "This is a return: prefer changed meaning, callback, continuation, or contrast over replaying prior structure." : "This is a first encounter: establish identity economically, then move toward the strongest unusual or consequential relationship.",
    "Search creative pressure across all domains: contest, obstacle, mission, race, countdown, rescue, chase, interruption, reversal, status change, before/after, accumulation, elimination, inspection, discovery, reveal, handoff, transformation, precision, failure/recovery, survival, game, score, ritual, contrast, absurdity, romance, menace, tenderness, spectacle, or deadpan comedy.",
    "These are optional expressive structures, never genres or templates. Choose only when concrete supplied details make the structure legible.",
    "For ordinary services, actively test whether the work itself can become the engine: rooms can become stages, tasks can become rounds, a queue can become a race, a repair can become a rescue, a wash can become a transformation, an inspection can become a hunt, a delivery can become a handoff, and a malfunction can become an interruption or reversal.",
    "Do not privilege poetic atmosphere over active structure. Plain, funny, kinetic, absurd, dramatic, competitive, game-like, procedural, lyrical, or stark form are all equally available.",
  ]);

  const compositionRules = [
    "The story earns its own length from semantic value. Do not shorten it to accommodate media, geo, timestamps, receipts, or attachments.",
    "Time, geo, and media are additive experience material. They may surround, attach to, or sit between story beats without becoming story beats automatically.",
    "Do not spend a story beat merely stating a timestamp or location unless the supplied reality makes that datum itself meaningful.",
    "Do not convert every event into one sentence. Prefer cross-event meaning, recontextualization, contrast, consequence, recurrence, or another grounded viewer-state change when available.",
    "When relations are sparse, prefer a distinctive observation over a fabricated plot. Sparse reality is allowed to remain sparse.",
    "A lens may intensify a grounded semantic move but may not create the move.",
    "Search action pressure before atmospheric language: ask whether something is being won, lost, solved, cleared, restored, rescued, completed, interrupted, transformed, discovered, compared, or brought back.",
    "Never force a battle, race, game, mission, contest, or conflict when the evidence does not support one. Creative permission is broad; evidence remains the boundary.",
    returning ? "Use prior experience only to create a new reading, not to repeat the same movie with different adjectives." : "Avoid defaulting to a generic routine, recap, chronological montage, or poetic mood piece when more active structure is supported.",
  ];

  const learnedPreferenceSignals = unique(creativeLearningContext)
    .map(clean)
    .filter(Boolean)
    .filter((line) => /(?:LEARNED_|AUTO_LEARNED_|RECENT_FEEDBACK|PREFERENCE|WEAKNESS|WINNER|AVOID|PREFERRED|LIKED)/i.test(line))
    .slice(0, 30);

  const decisionRules = [
    "First decide what the experience is actually about; never assume the input is a story just because multiple facts were supplied.",
    "Prefer semantic relationships over event coverage. The best Movie may intentionally leave low-value facts out of customer-facing language.",
    "A Movie step must justify its existence by changing attention, expectation, interpretation, status, curiosity, consequence, recognition, or emotional reading.",
    "A sequence with one near-paraphrase per source event is a caption reel and must lose to a smaller sequence with stronger semantic movement.",
    "A sequence that merely restates timestamps, locations, attachments, or completion status is metadata narration, not a Movie.",
    "Explore active and atmospheric forms as peers. Do not assume the safest artistic expression is lyrical or poetic.",
    "When the work contains repeated tasks plus a meaningful endpoint, test mission/round/score/race language as an expressive possibility.",
    "When a service contains a malfunction, interruption, recovery, bottleneck, queue, switch, or constraint, test obstacle/consequence/reversal structures.",
    "When a place, object, or business contains before/after evidence, test transformation, status-flip, inheritance, restoration, or recontextualization structures.",
    "When small unusual details coexist with routine work, test whether the unusual detail can become the hook, opponent, mascot, witness, punchline, or payoff without inventing behavior.",
    "Prefer competing interpretations when several grounded readings exist; select for semantic gain, evidence coverage, novelty, and low repetition risk.",
    "Do not reward length by itself. Do not reward shortness by itself. Reward meaningful information density.",
    "When evidence supports only one meaningful observation, make that observation excellent instead of manufacturing escalation.",
    "When prior experience is available, search for what changed in the world or in the reading before considering repetition.",
    "Learn presentation preference from accepted/rejected work, never facts about the world from creative preference.",
  ];

  const competitionProtocol = [
    "Generate 6–10 materially different semantic hypotheses internally before selecting one.",
    "Include at least one active-pressure attack when the supplied reality contains repeated work, obstacles, interruptions, completion, competition, recovery, transformation, or consequence.",
    "Vary the mechanism: contrast, change, recurrence, consequence, convergence, recontextualization, continuation, mission, obstacle, status flip, reversal, discovery, or distinctive observation.",
    "Vary the presentation stance: kinetic, comic, deadpan, game-like, dramatic, stark, lyrical, procedural, surreal, affectionate, ominous, or understated.",
    "Do not let the word 'service', 'business', 'cleaning', 'repair', 'car wash', 'restaurant', or another domain label select the form. Reality selects the form.",
    "Attack every hypothesis for genericity, caption-reel risk, template dependence, unsupported inference, weak grounding, repetition, fake escalation, and passive poetic sludge.",
    "Prefer a surprising interpretation only when the supplied evidence can carry it without invention.",
    "Treat candidate length as a consequence of semantic movement, never as a quality signal by itself.",
    "The Artist, not a deterministic quality score, chooses among materially different realizations.",
    "Rejected hypotheses are internal diagnostics only. Never leak alternatives, scoring, planner language, or selection mechanics to the Mouth.",
  ];

  const antiFailureChecks = [
    "CAPTION_REEL: each story beat cannot merely paraphrase a different source event.",
    "CHECKLIST_RECAP: event count must not determine story length.",
    "METADATA_NARRATION: time/geo/media do not become beats unless semantically necessary.",
    "GENRE_TEMPLATE: lens cannot determine the Movie or manufacture plot.",
    "POETIC_DEFAULT: atmosphere, metaphor, personification, or melancholy must not win merely because they sound artistic; active structures remain eligible.",
    "FAKE_BATTLE: battle/mission/race/game language must be supported by the supplied work, obstacles, sequence, constraints, recovery, competition, or completion evidence and must remain clearly figurative when not literal.",
    "PSYCHOLOGICAL_FILL_IN: preference/routine/coincidence does not prove inner state or motive.",
    "RETURN_REPLAY: returning context cannot simply replay the previous structure with new adjectives.",
    "SUBJECT_MISPLACEMENT: an arena, venue, service, object, or receipt cannot silently replace the explicit subject as protagonist.",
    "MOUTH_LEAK: cognition may never emit customer-facing prose, scene direction, invented dialogue, or fake events.",
    "TRUTH_DRIFT: learned taste and creative framing may never modify source evidence, chronology, actors, places, or outcomes.",
  ];

  const attention = unique([
    "Maximize information density, not minimum word count.",
    "Prefer the supplied detail that changes how an earlier detail is understood.",
    "Preserve strong nouns, distinctive objects, concrete actions, constraints, interruptions, and real relationships as anchors for the Mouth.",
    "Look for what is being cleared, defeated, repaired, transformed, interrupted, recovered, delivered, discovered, compared, or brought back when the evidence supports it.",
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
