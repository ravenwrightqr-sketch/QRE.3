/**
 * =====================================================
 * QRE EXPERIENCE CONFIDENCE ANALYZER
 * =====================================================
 *
 * TYPE:
 * Analyzer
 *
 * RESPONSIBILITY:
 * Calculates confidence score for semantic understanding.
 *
 * INPUT:
 * Understanding layer outputs
 *
 * OUTPUT:
 * Confidence value (0 - 1)
 *
 * DOES NOT:
 * - create experiences
 * - compile genomes
 * - execute runtime
 * - access database
 *
 * =====================================================
 */



type ConfidenceInput = {

  intent: unknown;

  entities: unknown;

  relationships: unknown;

  emotions: unknown;

  memory: unknown;

  audience: unknown;

  world: unknown;

  dna: unknown;

};




function hasSignal(
 value:unknown
):boolean {


if(
 value === null ||
 value === undefined
){

 return false;

}



if(
 Array.isArray(value)
){

 return value.length > 0;

}



if(
 typeof value === "object"
){

 return Object.keys(value as object).length > 0;

}



return true;


}





export function calculateConfidence(

 input:ConfidenceInput

):number {



const layers =
Object.values(input);



const activeLayers =
layers.filter(
 hasSignal
).length;




const totalLayers =
layers.length;




if(
 !totalLayers
){

 return 0;

}




const coverage =
activeLayers /
totalLayers;




/**
 * Confidence starts low.
 * Each validated understanding layer increases certainty.
 */

const confidence =
0.25 +
(
 coverage * 0.75
);




return Number(
 Math.min(
  1,
  confidence
 ).toFixed(3)
);


}