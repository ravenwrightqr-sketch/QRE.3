/**
 * =====================================================
 * QRE EXPERIENCE BLUEPRINT COMPOSER
 * =====================================================
 *
 * Experience Genome
 *        ↓
 * Experience World
 *        ↓
 * Experience Blueprint
 *
 * Composition only.
 *
 * The composer does not detect intent, create meaning, or execute
 * anything. It turns evidence already present in the genome/world into
 * the canonical blueprint consumed by the rest of the compiler.
 *
 * =====================================================
 */

import type {
  ExperienceBlueprint,
  ExperienceComponent,
  ExperienceGenome,
  ExperienceMoment,
  ExperienceMomentType,
  ExperienceTone,
  ExperienceType,
  ExperienceWorld,
  WorldDomain,
} from "@qre/contracts";

function resolveComponent(type: ExperienceMomentType): ExperienceComponent {
  const components: Partial<
    Record<ExperienceMomentType, ExperienceComponent>
  > = {
    welcome: "hero",
    introduction: "hero",
    story: "story",
    message: "story",
    reveal: "story",
    memory: "memory",
    meeting: "memory",
    family: "memory",
    friends: "memory",
    favorite_memories: "memory",
    highlights: "timeline",
    timeline: "timeline",
    milestone: "timeline",
    legacy: "timeline",
    future: "story",
    time_capsule: "timeline",
    photo: "gallery",
    photos: "gallery",
    video: "video",
    audio: "audio",
    soundtrack: "audio",
    media: "media",
    replay: "media",
    profile: "profile",
    social: "social",
    guestbook: "guestbook",
    guest_messages: "guestbook",
    arrival: "geo_memory",
    location: "geo_memory",
    venue: "geo_memory",
    product: "product",
    offer: "product",
    booking: "cta",
    payment: "payment",
    reward: "reward",
    review: "review",
    menu: "menu",
    ticket: "cta",
    merch: "product",
    education: "education",
    care_instructions: "education",
    interaction: "interaction",
    reaction: "interaction",
    share: "social",
    cta: "cta",
  };

  return components[type] ?? "story";
}

function unique(values: readonly unknown[]): string[] {
  return [
    ...new Set(
      values.filter(
        (value): value is string =>
          typeof value === "string" && value.trim().length > 0,
      ),
    ),
  ];
}

function resolveMomentType(value: string): ExperienceMomentType {
  const text = value.toLowerCase();

  if (/memory|remember|nostalg|past|history|legacy/.test(text)) {
    return "memory";
  }

  if (/people|person|friend|family|relationship|partner|together/.test(text)) {
    return "meeting";
  }

  if (/place|location|home|city|venue|travel|visit/.test(text)) {
    return "location";
  }

  if (/photo|image|picture/.test(text)) {
    return "photos";
  }

  if (/video|film|movie/.test(text)) {
    return "video";
  }

  if (/sound|song|music|audio/.test(text)) {
    return "audio";
  }

  if (/product|item|object|thing|purchase|buy|sell/.test(text)) {
    return "product";
  }

  if (/reward|gift|prize/.test(text)) {
    return "reward";
  }

  if (/learn|teach|instruction|guide|how to|education/.test(text)) {
    return "education";
  }

  if (/share|social|community|together/.test(text)) {
    return "share";
  }

  return "story";
}

function moment(
  type: ExperienceMomentType,
  title: string,
  description: string,
  order: number,
  genome: ExperienceGenome,
): ExperienceMoment {
  return {
    type,
    component: resolveComponent(type),
    title,
    subtitle: description,
    description,
    order,
    editable: true,
    demo: false,
    payload: {
      text: description,
      data: {
        source: "experience_genome",
        meaning: genome.meaning,
        entities: genome.entities,
        relationships: genome.relationships,
        semanticDNA: genome.dna,
        symbols: genome.symbols,
        worlds: genome.worlds,
      },
    },
  };
}

/**
 * Build runtime-facing moments directly from evidence in the genome.
 *
 * This intentionally does not depend on the removed object compiler.
 * It also avoids manufacturing a fixed narrative sequence for every prompt.
 */
