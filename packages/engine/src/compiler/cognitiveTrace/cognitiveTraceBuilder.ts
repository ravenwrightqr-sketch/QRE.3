/**
 * =====================================================
 * QRE COGNITIVE TRACE BUILDER
 * =====================================================
 *
 * Explainable Compiler Reasoning Layer
 *
 * Converts the entire Compiler Brain journey into
 * a human-readable reasoning artifact.
 *
 * Prompt
 *    ↓
 * Understanding
 *    ↓
 * Genome
 *    ↓
 * SemanticIR
 *    ↓
 * NUVO
 *    ↓
 * REVIK
 *    ↓
 * MOVER
 *    ↓
 * KAIVO
 *    ↓
 * ORION
 *    ↓
 * Cognitive Trace
 *
 *
 * This does not execute.
 * This does not generate experience.
 *
 * It explains why the compiler arrived there.
 *
 * NO DATABASE
 * NO RUNTIME
 * =====================================================
 */

import type {
  ExperienceCognitiveTrace,
  CognitiveTraceStep,
  CognitiveReasoningEdge,
} from "@qre/contracts";


import type {
  ExperienceGenome,
  SemanticIR,
  MoverArc,
  MoverTopology,
} from "@qre/contracts";


import type {
  NuvoField,
} from "../nuvo/index.js";


import type {
  RevikField,
} from "../revik/index.js";


import type {
  KaivoField,
} from "../kaivo/index.js";


import type {
  OrionField,
} from "../orion/index.js";




function createStep(
 layer:CognitiveTraceStep["layer"],
 title:string,
 purpose:string,
 inputs:string[],
 observations:string[],
 reasoning:string,
 outcome:string,
 confidence:number
):CognitiveTraceStep {


 return {

  layer,

  title,

  purpose,

  inputs,

  observations,

  reasoning,

  outcome,

  confidence

 };


}



function buildUnderstandingTrace(
 understanding:any
):CognitiveTraceStep {


return createStep(

 "understanding",

 "Human Understanding",

 "Discover hidden structure inside human expression.",

 [

  understanding.prompt

 ],

 [

  ...(understanding.emotions?.emotions ?? []),

  ...(understanding.intent ?? [])

 ],


 `
The prompt was analyzed for emotional signals,
intent, entities, relationships, and world context.

The compiler first identifies what the human
is trying to express before creating anything.
 `,


 `
Primary intent discovered:
${JSON.stringify(
 understanding.intent
)}

Emotional foundation:
${understanding.emotions?.emotions?.join(", ")}
 `,


 understanding.confidence ?? .8

);


}







function buildGenomeTrace(
 genome:ExperienceGenome
):CognitiveTraceStep {


return createStep(

 "genome",

 "Experience Genome",

 "Extract creative DNA from understood meaning.",


 [

  "Understanding layer"

 ],


 [

  ...genome.themes,

  ...genome.dna

 ],


 `
The compiler converted human intent into
a structured creative genome.

The genome represents what exists:
themes, symbols, emotions, and identity signals.
 `,


 `
Creative DNA discovered:

${genome.dna.join(", ")}

Themes:

${genome.themes.join(", ")}
 `,


 .85

);


}









function buildSemanticTrace(
 semanticIR:SemanticIR
):CognitiveTraceStep {


return createStep(

 "semanticIR",

 "Semantic Reality",

 "Build the internal meaning graph.",


 [

  "Experience Genome"

 ],


 [

  `Nodes: ${semanticIR.nodes.length}`,

  `Edges: ${semanticIR.edges.length}`,

  semanticIR.emotionalGravity

 ],


 `
Meaning was not treated as isolated data.

The compiler connected entities, emotions,
concepts, contradictions, and evidence into
a semantic graph.

 `,


 `
Root meaning:

${semanticIR.rootMeaningNodeId}


Transformation:

${semanticIR.transformation}


Unanswered question:

${semanticIR.unansweredQuestion}
 `,


 semanticIR.confidence

);


}









function buildNuvoTrace(
 nuvo:NuvoField
):CognitiveTraceStep {


return createStep(

 "nuvo",

 "NUVO Possibility Intelligence",

 "Discover what the experience could become.",


 [

  "Semantic Reality"

 ],


 [

  ...nuvo.futureRealities.map(
   future=>future.name
  )

 ],


 `
NUVO explored latent possibilities.

It searched for future realities,
hidden potential, and creative mutations.
 `,


 `
Future realities discovered:

${nuvo.futureRealities
.map(
 future=>future.name
)
.join(", ")}

Possibility strength:

${nuvo.resonance}
 `,


 .9

);


}









