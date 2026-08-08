import type { ExperienceGenome, WorldDomain } from "@qre/contracts";

/**
 * Resolve the experiential domain from evidence already present in the genome.
 * No domain receives a hidden default advantage.
 */
export function resolveWorldDomain(genome: ExperienceGenome): WorldDomain {
  const scores = new Map<WorldDomain, number>([
    ["memory_world", 0],
    ["relationship_world", 0],
    ["commerce_world", 0],
    ["culture_world", 0],
    ["discovery_world", 0],
    ["journey_world", 0],
    ["identity_world", 0],
    ["community_world", 0],
    ["service_world", 0],
    ["transformation_world", 0],
  ]);

  const add = (world: WorldDomain, amount: number) =>
    scores.set(world, (scores.get(world) ?? 0) + amount);

  if (genome.memory > 0.4 || genome.meaning.memories.length) add("memory_world", 3);
  if (genome.relationships.length || genome.interaction > 0.4) add("relationship_world", 3);
  if (genome.commerce > 0.4 || genome.entities.products.length) add("commerce_world", 3);
  if (genome.discovery > 0.4) add("discovery_world", 3);
  if (genome.entities.events.length || genome.themes.includes("culture")) add("culture_world", 2);
  if (genome.entities.people.length || genome.entities.creatures.length || genome.entities.objects.length) add("identity_world", 2);
  if (genome.themes.includes("community")) add("community_world", 3);
  if (genome.themes.includes("service") || genome.themes.includes("grooming")) add("service_world", 3);
  if (genome.transformation.length) add("transformation_world", 3);

  const winner = [...scores.entries()]
    .sort((a, b) => b[1] - a[1])[0];

  return winner && winner[1] > 0 ? winner[0] : "journey_world";
}
