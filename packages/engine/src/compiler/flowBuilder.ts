/**
 * =====================================================
 * QRE EXPERIENCE FLOW BUILDER
 * =====================================================
 *
 * Converts:
 *
 * Experience Blueprint
 *        ↓
 * Runtime FlowSteps
 *
 * Responsibilities:
 *
 * - Validate blueprint
 * - Compile every moment
 * - Produce runtime FlowSteps
 *
 * NO DATABASE
 * NO PRISMA
 * NO EXECUTION
 *
 * =====================================================
 */

import type {
  ExperienceBlueprint,
  FlowStep,
} from "@qre/contracts";

import {
  compileMoment,
} from "./templates/moments/momentCompiler.js";

export function buildFlowSteps(
  blueprint: ExperienceBlueprint
): FlowStep[] {

  if (!blueprint.moments.length) {
    throw new Error(
      "Experience blueprint contains no moments."
    );
  }

  return blueprint.moments.map(
    (moment, index) =>
      compileMoment(
        moment,
        index
      )
  );

}