/**
 * =====================================================
 * QRE DOMAIN DISCOVERY CONTRACT
 * =====================================================
 *
 * Detects the most relevant domain from
 * semantic signals.
 *
 * =====================================================
 */


import type {
 DomainType
} from "./domainContract.js";





export interface DomainSignal {


 signal:string;


 weight:number;


 source:string;


}


export interface DomainDiscovery {


 domain:DomainType;


 confidence:number;


 signals:DomainSignal[];


 reason:string;

}