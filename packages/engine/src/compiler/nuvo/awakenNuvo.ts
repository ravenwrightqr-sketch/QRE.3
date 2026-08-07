/**
 * =====================================================
 * QRE NUVO AWAKEN
 * =====================================================
 *
 * Possibility Intelligence Implementation.
 *
 * Question:
 *
 * What else could exist?
 *
 * Genome:
 * What exists.
 *
 * Semantic:
 * How things connect.
 *
 * NUVO:
 * What possibilities emerge.
 *
 * NO DATABASE.
 * NO RUNTIME.
 * NO INDUSTRY LOGIC.
 *
 * =====================================================
 */

import type {
  CompilerMind,
  NuvoField,
  NuvoFuture,
  NuvoMutation,
} from "@qre/contracts";


function unique(
  values:string[]
):string[] {

  return [
    ...new Set(
      values.filter(Boolean)
    )
  ];

}



/**
 * =====================================================
 *
 * FUTURE POSSIBILITY DISCOVERY
 *
 * Converts semantic reality into possible futures.
 *
 * =====================================================
 */

function discoverFutureRealities(
  mind:CompilerMind
):NuvoFuture[] {


  const meaning =
    mind.meaningContext;


  const semantic =
    mind.semanticIR;


  const futures:NuvoFuture[] = [];



  if(
    meaning?.themes?.length
  ){

    futures.push({

      id:"meaning_evolution",

      name:
      `${meaning.themes[0]}_evolution`,

      description:
      "A possible future emerges from current meaning structures.",

      transformation:
      "existing meaning → expanded possibility",

      confidence:.7,


      originSignals:
      meaning.themes,


      emergenceConditions:[
        "semantic coherence"
      ],


      meaningShift:
      "Current state becomes expanded experience.",


      emotionalDirection:
      "deeper meaning"

    });

  }



  if(
    semantic?.nodes &&
    semantic.nodes.length > 0
  ){

    futures.push({

      id:"semantic_expansion",

      name:
      "semantic_world_expansion",

      description:
      "Connected concepts evolve into larger possibility structures.",

      transformation:
      "concepts → relationships → world",

      confidence:.65,


      originSignals:[
        "semantic graph"
      ],


      emergenceConditions:[
        "relationship density"
      ],


      meaningShift:
      "Isolated concepts become connected systems.",


      emotionalDirection:
      "discovery"

    });

  }


  return futures;

}



/**
 * =====================================================
 *
 * MUTATION DISCOVERY
 *
 * Finds structures capable of transformation.
 *
 * =====================================================
 */

function discoverMutations(
  mind:CompilerMind
):NuvoMutation[] {


  const mutations:NuvoMutation[] = [];



  if(
    mind.genome.relationships.length
  ){

    mutations.push({

      source:
      "relationship",


      evolution:
      "connection becomes evolving network",


      potential:
      "human_connection_system",


      force:.6,


      transformation:
      "relationship → living structure"

    });

  }


  return mutations;

}



/**
 * =====================================================
 *
 * AWAKEN NUVO
 *
 * =====================================================
 */

export function awakenNuvo(
  mind:CompilerMind
):NuvoField {


  const futures =
  discoverFutureRealities(
    mind
  );


  const mutations =
  discoverMutations(
    mind
  );



  return {


    originPatterns:
    unique([
      ...mind.genome.archetypes,
      ...mind.genome.emotions
    ]),



    emergencePatterns:
    unique([
      ...mind.genome.themes,
      ...mind.genome.symbols
    ]),



    hiddenForces:
    unique([
      ...mind.genome.meaning.why,
      ...mind.genome.meaning.desiredFeeling
    ]),



    transformationPaths:
    unique([
      ...mind.genome.transformation
    ]),



    futureRealities:
    futures,



    creativeOpportunities:
    [
      ...mind.genome.themes
    ],



    mutations,



    latentWorlds:
    unique([
      ...futures.map(
        future =>
        future.name
      )
    ]),



    semanticPotential:
    unique(
      semanticNodes(mind)
    ),



    graphInsights:
    unique(
      semanticEdges(mind)
    ),



    hiddenRelationships:
    unique(
      semanticRelations(mind)
    ),



    possibilityVectors:
    unique([
      ...mind.genome.transformation
    ]),



    emergentArchetypes:
    unique([
      ...mind.genome.archetypes
    ]),



    futureQuestions:[
      "What unexplored possibility exists?"
    ],



    resonance:
    Math.min(
      1,
      futures.length / 5
    ),



    possibilityDensity:
    Math.min(
      1,
      futures.length / 10
    ),



    emergenceStrength:
    Math.min(
      1,
      mutations.length / 5
    ),



    noveltyScore:
    Math.min(
      1,
      futures.length / 10
    ),



    dominantPotential:
    futures.length > 1
    ?
    "expansion"
    :
    "emergence",



    emergentSurprises:
    [
      ...mind.genome.symbols
    ],



    unknownPotential:
    [
      "unresolved transformation space"
    ],



    confidence:
    futures.length
    ?
    .65
    :
    .2

  };

}



/**
 * =====================================================
 *
 * SEMANTIC EXTRACTION HELPERS
 *
 * =====================================================
 */

function semanticNodes(
  mind:CompilerMind
):string[] {

  return (
    mind.semanticIR?.nodes?.map(
      node =>
      node.label
    )
    ??
    []
  );

}



function semanticEdges(
  mind:CompilerMind
):string[] {

  return (
    mind.semanticIR?.edges?.map(
      edge =>
      `${edge.from}_${edge.to}`
    )
    ??
    []
  );

}



function semanticRelations(
  mind:CompilerMind
):string[] {

  return (
    mind.semanticIR?.edges?.map(
      edge =>
      edge.relation
    )
    ??
    []
  );

}