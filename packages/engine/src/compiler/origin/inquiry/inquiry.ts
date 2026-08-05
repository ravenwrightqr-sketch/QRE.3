import type {
    Inquiry
} from "@qre/contracts"


function inferIntent(

 question:string

):string{


 const text =

  question.toLowerCase();



 if(/why|purpose|meaning/.test(text)){

  return "discover meaning";

 }


 if(/how/.test(text)){

  return "understand mechanism";

 }


 if(/what if|could|might/.test(text)){

  return "explore possibility";

 }


 if(/relationship|connect|between/.test(text)){

  return "discover relationships";

 }


 if(/pattern|structure/.test(text)){

  return "identify patterns";

 }


 return "expand understanding";


}





function inferDomain(

 question:string

):string{


 const text =

  question.toLowerCase();



 if(/memory|legacy|history/.test(text)){

  return "memory";

 }


 if(/emotion|feeling|love|fear/.test(text)){

  return "emotion";

 }


 if(/identity|self/.test(text)){

  return "identity";

 }


 if(/world|environment|place/.test(text)){

  return "world";

 }


 if(/relationship|community|people/.test(text)){

  return "social";

 }


 return "general";


}





function inferImportance(

 question:string

):number{


 const score =

  Math.min(

   1,

   0.35 +

   question.length / 180

  );


 return Number(

  score.toFixed(2)

 );


}





export function createInquiry(

 question:string

):Inquiry{


 return {

  id:

   crypto.randomUUID(),


  question,


  intent:

   inferIntent(

    question

   ),


  domain:

   inferDomain(

    question

   ),


  status:

   "open",


  importance:

   inferImportance(

    question

   ),


  createdAt:

   Date.now()

 };


}