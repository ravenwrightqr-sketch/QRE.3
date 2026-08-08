import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import GlassCard from "../ui/GlassCard";
import NeonButton from "../ui/NeonButton";

import {
  apiPost,
} from "../../lib/api";


import type {
  ExperienceBlueprint,
} from "@qre/contracts";



/**
 * =====================================================
 * QRE EXPERIENCE COMPOSER
 * =====================================================
 *
 * AUTHORING LAYER ONLY
 *
 * User Intent
 *      ↓
 * Compiler
 *      ↓
 * ExperienceBlueprint
 *      ↓
 * ExperienceBuilder
 *      ↓
 * RuntimeExperience
 *
 *
 * Composer responsibilities:
 *
 * ✅ Capture creative intent
 * ✅ Request compilation
 * ✅ Preview blueprint existence
 * ✅ Hand off to Builder
 *
 *
 * Composer does NOT:
 *
 * ❌ Save
 * ❌ Create flows
 * ❌ Create runtime
 * ❌ Execute experiences
 * ❌ Own database state
 *
 * =====================================================
 */



const buildStages = [

  "Understanding intent",

  "Extracting experience meaning",

  "Designing experience structure",

  "Creating experience blueprint",

  "Preparing builder workspace",

];





export default function ExperienceComposer(){


  const navigate =
    useNavigate();



  const [
    prompt,
    setPrompt
  ] =
  useState("");



  const [
    loading,
    setLoading
  ] =
  useState(false);



  const [
    stage,
    setStage
  ] =
  useState(0);



  const [
    error,
    setError
  ] =
  useState<string | null>(null);



  const [
    blueprint,
    setBlueprint
  ] =
  useState<ExperienceBlueprint | null>(null);




  const intervalRef =
    useRef<number | null>(null);







  useEffect(()=>{


    return ()=>{


      if(intervalRef.current){

        window.clearInterval(
          intervalRef.current
        );

      }


    };


  },[]);









  async function createExperience(){



    if(!prompt.trim()){


      setError(
        "Describe the experience you want to create."
      );


      return;


    }




    setLoading(true);

    setError(null);

    setBlueprint(null);

    setStage(0);







    intervalRef.current =

      window.setInterval(()=>{


        setStage(current=>{


          if(
            current >= buildStages.length - 1
          ){

            return current;

          }


          return current + 1;


        });


      },900);









    try{


      const response =

        await apiPost(

          "/experience/compile",

          {

            prompt:
              prompt.trim(),

          }

        );






       if(
  !response?.experience
){

  throw new Error(
    "Compiler did not return an experience blueprint."
  );

}

const generatedBlueprint:
ExperienceBlueprint =

response.experience;







      setBlueprint(

        generatedBlueprint

      );







      /**
       * Temporary handoff state.
       *
       * Builder owns persistence.
       *
       */

      sessionStorage.setItem(

        "experienceDraft",

        JSON.stringify({

          blueprint:
            generatedBlueprint,


          prompt:
            prompt.trim(),


        })

      );




    }


    catch(error){


      setError(

        error instanceof Error

        ?

        error.message

        :

        "Experience compilation failed."

      );


    }


    finally{


      if(intervalRef.current){


        window.clearInterval(

          intervalRef.current

        );


      }


      setLoading(false);


    }


  }









  function openBuilder(){


    if(!blueprint){

      return;

    }



    navigate(

      "/experience/builder"

    );


  }









  return (

    <GlassCard glow>


      <h2>

        ✨ Create Experience

      </h2>




      <p

        style={{

          opacity:.7

        }}

      >

        Describe a world, memory, story, or interaction.

        The QRE compiler creates the experience blueprint.

      </p>







      <textarea


        value={prompt}


        disabled={loading}


        onChange={event=>

          setPrompt(

            event.target.value

          )

        }


        placeholder={

`Create a cinematic memory experience.

Example:

A wedding keepsake that reveals the couple's journey,
photos, messages, timeline, and future memories.`

        }



        style={{

          width:"100%",

          minHeight:170,

          marginTop:18,

          padding:18,

          borderRadius:16,

          resize:"vertical",

          background:

            "rgba(0,0,0,.35)",


          color:"white",


          border:

            "1px solid rgba(255,255,255,.15)",


          fontSize:15,

        }}


      />








      <div

        style={{

          marginTop:20

        }}

      >

        <NeonButton


          disabled={loading}


          onClick={createExperience}


        >

          {

          loading

          ?

          "⚡ COMPILING BLUEPRINT..."

          :

          "⚡ CREATE EXPERIENCE"

          }


        </NeonButton>


      </div>









      {

      loading &&


      <div

        style={{

          marginTop:25

        }}

      >


      {

      buildStages.map(

        (item,index)=>(


          <div

            key={item}


            style={{


              marginBottom:8,


              opacity:

              index <= stage

              ?

              1

              :

              .35


            }}

          >


            {

            index <= stage

            ?

            "✓"

            :

            "○"

            }


            {" "}

            {item}


          </div>


        )


      )


      }


      </div>


      }









      {

      error &&


      <div

        style={{


          marginTop:20,


          color:"#ff5555"


        }}

      >

        {error}


      </div>


      }









      {

      blueprint &&


      <div

        style={{

          marginTop:35

        }}

      >


        <h3>

          Experience Blueprint Created

        </h3>




        <h2>

          {

          blueprint.title

          ??

          "Untitled Experience"

          }


        </h2>




        <p

          style={{

            opacity:.6

          }}

        >

          {

          blueprint.moments?.length ?? 0

          }

          {" "}

          experience moments

        </p>





        <NeonButton

          onClick={openBuilder}

        >

          ▶ OPEN EXPERIENCE BUILDER

        </NeonButton>



      </div>


      }





    </GlassCard>


  );


}