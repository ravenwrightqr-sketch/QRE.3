import {
  useEffect,
  useState,
} from "react";

import GlassCard from "../ui/GlassCard";
import NeonButton from "../ui/NeonButton";

import FlowCard from "./FlowCard";

import {
  apiGet,
  apiPost,
} from "../../lib/api";


type Flow = {

  id:string;

  name:string;

  version:number;

  createdAt?:string;

};



type Props = {

  assetId:string;

  onEdit?:(flowId:string)=>void;

  onPlay?:(flowId:string)=>void;

  onRename?:(flowId:string)=>void;

  onCreate?():void;

};




export default function FlowManager({

assetId,

onEdit,

onPlay,

onRename,

onCreate,

}:Props){



const [
 attached,
 setAttached
] =
useState<Flow[]>([]);



const [
 library,
 setLibrary
] =
useState<Flow[]>([]);



const [
 loading,
 setLoading
] =
useState(true);




async function load(){


try{


setLoading(true);



const [
attachedResult,
libraryResult
]
=
await Promise.all([


apiGet(
`/api/flow/asset/${assetId}`
),


apiGet(
"/api/flow/library"
)


]);



setAttached(
attachedResult.flows ?? []
);



setLibrary(
libraryResult.flows ?? []
);



}
catch(error){


console.error(
"loading flow manager failed",
error
);



}
finally{


setLoading(false);


}


}






useEffect(()=>{

load();

},[assetId]);







async function attach(flowId:string){


try{


await apiPost(

"/api/flow/assign-flow",

{

assetId,

flowId,

}

);



await load();


}
catch(error){

console.error(
"attach failed",
error
);

}


}






async function detach(flowId:string){


try{


await apiPost(

"/api/flow/detach-flow",

{

assetId,

flowId,

}

);



await load();


}
catch(error){

console.error(
"detach failed",
error
);

}


}








if(loading){


return (

<GlassCard glow>

Loading experiences...

</GlassCard>

);


}







return (

<GlassCard glow>


<h2>
Experience Manager
</h2>





<h3>
Attached Experiences
</h3>




{
attached.length === 0 &&

<p>
No experiences attached.
</p>

}




{
attached.map(flow=>(


<FlowCard

key={flow.id}

flow={flow}

attached={true}

onEdit={
onEdit ??
(()=>{})
}

onPlay={
onPlay ??
(()=>{})
}

onRename={
onRename ??
(()=>{})
}

onDetach={
detach
}

/>


))

}







<h3
style={{
marginTop:40
}}
>

Experience Library

</h3>






{
library

.filter(

flow=>

!attached.some(

attachedFlow=>

attachedFlow.id === flow.id

)

)

.map(flow=>(


<FlowCard

key={flow.id}

flow={flow}

attached={false}

onEdit={
onEdit ??
(()=>{})
}

onPlay={
onPlay ??
(()=>{})
}

onRename={
onRename ??
(()=>{})
}

onAttach={
attach
}

/>


))

}






<NeonButton

onClick={onCreate}

>

+ CREATE EXPERIENCE

</NeonButton>





</GlassCard>

);


}