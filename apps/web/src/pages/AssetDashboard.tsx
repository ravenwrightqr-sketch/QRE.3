import {
  useEffect,
  useState,
} from "react";

import {
  useParams,
} from "react-router-dom";

import {
  getUserAssets,
} from "../lib/api";

import DashboardLayout from "../components/layout/DashboardLayout";


type Asset = {
  id:string;
  slug:string;
  status:string;
  tier:string;
  flowId:string|null;
};



export default function AssetDashboard(){

  const {
    slug
  } = useParams();



  const [
    asset,
    setAsset
  ] = useState<Asset | null>(null);



  const [
    loading,
    setLoading
  ] = useState(true);




  async function load(){

    try{

      const response =
        await getUserAssets();



      const assets =
        response.assets ?? response;



      const found =
        assets.find(
          (item:Asset)=>
            item.slug === slug
        );



      setAsset(
        found ?? null
      );


    }
    catch(error){

      console.error(
        "asset loading failed",
        error
      );

    }
    finally{

      setLoading(false);

    }

  }




  useEffect(()=>{

    load();

  },[slug]);






  if(loading){

    return (

      <DashboardLayout>

        <div
          style={{
            minHeight:"60vh",
            display:"grid",
            placeItems:"center",
            color:"rgba(255,255,255,.5)",
            letterSpacing:3,
          }}
        >

          LOADING EXPERIENCE...

        </div>

      </DashboardLayout>

    );

  }





  if(!asset){

    return (

      <DashboardLayout>

        <div
          style={{
            minHeight:"60vh",
            display:"grid",
            placeItems:"center",
            color:"#fff",
          }}
        >

          <h2>
            Object not found
          </h2>

        </div>

      </DashboardLayout>

    );

  }





  return (

    <DashboardLayout>


      <main

        style={{

          minHeight:"100vh",

          color:"#fff",

          padding:"60px 30px",

        }}

      >


        <section>


          <p

            style={{

              opacity:.45,

              letterSpacing:5,

              fontSize:12,

            }}

          >

            EXPERIENCE OBJECT

          </p>



          <h1>

            {asset.slug}

          </h1>



          <p>

            STATUS:

            {" "}

            {asset.status}

          </p>



          <p>

            TIER:

            {" "}

            {asset.tier}

          </p>



        </section>





        <section

          style={{

            marginTop:60,

          }}

        >


          <h2>

            Connected Experiences

          </h2>



          <p

            style={{

              opacity:.55,

              maxWidth:500,

            }}

          >

            Experiences are created from the QRE compiler and connected to this object automatically.

          </p>



        </section>




      </main>


    </DashboardLayout>

  );

}