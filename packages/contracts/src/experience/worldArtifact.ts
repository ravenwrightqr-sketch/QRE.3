/**
 * =====================================================
 * QRE WORLD ARTIFACT CONTRACT
 * =====================================================
 *
 * World Compiler
 *        ↓
 * WorldArtifact
 *        ↓
 * Blueprint Composer
 *
 * Canonical world output.
 *
 * NO DATABASE
 * NO EXECUTION
 *
 * =====================================================
 */

import type {
  WorldDomain,
} from "./world.js";

import type {
  ExperienceMoment,
} from "./moment.js";


export type WorldArtifact = {

  world:
    WorldDomain;


  moments:
    ExperienceMoment[];


  metadata?:
    Record<string, unknown>;

};