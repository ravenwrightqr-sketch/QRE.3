

export interface KaivoConnection {


  from:string;


  to:string;


  force:
    | "bond"
    | "memory"
    | "growth"
    | "identity"
    | "legacy"
    | "emotion"
    | "symbol";


  strength:number;


}


export interface KaivoResonance {

 node:string;

 influence:string;

 weight:number;

}


export interface KaivoMeaningCluster {

 name:string;

 nodes:string[];

 intensity:number;

}



export interface KaivoField {

 connections:KaivoConnection[];

 resonanceNodes:string[];

 resonances:KaivoResonance[];

 meaningClusters:KaivoMeaningCluster[];

 moverInfluence:string[];

 dominantForce:string;

 coherence:number;

}