import {
  useEffect,
  useState,
} from "react";

import {
  useParams,
} from "react-router-dom";


import GlassCard from "../ui/GlassCard";

import ExperienceBlueprint from "../experience/ExperienceBlueprint";

import {
  getFlow,
  saveFlow,
} from "../../lib/api";

import type {
  ExperienceBlock,
} from "../../types/experience";





export default function FlowEditor(){



const {
  flowId
}=useParams();




const [
  flow,
  setFlow
]=useState<any>(null);




const [
  saving,
  setSaving
]=useState(false);




const [
  error,
  setError
]=useState("");








async function load(){


if(!flowId){

return;

}



try{


setError("");



const result =
await getFlow(
 flowId
);



setFlow(
 result.flow
);



}
catch(error:any){


console.error(
 "Flow load failed",
 error
);



setError(
 error.message ??
 "Unable to load flow"
);



}



}








useEffect(()=>{


load();


},[flowId]);









async function handleSave(

 blocks:ExperienceBlock[]

){



if(!flowId){

return;

}




try{


setSaving(true);



await saveFlow(

 flowId,

 {

   steps:

    blocks.map(
      block=>({

        type:
          block.type,


        payload:{

          title:
            block.title,


          text:
            block.text,


          timer:
            block.timer,


          ...block.config,

        }

      })

    )

 }

);



alert(
 "Flow saved successfully."
);



}
catch(error:any){


console.error(
 error
);



alert(

 error.message ??
 "Save failed"

);



}
finally{


setSaving(false);


}



}









if(!flow){


return (

<GlassCard glow>

Loading flow...

</GlassCard>

);


}









return (

<GlassCard glow>



<h1>

{flow.name}

</h1>




<p>

Version {flow.version}

</p>







{
error &&

<p
style={{
color:"red"
}}
>

{error}

</p>

}









<ExperienceBlueprint



moments={

flow.steps?.map(

(step:any)=>(

{

type:
step.type,


text:
step.payload?.text ?? "",


title:
step.payload?.title ?? "Scene",


timer:
step.payload?.timer ?? 5,


config:
step.payload

}

)

)

}



onSave={handleSave}



/>









<GlassCard glow>


<small>

{
saving

?

"Saving flow..."

:

"Flow ready"

}

</small>


</GlassCard>







</GlassCard>

);



}