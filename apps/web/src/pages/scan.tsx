import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import type { ScanResponse } from "@qre/contracts";

import ScanAccessRouter from "../components/scan/ScanAccessRouter";
import { getScan } from "../lib/api";


export default function Scan() {

  const { slug } = useParams();


  const [
    data,
    setData
  ] = useState<ScanResponse | null>(null);



  useEffect(() => {

    async function load() {

      if (!slug) return;


      try {


        let geo:
          | {
              lat:number;
              lng:number;
              accuracy?:number;
            }
          | undefined;



        if ("geolocation" in navigator) {


          geo =
            await new Promise((resolve) => {


              navigator.geolocation.getCurrentPosition(

                (position) => {

                  resolve({

                    lat:
                      position.coords.latitude,

                    lng:
                      position.coords.longitude,

                    accuracy:
                      position.coords.accuracy,

                  });

                },


                () => {

                  console.warn(
                    "GPS unavailable"
                  );

                  resolve(undefined);

                },


                {

                  enableHighAccuracy:true,

                  timeout:5000,

                  maximumAge:0,

                }

              );


            });

        }



        const json =
          await getScan(
            slug,
            geo
          );



        console.log(
          "🔥 FULL EXPERIENCE RESPONSE",
          {

            access:
              json.access,

            geo,

            moments:
              json.moments,

            geoStory:
              json.geoStory,

            cinematicScenes:
              json.cinematicScenes,

            memorySnapshot:
              json.memorySnapshot,

            receipt:
              json.receipt,

            asset:
              json.asset,

          }
        );



        setData(json);



      } catch(error) {


        console.error(
          "🔥 SCAN PAGE FAILED",
          error
        );


      }

    }


    load();


  },[slug]);





  if (!data) {

    return (

      <div
        style={{

          height:"100vh",

          display:"grid",

          placeItems:"center",

          background:"#050505",

          color:"white",

        }}
      >

        Loading experience...

      </div>

    );

  }

  return (

    <ScanAccessRouter

      data={data}

    />

  );

}