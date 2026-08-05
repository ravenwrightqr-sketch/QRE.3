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
  CompiledExperience,
} from "@qre/contracts";



const buildStages = [

  "Understanding your idea",

  "Designing the experience",

  "Creating experience structure",

  "Compiling cinematic layers",

  "Preparing runtime",

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
    result,
    setResult
  ] =
  useState<CompiledExperience | null>(null);



  const intervalRef =
    useRef<number | null>(null);





  useEffect(()=>{


    return ()=>{


      if(intervalRef.current){

        clearInterval(
          intervalRef.current
        );

      }


    };


  },[]);







  async function buildExperience(){


    if(!prompt.trim()){


      setError(
        "Describe the experience you want to create."
      );


      return;

    }



    setLoading(true);

    setError(null);

    setResult(null);

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
          "Compiler returned no experience artifact."
        );

      }





      const compiled:

      CompiledExperience =

      response.experience;



      setResult(
        compiled
      );




      sessionStorage.setItem(

        "experienceDraft",

        JSON.stringify({

          compiledExperience:

            compiled,


          prompt,

        })

      );




    }
    catch(error){


      setError(

        error instanceof Error

        ? error.message

        :

        "Experience compilation failed."

      );


    }
    finally{


      if(intervalRef.current){

        clearInterval(
          intervalRef.current
        );

      }


      setLoading(false);


    }


  }








  function openBuilder(){


    if(!result){

      return;

    }



    navigate(
      "/experience/builder"
    );


  }








  return (

    <GlassCard glow>


      <h2>
        ✨ Build an Experience
      </h2>




      <p
        style={{
          opacity:.7
        }}
      >

        Describe an idea.

        The QRE engine compiles the living experience.

      </p>






      <textarea


        value={prompt}


        disabled={loading}


        onChange={e=>

          setPrompt(
            e.target.value
          )

        }



        placeholder={

`Create a cinematic memory experience.

Example:

A wedding guest tag that reveals the couple's story,
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
          marginTop:18
        }}
      >

        <NeonButton

          disabled={loading}

          onClick={buildExperience}

        >

          {

          loading

          ?

          "⚡ COMPILING..."

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

                    ? 1

                    : .35

                  }}

                >

                  {

                  index <= stage

                  ? "✓"

                  : "○"

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
        result &&


        <div

          style={{

            marginTop:30

          }}

        >

          <h3>
            createed
          </h3>



          <h2>

            {
              result.title
              ??
              "Living Experience"
            }

          </h2>





          <p
            style={{
              opacity:.6
            }}
          >

            {
              result.experienceMoments?.length
              ??
              0
            }

            {" "}
            experience moments

          </p>





          <p
            style={{
              opacity:.6
            }}
          >

            {
              result.cinematicScenes?.length
              ??
              0
            }

            {" "}
            cinematic scenes

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