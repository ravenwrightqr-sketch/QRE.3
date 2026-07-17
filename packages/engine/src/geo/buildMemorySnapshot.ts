import { nanoid } from "nanoid";

import type {
  Moment,
  GeoStoryScene,
  CinematicScene,
  MemorySnapshot,
} from "@qre/contracts";


type SnapshotInput = {

  assetId: string;

  moments: Moment[];

  geoStory:
    {
      scenes: GeoStoryScene[];
      summary?: string;
    }
    | null;

  cinematicScenes:
    CinematicScene[];

};




function hasMomentType(
  moments: Moment[],
  types: string[]
){

  return moments.some(
    (m)=>
      types.includes(
        String(m.type)
      )
  );

}





export function buildMemorySnapshot(
  input: SnapshotInput
): MemorySnapshot {


  const id =
    nanoid(12);



  const {
    moments,
    geoStory,
    cinematicScenes,
  } =
    input;



  /**
   * Detect experience characteristics
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
        "photos",
        "video",
        "soundtrack",
        "replay",
        "media",
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




  if (
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

    type = "generic";

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
   * GEO MEMORY TAGS
   */


  const locationTags =
    moments

    .filter(
      m =>
        [
          "location",
          "arrival",
        ]
        .includes(
          String(m.type)
        )
    )

    .map(
      m => {

        const label =
          m.meta?.label;


        return typeof label === "string"
          ? label
          : "Unknown";

      }

    );







  /**
   * Timeline generation
   *
   * Later this will use
   * real geoProof timestamps
   */

  const timeline =
    moments.map(
      (
        m,
        index
      )=>{


        const raw =
          m.meta?.text ??
          m.meta?.label ??
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







  const highlights =
    moments

    .slice(
      0,
      5
    )

    .map(
      m => {

        const raw =
          m.meta?.text ??
          m.meta?.label ??
          m.type;


        return typeof raw === "string"
          ? raw
          : String(m.type);

      }

    );







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



    case "generic":
  title = "Memory Capsule";
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