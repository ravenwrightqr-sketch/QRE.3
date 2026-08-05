import {
  useEffect,
  useState,
} from "react";


import type {
  Experience,
  CinematicScene,
} from "@qre/contracts";


import SceneRenderer from "./SceneRenderer";



type Props = {
  experience: Experience;
};




/**
 * =====================================================
 * QRE CINEMATIC SCAN PLAYER
 * =====================================================
 *
 * Runtime renderer only.
 *
 * Receives:
 *
 * Experience
 *      ↓
 * CinematicScene[]
 *      ↓
 * SceneRenderer
 *
 * No compiler logic.
 * No generation logic.
 *
 * =====================================================
 */


export default function CinematicScanPlayer({
  experience,
}: Props){



  const scenes:CinematicScene[] =
    experience.cinematicScenes ?? [];



  const [
    sceneIndex,
    setSceneIndex
  ] =
  useState(0);





  useEffect(()=>{


    setSceneIndex(0);


  },[experience.sessionId]);







  const scene =
    scenes[sceneIndex];







  useEffect(()=>{


    if(!scene){

      return;

    }



    const duration =

      scene.playback?.duration ??

      5000;




    const timer =

      window.setTimeout(()=>{


        setSceneIndex(current=>{


          const next =
            current + 1;



          if(next >= scenes.length){

            return current;

          }



          return next;


        });


      }, duration);





    return ()=>{


      window.clearTimeout(
        timer
      );


    };



  },[
    scene,
    scenes.length
  ]);







  if(!scene){


    return (

      <div

        style={{

          width:"100%",

          minHeight:300,

          display:"flex",

          alignItems:"center",

          justifyContent:"center",

          color:"#fff"

        }}

      >

        No cinematic scenes available

      </div>

    );


  }








  return (

    <SceneRenderer

      scene={scene}

    />

  );


}