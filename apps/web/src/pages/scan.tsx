import {
  useEffect,
  useState,
} from "react";

import {
  useParams,
} from "react-router-dom";

import type {
  ScanResponse,
} from "@qre/contracts";

import ScanAccessRouter from "../components/scan/ScanAccessRouter";

import {
  getScan,
} from "../lib/api";



/**
 * =====================================================
 * QRE SCAN PORTAL
 * =====================================================
 *
 * Frontend responsibility:
 *
 * SCAN
 *  ↓
 * PRESENCE SIGNAL
 *  ↓
 * API
 *  ↓
 * SCAN ENGINE
 *  ↓
 * EXPERIENCE RUNTIME
 *  ↓
 * PLAYER
 *
 * NO EXPERIENCE BUILDING
 * NO STORY COMPILATION
 * NO BUSINESS LOGIC
 *
 * The engine decides meaning.
 * The frontend reveals it.
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


  if(
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
  } = useParams();



  const [
    experience,
    setExperience,
  ] = useState<ScanResponse | null>(null);



  const [
    loading,
    setLoading,
  ] = useState(true);



  const [
    error,
    setError,
  ] = useState<string | null>(null);





  useEffect(()=>{


    async function bootExperience(){


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



        const response =
          await getScan(
            slug,
            geo
          );



        console.log(
          "🔥 QRE EXPERIENCE BOOT",
          {

            access:
              response.access,


            asset:
              response.asset,


            geoStory:
              response.geoStory,


            cinematicScenes:
              response.cinematicScenes,


            memorySnapshot:
              response.memorySnapshot,


            receipt:
              response.receipt,


          }
        );



        setExperience(
          response
        );



      }

      catch(error){


        console.error(
          "🔥 QRE SCAN FAILED",
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



    bootExperience();


  },[
    slug
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






  if(error || !experience){


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

              opacity:.6,

            }}

          >

            {error ?? "Unknown scan error"}

          </p>


        </div>


      </div>

    );


  }







  return (

    <ScanAccessRouter

      data={
        experience
      }

    />

  );


}