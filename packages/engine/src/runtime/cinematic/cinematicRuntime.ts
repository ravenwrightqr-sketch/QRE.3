import type {
  CinematicScene,
  Moment,
  GeoStory,
} from "@qre/contracts";


type CinematicInput = {
  moments: Moment[];
  geoStory: GeoStory | null;
};



export function cinematicRuntime(
  input: CinematicInput
): CinematicScene[] {


  const scenes: CinematicScene[] = [];



  // =========================================
  // MOMENTS → CINEMATIC SCENES
  // =========================================

  for (const m of input.moments) {

    scenes.push({

      id:
        `scene-${m.order}`,

      type:
        mapMomentType(m.type),

      duration:
        getDuration(m),

      moment:m,

    });

  }




  // =========================================
  // GEO STORY → MEMORY SCENES
  // =========================================

  if (input.geoStory?.scenes) {


    input.geoStory.scenes.forEach(
      (g,index)=>{


        scenes.push({

          id:
            `geo-${g.id}`,


          type:
            "memory",


          duration:
            3500,


          moment:{

            type:
              "location",


            order:
              1000 + index,


            location:{

              lat:
                g.location?.lat ?? 0,


              lng:
                g.location?.lng ?? 0,


              label:
                g.location?.label,


              city:
                g.location?.city,


              region:
                g.location?.region,


              country:
                g.location?.country,

            },


            meta:{

              intensity:
                g.intensity,


              timestamp:
                g.timestamp,

            },

          }

        });

      }

    );

  }





  // =========================================
  // FINAL CTA SCENE
  // =========================================

  scenes.push({

    id:
      "cta",


    type:
      "cta",


    duration:
      3000,


    moment:{

      type:
        "system",


      order:
        9999,


      text:
        "Continue Experience",


      meta:{},

    }

  });



  return scenes;

}






/**
 * =====================================================
 * MOMENT SEMANTIC TYPE
 *
 * ->
 *
 * CINEMATIC PRESENTATION TYPE
 *
 * =====================================================
 */


function mapMomentType(
  type:string
): CinematicScene["type"] {


  switch(type){


    case "system":

      return "system";



    case "action":

    case "product":

    case "reward":

    case "payment":

    case "booking":

      return "action";



    case "location":

    case "photos":

    case "video":

    case "media":

    case "replay":

    case "cinematic_replay":

      return "memory";



    case "story":

    case "message":

    case "education":

    case "social":

    case "profile":

      return "emotion";



    default:

      return "emotion";

  }

}






function getDuration(
  m:Moment
):number {


  switch(m.type){


    case "system":

      return 1200;


    case "action":

      return 2000;


    case "location":

      return 3000;


    case "media":

      return 4000;


    default:

      return 1500;

  }

}