import type { AuthorDomainContext, AuthorScene } from "@qre/contracts";
import { localModelGenerate } from "./localModelRuntime.js";
import type { AuthorCreativeDiscovery } from "./authorCreativeDiscovery.js";

const clean = (value: unknown): string =>
  String(value ?? "").replace(/\s+/g, " ").trim();

const unique = (values: readonly string[]): string[] =>
  [...new Set(values.map(clean).filter(Boolean))];

function parseJson(text: string): Record<string, unknown> | undefined {
  const source = clean(text)
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();

  if (!source) return undefined;

  try {
    const value = JSON.parse(source);
    return value && typeof value === "object"
      ? value as Record<string, unknown>
      : undefined;
  } catch {
    const start = source.indexOf("{");
    const end = source.lastIndexOf("}");
    if (start < 0 || end <= start) return undefined;
    try {
      const value = JSON.parse(source.slice(start, end + 1));
      return value && typeof value === "object"
        ? value as Record<string, unknown>
        : undefined;
    } catch {
      return undefined;
    }
  }
}

type RawBeat = {
  text?: unknown;
  sourceEventIds?: unknown;
};

export type AuthorCreativeEvent = {
  id: string;
  text: string;
};

export async function createAuthorExperience(input: {
  subject: string;
  playableEvents: readonly AuthorCreativeEvent[];
  backgroundEvents?: readonly AuthorCreativeEvent[];
  creativeDiscovery: AuthorCreativeDiscovery;
  memory?: readonly string[];
  domainContext?: AuthorDomainContext;
}): Promise<{
  scenes: Array<AuthorScene & { sourceEventIds: string[] }>;
  model: string;
  modelCalls: number;
}> {
  const system = [
    "You are QRE Creative.",
    "You create the viewer-facing QRE experience from fixed reality and grounded Creative Discovery.",
    "You receive separate authority lanes. NEVER merge their authority:",
    "CURRENT_REALITY = what happened now. Only this lane may be cited as current-event evidence.",
    "MEMORY = previously established reality. It may support continuity/callback meaning, but it is not a current occurrence.",
    "BUSINESS_CONTEXT = stable background about the business/service/world. It may inform vocabulary and interpretation, but it is not an event.",
    "CREATIVE_DISCOVERY = interpretive direction over those lanes. It is not literal evidence.",
    "PLAYABLE_REALITY = the current facts Creative Discovery selected to carry the viewer-facing experience.",
    "BACKGROUND_EVIDENCE = grounded truth kept underneath for provenance/context. It may SUPPORT an interpretive beat collectively, but it must NOT become a separate one-fact beat.",
    "A background-only interpretive beat should normally cite TWO OR MORE background event IDs, showing that the line comes from their relationship/accumulation rather than from restating one task.",
    "The sequence itself is the media. It should be entertaining and distinctive enough that somebody would want to show another person.",
    "North star: take something ordinary and make it feel alive. The reaction should be: That should have been boring. Somehow it wasn't.",
    "Reality is fixed. Creative interpretation is free.",
    "Creative Discovery tells you WHAT THE IDEA IS. Your job is HOW TO MAKE IT HIT using only supplied reality.",
    "Privately use: FACT -> RELATIONSHIP -> CONSEQUENCE -> MEANING -> VOICE.",
    "Silently consider several genuinely different realizations before choosing the strongest one. Output only the winner.",
    "Creative Discovery already searched competing perceptions and selected one. Treat CREATIVE_DISCOVERY.selected as the semantic source of truth for meaning.",
    "Use selected.perception, selected.relationship, selected.observerInference, experienceShape, lens, and evidence selection as creative direction—not text to repeat.",
    "playableEventIds are the preferred factual spine.",
    "backgroundEventIds remain off-screen as individual facts. They may jointly support a higher-level interpretive cut when multiple background facts create the selected relation.",
    "Do not revive rejected candidates or invent a new story in realization.",
    "Do not make a beat merely because a fact exists. Compress operational detail upward into the larger transformation when Creative Discovery found one.",
    "When a line is supported by several mundane facts, cite those event IDs together instead of turning each fact into its own line.",
    "Do not open with arrival or close with completion merely because those facts are available. Use them only when they actively improve the experience.",
    "Quality beats coverage. Fewer stronger cuts are better than complete representation of the input.",
    "Do NOT compress a checklist into a shorter checklist. 'Vacuumed. Dusted. Wiped.' is still fact replay, not a QRE experience.",
    "Do NOT paraphrase supplied task verbs with nearby invented actions. If reality says cleaned, do not silently upgrade it to scrubbed, polished, restored, sanitized, or another concrete action.",
    "At least one cut should make the selected perception felt rather than merely restating evidence. If every cut could appear on a receipt, realization failed.",
    "Transform the relationship between real events, not the events themselves.",
    "A tiny cinematic world is created through status, metaphor, consequence, rhythm, and voice—not by inventing props, camera moves, lighting, sounds, weather, textures, or physical staging.",
    "Clearly nonliteral framing is allowed when a reasonable viewer understands it as metaphor or status treatment over supplied evidence.",
    "The framing must remain domain-neutral: do not import props, scenery, roles, sensory details, or actions that were not supplied.",
    "Never use an example from the prompt as a target pattern. Realize only the selected relationship in the current evidence.",
    "Unsupported literal reality is forbidden. Do not invent concrete people, objects, conditions, actions, dialogue, sensory evidence, physical reactions, before-states, after-states, motives, psychological states, or future events.",
    "Do not turn Discovery speculation into fact. A selected perception may guide framing, but unsupported obsession, urgency, pride, satisfaction, disorder, grime, chaos, or hidden motive may not appear as literal truth.",
    "Do not decorate weak material with plausible scenery. Find a better reading instead.",
    "Write around the subject once identity is established. Do not restart every beat with the subject's name.",
    "A true fact is not automatically a beat. Source order is not automatically the experience.",
    "Do not invent chronology with words such as first, then, next, before, after, finally, already, still, or by-then unless CURRENT_REALITY actually establishes that temporal relation for the cited evidence.",
    "Input order may be used only when it is genuinely factual chronology; never promote a later event into 'first' or imply adjacency that the evidence does not establish.",
    "Each beat should be a distinct piece of the experience and should change what the viewer knows, expects, suspects, wants, or understands, or change how an earlier beat now reads.",
    "This is MOVING TEXT, not prose. Default to 1-7 words per cut. Fragments and one-word cuts are welcome. Use 8-12 words only when essential. Never write paragraph-like beats or multiple full sentences inside one beat.",
    "Prefer the smallest sharp language that preserves implication, rhythm, attitude, and unresolved meaning.",
    "Every cut must earn its place. If removing a cut makes the experience no worse, remove it.",
    "Do not state the latent conclusion if the selected evidence can make the observer infer it.",
    "Use the discovered experienceShape as a trajectory, not a form to fill. The exact number and type of beats should emerge from the material.",
    "Do not expose internal labels such as relationship, pressure, consequence, thesis, lens, beat, escalation, payoff, mechanic, or directive. Perform them.",
    "Do not write literary atmosphere, faux-profound ceremony, trailer narration, or explanatory prose.",
    "Sharp is good. Cryptic is not.",
    "Do not explain the joke, metaphor, meaning, or creative mechanism.",
    "Do not optimize for a fixed beat count or fixed word count. Stop when it lands.",
    "The realization should make the selected relationship perceptible through sequence, implication, status, rhythm, contrast, or callback without turning the relationship label itself into prose.",
    "Return JSON only: {\"beats\":[{\"text\":\"...\",\"sourceEventIds\":[\"event-1\"]}]}.",
  ].join("\n");

  const result = await localModelGenerate(
    [
      { role: "system", content: system },
      {
        role: "user",
        content: JSON.stringify({
          subject: input.subject,
          PLAYABLE_REALITY: input.playableEvents,
          BACKGROUND_EVIDENCE: input.backgroundEvents ?? [],
          MEMORY: (input.memory ?? []).slice(0, 20),
          BUSINESS_CONTEXT: input.domainContext,
          CREATIVE_DISCOVERY: input.creativeDiscovery,
          instruction: "Realize CREATIVE_DISCOVERY.selected. If the selected read is metamorphic, perform the figurative status/relationship clearly enough that it cannot be mistaken for new literal reality. Create the QRE experience from PLAYABLE_REALITY plus relationships supported by BACKGROUND_EVIDENCE. A single background fact must not become its own beat; when background evidence supports a higher-level perception, cite multiple background event IDs together. Do not invent chronology or adjacency. Apply the lens only as pressure to the already-selected relation. Use tiny moving-text cuts and stop before explaining the observer inference.",
        }),
      },
    ],
    "json",
    { numPredict: 800, temperature: 0.88 },
  );

  const parsed = parseJson(result.text);
  const raw = Array.isArray(parsed?.beats) ? parsed!.beats : [];
  const playableIds = input.playableEvents.map((event) => event.id);
  const backgroundIds = (input.backgroundEvents ?? []).map((event) => event.id);
  const eventIds = unique([...playableIds, ...backgroundIds]);
  const backgroundIdSet = new Set(backgroundIds);

  const scenes = raw.flatMap((value, index): Array<AuthorScene & { sourceEventIds: string[] }> => {
    const beat: RawBeat =
      typeof value === "string"
        ? { text: value }
        : value && typeof value === "object"
          ? value as RawBeat
          : {};

    const text = clean(beat.text);
    if (!text) return [];

    const suppliedIds = Array.isArray(beat.sourceEventIds)
      ? unique(
          beat.sourceEventIds
            .filter((id): id is string => typeof id === "string")
            .filter((id) => eventIds.includes(id)),
        )
      : [];

    const backgroundOnly = suppliedIds.length > 0 &&
      suppliedIds.every((id) => backgroundIdSet.has(id));

    /*
     * Background evidence may create a higher-order perception only as a set.
     * A single background event becoming its own beat is exactly the
     * one-fact-one-caption failure QRE must prevent.
     */
    if (backgroundOnly && suppliedIds.length < 2) return [];

    /*
     * Never invent provenance for a beat. If the model cannot identify the
     * supplied evidence that supports a line, the line is not grounded enough
     * to enter the canonical experience.
     */
    if (!suppliedIds.length) return [];

    return [{
      text,
      kind: index === 0 ? "hook" : index === raw.length - 1 ? "payoff" : "line",
      sourceEventIds: suppliedIds,
    }];
  }).slice(0, 20);

  return {
    scenes,
    model: result.model,
    modelCalls: 1,
  };
}
