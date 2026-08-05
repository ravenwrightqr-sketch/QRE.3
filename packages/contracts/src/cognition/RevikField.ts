export interface RevikTransformation {

  source:string;

  destination:string;

  path:string[];

  meaning:string;

  strength:number;

}


export interface RevikField {

 evolutionChains:string[][];

 transformations:RevikTransformation[];

 identityShifts:string[];

 emotionalMovements:string[];

 dominantMotion:string;

 futureStates:string[];

 semanticTransitions:string[];

 relationshipEvolutions:string[];

 unansweredPaths:string[];

 archetypeEvolutions:string[];

 evolutionStrength:number;

}