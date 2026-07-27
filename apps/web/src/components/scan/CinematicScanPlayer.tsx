import {
  useEffect,
  useState,
} from "react";

import type {
  ScanResponse,
  CinematicScene,
} from "@qre/contracts";



type Props = {
  data: ScanResponse;
};



export default function CinematicScanPlayer({
  data,
}: Props) {


  const scenes: CinematicScene[] =
    data.cinematicScenes ?? [];



  const [
    sceneIndex,
    setSceneIndex
  ] =
  useState(0);



  useEffect(() => {

    setSceneIndex(0);

  }, [data]);



  const scene =
    scenes[sceneIndex];




  useEffect(() => {

    if (!scene) {
      return;
    }


    const timer =
      window.setTimeout(() => {


        setSceneIndex(current => {


          const next =
            current + 1;


          if (
            next >= scenes.length
          ) {

            return scenes.length;

          }


          return next;


        });


      }, 5000);



    return () => {

      window.clearTimeout(timer);

    };


  }, [
    scene,
    scenes.length
  ]);





  function restart() {

    setSceneIndex(0);

  }





  if (!scene) {


    return (

      <main
        style={{
          minHeight:"100vh",
          display:"grid",
          placeItems:"center",
          background:"#030305",
          color:"#fff",
          textAlign:"center",
        }}
      >

        <div>

          <h1>
            Memory Complete
          </h1>


          <button
            onClick={restart}
            style={{
              marginTop:30,
              padding:"14px 35px",
              borderRadius:999,
              background:"transparent",
              border:"1px solid rgba(255,255,255,.35)",
              color:"#fff",
              cursor:"pointer"
            }}
          >
            RELIVE
          </button>


        </div>

      </main>

    );

  }





  return (

    <main

      style={{

        minHeight:"100vh",

        width:"100%",

        background:"#030305",

        color:"#fff",

      }}

    >


      <section

        style={{

          width:"100%",

          minHeight:"100vh",

        }}

      >


        <pre

          style={{

            whiteSpace:"pre-wrap",

            padding:40,

            fontSize:18,

            opacity:.85,

          }}

        >

          {JSON.stringify(
            scene,
            null,
            2
          )}

        </pre>



      </section>


    </main>

  );

}