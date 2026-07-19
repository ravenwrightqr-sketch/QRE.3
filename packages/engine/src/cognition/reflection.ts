/**
 * =====================================================
 * QRE COGNITION REFLECTION ENGINE
 * =====================================================
 *
 * Converts memory into understanding.
 *
 * Memory:
 *   "Something happened"
 *
 * Reflection:
 *   "What does it mean?"
 *
 * Responsibilities:
 *
 * - Analyze experiences
 * - Detect repeated signals
 * - Find strong patterns
 * - Produce cognitive insights
 *
 * NO DATABASE
 * NO PRISMA
 * NO EXECUTION
 *
 * =====================================================
 */


import type {
  CognitiveMemory,
} from "./memory.js";





export type CognitiveInsight = {


  id:
    string;



  statement:
    string;



  confidence:
    number;



  sourceMemoryIds:
    string[];



  context?:
    Record<string, unknown>;

};







/**
 * =====================================================
 * REFLECT
 * =====================================================
 *
 * Memory
 *   ↓
 * Pattern extraction
 *   ↓
 * Insights
 *
 * =====================================================
 */


export function reflect(

  memories:readonly CognitiveMemory[]

):CognitiveInsight[] {



  const insights:CognitiveInsight[] = [];



  if(!memories.length){

    return insights;

  }






  /**
   * =====================================================
   * EXPERIENCE PATTERN
   * =====================================================
   */


  const experiences =

    memories.filter(

      memory =>

        memory.type === "experience"

    );




  if(experiences.length > 0){


    insights.push({

      id:

        crypto.randomUUID(),


      statement:

        "Experience signals are accumulating and can improve future decisions.",


      confidence:

        Math.min(

          experiences.length / 10,

          1

        ),


      sourceMemoryIds:

        experiences.map(

          memory => memory.id

        ),


      context:{

        experienceCount:

          experiences.length,

      },


    });


  }









  /**
   * =====================================================
   * HIGH CONFIDENCE SIGNAL DETECTION
   * =====================================================
   */


  const strongSignals =

    memories.filter(

      memory =>

        memory.confidence >= 0.8

    );




  if(strongSignals.length > 0){


    insights.push({

      id:

        crypto.randomUUID(),


      statement:

        "High confidence signals indicate repeatable patterns.",


      confidence:

        strongSignals.length /

        Math.max(

          memories.length,

          1

        ),


      sourceMemoryIds:

        strongSignals.map(

          memory => memory.id

        ),


      context:{

        strongSignalCount:

          strongSignals.length,

      },


    });


  }









  /**
   * =====================================================
   * EVENT PATTERN RECOGNITION
   * =====================================================
   *
   * Looks inside memory context.
   *
   * Example:
   *
   * FLOW_COMPLETE
   * FLOW_COMPLETE
   * FLOW_COMPLETE
   *
   * becomes:
   *
   * "Repeated completion behavior detected"
   *
   * =====================================================
   */


  const eventCounts:

    Record<string, CognitiveMemory[]> = {};




  for(const memory of memories){


    const event =

      memory.context?.event;



    if(typeof event !== "string"){

      continue;

    }



    if(!eventCounts[event]){

      eventCounts[event] = [];

    }



    eventCounts[event].push(memory);


  }






  for(const [event, related] of Object.entries(eventCounts)){


    if(related.length < 3){

      continue;

    }



    insights.push({


      id:

        crypto.randomUUID(),



      statement:

        `Repeated runtime pattern detected: ${event}.`,



      confidence:

        Math.min(

          related.length / 10,

          1

        ),



      sourceMemoryIds:

        related.map(

          memory => memory.id

        ),



      context:{

        event,

        occurrences:

          related.length,

      },


    });


  }







  return insights;

}