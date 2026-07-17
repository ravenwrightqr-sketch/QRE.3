import {
  useEffect,
  useState,
} from "react";


import {
  getUserAssets,
  apiPost,
} from "../lib/api";


import {
  blocksToBlueprint,
} from "../lib/experienceAdapter";


import DashboardLayout from "../components/layout/DashboardLayout";

import GlassCard from "../components/ui/GlassCard";

import NeonButton from "../components/ui/NeonButton";


import ExperienceBlueprint from "../components/experience/ExperienceBlueprint";

import type {
  ExperienceBlock,
} from "../types/experience";


import FlowLibrary from "../components/flow/FlowLibrary";


import LiveScanPreview from "../components/scan/LiveScanPreview";




type Experience = {

  id:string;

  slug:string;

  paid:boolean;

  status:string;

  flowId:string | null;

  tier:string;

};







export default function Dashboard(){



const [

  experiences,

  setExperiences

]=useState<Experience[]>([]);




const [

  activeExperience,

  setActiveExperience

]=useState<Experience | null>(null);




const [

  loading,

  setLoading

]=useState(true);









async function loadExperiences(){



try{


const response =

await getUserAssets();



const assets:Experience[] =

Array.isArray(response)

?

response

:

response.assets ?? [];





setExperiences(

 assets

);





if(

 !activeExperience &&

 assets.length

){



const ready =

assets.find(

 asset =>

 Boolean(
  asset.flowId
 )

);





setActiveExperience(

 ready ?? assets[0]

);



}





}

catch(error){



console.error(

"Loading assets failed",

error

);



}

finally{


setLoading(false);


}


}









async function createExperience(

 blocks:ExperienceBlock[]

){



if(!activeExperience){


alert(

"Select an asset first."

);


return;


}






try{



const blueprint =

blocksToBlueprint(

 blocks

);






const result =

await apiPost(

"/api/flow/create-and-attach",

{


assetId:

activeExperience.id,



name:

blueprint.title,



blueprint,



actions:{},



}

);





console.log(

"Experience created",

result

);





await loadExperiences();





alert(

"Experience launched."

);





}

catch(error:any){



console.error(

error

);





alert(

error.message ??

"Experience creation failed"

);


}



}










useEffect(()=>{


loadExperiences();


},[]);











if(loading){


return (

<DashboardLayout>


<GlassCard glow>

Loading command center...

</GlassCard>


</DashboardLayout>

);


}









return (



<DashboardLayout>





<h1

style={{

fontSize:34,

marginBottom:8,

}}

>

QRE EXPERIENCE STUDIO

</h1>





<p

style={{

opacity:.65,

marginBottom:30,

}}

>

Create cinematic QR and NFC journeys.

</p>









{

activeExperience &&



<GlassCard glow>



<h3>

ACTIVE ASSET

</h3>




<h2>

{activeExperience.slug}

</h2>





<p>

Experience:

{" "}


{

activeExperience.flowId

?

"READY"

:

"EMPTY"

}


</p>





<p>

Tier:

{" "}

{activeExperience.tier}

</p>




</GlassCard>



}









{

activeExperience &&



<FlowLibrary

 assetId={activeExperience.id}

 onEdit={(flowId)=>{

   window.location.href =
   `/flows/${flowId}`;

 }}

/>

}











<ExperienceBlueprint


onSave={

createExperience

}



onLaunch={

createExperience

}


/>









<h2

style={{

marginTop:50,

}}

>

Your Assets

</h2>









<div

style={{

display:"grid",

gridTemplateColumns:

"repeat(auto-fit,minmax(300px,1fr))",

gap:20,

marginTop:20,

}}

>







{

experiences.map(

asset=>(



<GlassCard


      key={asset.id}


      glow={Boolean(

        asset.flowId

      )} children={undefined}

/>





)

)

}








{

experiences.map(

asset=>(



<GlassCard

key={asset.id}

glow={

Boolean(

asset.flowId

)

}

>





<h3>

{asset.slug}

</h3>






<p>

Status:

{" "}

{asset.status}

</p>






<p>

Experience:

{" "}

{

asset.flowId

?

"READY"

:

"EMPTY"

}

</p>






<p>

Tier:

{" "}

{asset.tier}

</p>






<div

style={{

display:"flex",

gap:12,

marginTop:15,

}}

>





<NeonButton

onClick={()=>{


setActiveExperience(

asset

);


}}

>

CONTROL

</NeonButton>









<NeonButton

onClick={()=>{



if(!asset.flowId){



alert(

"No experience attached."

);



return;


}





window.location.href =

`/scan/${asset.slug}`;



}}

>

PLAY

</NeonButton>







</div>







</GlassCard>



)

)

}





</div>









<div

style={{

marginTop:50,

}}

>





{

activeExperience

?

<LiveScanPreview

slug={

activeExperience.slug

}

/>

:

<GlassCard glow>

Select an asset.

</GlassCard>


}





</div>







</DashboardLayout>


);


}