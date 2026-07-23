/**
 * =====================================================
 * QRE BEAST MEMORY ENGINE
 * =====================================================
 *
 * Cognitive memory primitive.
 *
 * NO DATABASE
 * NO PRISMA
 * NO EXECUTION
 *
 * =====================================================
 */

export type BeastMemoryType =
  | "experience"
  | "decision"
  | "pattern";


export type BeastMemory = {

  id:string;

  type:BeastMemoryType;

  subject:string;

  information:Record<string, unknown>;

  confidence:number;

  createdAt:Date;

};



export function createMemory(
  input:{
    type:BeastMemoryType;

    subject:string;

    information:Record<string, unknown>;

    confidence?:number;
  }
):BeastMemory {


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