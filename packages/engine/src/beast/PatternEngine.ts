/**
 * =====================================================
 * QRE BEAST PATTERN ENGINE
 * =====================================================
 *
 * Memory
 *    ↓
 * Pattern Recognition
 *    ↓
 * Intelligence
 *
 * No database.
 * No Prisma.
 * No execution.
 *
 * =====================================================
 */


import type {
  BeastMemory,
} from "./MemoryEngine.js";



export type BeastPattern = {

  id:
    string;


  name:
    string;


  description:
    string;


  occurrences:
    number;


  confidence:
    number;


};






export function detectPatterns(

  memories:
    BeastMemory[]

): BeastPattern[] {



  const patterns:
    BeastPattern[] = [];



  const subjects =
    new Map<string, number>();



  for(
    const memory of memories
  ){


    const count =
      subjects.get(
        memory.subject
      ) ?? 0;


    subjects.set(
      memory.subject,
      count + 1
    );


  }



  for(
    const [
      subject,
      count
    ]
    of subjects
  ){


    if(count >= 2){


      patterns.push({

        id:
          crypto.randomUUID(),


        name:
          `${subject}_pattern`,


        description:
          `Repeated experience pattern detected for ${subject}.`,


        occurrences:
          count,


        confidence:
          Math.min(
            count / 10,
            1
          ),

      });


    }

  }



  return patterns;

}