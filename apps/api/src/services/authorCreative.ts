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
  support?: unknown;
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
    "Turn the selected grounded perception into a short viewer-facing sequence.",
    "Reality is fixed. Interpretation is free.",
    "",
    "YOUR JOB:",
    "Do not summarize evidence. Do not write a receipt. Do not explain the idea.",
    "Create a sequence where each cut changes status, expectation, pressure, scale, implication, or the meaning of an earlier cut.",
    "Escalate the selected world. Let ordinary evidence become increasingly consequential inside the figurative frame.",
    "The sequence should feel like something is happening even when the source reality is ordinary.",
    "Prefer bold, compressed, memorable language over polite description.",
    "Magnify STATUS and CONSEQUENCE, not literal facts.",
    "When escalating a metamorphic world, prefer changes in abstract status, control, hierarchy, victory, defeat, permission, rank, possession, threat, or consequence over new physical phenomena.",
    "The stronger the metaphor gets, the more clearly figurative it should become.",
    "Overstatement is allowed when it is unmistakably figurative.",
    "Playfulness, swagger, absurd seriousness, attitude, and dramatic escalation are allowed when they fit the selected read.",
    "",
    "SEQUENCE:",
    "Think in cuts, not sentences.",
    "Usually 3-7 cuts, but let the material decide.",
    "Default to 1-7 words per cut.",
    "Every cut belongs to the same tiny world.",
    "Do not restart from zero on every line.",
    "Build pressure, callback, contrast, or recontextualization across cuts.",
    "A later cut should sharpen an earlier cut whenever possible.",
    "Land hard. Stop before explaining.",
    "",
    "GROUNDING:",
    "PLAYABLE_REALITY and BACKGROUND_EVIDENCE are the only current-event evidence.",
    "CREATIVE_DISCOVERY.selected gives the perception to realize. Do not invent a different story.",
    "Do not invent literal people, objects, actions, dialogue, motives, psychology, sensory details, before-states, after-states, or chronology.",
    "Do not paraphrase a supplied action into a new concrete action.",
    "Do not use first/then/next/before/after/finally unless the evidence establishes that relation.",
    "",
    "METAPHOR:",
    "If selected.mode is METAMORPHIC, commit to the figurative world.",
    "Do not timidly describe the metaphor. Perform it.",
    "A phrase may have both literal and figurative readings when the sequence clearly makes the figurative reading dominant.",
    "Do not ban idioms or double meanings merely because the words could also be literal.",
    "Invent language and meaning freely. Do not invent the world.",
    "Keep metaphor attached to supplied entities/actions or to clearly figurative status language.",
    "Judge phrases by how they function in the sequence, not by isolated words. Idioms, double meanings, personification, and figurative transformations are allowed when a reasonable viewer reads them as creative framing.",
    "Reject language that materially asserts new concrete physical evidence as fact.",
    "Allow figurative transformation freely when the sequence makes its nonliteral function clear.",
    "Do not turn a supplied action into an invented physical consequence, environmental change, or sensory aftermath.",
    "Do not expand a figurative phrase into unsupported literal scenery or sensory description.",
    "",
    "PROVENANCE:",
    "Mark each beat support as FACT or RELATION.",
    "FACT = one supplied fact is being transformed or presented; one source ID may be enough.",
    "RELATION = the line expresses accumulation, status shift, callback, whole-read metaphor, or a relationship across facts; cite at least TWO source IDs.",
    "Do not hang a global claim on one event.",
    "A single background event cannot become its own beat.",
    "",
    "ANTI-FAILURES:",
    "A shorter checklist is still a checklist.",
    "Do not emit task nouns or verbs merely because they were supplied.",
    "If every cut could appear on a receipt, try again internally.",
    "Do not write faux-profound poetry for its own sake.",
    "Do not expose labels like lens, relationship, perception, payoff, mechanic, or beat.",
    "",
    "Silently consider several realizations. Output only the strongest.",
    "Return JSON only: {\"beats\":[{\"text\":\"...\",\"support\":\"RELATION\",\"sourceEventIds\":[\"event-1\",\"event-2\"]}]}.",
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
          instruction: "Realize CREATIVE_DISCOVERY.selected as one coherent tiny world. Escalate status and implication across short cuts. Be bold and memorable. If the read is metamorphic, commit to it through status and figurative consequence, not invented sensory aftermath. Preserve literal truth, but do not flatten figurative language. Mark every beat FACT or RELATION and cite the evidence that supports its scope. Stop when it lands.",
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

    const support = clean(beat.support).toUpperCase() === "RELATION"
      ? "RELATION"
      : "FACT";

    const backgroundOnly = suppliedIds.length > 0 &&
      suppliedIds.every((id) => backgroundIdSet.has(id));

    /*
     * Background evidence may create a higher-order perception only as a set.
     * A single background event becoming its own beat is exactly the
     * one-fact-one-caption failure QRE must prevent.
     */
    if (backgroundOnly && suppliedIds.length < 2) return [];
    if (support === "RELATION" && suppliedIds.length < 2) return [];

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