function buildRevikTrace(
 revik:RevikField
):CognitiveTraceStep {


return createStep(

 "revik",

 "REVIK Transformation Intelligence",

 "Discover how meaning evolves.",


 [

  "NUVO possibility field"

 ],


 [

  ...revik.futureStates,

  ...revik.identityShifts

 ],


 `
REVIK converts possibility into movement.

It identifies transformation chains,
identity changes, and evolution paths.
 `,


 `
Dominant movement:

${revik.dominantMotion}


Future states:

${revik.futureStates.join(", ")}
 `,


 revik.evolutionStrength

);


}









function buildMoverTrace(
 moverArc:MoverArc,
 topology:MoverTopology
):CognitiveTraceStep {


return createStep(

 "moverArc",

 "MOVER Transformation Movement",

 "Understand how transformation travels.",


 [

  "REVIK evolution"

 ],


 [

  moverArc.origin,

  moverArc.destination,

  ...topology.dominantPath

 ],


 `
MOVER analyzes the path between states.

It determines movement topology,
transformation force, and dominant direction.
 `,


 `
Movement:

${moverArc.origin}
 →
${moverArc.destination}


Dominant path:

${topology.dominantPath.join(" → ")}
 `,


 moverArc.confidence

);


}









function buildKaivoTrace(
 kaivo:KaivoField
):CognitiveTraceStep {


return createStep(

 "kaivo",

 "KAIVO Meaning Relationships",

 "Discover why relationships matter.",


 [

  "Mover transformation field"

 ],


 [

  ...kaivo.meaningClusters.map(
   cluster=>cluster.name
  )

 ],


 `
KAIVO discovers meaning gravity between
entities, memories, emotions, and identities.
 `,


 `
Dominant force:

${kaivo.dominantForce}


Meaning clusters:

${kaivo.meaningClusters
.map(
 cluster=>cluster.name
)
.join(", ")}
 `,


 kaivo.coherence

);


}









function buildOrionTrace(
 orion:OrionField
):CognitiveTraceStep {


return createStep(

 "orion",

 "ORION Meaning Gravity",

 "Find the final semantic attractor.",


 [

  "KAIVO resonance field"

 ],


 [

  ...orion.dominantNodes

 ],


 `
ORION receives all previous intelligence layers.

It determines where meaning naturally converges.

This is the final semantic gravity field.
 `,


 `
Core vector:

${orion.coreVector}


Human need:

${orion.humanNeed}


Mission:

${orion.creativeMission}


Synthesis:

${orion.synthesis}
 `,


 orion.gravity

);


}









function buildEdges()
:CognitiveReasoningEdge[]{


const layers:CognitiveReasoningEdge["from"][]=[

 "understanding",

 "genome",

 "semanticIR",

 "nuvo",

 "revik",

 "moverArc",

 "moverTopology",

 "kaivo",

 "orion"

];


return layers.slice(0,-1)
.map(

(layer,index)=>({

 from:layer,

 to:layers[index+1],

 relationship:

  "derived cognitive transformation"

})

);


}









function buildConclusion(
 orion:OrionField
):string {


return `

The compiler transformed human intent into a semantic experience.

Meaning gravity converged around:

${orion.coreVector}


The dominant human need discovered was:

${orion.humanNeed}


The final creative mission became:

${orion.creativeMission}


The compiler determined this direction because
all previous intelligence layers converged toward:

${orion.synthesis}

`;

}









export function buildCognitiveTrace(

 input:{

  understanding:any;

  genome:ExperienceGenome;

  semanticIR:SemanticIR;

  nuvo:NuvoField;

  revik:RevikField;

  moverArc:MoverArc;

  moverTopology:MoverTopology;

  kaivo:KaivoField;

  orion:OrionField;

 }

):ExperienceCognitiveTrace {


const steps = [

 buildUnderstandingTrace(input.understanding),

 buildGenomeTrace(input.genome),

 buildSemanticTrace(input.semanticIR),

 buildNuvoTrace(input.nuvo),

 buildRevikTrace(input.revik),

 buildMoverTrace(
  input.moverArc,
  input.moverTopology
 ),

 buildKaivoTrace(input.kaivo),

 buildOrionTrace(input.orion)

];

return {

 steps,

 edges:buildEdges(),


 compilerConclusion:

  buildConclusion(
   input.orion
  ),


 dominantReasoning:

  input.orion.synthesis,


 unresolvedQuestions:

  [

   ...input.semanticIR.unansweredQuestion
    ? 
      [input.semanticIR.unansweredQuestion]
    :
      [],


   ...input.nuvo.futureQuestions,


   ...input.revik.unansweredPaths

  ],


 confidence:

  steps.reduce(

   (sum,step)=>

    sum + step.confidence,

   0

  )
  /
  steps.length,


 version:1

};


}