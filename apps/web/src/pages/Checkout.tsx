import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";


export default function Checkout(){

  const { slug } = useParams();

  const [loading,setLoading] =
    useState(true);


  useEffect(()=>{

    async function startCheckout(){

      const res =
        await fetch(
          "/api/checkout",
          {
            method:"POST",
            headers:{
              "Content-Type":"application/json",
            },
            body:JSON.stringify({
              slug,
            }),
          }
        );


      const data =
        await res.json();


      if(data.url){
        window.location.href =
          data.url;
        return;
      }


      if(data.dev){

        window.location.href =
          data.url;

        return;
      }


    }


    startCheckout();

  },[slug]);



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

      <h1>
        Unlocking Experience...
      </h1>

    </div>

  );

}