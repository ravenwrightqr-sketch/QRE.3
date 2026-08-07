/**
 * =====================================================
 * QRE EXECUTIVE MEMORY CONTRACT
 * =====================================================
 *
 * Stores executive decisions as learning signals.
 *
 * =====================================================
 */


export interface ExecutiveMemory {


 action:string;


 reason:string;


 success?:boolean;


 impact?:number;


 timestamp:string;


}