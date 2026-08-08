/**
 * =====================================================
 * QRE WORLD DOMAIN PROJECTION
 * =====================================================
 *
 * World domains are downstream presentation labels.
 * They are deliberately NOT used as the semantic authority for
 * universal prompt understanding.
 *
 * The universal compiler can describe memory, commerce, culture,
 * relationships, discovery, identity, or community through its
 * evidence and affordances without forcing the entire experience
 * into one domain.
 *
 * =====================================================
 */

import type { ExperienceGenome, WorldDomain } from "@qre/contracts";

export function resolveWorldDomain(_genome: ExperienceGenome): WorldDomain {
  return "experience_world";
}
