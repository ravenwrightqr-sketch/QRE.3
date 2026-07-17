import { useEffect, useState } from "react";

import DashboardLayout from "../components/layout/DashboardLayout";
import GlassCard from "../components/ui/GlassCard";
import NeonButton from "../components/ui/NeonButton";

import ExperienceBlueprint from "../components/experience/ExperienceBlueprint";

type PreviewData = {
  title?: string;
  moments?: unknown[];
  momentCount?: number;
};



export default function ExperiencePreview(){


  const [experience,setExperience] =
    useState<PreviewData | null>(null);



  useEffect(()=>{


    const stored =
      sessionStorage.getItem(
        "experiencePreview"
      );


    if(!stored){
      return;
    }


    try{

      setExperience(
        JSON.parse(stored)
      );


    }catch{

      console.error(
        "Invalid preview data"
      );

    }


  },[]);




  function returnDashboard(){

    window.location.href =
      "/dashboard";

  }




  if(!experience){


    return (

      <DashboardLayout>

        <GlassCard glow>


          <h2>
            No Experience Loaded
          </h2>


          <NeonButton
            onClick={returnDashboard}
          >
            ← Dashboard
          </NeonButton>


        </GlassCard>

      </DashboardLayout>

    );

  }





  return (

    <DashboardLayout>


      <GlassCard glow>


        <div
          style={{
            display:"flex",
            justifyContent:"space-between",
            alignItems:"center"
          }}
        >


          <div>


            <h1>
              🧱{" "}
              {
                experience.title ??
                "Experience Builder"
              }
            </h1>


            <p
              style={{
                opacity:.6
              }}
            >
              Design your customer journey.
            </p>


          </div>



          <NeonButton
            onClick={returnDashboard}
          >
            ← Dashboard
          </NeonButton>


        </div>


      </GlassCard>




      <div
        style={{
          marginTop:24
        }}
      >

       <ExperienceBlueprint

  moments={
    experience.moments as any[]
  }

/>


      </div>




    </DashboardLayout>

  );

}