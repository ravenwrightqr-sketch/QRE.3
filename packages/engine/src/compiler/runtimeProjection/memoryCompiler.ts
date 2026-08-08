import { nanoid } from "nanoid";

import type {
  ExperienceMoment,
  GeoStoryScene,
  CinematicScene,
  MemorySnapshot,
} from "@qre/contracts";


type SnapshotInput = {

  assetId:string;

  moments:ExperienceMoment[];

  geoStory:
    {
      scenes:GeoStoryScene[];
      summary?:string;
    }
    | null;

  cinematicScenes:CinematicScene[];

};



function hasMomentType(
  moments:ExperienceMoment[],
  types:string[]
){

  return moments.some(
    (m)=>
      types.includes(
        String(m.type)
      )
  );

}

export function buildMemorySnapshot(
  input:SnapshotInput
):MemorySnapshot {


  const id =
    nanoid(12);



  const {
    moments,
    geoStory,
    cinematicScenes,
  } =
    input;



  /**
   * =====================================================
   * EXPERIENCE CHARACTER DETECTION
   * =====================================================
   */


  const hasLocation =
    hasMomentType(
      moments,
      [
        "location",
        "arrival",
      ]
    );



  const hasMedia =
    hasMomentType(
      moments,
      [
        "media",
        "video",
        "photos",
        "soundtrack",
      ]
    );



  const hasStory =
    hasMomentType(
      moments,
      [
        "story",
        "memory",
        "timeline",
      ]
    );





  let type:
    MemorySnapshot["type"] =
      "generic";




  if(
    hasLocation &&
    hasMedia
  ){

    type =
      "event";

  }
  else if(
    hasLocation
  ){

    type =
      "service";

  }
  else if(
    hasStory
  ){

    type =
      "generic";

  }





  const sceneCount =
    geoStory?.scenes.length ?? 0;



  if(
    sceneCount > 3
  ){

    type =
      "memorial";

  }





  /**
   * =====================================================
   * LOCATION TAG EXTRACTION
   * =====================================================
   */


  const locationTags =

    moments

      .filter(
        (m)=>
          [
            "location",
            "arrival",
          ]
          .includes(
            String(m.type)
          )
      )

      .map(
        (m)=>{

          const label =
            m.title


          return typeof label === "string"
            ? label
            : "Unknown";

        }

      );

  /**
   * =====================================================
   * TIMELINE
   * =====================================================
   */

  const timeline =

    moments.map(
      (
        m,
        index
      )=>{


        const raw =
        m.title ??
        m.subtitle ??
        m.type;



        return {

          label:
            typeof raw === "string"
              ? raw
              : String(m.type),


          timestamp:

            new Date(
              Date.now()
              +
              index * 1000
            )
            .toISOString(),

        };

      }

    );


  /**
   * =====================================================
   * EMOTIONAL SIGNAL
   * =====================================================
   */


  let emotionalTone:
    MemorySnapshot["emotionalTone"] =
      "neutral";



  if(
    type === "memorial"
  ){

    emotionalTone =
      "intense";

  }
  else if(
    cinematicScenes.length > 0
  ){

    emotionalTone =
      "mixed";

  }
  else if(
    hasMedia
  ){

    emotionalTone =
      "positive";

  }





  /**
   * =====================================================
   * HIGHLIGHTS
   * =====================================================
   */


  const highlights =

    moments

      .slice(
        0,
        5
      )

      .map(
        (m)=>{


         const raw =
         m.title ??
         m.subtitle ??
         m.type;


          return typeof raw === "string"
            ? raw
            : String(m.type);


        }

      );






  /**
   * =====================================================
   * TITLE
   * =====================================================
   */


  let title =
    "Memory Capsule";



  switch(type){

    case "memorial":

      title =
        "A Life Remembered";

      break;


    case "service":

      title =
        "Experience Record";

      break;


    case "event":

      title =
        "Shared Experience";

      break;


    default:

      title =
        "Memory Capsule";

      break;

  }




  if(
    geoStory?.summary
  ){

    title =
      geoStory.summary.slice(
        0,
        40
      );

  }







  return {

    id,

    type,

    title,


    summary:

      geoStory?.summary ??

      `Captured ${moments.length} moments across experience.`,


    emotionalTone,


    highlights,


    locationTags,


    timeline,

  };


}