export interface NuvoFuture {

  name:string;

  description:string;

  transformation:string;

  confidence:number;

}


export interface NuvoMutation {

  source:string;

  evolution:string;

  potential:string;

}


export interface NuvoField {

 originPatterns:string[];

 emergencePatterns:string[];

 hiddenForces:string[];

 transformationPaths:string[];

 futureRealities:NuvoFuture[];

 creativeOpportunities:string[];

 mutations:NuvoMutation[];

 latentWorlds:string[];

 semanticPotential:string[];

 graphInsights:string[];

 hiddenRelationships:string[];

 possibilityVectors:string[];

 emergentArchetypes:string[];

 futureQuestions:string[];

 resonance:number;

}