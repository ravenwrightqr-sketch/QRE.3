import {
 useEffect,
 useState,
} from "react";


import {
 compileExperience,
} from "../../lib/api";


import GlassCard from "../ui/GlassCard";
import NeonButton from "../ui/NeonButton";

import type {
 ExperienceBlueprint,
 ExperienceMoment
} from "@qre/contracts";
type BlockType =
  | "message"
  | "location"
  | "place"
  | "redirect"
  | "link"
  | "payment"
  | "reward"
  | "memory"
  | "media"
  | "review"
  | "notification"
  | "certificate";


type ExperienceBlock = {

  id:string;

  type:BlockType;

  title:string;

  text:string;

  duration:number;

  config:Record<string, unknown>;

};



const labels:Record<BlockType,string> = {

 message:"MESSAGE",

 location:"LOCATION",

 place:"PLACE",

 redirect:"REDIRECT",

 link:"LINK",

 payment:"PAYMENT",

 reward:"REWARD",

 memory:"MEMORY",

 media:"MEDIA",

 review:"REVIEW",

 notification:"NOTIFICATION",

 certificate:"CERTIFICATE",

};





function convertMomentsToBlocks(
 moments:any[]
):ExperienceBlock[]{


return moments.map(
(moment,index)=>(

{

id:
crypto.randomUUID(),


type:
moment.type === "action"
?
"redirect"
:
moment.type,


title:
moment.meta?.label ??
`Scene ${index+1}`,


text:
moment.text ?? "",


duration:
moment.timer ??
moment.meta?.timer ??
5,


config:{
 ...moment.meta
},


}

)

);


}





type Props={


blocks?:ExperienceBlock[];


moments?:any[];


onSave?:
(
blocks:ExperienceBlock[]
)=>void;



onLaunch?:
(
blocks:ExperienceBlock[]
)=>void;


};





export default function ExperienceBlueprint({

blocks:incomingBlocks,

moments,

onSave,

onLaunch,

}:Props){



const [
blocks,
setBlocks
]=useState<ExperienceBlock[]>([]);



const [
prompt,
setPrompt
]=useState("");



const [
loading,
setLoading
]=useState(false);



const [
error,
setError
]=useState("");




useEffect(()=>{


if(incomingBlocks){

setBlocks(
incomingBlocks
);

return;

}



if(moments){

setBlocks(
convertMomentsToBlocks(
moments
)
);

return;

}



setBlocks([]);



},[
incomingBlocks,
moments
]);







async function compile(){


if(!prompt.trim())
return;



try{


setLoading(true);

setError("");



const result =
await compileExperience({

prompt

});



const scenes =
result.experience?.moments;



if(!scenes?.length){

throw new Error(
"No scenes returned"
);

}



setBlocks(

convertMomentsToBlocks(
scenes
)

);



}
catch(e:any){


console.error(e);


setError(
e.message ??
"Compiler failed"
);


}
finally{


setLoading(false);


}


}







function updateBlock(

id:string,

data:Partial<ExperienceBlock>

){


setBlocks(

current =>

current.map(

block =>

block.id===id

?

{

...block,
...data

}

:

block


)


);


}







function addBlock(
type:BlockType
){



setBlocks(

current =>

[

...current,


{

id:
crypto.randomUUID(),

type,

title:
labels[type],

text:"",

duration:5,

config:{}

}

]


);



}






function removeBlock(
id:string
){


setBlocks(

current =>

current.filter(

b=>

b.id!==id

)

);


}






return (

<GlassCard glow>



<h2>
EXPERIENCE COMPILER
</h2>




<textarea

value={prompt}

onChange={
e=>
setPrompt(
e.target.value
)
}


placeholder="
Describe the experience you want to create...
Example:
Create a luxury dog grooming pickup story
"


style={{

width:"100%",

minHeight:120,

padding:15,

background:"#050505",

color:"white",

borderRadius:12

}}


/>



<NeonButton

disabled={loading}

onClick={compile}

>


{

loading

?

"COMPILING..."

:

"GENERATE EXPERIENCE"

}


</NeonButton>




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







<h2>
TIMELINE
</h2>





{

blocks.map(

(block,index)=>(


<GlassCard

key={block.id}

glow


>


<h3>

SCENE {index+1}

</h3>




<input

value={block.title}

onChange={

e=>

updateBlock(

block.id,

{
title:e.target.value
}

)

}



/>




<textarea

value={block.text}

onChange={

e=>

updateBlock(

block.id,

{
text:e.target.value
}

)

}



/>






<p>
Duration:
{block.duration}s
</p>



<input

type="range"

min="1"

max="120"

value={block.duration}

onChange={

e=>

updateBlock(

block.id,

{

duration:Number(
e.target.value
)

}

)

}

/>






<NeonButton

onClick={()=>removeBlock(block.id)}

>

DELETE

</NeonButton>




</GlassCard>


)


)

}







<GlassCard glow>

<h3>
ADD SCENE
</h3>


{

Object.keys(labels).map(

(type)=>(


<NeonButton

key={type}

onClick={()=>addBlock(
type as BlockType
)}

>

+
{labels[type as BlockType]}

</NeonButton>


)


)

}


</GlassCard>







<div
style={{
display:"flex",
gap:15
}}
>


<NeonButton

onClick={()=>onSave?.(blocks)}

>

SAVE FLOW

</NeonButton>




<NeonButton

onClick={()=>onLaunch?.(blocks)}

>

PLAY PREVIEW

</NeonButton>


</div>




</GlassCard>


);


}