/**
 * =====================================================
 * QRE SEMANTIC INTERNAL REALITY (SemanticIR)
 * =====================================================
 *
 * The living cognitive graph of the compiler.
 *
 * Meaning is not stored as isolated data.
 * Meaning emerges from:
 *
 * Nodes
 * Relationships
 * Evidence
 * Contradictions
 * Gravity
 * Transformation
 *
 * =====================================================
 *
 * NO DATABASE
 * NO RUNTIME
 * NO UI
 *
 * =====================================================
 */


export type SemanticNodeType =

  | "entity"
  | "concept"
  | "emotion"
  | "relationship"
  | "memory"
  | "symbol"
  | "goal"
  | "world"
  | "question"
  | "theme"
  | "archetype"
  | "transformation"
  | "scene"
  | "artifact"
  | "meaning";



export interface SemanticNode {


  id:string;


  label:string;


  type:SemanticNodeType;



  /**
   * Confidence that this node represents reality.
   */
  confidence:number;



  /**
   * Semantic importance.
   *
   * Orion updates this.
   */
  gravity:number;



  /**
   * Current reasoning activation.
   */
  activation:number;



  /**
   * Origin intelligence.
   */
  createdBy:string;



  /**
   * Last modifier.
   */
  updatedBy:string;



  metadata?:
    Record<string,unknown>;

}



export type SemanticRelation =


 | "causes"

 | "becomes"

 | "symbolizes"

 | "belongs_to"

 | "contrasts"

 | "reveals"

 | "creates"

 | "remembers"

 | "protects"

 | "transforms"

 | "contains"

 | "supports"

 | "questions"

 | "echoes"

 | "connects"

 | "conflicts";





export interface SemanticEdge {


 from:string;


 to:string;


 relation:SemanticRelation;



 /**
  * Strength of relationship.
  */
 weight:number;



 /**
  * Confidence of relationship.
  */
 confidence:number;



 createdBy:string;



 metadata?:
  Record<string,unknown>;

}







/**
 * =====================================================
 *
 * SEMANTIC EVIDENCE
 *
 * Why does this meaning exist?
 *
 * =====================================================
 */


export type SemanticEvidenceType =


 | "prompt"

 | "extraction"

 | "inference"

 | "world_rule"

 | "emotion_signal"

 | "entity_signal"

 | "relationship_signal"

 | "compiler_generation";




export interface SemanticEvidence {


 id:string;


 /**
  * Node or edge supported.
  */
 targetId:string;



 type:SemanticEvidenceType;



 /**
  * Original supporting information.
  */
 source:string;



 /**
  * Strength of support.
  */
 confidence:number;



 createdBy:string;



 metadata?:
  Record<string,unknown>;

}








/**
 * =====================================================
 *
 * SEMANTIC CONTRADICTION
 *
 * Meaning tension creates depth.
 *
 * Example:
 *
 * abandoned
 *      vs
 * loved
 *
 * creates:
 *
 * rescue transformation
 *
 * =====================================================
 */


export type SemanticContradictionType =


 | "emotional"

 | "identity"

 | "relationship"

 | "world"

 | "goal"

 | "temporal";




export interface SemanticContradiction {


 id:string;



 firstNodeId:string;



 secondNodeId:string;



 type:SemanticContradictionType;



 /**
  * How strongly these meanings oppose each other.
  */
 tension:number;



 /**
  * Potential narrative value.
  *
  * High tension creates transformation.
  */
 narrativePotential:number;



 resolved:boolean;



 resolutionNodeId?:string;



 createdBy:string;


}








/**
 * =====================================================
 *
 * SEMANTIC INTERNAL REALITY
 *
 * =====================================================
 */


export interface SemanticIR {

 /**
  * Cognitive graph.
  */
 nodes:SemanticNode[];

 edges:SemanticEdge[];
 /**
  * Proof layer.
  */
 evidence:SemanticEvidence[];
   /**
   * Emotional force driving the experience.
   */
  emotionalGravity:string;


  /**
   * The predicted change created by the experience.
   */
  transformation:string;


  /**
   * The unresolved curiosity loop.
   */
  unansweredQuestion:string;

 /**
  * Meaning conflicts.
  */
 contradictions:SemanticContradiction[];

 /**
  * Entry point.
  */
 rootNodeId:string;

 /**
  * Highest meaning gravity.
  */
 rootMeaningNodeId:string;

 /**
  * Emotional center.
  */
 dominantEmotionNodeId:string;

 /**
  * Transformation engine target.
  */
 transformationNodeId:string;

 /**
  * Unanswered discovery.
  */
 primaryQuestionNodeId:string;
 /**
  * Overall certainty.
  */
 confidence:number;
 /**
  * Internal consistency.
  */
 coherence:number;
 /**
  * Future evolution.
  */
 version:number;

}