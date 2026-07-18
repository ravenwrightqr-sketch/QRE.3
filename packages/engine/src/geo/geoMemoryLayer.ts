import type {
  GeoMemoryRepository,
} from "../repositories/index.js";


/**
 * GEO MEMORY LAYER V1
 *
 * Turns raw geoProof into memory objects.
 *
 * Engine only consumes repository contracts.
 */


export type GeoMemory = {

  assetId:string;

  sessionId:string | null;

  label:string | null;

  city:string | null;

  region:string | null;

  country:string | null;

  visits:number;

  firstSeen:Date;

  lastSeen:Date;

};




export async function getGeoMemory(

  assetId:string,

  repo:GeoMemoryRepository

):Promise<GeoMemory[]> {


  const points =
    await repo.findGeoProof(assetId);



  const memoryMap =
    new Map<string,GeoMemory>();



  for(const p of points){


    const key =
      `${p.lat.toFixed(3)}:${p.lng.toFixed(3)}`;



    const existing =
      memoryMap.get(key);



    if(!existing){


      memoryMap.set(

        key,

        {

          assetId,

          sessionId:
            p.sessionId ?? null,

          label:
            p.label ?? null,

          city:
            p.city ?? null,

          region:
            p.region ?? null,

          country:
            p.country ?? null,


          visits:1,


          firstSeen:
            p.createdAt,


          lastSeen:
            p.createdAt,

        }

      );


    } else {


      existing.visits += 1;

      existing.lastSeen =
        p.createdAt;


    }

  }



  return Array.from(
    memoryMap.values()
  );

}