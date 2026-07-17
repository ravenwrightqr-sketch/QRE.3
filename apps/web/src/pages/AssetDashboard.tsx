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
import GlassCard from "../components/ui/GlassCard";
import NeonButton from "../components/ui/NeonButton";

import FlowManager from "../components/flow/FlowManager";


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
  ] = useState<Asset|null>(null);


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


      setAsset(found ?? null);


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
        <GlassCard glow>
          Loading object...
        </GlassCard>
      </DashboardLayout>
    );

  }



  if(!asset){

    return (
      <DashboardLayout>

        <GlassCard glow>

          <h2>
            Object not found
          </h2>

        </GlassCard>

      </DashboardLayout>
    );

  }





  return (

    <DashboardLayout>


      <GlassCard glow>

        <h1>
          {asset.slug}
        </h1>


        <p>
          Object Status:
          {" "}
          {asset.status}
        </p>


        <p>
          Tier:
          {" "}
          {asset.tier}
        </p>


      </GlassCard>





      <div
        style={{
          marginTop:30
        }}
      >

        <FlowManager

          assetId={
            asset.id
          }

        />

      </div>





    </DashboardLayout>

  );

}