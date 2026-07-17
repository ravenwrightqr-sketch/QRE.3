import {
  useEffect,
  useState,
} from "react";

import MomentRenderer from "./MomentRenderer";

import type {
  CinematicScene,
} from "@qre/contracts";


export default function CinematicScanPlayer({

  scenes,

}:{

  scenes:CinematicScene[];

}){


  const [index,setIndex] =
    useState(0);



  useEffect(()=>{

    setIndex(0);

  },[scenes]);



  const scene =
    scenes?.[index];



  console.log(
    "🔥 CINEMATIC PLAYER SCENES",
    scenes
  );



  console.log(
    "🔥 CURRENT SCENE",
    index,
    scene?.moment?.type,
    scene
  );



  useEffect(()=>{


    if(!scene){
      return;
    }


    /**
     * Payment actions pause playback.
     * Everything else is cinematic autoplay.
     */
    if(
      scene.moment.type === "action" &&
      scene.moment.action === "payment"
    ){
      return;
    }



    const timer =
      window.setTimeout(()=>{

        setIndex(
          current =>
            Math.min(
              current + 1,
              scenes.length
            )
        );

      }, scene.duration ?? 1500);



    return()=>{

      clearTimeout(timer);

    };


  },[scene, scenes.length]);





  function next(){

    setIndex(
      current =>
        Math.min(
          current + 1,
          scenes.length
        )
    );

  }




  function restart(){

    setIndex(0);

  }




  if(!scene){


    return (

      <div
        className="cinematic-end"
        style={{
          minHeight:"100vh",
          width:"100vw",
          display:"grid",
          placeItems:"center",
          textAlign:"center",
          padding:40,
          background:
            "radial-gradient(circle at top, rgba(0,255,170,.12), #050505 60%)",
          color:"white",
        }}
      >

        <h1>
          Memory Sealed
        </h1>


        <p
          style={{
            opacity:.7
          }}
        >
          This moment now exists forever
        </p>


        <div
          style={{
            marginTop:30,
            display:"flex",
            justifyContent:"center",
            gap:15
          }}
        >

          <button
            onClick={restart}
          >
            ↻ Relive
          </button>


          <button
            onClick={()=>{
              window.location.href="/store";
            }}
          >
           Make A Memory
          </button>

        </div>


      </div>

    );

  }





  const isPaymentAction =
    scene.moment.type === "action" &&
    scene.moment.action === "payment";




  return (

    <div
      className="cinematic-stage"
      style={{
        minHeight:"100vh",
        width:"100vw",
        display:"grid",
        placeItems:"center",
        background:"#050505",
        color:"white",
        overflow:"hidden",
      }}
    >


      <div
        style={{
          width:"100%",
          maxWidth:1200,
          display:"grid",
          gap:18,
          placeItems:"center",
          padding:"24px 20px 40px",
        }}
      >


        <MomentRenderer
          moment={
            scene.moment
          }
        />



        {
          isPaymentAction &&

          <button

            onClick={()=>{

             const url =
  typeof scene.moment.meta?.url === "string"
    ? scene.moment.meta.url
    : null;

if(url){
  window.location.href = url;
}

            }}

            style={{

              marginTop:10,

              padding:
                "14px 32px",

              borderRadius:
                "999px",

              background:
                "rgba(255,255,255,.96)",

              color:"#000",

              border:"none",

              cursor:"pointer",

              fontWeight:800,

              width:"min(420px,100%)",

            }}

          >

           {
  typeof scene.moment.meta?.text === "string"
    ? scene.moment.meta.text
    : "Get this QRE"
}


          </button>

        }


      </div>

    </div>

  );

}