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
    "BACKGROUND_EVIDENCE = grounded truth kept underneath for provenance/context. It must NOT become a separate beat unless Discovery selected it as playable.",
    "The sequence itself is the media. It should be entertaining and distinctive enough that somebody would want to show another person.",
    "North star: take something ordinary and make it feel alive. The reaction should be: That should have been boring. Somehow it wasn't.",
    "Reality is fixed. Creative interpretation is free.",
    "Creative Discovery tells you WHAT THE IDEA IS. Your job is HOW TO MAKE IT HIT using only supplied reality.",
    "Privately use: FACT -> RELATIONSHIP -> CONSEQUENCE -> MEANING -> VOICE.",
    "Silently consider several genuinely different realizations before choosing the strongest one. Output only the winner.",
    "Use the discovered organizing idea, subject pattern, tension, surprise potential, payoff potential, experienceShape, and evidence-role selections as creative direction—not text to repeat.",
    "carrierEventIds are the on-screen factual spine.",
    "backgroundEventIds remain off-screen unless already represented by a selected playable milestone. They are still valuable provenance.",
    "turnEventIds and payoffEventIds identify supplied facts that may earn shifts and landings.",
    "Do not make a beat merely because a fact exists. Compress operational detail upward into the larger transformation when Creative Discovery found one.",
    "Transform the relationship between real events, not the events themselves.",
    "A tiny cinematic world is created through status, metaphor, consequence, rhythm, and voice—not by inventing props, camera moves, lighting, sounds, weather, textures, or physical staging.",
    "Clearly nonliteral lens-world invention is allowed. Rooms may resist, work may become battle, completion may become victory, a bow may become a negotiated settlement, when a reasonable viewer understands the move as framing.",
    "Allowed example from housekeeping facts: 'The kitchen looked confident. It was about to lose that confidence.' That personifies the supplied kitchen without asserting a new physical event.",
    "Allowed example: 'By the time she reached the living room, the house was negotiating from a position of weakness.' That is clearly status framing over supplied progress.",
    "Forbidden from the same facts: glowing clocks, welcome mats, vacuum cleaners, water rushing, sponges, grease, floorboards, lighting, sounds, or any other concrete scenery not supplied.",
    "Unsupported literal reality is forbidden. Do not invent concrete people, objects, conditions, actions, dialogue, sensory evidence, physical reactions, before-states, after-states, or future events.",
    "Do not decorate weak material with plausible scenery. Find a better reading instead.",
    "Write around the subject once identity is established. Do not restart every beat with the subject's name.",
    "A true fact is not automatically a beat. Source order is not automatically the experience.",
    "Each beat should be a distinct piece of the experience and should change what the viewer knows, expects, suspects, wants, or understands, or change how an earlier beat now reads.",
    "This is MOVING TEXT, not prose. Default to 1-7 words per cut. Fragments and one-word cuts are welcome. Use 8-12 words only when essential. Never write paragraph-like beats or multiple full sentences inside one beat.",
    "Prefer the smallest sharp language that preserves implication, rhythm, attitude, and unresolved meaning.",
    "Do not state the latent conclusion if the selected evidence can make the observer infer it.",
    "Use the discovered experienceShape as a trajectory, not a form to fill. The exact number and type of beats should emerge from the material.",
    "Do not expose internal labels such as relationship, pressure, consequence, thesis, lens, beat, escalation, payoff, mechanic, or directive. Perform them.",
    "Do not write literary atmosphere, faux-profound ceremony, trailer narration, or explanatory prose.",
    "Sharp is good. Cryptic is not.",
    "Do not explain the joke, metaphor, meaning, or creative mechanism.",
    "Do not optimize for a fixed beat count or fixed word count. Stop when it lands.",
    "Behavior examples, never target wording: supplied completion may read as victory; repeated return may reframe earlier nervousness; several preferences together may reveal character without listing them.",
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
          BACKGROUND_EVIDENCE: (input.backgroundEvents ?? []).map((event) => event.text),
          MEMORY: (input.memory ?? []).slice(0, 20),
          BUSINESS_CONTEXT: input.domainContext,
          CREATIVE_DISCOVERY: input.creativeDiscovery,
          instruction: "Create the QRE experience from PLAYABLE_REALITY. BACKGROUND_EVIDENCE stays underneath and must not become its own beat. Apply the lens as pressure to the discovered relation, then realize it in tiny moving-text cuts.",
        }),
      },
    ],
    "json",
    { numPredict: 800, temperature: 0.88 },
  );

  const parsed = parseJson(result.text);
  const raw = Array.isArray(parsed?.beats) ? parsed!.beats : [];
  const eventIds = input.playableEvents.map((event) => event.id);

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
      ? beat.sourceEventIds
          .filter((id): id is string => typeof id === "string")
          .filter((id) => eventIds.includes(id))
      : [];

    const fallbackId = eventIds.length
      ? eventIds[Math.min(eventIds.length - 1, Math.round(
          (index / Math.max(1, raw.length - 1)) * (eventIds.length - 1),
        ))]
      : undefined;

    return [{
      text,
      kind: index === 0 ? "hook" : index === raw.length - 1 ? "payoff" : "line",
      sourceEventIds: unique(
        suppliedIds.length ? suppliedIds : fallbackId ? [fallbackId] : [],
      ),
    }];
  }).slice(0, 20);

  return {
    scenes,
    model: result.model,
    modelCalls: 1,
  };
}
