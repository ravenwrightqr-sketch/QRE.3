import {
  runCompilerBrain,
} from "@qre/engine";


import type {
  CompiledExperience,
} from "@qre/contracts";



/**
 * =====================================================
 *
 * QRE EXPERIENCE SERVICE
 *
 * API APPLICATION BOUNDARY
 *
 * Route
 *   ↓
 * Experience Service
 *   ↓
 * Compiler Brain
 *   ↓
 * Compiled Experience Contract
 *
 *
 * Responsibilities:
 *
 * ✅ Validate human input
 * ✅ Invoke engine compiler
 * ✅ Return production contract
 *
 *
 * Does NOT:
 *
 * ❌ Database writes
 * ❌ Prisma ownership
 * ❌ Flow creation
 * ❌ Runtime execution
 * ❌ Player rendering
 *
 *
 * =====================================================
 */



/**
 * =====================================================
 *
 * COMPILE EXPERIENCE
 *
 * Human Prompt
 *
 *        ↓
 *
 * Compiler Brain
 *
 *        ↓
 *
 * Production Experience Object
 *
 *
 * Pure operation.
 *
 * No persistence.
 *
 * =====================================================
 */


export async function compileExperience(

  prompt: string

): Promise<CompiledExperience> {



  if (

    typeof prompt !== "string"

    ||

    prompt.trim().length === 0

  ) {

    throw new Error(

      "Experience prompt required."

    );

  }



  const result =

    runCompilerBrain(

      prompt.trim()

    );



  return result.compiled;

}