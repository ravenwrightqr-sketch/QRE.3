/**
 * =====================================================
 * QRE OBJECT COMPILER TYPES
 * =====================================================
 *
 * Semantic Understanding
 *        ↓
 * Object Genome
 *
 * Everything becomes an object.
 *
 * =====================================================
 */

import type {
  ObjectGenome,
  ObjectMoment,
  ObjectRelationship,
} from "@qre/contracts";


export type ObjectCompilationInput = {

  prompt:string;

  entities:any;

  meaning:any;

  emotions:any;

  memory:any;

  relationships:any;

};



export type {
  ObjectGenome,
  ObjectMoment,
  ObjectRelationship,
};