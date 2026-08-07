/**
 * =====================================================
 * QRE EXPERIENCE NARRATIVE COMPILER
 * =====================================================
 *
 * Cognitive narrative synthesis layer.
 *
 * Converts:
 *
 * Experience Intelligence
 *        ↓
 * World Meaning
 *        ↓
 * Emotional Possibilities
 *        ↓
 * Narrative Selection
 *        ↓
 * Human Experience Story
 *
 *
 * NOT:
 *
 * ❌ templates
 * ❌ chapters
 * ❌ UI text
 * ❌ fixed stories
 *
 *
 * IS:
 *
 * ✅ adaptive story generation
 * ✅ emotional reasoning
 * ✅ narrative evolution
 * ✅ memory creation
 * ✅ world-aware storytelling
 *
 * =====================================================
 */


import type {
  ExperienceNarrative,
  ExperienceGenome,
  ExperienceWorld,
  ExperienceBlueprint
} from "@qre/contracts";



import {
  buildNarrativeIntent
} from "./narrativeIntentEngine.js";


import {
  buildNarrativeStateGraph
} from "./narrativeStateGraph.js";


import {
  generateNarrativePaths
} from "./narrativePathGenerator.js";


import {
  evaluateNarrativePaths
} from "./narrativePathEvaluator.js";


import {
  buildNarrativeSequence
} from "./narrativeSequenceEngine.js";


import {
  weaveNarrative
} from "./narrativeWeaver.js";









export function compileExperienceNarrative(


  genome:ExperienceGenome,


  world:ExperienceWorld,


  blueprint:ExperienceBlueprint


):ExperienceNarrative {







/*
 *
 * Stage 1:
 *
 * Understand why this experience exists.
 *
 */


const intent =

buildNarrativeIntent(

 genome,

 world,

 blueprint

);









/*
 *
 * Stage 2:
 *
 * Create emotional world state.
 *
 */


const graph =

buildNarrativeStateGraph(

 intent,

 genome,

 world,

 blueprint

);









/*
 *
 * Stage 3:
 *
 * Generate possible emotional realities.
 *
 */


const pathSet =

generateNarrativePaths(

 intent,

 graph,

 genome,

 world,

 blueprint

);









/*
 *
 * Stage 4:
 *
 * Evaluate meaning,
 * memory,
 * transformation,
 * and world coherence.
 *
 */


const evaluation =

evaluateNarrativePaths(

 pathSet.paths,

 genome,

 world,

 blueprint

);









/*
 *
 * Stage 5:
 *
 * Select strongest reality.
 *
 */


const selected =

evaluation.selected;









/*
 *
 * Stage 6:
 *
 * Convert selected path
 * into emotional movement.
 *
 */


const sequence =

buildNarrativeSequence(

 selected.path,

 genome,

 world,

 blueprint

);









/*
 *
 * Stage 7:
 *
 * Create continuity and texture.
 *
 */


const woven =

weaveNarrative(

 sequence

);









/*
 *
 * Stage 8:
 *
 * Human experience language.
 *
 */


const story = [


...sequence.moments.map(

moment =>

moment.meaning

),



...woven.threads.map(

thread =>

thread.meaning

)


];



return {


title:

blueprint.title

??

world.worldIdentity.name

??

"A Human Experience",





emotionalArc:

sequence.transformation,





story,





voice:

genome.energy

??

world.worldIdentity.philosophy

??

"cinematic",





sensory:

[

...(genome.sensory ?? []),

...world.sensoryLanguage

],





/*
 *
 * Internal narrative cognition.
 *
 * Used by:
 *
 * - Cinematic Runtime
 * - Memory Engine
 * - Adaptive Evolution
 * - Replay Intelligence
 *
 */


narrativeIntelligence: {


intent,


selectedScore:

selected.score,


confidence:

selected.score,


reasoning:

selected.reasoning,


world:

world.worldIdentity.name,


journey:

sequence.moments.map(

moment =>

moment.state

)


}



};


}