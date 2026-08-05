/**
 * =====================================================
 * QRE SEMANTIC IR BUILDER
 * =====================================================
 *
 * Converts compiler understanding into a cognitive graph.
 *
 * Human Prompt
 *        ↓
 * Understanding
 *        ↓
 * SemanticIR
 *
 *
 * This is the first reasoning substrate.
 *
 * NO DATABASE
 * NO RUNTIME
 * NO API
 *
 * =====================================================
 */


import type {

 SemanticIR,
 SemanticNode,
 SemanticEdge,
 SemanticEvidence,
 SemanticContradiction,
 ExperienceMeaningContext

} from "@qre/contracts";
import type { CompilerMind } from "@qre/contracts";




function createId(

 prefix:string

){

 return (

  `${prefix}_${

   Math.random()
    .toString(36)
    .slice(2,10)

  }`

 );

}








function createNode(

 label:string,

 type:SemanticNode["type"],

 confidence:number,

 createdBy:string

):SemanticNode {


 return {


  id:createId(type),


  label,


  type,


  confidence,


  gravity:0.5,


  activation:1,


  createdBy,


  updatedBy:
   createdBy


 };

}








function createEdge(

 from:string,

 to:string,

 relation:SemanticEdge["relation"],

 weight:number,

 createdBy:string

):SemanticEdge {


 return {


  from,


  to,


  relation,


  weight,


  confidence:
   weight,


  createdBy


 };

}

