/**
 * =====================================================
 *
 * INQUIRY CONTRACT
 *
 * Cognitive questioning unit.
 *
 * =====================================================
 */

export interface Inquiry {

  id:string;

  question:string;

  intent:string;

  domain:string;

  status:
    | "open"
    | "answered";

  importance:number;

  createdAt:number;

}