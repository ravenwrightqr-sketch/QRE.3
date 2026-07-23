import {
  useEffect,
  useState,
} from "react";

import MomentRenderer from "./MomentRenderer";

import type {
  ScanResponse,
  CinematicScene,
} from "@qre/contracts";


type Props = {

  data: ScanResponse;

};

export default function CinematicScanPlayer({

  data,

}:Props){


const scenes: CinematicScene[] =
  data.cinematicScenes ?? [];








const [
index,
setIndex
]=useState(0);






useEffect(()=>{

setIndex(0);

},[data]);







const scene =

scenes[index];









useEffect(()=>{


if(!scene)
return;



const timer =

window.setTimeout(()=>{


setIndex(

current =>

Math.min(

current + 1,

scenes.length

)

);


},


scene.duration ?? 3000);



return()=>{

window.clearTimeout(timer);

};


},[

scene,

scenes.length

]);








function restart(){

setIndex(0);

}







if(!scene){


return (

<div

style={{

minHeight:"100vh",

display:"grid",

placeItems:"center",

background:"#030305",

color:"#fff",

textAlign:"center",

padding:40

}}

>


<div>


<h1>

Memory Sealed

</h1>


<p

style={{

opacity:.6

}}

>

This experience has completed.

</p>



<button

onClick={restart}

style={{

marginTop:25,

padding:"14px 35px",

borderRadius:999,

background:"transparent",

border:"1px solid rgba(255,255,255,.35)",

color:"#fff",

cursor:"pointer"

}}

>

RELIVE

</button>


</div>


</div>

);


}







return (

<div

style={{

minHeight:"100vh",

width:"100%",

display:"flex",

alignItems:"center",

justifyContent:"center",

background:"#030305",

color:"#fff",

padding:"40px 20px"

}}

>


<div

style={{

width:"min(1200px,100%)",

}}

>


<MomentRenderer

moment={scene.moment}

/>



</div>


</div>

);


}