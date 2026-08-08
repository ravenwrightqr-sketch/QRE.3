import type {
  GeoStory,
  GeoStoryScene,
} from "@qre/contracts";


export type GeoPoint = {

  lat:number;

  lng:number;

  createdAt:Date;

  label?:string | null;

  city?:string | null;

  region?:string | null;

  country?:string | null;

};




export function buildGeoStory(
  assetId:string,
  points:GeoPoint[]
):GeoStory {


  if(points.length === 0){

    return {

      assetId,

      scenes:[],

      summary:"No movement recorded."

    };

  }



  const scenes:GeoStoryScene[] = [];



  const first = points[0];



  scenes.push({

    id:"intro",

    type:"intro",

    title:"Journey Begins",

    description:
      "A presence is detected entering the system.",


    location:{

      lat:first.lat,

      lng:first.lng,

      label:first.label ?? undefined,

      city:first.city ?? undefined,

      region:first.region ?? undefined,

      country:first.country ?? undefined,

    },


    intensity:0.2,


    timestamp:
      first.createdAt.toISOString(),

  });





  const grouped =
    groupByLocation(points);




  for(const group of grouped){


    scenes.push({

      id:`presence-${group.key}`,


      type:"presence",


      title:
        group.label ??
        "Unknown Location",


      description:
        `Visited ${group.points.length} times`,



      location:{

        lat:group.location.lat,

        lng:group.location.lng,

        label:group.label ?? undefined,

        city:
          group.points[0].city ?? undefined,

        region:
          group.points[0].region ?? undefined,

        country:
          group.points[0].country ?? undefined,

      },



      intensity:
        Math.min(
          1,
          group.points.length / 5
        ),



      timestamp:
        group.points[0]
        .createdAt
        .toISOString(),

    });


  }





  const last =
    points[points.length - 1];




  scenes.push({

    id:"exit",

    type:"exit",


    title:"Session Ends",


    description:
      "Presence leaves tracked environment.",



    location:{

      lat:last.lat,

      lng:last.lng,

      label:last.label ?? undefined,

      city:last.city ?? undefined,

      region:last.region ?? undefined,

      country:last.country ?? undefined,

    },



    intensity:0.3,


    timestamp:
      last.createdAt.toISOString(),

  });






  return {

    assetId,


    scenes,


    summary:
      generateSummary(points),

  };


}









function groupByLocation(
  points:GeoPoint[]
){

  const map =
    new Map<string, GeoPoint[]>();



  for(const point of points){

    const key =
      `${point.lat.toFixed(2)}:${point.lng.toFixed(2)}`;



    if(!map.has(key)){

      map.set(
        key,
        []
      );

    }



    map
      .get(key)!
      .push(point);

  }





  return Array
    .from(map.entries())
    .map(([key, points])=>{


      const first =
        points[0];



      return {

        key,


        points,



        label:
          first.label ?? null,



        location:{

          lat:first.lat,

          lng:first.lng,

        },

      };

    });

}









function generateSummary(
  points:GeoPoint[]
){


  const places =
    new Set(
      points.map(
        p =>
          p.city ?? "unknown"
      )
    );



  return `Tracked ${points.length} interactions across ${places.size} locations.`;

}