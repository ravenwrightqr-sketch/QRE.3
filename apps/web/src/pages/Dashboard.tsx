import {
  useEffect,
  useState,
} from "react";

import {
  getUserAssets,
} from "../lib/api";

import {
  useNavigate,
} from "react-router-dom";

import {
  compileExperience,
} from "../lib/experienceApi";

import DashboardLayout from "../components/layout/DashboardLayout";

import IdeaParticles from "../components/effects/IdeaParticles";


type Portal = {

  id:string;

  slug:string;

  status:string;

  tier:string;

  flowId:string|null;

};



const starPositions = [

  { top:"18%", left:"14%" },

  { top:"30%", left:"78%" },

  { top:"72%", left:"62%" },

  { top:"76%", left:"20%" },

  { top:"45%", left:"88%" },

];




export default function Dashboard(){


const [
 objects,
 setObjects
]=useState<Portal[]>([]);



const [
 loading,
 setLoading
]=useState(true);



const navigate = useNavigate();



const [
 prompt,
 setPrompt
]=useState("");



const [
 creating,
 setCreating
]=useState(false);




async function load(){


try{


const response =
await getUserAssets();


const assets:Portal[] =

Array.isArray(response)

?

response

:

response.assets ?? [];



setObjects(
assets
);



}

catch(error){

console.error(
error
);

}

finally{

setLoading(false);

}


}

async function awaken(){


if(!prompt.trim()) return;


console.log("PROMPT SENT TO COMPILER:", prompt);


try{


setCreating(true);



const compiled =

await compileExperience({

prompt,

});

sessionStorage.setItem(
  "compiledExperience",
  JSON.stringify(compiled)
);

navigate("/experience");


navigate(
"/experience"
);



}

catch(error){

console.error(
"Creation failed",
error
);

}

finally{

setCreating(false);

}


}





useEffect(()=>{

load();

},[]);







if(loading){


return (

<DashboardLayout>

<IdeaParticles />

<div

style={{

minHeight:"100vh",

display:"flex",

alignItems:"center",

justifyContent:"center",

color:"rgba(255,255,255,.45)",

letterSpacing:4

}}

>

QRE AWAKENING...

</div>


</DashboardLayout>

);


}






return (

<DashboardLayout>


<IdeaParticles />



<div

style={{

position:"relative",

zIndex:2,

minHeight:"100vh",

overflow:"hidden",

color:"#f5f5f5"

}}

>

<div

style={{

position:"absolute",

bottom:"max(25px, env(safe-area-inset-bottom))",

left:"25px",

fontSize:12,

letterSpacing:14,

opacity:.45,

zIndex:5

}}

>
QRE
</div>

<section

style={{

minHeight:"20vh",

display:"flex",

flexDirection:"column",

alignItems:"center",

justifyContent:"flex-start",

paddingTop:"8vh",

}}

>


<h1

className="glow-text"

style={{

fontSize:"clamp(28px,6vw,40px)",

fontWeight:400,

letterSpacing:"-1px",

lineHeight:1,

margin:0,

}}

>

What do you want

<br/>

to bring alive?

</h1>





<div

style={{

display:"flex",

alignItems:"flex-end",

marginTop:"38vh",

gap:10,

width:"min(520px,80vw)",

}}

>


<textarea

value={prompt}

onChange={e=>setPrompt(e.target.value)}

onKeyDown={e=>{

if(e.key==="Enter" && !e.shiftKey){

e.preventDefault();

awaken();

}

}}

placeholder="Describe it..."

style={{

flex:1,

height:70,

resize:"none",

background:"transparent",

border:"none",

borderBottom:
"1px solid rgba(255,255,255,.25)",

outline:"none",

color:"#fff",

fontSize:18,

textAlign:"center",

fontFamily:"inherit",

lineHeight:"70px",

padding:"0",

}}

/>


<button

onClick={awaken}

disabled={creating}

style={{

width:42,

height:42,

borderRadius:"50%",

background:"transparent",

border:

"1px solid rgba(255,255,255,.35)",

color:"#fff",

fontSize:10,

letterSpacing:1,

cursor:"pointer",

marginBottom:8,

transform:"translateX(-50px)",

}}

>
CREATE
</button>


</div>


</section>








<section

style={{

position:"absolute",

inset:0,

zIndex:1,

pointerEvents:"none"

}}

>





{

objects.map((object,index)=>{


const star =
starPositions[index % starPositions.length];


return (

<div

key={object.id}

onClick={()=>{

navigate(
`/dashboard/assets/${object.slug}`
);

}}

style={{

position:"absolute",

top:star.top,

left:star.left,

cursor:"pointer",

animation:

`qreFloat ${8 + index}s ease-in-out infinite`

}}

>



<div

style={{

width:12,

height:12,

borderRadius:"50%",

background:"#fff",

boxShadow:

"0 0 25px rgba(255,255,255,.9), 0 0 70px rgba(255,255,255,.35)"

}}

/>





<div

style={{

marginTop:14,

fontSize:13,

letterSpacing:2,

opacity:.7

}}

>

{object.slug}

</div>



</div>

);


})


}



</section>







</div>


</DashboardLayout>

);


}