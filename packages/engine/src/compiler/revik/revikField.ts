/**
 * =====================================================
 * QRE REVIK FIELD
 * =====================================================
 *
 * Transformation Intelligence Layer.
 *
 * NUVO:
 * "What could become"
 *
 * REVIK:
 * "How does it evolve"
 *
 * Responsibility:
 *
 * Convert possibility space
 * into transformation intelligence.
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
  RevikField,
  RevikTransformation,
} from "@qre/contracts";

export type {
  RevikField,
  RevikTransformation,
} from "@qre/contracts";


function unique(
  values: string[]
): string[] {

  return [
    ...new Set(
      values.filter(Boolean)
    )
  ];

}


/**
 * =====================================================
 *
 * POSSIBILITY → TRANSFORMATION
 *
 * =====================================================
 */

function discoverTransformations(
  nuvo: NuvoField
): RevikTransformation[] {

  return nuvo.futureRealities.map(
    future => {

      const path =
        future.transformation
          .split("→")
          .map(
            item =>
              item.trim()
          )
          .filter(Boolean);


      return {

        source:
          path[0] ?? "origin",

        destination:
          future.name,

        path,

        meaning:
          future.description,

        strength:
          future.confidence,

        originSignals:
          future.originSignals,

        meaningShift:
          future.meaningShift,

        emotionalDirection:
          future.emotionalDirection

      };

    }
  );

}


/**
 * =====================================================
 *
 * SEMANTIC EVOLUTION
 *
 * =====================================================
 */

function discoverSemanticTransitions(
  nuvo: NuvoField
): string[] {

  return unique([

    ...nuvo.semanticPotential,

    ...nuvo.possibilityVectors,

    ...nuvo.emergentArchetypes

  ]);

}



function discoverRelationshipEvolutions(
  nuvo: NuvoField
): string[] {

  return unique([

    ...nuvo.hiddenRelationships,

    ...nuvo.graphInsights

  ]);

}


/**
 * =====================================================
 *
 * EVOLUTION CHAINS
 *
 * =====================================================
 */

function discoverEvolutionChains(
  nuvo: NuvoField
): string[][] {

  const chains: string[][] = [];


  for(
    const future of nuvo.futureRealities
  ){

    const path =
      future.transformation
        .split("→")
        .map(
          item =>
            item.trim()
        )
        .filter(Boolean);


    if(path.length > 1){

      chains.push(path);

    }

  }



  for(
    const mutation of nuvo.mutations
  ){

    chains.push([

      mutation.source,

      mutation.evolution,

      mutation.potential

    ]);

  }


  return chains;

}


/**
 * =====================================================
 *
 * IDENTITY EVOLUTION
 *
 * =====================================================
 */

function discoverIdentityShifts(
  nuvo: NuvoField
): string[] {

  const shifts: string[] = [];


  for(
    const future of nuvo.futureRealities
  ){

    const path =
      future.transformation
        .split("→")
        .map(
          x =>
            x.trim()
        )
        .filter(Boolean);


    if(path.length >= 2){

      shifts.push(
        `${path[0]} → ${path[path.length - 1]}`
      );

    }

  }


  return unique(shifts);

}


/**
 * =====================================================
 *
 * EMOTIONAL MOVEMENT
 *
 * =====================================================
 */

function discoverEmotionalMovements(
  nuvo: NuvoField
): string[] {

  return unique(

    nuvo.hiddenForces.map(

      force =>
        `${force} → expanded meaning`

    )

  );

}


/**
 * =====================================================
 *
 * AWAKEN REVIK
 *
 * =====================================================
 */

export function awakenRevik(
  mind: CompilerMind
): RevikField {


  if(!mind.nuvo){

    throw new Error(
      "CompilerMind.nuvo required before awakenRevik"
    );

  }


  const nuvo =
    mind.nuvo;


  const transformations =
    discoverTransformations(
      nuvo
    );


  const evolutionChains =
    discoverEvolutionChains(
      nuvo
    );


  const identityShifts =
    discoverIdentityShifts(
      nuvo
    );


  const emotionalMovements =
    discoverEmotionalMovements(
      nuvo
    );


  const semanticTransitions =
    discoverSemanticTransitions(
      nuvo
    );


  const relationshipEvolutions =
    discoverRelationshipEvolutions(
      nuvo
    );


  const evolutionStrength =
    transformations.length

      ?

      Math.min(

        1,

        transformations.reduce(

          (
            total,
            item
          ) =>
          total + item.strength,

          0

        )
        /
        transformations.length

      )

      :

      0;



  return {

    evolutionChains,

    transformations,

    identityShifts,

    emotionalMovements,

    dominantMotion:

      evolutionStrength > .5

        ?

        "transformation"

        :

        "emergence",


    futureStates:

      unique([

        ...nuvo.latentWorlds,

        ...nuvo.futureRealities.map(
          future =>
            future.name
        )

      ]),


    semanticTransitions,

    relationshipEvolutions,


    unansweredPaths:

      nuvo.futureQuestions,


    archetypeEvolutions:

      unique(
        nuvo.emergentArchetypes
      ),



    evolutionStrength,



    transformationDensity:

      Math.min(
        1,
        transformations.length / 10
      ),



    transformationForce:

      nuvo.hiddenForces.join(", "),



    movementVector:

      nuvo.transformationPaths.join(" → "),



    narrativeMomentum:

      evolutionStrength,



    identityGravity:

      Math.min(
        1,
        identityShifts.length / 10
      ),



    emotionalGravity:

      Math.min(
        1,
        emotionalMovements.length / 10
      ),



    confidence:

      evolutionStrength

  };

}