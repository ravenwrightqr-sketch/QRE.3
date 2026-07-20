/**
 * =====================================================
 * QRE EXPERIENCE WORLD CONTRACT
 * =====================================================
 *
 * Universal experience universes.
 *
 * NOT industries.
 * NOT templates.
 *
 * =====================================================
 */


export type WorldDomain =

  | "memory_world"

  | "relationship_world"

  | "commerce_world"

  | "culture_world"

  | "discovery_world"

  | "journey_world"

  | "identity_world"

  | "community_world";





export type ExperienceWorld = {


  domain:
    WorldDomain;



  archetype:
    string;



  atmosphere:
    string[];



  journey:
    string[];



  atoms:
    string[];



  themes:
    string[];


};