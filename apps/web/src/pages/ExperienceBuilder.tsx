import {
  useEffect,
  useState,
} from "react";

import type {
  ExperienceBlueprint,
} from "@qre/contracts";



/**
 * =====================================================
 * QRE EXPERIENCE BUILDER
 * =====================================================
 *
 * Authoring Layer
 *
 * ExperienceBlueprint
 *        ↓
 * Builder
 *        ↓
 * Save Authority
 *        ↓
 * Runtime Projection
 *
 *
 * Responsibilities:
 *
 * ✅ Load draft blueprint
 * ✅ Present editable experience structure
 * ✅ Prepare future save workflow
 *
 * Does NOT:
 *
 * ❌ Compile
 * ❌ Execute runtime
 * ❌ Play experience
 *
 * =====================================================
 */



type ExperienceDraft = {

  blueprint: ExperienceBlueprint;

  prompt?: string;

};






export default function ExperienceBuilder(){


  const [
    draft,
    setDraft
  ] =

  useState<ExperienceDraft | null>(null);







  useEffect(()=>{


    const stored =

      sessionStorage.getItem(

        "experienceDraft"

      );



    if(!stored){

      return;

    }





    try{


      const parsed:

      ExperienceDraft =

      JSON.parse(

        stored

      );



      setDraft(

        parsed

      );


    }

    catch(error){


      console.error(

        "Invalid experience draft",

        error

      );


    }



  },[]);









  if(!draft){


    return (

      <div>

        No experience draft found.

      </div>

    );


  }






  const blueprint =

    draft.blueprint;








  return (

    <div

      style={{

        padding:40,

        color:"#fff"

      }}

    >



      <h1>

        Experience Builder

      </h1>





      <h2>

        {

        blueprint.title

        ??

        "Untitled Experience"

        }

      </h2>





      <p>

        Moments:

        {" "}

        {

        blueprint.moments?.length

        ??

        0

        }

      </p>





      <p>

        Type:

        {" "}

        {

        blueprint.type

        ??

        "experience"

        }

      </p>







      <pre

        style={{

          marginTop:30,

          padding:20,

          borderRadius:16,

          background:

            "rgba(0,0,0,.35)",

          overflow:"auto"

        }}

      >

        {

        JSON.stringify(

          blueprint,

          null,

          2

        )

        }


      </pre>




    </div>

  );


}