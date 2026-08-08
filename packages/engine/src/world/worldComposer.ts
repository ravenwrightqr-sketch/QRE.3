import type {
  ExperienceArchetype,
  ExperienceGenome,
  ExperienceWorld,
  WorldDomain,
  WorldRole,
} from "@qre/contracts";
import { resolveWorldDomain } from "./worldDomain.js";

export function composeWorld(genome: ExperienceGenome): ExperienceWorld {
  const domain = resolveWorldDomain(genome);
  const primary = genome.entities.people[0] ?? genome.entities.creatures[0] ?? genome.entities.objects[0] ?? genome.entities.places[0];
  const role = resolveRole(genome);
  const purpose = genome.meaning.desiredFeeling[0] ?? genome.meaning.memories[0] ?? genome.meaning.why[0] ?? "Create an experience from the user's idea.";
  const themes = unique([...genome.themes, ...genome.emotions, ...genome.entities.events]);
  const moments = genome.object?.moments ?? [];

  const worldIdentity = {
    name: primary ? `${primary}'s Experience` : "QRE Experience",
    description: purpose,
    philosophy: purpose,
    origin: primary ? `Derived from the user's description of ${primary}.` : "Derived from the user's prompt.",
    promise: purpose,
    emotionalCore: genome.emotions[0] ?? "meaning",
    symbol: primary ?? "experience",
  };

  const signature = {
    semantic: unique([...genome.dna, ...genome.themes, ...genome.entities.events]),
    emotional: unique(genome.emotions),
    visual: unique(genome.sensory.visual),
    sensory: unique([...genome.sensory.audio, ...genome.sensory.atmosphere]),
  };

  const transformation = genome.transformation.length
    ? {
        before: genome.transformation[0] ?? "",
        journey: genome.transformation.join(" → "),
        after: genome.transformation[genome.transformation.length - 1] ?? "",
      }
    : undefined;

  return {
    domain,
    archetype: resolveArchetype(genome),
    role,
    purpose,
    worldIdentity,
    worldLaws: [],
    signature,
    emotionalPhysics: unique(genome.emotions),
    sensoryLanguage: unique([...genome.sensory.visual, ...genome.sensory.audio, ...genome.sensory.atmosphere]),
    transformation,
    journey: moments.length ? moments.map((moment) => moment.title).filter(Boolean) : ["experience"],
    atoms: unique([...genome.dna, ...genome.entities.objects, ...genome.entities.creatures, ...genome.entities.events]),
    themes,
    connectedWorlds: genome.worlds.filter((world) => world !== domain) as WorldDomain[],
    artifacts: [{ world: domain, moments: [], metadata: { source: "cognition", primaryEntity: primary } }],
  };
}

function resolveRole(genome: ExperienceGenome): WorldRole {
  if (genome.memory > 0.4 || genome.meaning.memories.length) return "remember";
  if (genome.relationships.length || genome.interaction > 0.4) return "connect";
  if (genome.discovery > 0.4) return "discover";
  if (genome.commerce > 0.4) return "sell";
  if (genome.themes.includes("education")) return "teach";
  if (genome.themes.includes("celebration")) return "celebrate";
  return "transform";
}

function resolveArchetype(genome: ExperienceGenome): ExperienceArchetype {
  if (genome.memory > 0.6) return "memory_archive";
  if (genome.discovery > 0.6) return "discovery_adventure";
  if (genome.relationships.length || genome.interaction > 0.6) return "relationship_journey";
  if (genome.commerce > 0.6) return "premium_brand_world";
  if (genome.themes.includes("community")) return "community_movement";
  return "cinematic_story";
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter((value): value is string => Boolean(value?.trim())))];
}
