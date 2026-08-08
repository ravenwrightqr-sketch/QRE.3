import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";


import type {
  RuntimeExperience,
} from "@qre/contracts";


import {
  getScan,
} from "../lib/api";




/**
 * =====================================================
 * QRE SCAN ENTRY
 * =====================================================
 *
 * Frontend responsibility:
 *
 * QR / NFC identity
 *        ↓
 * Presence signal
 *        ↓
 * Runtime API
 *        ↓
 * RuntimeExperience
 *        ↓
 * Experience Player
 *
 *
 * Frontend does NOT:
 *
 * - compile experiences
 * - decide access
 * - render demos
 * - render unlocked states
 * - understand cognition
 *
 * The engine decides.
 * The frontend reveals.
 *
 * =====================================================
 */



type GeoPresence = {

  lat:number;

  lng:number;

  accuracy?:number;

};





async function captureGeoPresence():

Promise<GeoPresence | undefined> {


  if (
    !("geolocation" in navigator)
  ){

    return undefined;

  }



  return await new Promise(
    (resolve)=>{


      navigator.geolocation.getCurrentPosition(

        (position)=>{


          resolve({

            lat:
              position.coords.latitude,


            lng:
              position.coords.longitude,


            accuracy:
              position.coords.accuracy,

          });


        },


        ()=>{


          console.warn(
            "QRE geo presence unavailable"
          );


          resolve(undefined);


        },


        {

          enableHighAccuracy:true,

          timeout:5000,

          maximumAge:0,

        }

      );


    }

  );


}





export default function Scan(){


  const {
    slug,
  } =
  useParams();



  const navigate =
    useNavigate();




  const [
    loading,
    setLoading,
  ] =
  useState(true);



  const [
    error,
    setError,
  ] =
  useState<string | null>(null);





  useEffect(()=>{


    async function boot(){



      if(!slug){


        setError(
          "Missing experience identity"
        );


        setLoading(false);


        return;

      }






      try{


        const geo =
          await captureGeoPresence();





        console.log(
          "🔥 QRE SCAN SIGNAL",
          {

            slug,

            geo,

          }
        );






        const runtime:

        RuntimeExperience =

          await getScan(

            slug,

            geo

          );







        console.log(

          "🔥 RUNTIME EXPERIENCE RECEIVED",

          {

            sessionId:
              runtime.sessionId,


            access:
              runtime.accessState,


            scenes:
              runtime.cinematicScenes?.length ?? 0,


            moments:
              runtime.moments?.length ?? 0,


            asset:
              runtime.asset,

          }

        );







        sessionStorage.setItem(

          "runtimeExperience",

          JSON.stringify(
            runtime
          )

        );





        navigate(
          "/experience"
        );



      }


      catch(error){



        console.error(

          "🔥 QRE EXPERIENCE FAILED",

          error

        );



        setError(

          error instanceof Error

          ? error.message

          : "Experience failed to load"

        );


      }


      finally{


        setLoading(false);


      }


    }




    boot();



  },[

    slug,

    navigate,

  ]);







  if(loading){


    return (

      <div

        style={{

          minHeight:"100vh",

          display:"grid",

          placeItems:"center",

          background:"#030305",

          color:"rgba(255,255,255,.7)",

          letterSpacing:4,

          fontSize:14,

        }}

      >

        AWAKENING EXPERIENCE...

      </div>

    );


  }







  if(error){


    return (

      <div

        style={{

          minHeight:"100vh",

          display:"grid",

          placeItems:"center",

          background:"#030305",

          color:"#fff",

          textAlign:"center",

          padding:40,

        }}

      >


        <div>


          <h2>
            Experience unavailable
          </h2>



          <p

            style={{

              opacity:.65,

            }}

          >

            {error}

          </p>



        </div>


      </div>

    );


  }





  return null;


}