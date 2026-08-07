import type {
  ExperienceGenome,
  ExperienceWorld,
} from "@qre/contracts";

export interface HumanMeaning {
  subject: string;
  identity: string;
  ordinaryReality: string;
  hiddenDesire: string;
  emotionalTension: string;
  transformation: string;
  memoryReason: string;
  hiddenMeaning: string;
  emotionalMovement: string;
  storyTruth: string;
}

/**
 * =====================================================
 *
 * HUMAN MEANING DISCOVERY ENGINE
 *
 * Converts structured experience signals into semantic
 * meaning for downstream narrative systems.
 *
 * This layer does NOT write narrative prose.
 * Narrative expression belongs downstream.
 *
 * =====================================================
 */

export function resolveHumanMeaning(
  genome: ExperienceGenome,
  world: ExperienceWorld,
): HumanMeaning {
  const subject = discoverSubject(genome);
  const identity = discoverIdentity(genome);

  const ordinaryReality =
    discoverOrdinaryReality(genome, world);

  const hiddenDesire =
    discoverHumanDesire(genome);

  const emotionalTension =
    discoverEmotionalTension(genome);

  const transformation =
    discoverTransformation(genome);

  const memoryReason =
    discoverMemoryReason(genome);

  const hiddenMeaning =
    buildHiddenMeaning(
      hiddenDesire,
      transformation,
    );

  const emotionalMovement =
    buildEmotionalMovement(
      emotionalTension,
      transformation,
      memoryReason,
    );

  const storyTruth =
    buildStoryTruth(
      subject,
      identity,
      hiddenMeaning,
    );

  return {
    subject,
    identity,
    ordinaryReality,
    hiddenDesire,
    emotionalTension,
    transformation,
    memoryReason,
    hiddenMeaning,
    emotionalMovement,
    storyTruth,
  };
}

function discoverSubject(
  genome: ExperienceGenome,
): string {
  const creatures =
    cleanStrings(genome.entities.creatures);

  const people =
    cleanStrings(genome.entities.people);

  const objects =
    cleanStrings(genome.entities.objects);

  const namedCreature =
    creatures.find(
      value => !isGenericCreature(value),
    );

  if (namedCreature) {
    return namedCreature;
  }

  const namedPerson =
    people.find(
      value => !isGenericPerson(value),
    );

  if (namedPerson) {
    return namedPerson;
  }

  const namedObject =
    objects.find(
      value => !isGenericObject(value),
    );

  if (namedObject) {
    return namedObject;
  }

  if (people.length > 0) {
    return people[0];
  }

  if (creatures.length > 0) {
    return creatures[0];
  }

  if (objects.length > 0) {
    return objects[0];
  }

  return "experience";
}

function discoverIdentity(
  genome: ExperienceGenome,
): string {
  const creatures =
    cleanStrings(genome.entities.creatures);

  const people =
    cleanStrings(genome.entities.people);

  const organizations =
    cleanStrings(
      genome.entities.organizations,
    );

  if (
    creatures.some(
      value => !isGenericCreature(value),
    )
  ) {
    return "named companion";
  }

  if (creatures.length > 0) {
    return "companion";
  }

  if (people.length > 0) {
    return "person";
  }

  if (organizations.length > 0) {
    return "organization";
  }

  return "experience";
}

function discoverOrdinaryReality(
  genome: ExperienceGenome,
  world: ExperienceWorld,
): string {
  const values = uniqueStrings([
    ...cleanStrings(genome.entities.people),
    ...cleanStrings(genome.entities.creatures),
    ...cleanStrings(genome.entities.places),
    ...cleanStrings(genome.entities.objects),
    ...cleanStrings(world.domain),
    ...cleanStrings(genome.themes),
  ]);

  if (values.length > 0) {
    return values.slice(0, 8).join(", ");
  }

  return "experience";
}

