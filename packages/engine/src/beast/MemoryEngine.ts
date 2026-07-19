/**
 * =====================================================
 * QRE BEAST MEMORY ENGINE
 * =====================================================
 *
 * Experience
 *      ↓
 * Memory
 *      ↓
 * Future Intelligence
 *
 * No database.
 * No Prisma.
 * No execution.
 *
 * This is cognition memory structure.
 *
 * =====================================================
 */


export type BeastMemoryType =

  | "experience"

  | "decision"

  | "pattern";




export type BeastMemory = {

  id:
    string;


  type:
    BeastMemoryType;


  subject:
    string;


  information:
    Record<string, unknown>;


  confidence:
    number;


  createdAt:
    Date;

};





/**
 * =====================================================
 * CREATE MEMORY
 * =====================================================
 */


export function createMemory(

  input: {

    type:
      BeastMemoryType;


    subject:
      string;


    information:
      Record<string, unknown>;


    confidence?:
      number;

  }

): BeastMemory {


  return {


    id:
      crypto.randomUUID(),


    type:
      input.type,


    subject:
      input.subject,


    information:
      input.information,


    confidence:
      input.confidence ?? 1,


    createdAt:
      new Date(),


  };

}






/**
 * =====================================================
 * MEMORY RELEVANCE
 * =====================================================
 *
 * Determines if memory matters.
 *
 * Future:
 * semantic scoring,
 * embeddings,
 * pattern detection.
 *
 * =====================================================
 */


export function memoryRelevance(

  memory:
    BeastMemory,

  context:
    string

): number {


  if(

    memory.subject
      .toLowerCase()
      .includes(
        context.toLowerCase()
      )

  ){

    return 1;

  }



  return 0.1;

}