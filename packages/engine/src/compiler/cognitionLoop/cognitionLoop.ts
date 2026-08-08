/**
 * =====================================================
 * QRE COGNITION LOOP CONTROLLER
 * =====================================================
 *
 * ROLE:
 *
 * Executive metacognitive orchestrator.
 *
 *
 * This file does NOT contain intelligence.
 *
 * It coordinates intelligence systems.
 *
 *
 * Pipeline:
 *
 * Human Prompt
 *      ↓
 * Hypothesis
 *      ↓
 * Reflection
 *      ↓
 * Curiosity
 *      ↓
 * Critic
 *      ↓
 * Consolidation
 *      ↓
 * Improved Cognitive State
 *
 *
 * =====================================================
 */


import type {
 CompilerMind
} from "@qre/contracts";

import {
 runAttentionPass
} from "./attentionPass.js";

import {
 runHypothesisPass
} from "./hypothesisPass.js";


import {
 runReflectionPass
} from "./reflectionPass.js";


import {
 runCuriosityPass
} from "./curiosityPass.js";


import {
 runCriticPass
} from "./criticPass.js";


import {
 runConsolidationPass
} from "./consolidationPass.js";





export function runCognitionLoop(

 mind:CompilerMind

):CompilerMind {



let updated =
 mind;


updated =
 runAttentionPass(
  updated
 );


updated =
 runHypothesisPass(
  updated
 );



updated =
 runReflectionPass(
  updated
 );



updated =
 runCuriosityPass(
  updated
 );



updated =
 runCriticPass(
  updated
 );



updated =
 runConsolidationPass(
  updated
 );



return updated;



}