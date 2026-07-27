/**
 * =====================================================
 * QRE ORION FIELD
 * =====================================================
 *
 * Meaning alignment engine.
 *
 * KAIVO:
 * relationship discovery.
 *
 * ORION:
 * central experiential gravity.
 *
 * NO DATABASE.
 * NO EXECUTION.
 *
 * =====================================================
 */

import type {
  KaivoField,
} from "../kaivo/index.js";




export interface OrionField {


  coreVector:
    string;


  dominantNodes:
    string[];


  gravity:
    number;


  synthesis:
    string;


}




export function awakenOrion(

 kaivo:KaivoField

):OrionField {



const nodeFrequency =
new Map<string,number>();



for(
 const node of kaivo.resonanceNodes
){

 nodeFrequency.set(

  node,

  (nodeFrequency.get(node) ?? 0) + 1

 );

}



const dominantNodes =

[
 ...nodeFrequency.entries()

]

.sort(

(a,b)=>

b[1]-a[1]

)

.map(

entry => entry[0]

)

.slice(
0,
3
);



let coreVector =
"meaning formation";



if(
 dominantNodes.includes("legacy")
){

 coreVector =
 "preservation of human significance";

}

else if(
 dominantNodes.includes("memory")
){

 coreVector =
 "emotional continuity";

}



return {


coreVector,


dominantNodes,


gravity:

 kaivo.coherence,


synthesis:

 dominantNodes.join(
 " → "
 )


};


}