export function buildSemanticIR(

 mind: CompilerMind

): SemanticIR {



 const nodes:SemanticNode[] = [];


 const edges:SemanticEdge[] = [];


 const evidence:SemanticEvidence[] = [];


 const contradictions:SemanticContradiction[] = [];





 const source =
  "semantic_builder";

 const meaningContext = mind.meaningContext;






 /**
  * =====================================================
  *
  * ENTITY EXTRACTION
  *
  * =====================================================
  */


 const entities =

 mind.understanding
 ?.entities
 ??
 {};



 const entityValues = [

  ...(entities.creatures ?? []),

  ...(entities.objects ?? []),

  ...(entities.people ?? [])

 ];




 const entityNodes =

 entityValues.map(

  (entity:string)=>

   createNode(

    entity,

    "entity",

    .95,

    source

   )

 );



 nodes.push(
  ...entityNodes
 );







 /**
  * =====================================================
  *
  * EMOTION EXTRACTION
  *
  * =====================================================
  */


 const emotions =

 mind.understanding
 ?.emotions
 ?.emotions
 ??
 [];



 const emotionNodes =

 emotions.map(

  (emotion:string)=>

   createNode(

    emotion,

    "emotion",

    .9,

    source

   )

 );



 nodes.push(
  ...emotionNodes
 );








 /**
  * =====================================================
  *
  * MEANING EXTRACTION
  *
  * =====================================================
  */

const meanings = [

 ...meaningContext.meanings,

 ...meaningContext.humanDesires,

 ...meaningContext.symbolicForces,

 ...meaningContext.narrativePotential,

 ...(mind.genome?.meaning?.why ?? []),

 ...(mind.genome?.meaning?.desiredFeeling ?? []),

 ...(mind.genome?.meaning?.transformation ?? [])

].filter(Boolean);

const uniqueMeanings = [
 ...new Set(
  meanings.map(
   (meaning:string)=>String(meaning)
  )
 )
];


 const meaningNodes =

 uniqueMeanings.map(

  (meaning:string)=>

   createNode(

    meaning,

    "meaning",

    .85,

    source

   )

 );



 nodes.push(
  ...meaningNodes
 );







 /**
  * =====================================================
  *
  * GENOME THEMES
  *
  * =====================================================
  */


 const themes = [

 ...meaningContext.themes,

 ...(mind.genome?.themes ?? []),

 ...(mind.understanding?.world?.domains ?? [])

 ].filter(Boolean);




 for(const theme of themes){


  nodes.push(

   createNode(

    theme,

    "theme",

    .8,

    source

   )

  );


 }








 /**
  * =====================================================
  *
  * RELATIONSHIP CREATION
  *
  * =====================================================
  */


 for(
  const entity of entityNodes
 ){


  for(
   const meaning of meaningNodes
  ){


   edges.push(

    createEdge(

     entity.id,

     meaning.id,

     "reveals",

     .75,

     source

    )

   );


  }


 }








 /**
  * =====================================================
  *
  * EMOTIONAL GRAVITY
  *
  * =====================================================
  */


 for(
  const emotion of emotionNodes
 ){


  for(
   const meaning of meaningNodes
  ){


   edges.push(

    createEdge(

     emotion.id,

     meaning.id,

     "creates",

     .8,

     source

    )

   );


  }


 }









 /**
  * =====================================================
  *
  * EVIDENCE LAYER
  *
  * =====================================================
  */


 evidence.push({


  id:createId("evidence"),


  targetId:
   nodes[0]?.id
   ??
   "unknown",


  type:"prompt",


  source:
   mind.prompt,


  confidence:.95,


  createdBy:
   source


 });










 /**
  * =====================================================
  *
  * CONTRADICTION DISCOVERY
  *
  * Finds emotional tension.
  *
  * =====================================================
  */


 const hasAbandonment =

 mind.prompt
 .toLowerCase()
 .includes("abandon");



 const hasConnection =

 mind.prompt
 .toLowerCase()
 .includes("family")
 ||
 mind.prompt
 .toLowerCase()
 .includes("connection");





 if(
  hasAbandonment &&
  hasConnection
 ){


 const abandoned =

 createNode(

  "abandonment",

  "concept",

  .9,

  source

 );


 const belonging =

 createNode(

  "belonging",

  "concept",

  .9,

  source

 );


 nodes.push(
  abandoned,
  belonging
 );



 contradictions.push({


  id:createId("contradiction"),


  firstNodeId:
   abandoned.id,


  secondNodeId:
   belonging.id,


  type:"emotional",


  tension:.9,


  narrativePotential:.95,


  resolved:false,


  createdBy:
   source


 });


 }

 /**
  * =====================================================
  *
  * RETURN COGNITIVE REALITY
  *
  * =====================================================
  */

 const root =

 nodes[0];

/**
 * =====================================================
 *
 * HIGHER ORDER SEMANTIC SIGNALS
 *
 * Emotional physics + transformation + curiosity
 *
 * =====================================================
 */


const emotionalGravity =

mind.understanding
  ?.emotions
  ?.emotions
  ?.length

 ?

 mind.understanding.emotions.emotions[0]

 :

 "emerging_emotion";




const transformation =

 mind.genome
  ?.transformation
  ?.length

 ?

 mind.genome.transformation[0]

 :

 "experience_transformation";


const unansweredQuestion =

 meaningContext.narrativePotential.length

 ?

 meaningContext.narrativePotential[0]

 :

 "What deeper meaning is waiting to be discovered?";

const questionNode =
 createNode(
  unansweredQuestion,
  "question",
  .78,
  source
 );

nodes.push(questionNode);

const transformationNode =
 createNode(
  transformation,
  "transformation",
  .82,
  source
 );

nodes.push(transformationNode);

return {


  nodes,
  edges,
  evidence,
  contradictions,

  rootNodeId:

   root?.id
   ??
   "",

  rootMeaningNodeId:

   meaningNodes[0]?.id
   ??
   "",

  dominantEmotionNodeId:

   emotionNodes[0]?.id
   ??
   "",

  transformationNodeId:
   transformationNode.id,

  primaryQuestionNodeId:
   questionNode.id,

    emotionalGravity,

transformation,

unansweredQuestion,

  confidence:.85,

  coherence:.9,

  version:1

 };


}