import type {

 KnowledgeGraph

} from "./knowledgeTypes.js";



export function evolveKnowledge(

 nodes:any[]

):KnowledgeGraph {


 const graphNodes = nodes.map(

  (node,index)=>({

   id:`node_${index}`,

   concept:node.concept,

   domain:node.domain

  })

 );


 const edges = [];


 for(let i=0;i<graphNodes.length-1;i++){


  edges.push({

   from:graphNodes[i].id,

   to:graphNodes[i+1].id,

   relationship:"connected_pattern",

   strength:0.8

  });


 }


 return {

  nodes:graphNodes,

  edges

 };


}