import type {
  EngineEventType,
} from "@qre/contracts";


export type SpineEvent = {

  type:EngineEventType;

  assetId:string;

  sessionId?:string;

  flowId?:string;

  stepIndex?:number;

  userId?:string;

  meta?:Record<string,unknown>;

};




/**
 * =====================================================
 * ENGINE EVENT SPINE
 * =====================================================
 *
 * Central runtime event emitter.
 *
 * Responsibilities:
 *
 * - broadcast engine lifecycle events
 * - keep runtime decoupled
 * - allow analytics/memory/rewards listeners
 *
 *
 * Does NOT:
 *
 * - import Prisma
 * - write database
 * - know analytics storage
 *
 * =====================================================
 */


type EventHandler =
  (
    event:SpineEvent
  )=>Promise<void>;



const handlers =
  new Set<EventHandler>();




export function subscribeSpine(

  handler:EventHandler

){

  handlers.add(handler);


  return ()=>{

    handlers.delete(handler);

  };

}





export async function emitSpineEvent(

  event:SpineEvent

){


  for(const handler of handlers){

    try{

      await handler(event);

    }

    catch(error){

      console.error(

        "[SPINE HANDLER FAILED]",

        error

      );

    }

  }


}