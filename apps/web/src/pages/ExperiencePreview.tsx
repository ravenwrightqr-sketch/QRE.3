import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";


import DashboardLayout from "../components/layout/DashboardLayout";

import CinematicScanPlayer from "../components/scan/CinematicScanPlayer";


import type {
  Experience,
  CompiledExperience,
} from "@qre/contracts";





/**
 * =====================================================
 * COMPILER PREVIEW → RUNTIME EXPERIENCE
 *
 * Frontend adapter only.
 *
 * Compiler output:
 *
 * Genome
 * World
 * Blueprint
 * ExperienceMoments
 *
 * becomes:
 *
 * Runtime Experience
 * Cinematic Scenes
 * Player
 *
 * =====================================================
 */

function compileToRuntimeExperience(
  input: CompiledExperience
): Experience {


  return {

    sessionId:
      crypto.randomUUID(),


    access:
      "DEMO",


    preview:
      true,


    asset: {

      id:
        "preview",


      slug:
        "preview",


      title:
        input.title ||
        "Living Experience",


      category:
        input.model.metadata?.category,


      accountId:
        null,


      paid:
        false,

    },


    geoStory:
      null,


    cinematicScenes:
      input.cinematicScenes ?? [],


    memorySnapshot:
      null,


    receipt:
      null,


    insights:
      [],


    meta: {

      source:
        "experience-compiler-preview",


      compiler:

        {

          duration:
            input.estimatedDuration,


          moments:
            input.momentCount,

        }

    },


    timestamp:
      new Date().toISOString(),

  };

}







export default function ExperiencePreview(){


  const navigate =
    useNavigate();



  const [
    experience,
    setExperience
  ] =
  useState<Experience|null>(null);





  useEffect(()=>{


    const stored =
      sessionStorage.getItem(
        "experiencePreview"
      );



    if(!stored){

      return;

    }



    try{


      const compiled:
        CompiledExperience =

        JSON.parse(
          stored
        );



      console.log(
        "🎬 CINEMATIC SCENES",
        compiled.cinematicScenes
      );



      console.log(
        "🌎 EXPERIENCE WORLD",
        compiled.world
      );



      setExperience(

        compileToRuntimeExperience(
          compiled
        )

      );


    }

    catch(error){


      console.error(

        "Invalid QRE experience preview",

        error

      );


    }



  },[]);








  function back(){

    navigate(
      "/dashboard"
    );

  }








  if(!experience){


    return (

      <DashboardLayout>

        <div

          style={{

            minHeight:"70vh",

            display:"flex",

            alignItems:"center",

            justifyContent:"center",

            color:"#fff"

          }}

        >

          <h2>
            No Experience Loaded
          </h2>


        </div>


      </DashboardLayout>

    );

  }








  return (

    <DashboardLayout>


      <div

        style={{

          minHeight:"100vh",

          background:"#030305",

          color:"#fff",

          padding:"80px 30px"

        }}

      >




        <div

          style={{

            textAlign:"center",

            marginBottom:50

          }}

        >


          <p

            style={{

              letterSpacing:8,

              opacity:.5

            }}

          >

            QRE EXPERIENCE RUNTIME

          </p>





          <h1

            style={{

              fontSize:"clamp(40px,6vw,72px)",

              fontWeight:900

            }}

          >

            {
              experience.asset?.title ??
              "Living Experience"
            }


          </h1>




          <p

            style={{

              opacity:.65,

              maxWidth:700,

              margin:"20px auto",

              fontSize:18

            }}

          >

            {
              experience.meta?.source ===
              "experience-compiler-preview"

              ?

              "Preview generated from QRE Experience Compiler."

              :

              "Experience ready."

            }


          </p>


        </div>






        {
          experience.cinematicScenes.length > 0 &&

          <CinematicScanPlayer

            experience={
              experience
            }

          />

        }






        <div

          style={{

            textAlign:"center",

            marginTop:50

          }}

        >


          <button

            onClick={back}

            style={{

              background:"transparent",

              border:
                "1px solid rgba(255,255,255,.3)",

              borderRadius:50,

              padding:
                "15px 40px",

              color:"#fff",

              cursor:"pointer"

            }}

          >

            BACK


          </button>


        </div>





      </div>


    </DashboardLayout>


  );

}