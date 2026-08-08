export interface CuriositySignal {

  discovery:string;

  strength:number;

  reason:string;

}


export interface Curiosity {

  signals:CuriositySignal[];

}