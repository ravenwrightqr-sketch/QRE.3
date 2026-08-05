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
  RuntimeExperience,
} from "@qre/contracts";



/**
 * =====================================================
 * QRE RUNTIME EXPERIENCE PAGE
 * =====================================================
 *
 * FRONTEND RESPONSIBILITY:
 *
 * Receive RuntimeExperience
 * Render Human Experience
 *
 *
 * Pipeline:
 *
 * Scan
 *   ↓
 * API
 *   ↓
 * scanEngine
 *   ↓
 * RuntimeExperience
 *   ↓
 * Cinematic Player
 *
 *
 * The frontend does NOT know:
 *
 * - Compiler
 * - Cognition
 * - Genome
 * - World synthesis
 * - Semantic layers
 *
 * Runtime is the contract.
 *
 * =====================================================
 */



function isRuntimeExperience(
  value:unknown
): value is RuntimeExperience {


  if(
    !value ||
    typeof value !== "object"
  ){

    return false;

  }


  const runtime =
    value as Partial<RuntimeExperience>;


  return (

    typeof runtime.runtimeVersion === "string"

    &&

    Array.isArray(
      runtime.cinematicScenes
    )

    &&

    Array.isArray(
      runtime.moments
    )

  );


}





export default function Experience(){


  const navigate =
    useNavigate();



  const [
    experience,
    setExperience
  ] =
  useState<RuntimeExperience|null>(
    null
  );



  const [
    error,
    setError
  ] =
  useState<string|null>(
    null
  );



  useEffect(()=>{


    const stored =
      sessionStorage.getItem(
        "runtimeExperience"
      );



    if(!stored){


      setError(
        "No runtime experience found."
      );


      return;

    }



    try{


      const parsed:
        unknown =
        JSON.parse(
          stored
        );



      if(
        !isRuntimeExperience(
          parsed
        )
      ){

        throw new Error(
          "Invalid RuntimeExperience contract"
        );

      }



      setExperience(
        parsed
      );


    }

    catch(error:any){


      console.error(
        "Runtime experience load failed",
        error
      );


      setError(
        error.message
      );


    }



  },[]);







  function back(){


    navigate(
      "/dashboard"
    );


  }







  if(error){


    return (

      <DashboardLayout>


        <RuntimeStateCard>

          <h2>
            Experience unavailable
          </h2>


          <p>
            {error}
          </p>


          <button
            onClick={back}
          >
            Return Dashboard
          </button>


        </RuntimeStateCard>


      </DashboardLayout>

    );

  }







  if(!experience){


    return (

      <DashboardLayout>


        <RuntimeStateCard>

          <h2>
            Loading Experience...
          </h2>


        </RuntimeStateCard>


      </DashboardLayout>

    );

  }








  return (

    <DashboardLayout>


      <main

        style={{

          minHeight:"100vh",

          background:"#030305",

          color:"#fff",

          padding:"60px 30px"

        }}

      >



        <header

          style={{

            textAlign:"center",

            marginBottom:50

          }}

        >


          <h1

            style={{

              fontSize:
                "clamp(40px,7vw,90px)",

              fontWeight:900,

              letterSpacing:"-3px",

              marginBottom:10

            }}

          >

            {
              experience.asset?.title
              ??
              experience.asset?.slug
              ??
              "QRE Experience"
            }


          </h1>




          <p

            style={{

              opacity:.7,

              textTransform:"uppercase",

              letterSpacing:"3px"

            }}

          >

            {experience.accessState}


          </p>



        </header>








        {
          experience.cinematicScenes.length > 0

          &&

          <CinematicScanPlayer

            experience={
              experience
            }

          />

        }








        <footer

          style={{

            textAlign:"center",

            marginTop:70

          }}

        >



          <button

            onClick={back}

            style={{

              background:
                "transparent",

              border:
                "1px solid rgba(255,255,255,.35)",

              borderRadius:999,

              padding:
                "16px 45px",

              color:"#fff",

              cursor:"pointer",

              fontSize:16

            }}

          >

            BACK


          </button>



        </footer>




      </main>


    </DashboardLayout>

  );

}







function RuntimeStateCard({

  children,

}:{

  children:React.ReactNode;

}){


  return (

    <div

      style={{

        minHeight:"70vh",

        display:"flex",

        flexDirection:"column",

        alignItems:"center",

        justifyContent:"center",

        gap:20,

        color:"#fff",

        textAlign:"center"

      }}

    >

      {children}


    </div>

  );

}