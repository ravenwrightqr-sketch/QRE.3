import type {
  ExperienceGenome,
  ExperienceJourney,
  ExperienceMomentType
} from "@qre/contracts";

export type ExperienceStrategy = {
  goal:
    | "conversion"
    | "memory"
    | "storytelling"
    | "educate"
    | "retention"
    | "welcome";

  industry:
    | "business"
    | "personal"
    | "relationship"
    | "event"
    | "generic";

  type:
    | "story"
    | "business"
    | "journey";

  moments: ExperienceMomentType[];
};

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

function has(
  genome: ExperienceGenome,
  theme: string
): boolean {
  return genome.themes.includes(theme);
}

function hasEntity(
  genome: ExperienceGenome,
  collection: keyof ExperienceGenome["entities"]
): boolean {
  const value = genome.entities[collection];

  return Array.isArray(value) && value.length > 0;
}

function resolveGoal(
  genome: ExperienceGenome
): ExperienceStrategy["goal"] {

  if (genome.commerce >= 0.7) {
    return "conversion";
  }

  if (genome.memory >= 0.7) {
    return "memory";
  }

  if (has(genome, "connection")) {
    return "storytelling";
  }

  if (has(genome, "education")) {
    return "educate";
  }

  if (genome.replay >= 0.7) {
    return "retention";
  }

  return "welcome";
}

function resolveIndustry(
  genome: ExperienceGenome
): ExperienceStrategy["industry"] {

  if (has(genome, "commerce")) {
    return "business";
  }

  if (has(genome, "memory")) {
    return "personal";
  }

  if (has(genome, "relationship")) {
    return "relationship";
  }

  if (has(genome, "culture")) {
    return "event";
  }

  return "generic";
}

function resolveType(
  genome: ExperienceGenome
): ExperienceStrategy["type"] {

  if (genome.memory >= 0.7) {
    return "story";
  }

  if (genome.commerce >= 0.7) {
    return "business";
  }

  return "journey";
}

function pushMediaMoments(
  genome: ExperienceGenome,
  moments: ExperienceMomentType[]
): void {

  if (
    hasEntity(genome, "media") ||
    genome.immersion >= 0.8
  ) {
    moments.push(
      "photos",
      "video"
    );
  }
}

function pushServiceMoments(
  genome: ExperienceGenome,
  moments: ExperienceMomentType[]
): void {

  const text =
    genome.entities.keywords
      .join(" ")
      .toLowerCase();

  const service =
    /(clean|cleaned|cleaning|service|repair|maintenance|inspection|delivery|arrived|arrival|finished|complete|completed|appointment)/.test(
      text
    );

  if (!service) {
    return;
  }

  moments.push(
    "location",
    "timeline",
    "photos",
    "story"
  );
}

function pushCommerceMoments(
  genome: ExperienceGenome,
  moments: ExperienceMomentType[]
): void {

  if (
    genome.commerce >= 0.7 ||
    has(genome, "commerce")
  ) {
    moments.push("product");
  }

  if (
    genome.replay >= 0.7 ||
    has(genome, "discovery") ||
    has(genome, "reward")
  ) {
    moments.push("reward");
  }
}

function pushMemoryMoments(
  genome: ExperienceGenome,
  moments: ExperienceMomentType[]
): void {

  if (
    genome.memory >= 0.7 ||
    has(genome, "memory") ||
    hasEntity(genome, "events")
  ) {
    moments.push(
      "memory",
      "timeline"
    );
  }
}

function pushSocialMoments(
  genome: ExperienceGenome,
  moments: ExperienceMomentType[]
): void {

  if (
    genome.social !== "solo" ||
    has(genome, "connection") ||
    has(genome, "culture")
  ) {
    moments.push("share");
  }
}

export function compileExperienceStrategy(
  genome: ExperienceGenome
): ExperienceStrategy {

  const moments: ExperienceMomentType[] = [
    "welcome"
  ];

  if (genome.journey.includes("arrival")) {
    moments.push("introduction");
  }

  if (
    genome.journey.includes("discovery") ||
    genome.discovery >= 0.7
  ) {
    moments.push("story");
  }

  pushMemoryMoments(
    genome,
    moments
  );

  pushServiceMoments(
    genome,
    moments
  );

  pushMediaMoments(
    genome,
    moments
  );

  pushCommerceMoments(
    genome,
    moments
  );

  if (
    hasEntity(genome, "places")
  ) {
    moments.push("location");
  }

  if (
    hasEntity(genome, "people") &&
    genome.social !== "solo"
  ) {
    moments.push("profile");
  }

  if (
    genome.journey.includes(
      "transformation"
    )
  ) {
    moments.push("story");
  }

  if (
    genome.journey.includes("peak")
  ) {
    moments.push("video");
  }

  pushSocialMoments(
    genome,
    moments
  );

  moments.push("message");

  return {
    goal: resolveGoal(genome),
    industry: resolveIndustry(genome),
    type: resolveType(genome),
    moments: unique(moments)
  };
}

export function inferJourney(
  genome: ExperienceGenome
): ExperienceJourney[] {

  const journey: ExperienceJourney[] = [
    "arrival"
  ];

  if (
    genome.discovery >= 0.6 ||
    has(genome, "discovery")
  ) {
    journey.push("discovery");
  }

  if (
    genome.memory >= 0.6 ||
    has(genome, "memory")
  ) {
    journey.push("memory");
  }

  if (
    genome.journey.includes(
      "transformation"
    )
  ) {
    journey.push("transformation");
  }

  if (
    genome.immersion >= 0.7 ||
    has(genome, "culture")
  ) {
    journey.push("peak");
  }

  if (
    genome.social !== "solo"
  ) {
    journey.push("share");
  }

  journey.push("return");

  return unique(journey);
}
