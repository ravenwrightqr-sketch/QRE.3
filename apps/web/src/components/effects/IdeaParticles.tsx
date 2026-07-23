import { useMemo } from "react";


const ideas = [

  "Create a wedding memory",

  "Create a time capsule",

  "Create a living dog tag",

  "Create a secret message",

  "Create a brand story",

  "Create an event that lives forever",

  "Create a digital legacy",

  "Create a memory from a moment",

  "Create something they never forget",

  "Create a story that survives time",

  "Create a living object",

  "Create a piece of history",

];




export default function IdeaParticles(){


const particles = useMemo(()=>{


return ideas.map((text,index)=>(


{

text,


top:
Math.random()*100,


left:
Math.random()*100,


duration:
18 + Math.random()*15,


delay:
index * 8,


size:

14 + Math.random()*5


}



));


},[]);





return (


<div

className="idea-particle-layer"

>


{


particles.map((particle,index)=>(


<div

key={index}

className="idea-particle"

style={{


top:`${particle.top}%`,


left:`${particle.left}%`,


fontSize:`${particle.size}px`,


animationDuration:
`${particle.duration}s`,


animationDelay:
`${particle.delay}s`


}}


>


{particle.text}


</div>


))


}



</div>


);


}