/**
 * =====================================================
 * QRE DOMAIN DISCOVERY ENGINE
 * =====================================================
 *
 * Detects application domain from meaning signals.
 *
 * =====================================================
 */


import type {

 DomainDiscovery,

 DomainType,
 DomainSignal

} from "@qre/contracts";





export function discoverDomain(

 input:string

):DomainDiscovery {


const text =
 input.toLowerCase();



const scores:

Record<DomainType,number> = {


 pet:0,


 wedding:0,


 relationship:0,


 home:0,


 object:0,


 warehouse:0,


 retail:0,


 health:0,


 education:0,


 event:0,


 general:0

};



const signals:DomainSignal[] = [];




function detect(

 domain:DomainType,

 words:string[],

 weight:number

){


 for(const word of words){


  if(text.includes(word)){


   scores[domain]+=weight;


   signals.push({

    signal:word,

    weight,

    source:"domainDiscovery"

   });


  }


 }


}





detect(

"pet",

[

"dog",

"cat",

"animal",

"vet",

"pet",

"collar"

],

.25

);





detect(

"wedding",

[

"wedding",

"marriage",

"bride",

"groom",

"ceremony"

],

.25

);





detect(

"warehouse",

[

"inventory",

"pallet",

"stock",

"shipping",

"asset"

],

.25

);





detect(

"retail",

[

"store",

"customer",

"product",

"sale"

],

.25

);





detect(

"home",

[

"house",

"property",

"home",

"real estate"

],

.25

);





const winner =

Object.entries(scores)

.sort(

(a,b)=>b[1]-a[1]

)[0];





return {


 domain:

 winner[1] > 0

 ? winner[0] as DomainType

 : "general",



 confidence:

 Math.min(

 1,

 winner[1]

 ),



 signals,



 reason:

 winner[1] > 0

 ?

 `Detected ${winner[0]} domain.`

 :

 "No strong domain detected."

};


}