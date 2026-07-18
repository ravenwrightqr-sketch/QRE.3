import type {
  GeoMemoryRepository,
  GeoProofRecord,
} from "../repositories/index.js";


export async function buildGeoMemoryAnalytics(

  assetId:string,

  repo:GeoMemoryRepository,

  sessionId?:string

){


  const geoEvents =
    await repo.findGeoProof(
      assetId
    );



  const totalPoints =
    geoEvents.length;



  const uniqueCities =
    new Set(

     geoEvents
     .map((g:GeoProofRecord)=>g.city)

    .filter(Boolean)

    );



  const dominantRegion =
    mostCommon(

   geoEvents
   .map((g:GeoProofRecord)=>g.region)

    );



  const confidence =
    totalPoints === 0

      ? 0

      : Math.min(
          totalPoints / 10,
          1
        );



  const rewardScore =
    totalPoints * 1.2;



  const signalStrength =

    totalPoints > 10

      ? "high"

      : totalPoints > 3

        ? "medium"

        : "low";



  const lastPoint =
    geoEvents.at(-1);



  return repo.createMemorySnapshot({

    assetId,

    sessionId,

    scanWeight:
      totalPoints,

    rewardScore,

    confidence,

    dominantLayer:
      "geo_analytics",

    data:{

      totalPoints,

      uniquePlaces:
        uniqueCities.size,

      dominantRegion,

      signalStrength,


      lastLocation:
        lastPoint
          ? {
              lat:lastPoint.lat,
              lng:lastPoint.lng,
              city:lastPoint.city,
              region:lastPoint.region,
            }

          : null,

    },

  });


}



function mostCommon(
  values:(string|null|undefined)[]
){

  const counts =
    new Map<string,number>();


  for(const value of values){

    if(!value) continue;

    counts.set(
      value,
      (counts.get(value) ?? 0)+1
    );

  }


  let winner:null|string = null;

  let highest = 0;


  for(const [key,value] of counts){

    if(value > highest){

      highest=value;

      winner=key;

    }

  }


  return winner;

}