/**
 * =====================================================
 * QRE EXPERIENCE WORLD CONTRACT
 * =====================================================
 *
 * A world is a presentation projection, not the compiler's
 * understanding of the user's subject.
 *
 * Domain-specific worlds remain available for downstream UI,
 * but the universal compiler may legitimately emit the neutral
 * experience_world when no domain should dominate the experience.
 *
 * =====================================================
 */

export type WorldDomain =
  | "experience_world"
  | "memory_world"
  | "relationship_world"
  | "commerce_world"
  | "culture_world"
  | "discovery_world"
  | "journey_world"
  | "identity_world"
  | "community_world";

export type ExperienceWorld = {
  domain: WorldDomain;
  archetype: string;
  atmosphere: string[];
  journey: string[];
  atoms: string[];
  themes: string[];
};