function buildEvidenceMoments(
  genome: ExperienceGenome,
): ExperienceMoment[] {
  const moments: ExperienceMoment[] = [];

  const add = (
    type: ExperienceMomentType,
    title: string,
    description: string,
  ) => {
    if (!title.trim() || !description.trim()) return;
    moments.push(moment(type, title, description, moments.length, genome));
  };

  const intent = unique(genome.intent)[0];
  const why = unique(genome.meaning.why)[0];

  if (intent || why) {
    const title = intent ?? "Experience intent";
    add(
      resolveMomentType(title),
      title,
      why ?? `Built from the intent: ${title}.`,
    );
  }

  for (const person of unique(genome.entities.people).slice(0, 4)) {
    add("profile", person, `A person identified in the experience: ${person}.`);
  }

  for (const place of unique(genome.entities.places).slice(0, 3)) {
    add("location", place, `A place identified in the experience: ${place}.`);
  }

  for (const event of unique(genome.entities.events).slice(0, 4)) {
    add("story", event, `An event identified in the experience: ${event}.`);
  }

  for (const product of unique(genome.entities.products).slice(0, 4)) {
    add("product", product, `A product or offering identified in the experience: ${product}.`);
  }

  for (const memory of unique(genome.meaning.memories).slice(0, 3)) {
    add("memory", "Memory", memory);
  }

  for (const feeling of unique(genome.meaning.desiredFeeling).slice(0, 2)) {
    add("reveal", feeling, `Desired experience quality: ${feeling}.`);
  }

  if (!moments.length) {
    const fallback = unique([
      ...genome.themes,
      ...genome.symbols,
      ...genome.sensory,
      ...genome.tone,
    ])[0];

    if (fallback) {
      add("story", fallback, `A creative signal found in the experience: ${fallback}.`);
    }
  }

  if (!moments.length) {
    add(
      "welcome",
      "Experience",
      "An experience composed from the available semantic evidence.",
    );
  }

  return moments.map((item, index) => ({
    ...item,
    order: index,
  }));
}

function resolveWorlds(world: ExperienceWorld): WorldDomain[] {
  return unique([
    world.domain,
    ...(world.connectedWorlds ?? []),
  ]) as WorldDomain[];
}

function createTitle(
  genome: ExperienceGenome,
  world: ExperienceWorld,
): string {
  return (
    unique([
      world.worldIdentity?.name,
      genome.entities.people[0]
        ? `${genome.entities.people[0]} Experience`
        : undefined,
      genome.entities.places[0]
        ? `${genome.entities.places[0]} Experience`
        : undefined,
      genome.meaning.memories[0],
      genome.meaning.desiredFeeling[0]
        ? `${genome.meaning.desiredFeeling[0]} Experience`
        : undefined,
      genome.intent[0],
    ])[0] ?? "QRE Experience"
  );
}

function resolveExperienceType(
  worlds: WorldDomain[],
  genome: ExperienceGenome,
): ExperienceType {
  if (worlds.includes("commerce_world") || genome.commerce > 0.5) {
    return "business";
  }

  if (worlds.includes("memory_world") || genome.memory > 0.5) {
    return "story";
  }

  if (
    worlds.includes("discovery_world") ||
    worlds.includes("journey_world") ||
    genome.discovery > 0.5
  ) {
    return "journey";
  }

  return "journey";
}

export function composeBlueprint(
  genome: ExperienceGenome,
  world: ExperienceWorld,
): ExperienceBlueprint {
  if (!genome) {
    throw new Error("Genome required");
  }

  if (!world) {
    throw new Error("ExperienceWorld required");
  }

  const worlds = resolveWorlds(world);
  const moments = buildEvidenceMoments(genome);

  const tone = unique([
    genome.energy,
    ...genome.emotions,
    ...genome.tone,
  ]) as ExperienceTone[];

  return {
    title: createTitle(genome, world),
    type: resolveExperienceType(worlds, genome),
    tone: [...new Set(tone)],
    meaning: genome.meaning,
    moments,
    entities: genome.entities,
    metadata: {
      archetypes: genome.archetypes,
      themes: genome.themes,
      dna: genome.dna,
      worlds,
      artifacts: world.artifacts,
    },
  };
}

export const blueprintComposer = composeBlueprint;
