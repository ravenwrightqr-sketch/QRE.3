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

type CompilerResult = {

  id?: string;

  experienceName?: string;

  assetName?: string;

  flowName?: string;

  description?: string;

  flowId?: string;

  assetId?: string;

  title?: string;

  industry?: string;

  blueprint?: unknown;

  flowSteps?: unknown[];

  moments?: unknown[];

  cinematicScenes?: unknown[];

  estimatedDuration?: number;

  momentCount?: number;

};




const buildStages = [

  "Understanding your idea",

  "Designing the experience",

  "Creating the moments",

  "Building the sequence",

  "Preparing your builder",

];





export default function ExperienceComposer(){


  const navigate =
    useNavigate();



  const [prompt,setPrompt] =
    useState("");



  const [loading,setLoading] =
    useState(false);



  const [stage,setStage] =
    useState(0);



  const [error,setError] =
    useState<string | null>(null);



  const [result,setResult] =
    useState<CompilerResult | null>(null);



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
        "Describe the experience you want to build."
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
            input:
              prompt.trim(),
          }

        );



      setResult(response);



    }
    catch(error){


      setError(

        error instanceof Error

        ? error.message

        : "Experience generation failed."

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



    /**
     * Temporary editor handoff.
     *
     * Builder becomes the owner
     * of saving.
     */

    sessionStorage.setItem(

      "experienceDraft",

      JSON.stringify({

        ...result,

        prompt,

      })

    );



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

        Describe the experience.
        The engine creates the structure.

      </p>





      <textarea


        value={prompt}


        disabled={loading}


        onChange={
          e =>
          setPrompt(
            e.target.value
          )
        }



        placeholder={
`Example:

Create a luxury Airbnb welcome experience.

Welcome guests.
Show WiFi instructions.
Recommend restaurants.
End with checkout details.`
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

          fontSize:15

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

            ? "⚡ Creating..."

            : "⚡ Create Experience"

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
            🧱 Experience Generated
          </h3>



         <h2>
         {
         result.experienceName ??
         result.title ??
         "Unnamed Experience"
         }
         </h2>





          <p
            style={{
              opacity:.6
            }}
          >

            {

              result.momentCount ??

              result.moments?.length ??

              0

            }

            {" "}
            moments created


          </p>






          <NeonButton

            onClick={openBuilder}

          >

            ▶ OPEN BUILDER & SAVE

          </NeonButton>





        </div>

      }




    </GlassCard>

  );

}