function discoverHumanDesire(
  genome: ExperienceGenome,
): string {
  const values = uniqueStrings([
    ...cleanStrings(
      genome.meaning?.desiredFeeling,
    ),
    ...cleanStrings(
      genome.meaning?.memories,
    ),
    ...cleanStrings(genome.themes),
  ]);

  if (values.length === 0) {
    return "unspecified";
  }

  return values.slice(0, 8).join(", ");
}

function discoverEmotionalTension(
  genome: ExperienceGenome,
): string {
  const emotions =
    cleanStrings(genome.emotions);

  const meaningSignals = cleanStrings([
    ...(genome.meaning?.desiredFeeling ?? []),
    ...(genome.meaning?.memories ?? []),
  ]);

  const values =
    uniqueStrings([
      ...emotions,
      ...meaningSignals,
    ]);

  if (values.length > 0) {
    return values.slice(0, 8).join(", ");
  }

  if (genome.interaction > 0.5) {
    return "interaction";
  }

  if (genome.memory > 0.5) {
    return "memory";
  }

  return "unspecified";
}

function discoverTransformation(
  genome: ExperienceGenome,
): string {
  const values =
    cleanStrings(genome.transformation);

  if (values.length > 0) {
    return uniqueStrings(values).join(", ");
  }

  if (genome.memory > 0.5) {
    return "memory";
  }

  if (genome.interaction > 0.5) {
    return "connection";
  }

  if (genome.replay > 0.5) {
    return "replay";
  }

  return "unspecified";
}

function discoverMemoryReason(
  genome: ExperienceGenome,
): string {
  const memories =
    cleanStrings(
      genome.meaning?.memories,
    );

  if (memories.length > 0) {
    return memories.slice(0, 8).join(", ");
  }

  if (genome.memory > 0.5) {
    return "memory";
  }

  if (genome.replay > 0.5) {
    return "replay";
  }

  return "unspecified";
}

function buildHiddenMeaning(
  desire: string,
  transformation: string,
): string {
  return [
    normalize(desire),
    normalize(transformation),
  ]
    .filter(Boolean)
    .join(" → ");
}

function buildEmotionalMovement(
  tension: string,
  transformation: string,
  memory: string,
): string {
  return [
    normalize(tension),
    normalize(transformation),
    normalize(memory),
  ]
    .filter(Boolean)
    .join(" | ");
}

function buildStoryTruth(
  subject: string,
  identity: string,
  hiddenMeaning: string,
): string {
  return [
    normalize(subject),
    normalize(identity),
    normalize(hiddenMeaning),
  ]
    .filter(Boolean)
    .join(" | ");
}

function normalize(
  value: unknown,
): string {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .replace(/[_]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\s*,\s*/g, ", ")
    .trim();
}

function cleanStrings(
  values: unknown,
): string[] {
  if (!Array.isArray(values)) {
    return [];
  }

  return values
    .filter(
      value => typeof value === "string",
    )
    .map(value => normalize(value))
    .filter(Boolean);
}

function uniqueStrings(
  values: unknown[],
): string[] {
  return [
    ...new Set(
      values
        .filter(
          value => typeof value === "string",
        )
        .map(value => normalize(value))
        .filter(Boolean),
    ),
  ];
}

function isGenericCreature(
  value: string,
): boolean {
  return new Set([
    "dog",
    "dogs",
    "cat",
    "cats",
    "pet",
    "pets",
    "animal",
    "animals",
    "bird",
    "birds",
    "horse",
    "horses",
    "rabbit",
    "rabbits",
    "creature",
    "creatures",
  ]).has(value.toLowerCase());
}

function isGenericPerson(
  value: string,
): boolean {
  return new Set([
    "person",
    "people",
    "someone",
    "somebody",
    "user",
    "users",
    "customer",
    "customers",
    "visitor",
    "visitors",
    "guest",
    "guests",
  ]).has(value.toLowerCase());
}

function isGenericObject(
  value: string,
): boolean {
  return new Set([
    "object",
    "objects",
    "thing",
    "things",
    "item",
    "items",
    "product",
    "products",
  ]).has(value.toLowerCase());
}