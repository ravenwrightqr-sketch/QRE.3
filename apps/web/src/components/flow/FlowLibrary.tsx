import {
  useEffect,
  useState,
} from "react";


import GlassCard from "../ui/GlassCard";
import NeonButton from "../ui/NeonButton";


import {
  getFlowLibrary,
  attachFlow,
  detachFlow,
} from "../../lib/api";




type Flow = {

  id:string;

  name:string;

  description?:string | null;

  category?:string | null;

  visibility?:string;

  version:number;

  stepCount:number;

  createdAt:string;

};




type Props = {

  assetId:string;

  onEdit?:
  (
    flowId:string
  )=>void;

};





export default function FlowLibrary({

  assetId,

  onEdit,

}:Props){



const [

  flows,

  setFlows

]=useState<Flow[]>([]);




const [

  loading,

  setLoading

]=useState(true);




const [

  error,

  setError

]=useState("");




const [

  message,

  setMessage

]=useState("");




const [

  actionLoading,

  setActionLoading

]=useState<string | null>(null);









async function load(){


try{


setError("");



const result =

await getFlowLibrary();



setFlows(

 result.flows ?? []

);



}
catch(error:any){


console.error(

 "Flow library failed",

 error

);



setError(

 error.message ??
 "Unable to load flows"

);



}
finally{


setLoading(false);


}


}








useEffect(()=>{


load();


},[]);









async function handleAttach(

 flowId:string

){



try{


setActionLoading(flowId);

setMessage("");



await attachFlow(

 assetId,

 flowId

);



setMessage(

 "Experience attached."

);



await load();



}
catch(error:any){


setMessage(

 error.message ??
 "Attach failed"

);



}
finally{


setActionLoading(null);


}



}









async function handleDetach(

 flowId:string

){



try{


setActionLoading(flowId);

setMessage("");



await detachFlow(

 assetId,

 flowId

);



setMessage(

 "Experience detached."

);



await load();



}
catch(error:any){


setMessage(

 error.message ??
 "Detach failed"

);



}
finally{


setActionLoading(null);


}



}









if(loading){


return (

<GlassCard glow>

Loading experience library...

</GlassCard>

);


}









return (

<GlassCard glow>



<h2>

Experience Library

</h2>





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





{
message &&

<p
style={{
opacity:.8
}}
>

{message}

</p>

}









{
flows.length === 0 &&

<p>

No saved experiences yet.

</p>

}









{
flows.map(flow=>(


<GlassCard

key={flow.id}

glow

>





<h3>

{flow.name}

</h3>





<p>

Version {flow.version}

</p>





<p>

Scenes:

{" "}

{flow.stepCount}

</p>





{
flow.description &&

<p>

{flow.description}

</p>

}





{
flow.category &&

<p>

Category:

{" "}

{flow.category}

</p>

}





<p>

Visibility:

{" "}

{flow.visibility ?? "PRIVATE"}

</p>







<p
style={{
fontSize:12,
opacity:.6
}}
>

Created:

{" "}

{
new Date(
flow.createdAt
).toLocaleDateString()
}

</p>









<div

style={{

display:"flex",

gap:10,

flexWrap:"wrap",

marginTop:15

}}

>





<NeonButton

onClick={()=>onEdit?.(flow.id)}

>

EDIT

</NeonButton>







<NeonButton

disabled={
 actionLoading === flow.id
}

onClick={()=>handleAttach(flow.id)}

>

{
actionLoading === flow.id
?
"ATTACHING..."
:
"ATTACH"
}

</NeonButton>







<NeonButton

disabled={
 actionLoading === flow.id
}

onClick={()=>handleDetach(flow.id)}

>

{
actionLoading === flow.id
?
"WORKING..."
:
"DETACH"
}

</NeonButton>







</div>







</GlassCard>


))

}








</GlassCard>

);


}