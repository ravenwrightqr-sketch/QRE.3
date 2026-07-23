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


return ideas.map((text,index)=>({


text,


index,


duration:
22 + (index * 2),


delay:
index * 3,


size:
14 + (index % 3),


}));


},[]);





return (

<div

className="idea-particle-layer"

>


{


particles.map((particle)=>(


<div

key={particle.index}

className="idea-particle"

style={{


fontSize:
`${particle.size}px`,


animationDuration:
`${particle.duration}s`,


animationDelay:
`${particle.delay}s`,



}}


>


{particle.text}


</div>


))


}



<style>

{`

.idea-particle-layer{

position:absolute;

inset:0;

overflow:hidden;

pointer-events:none;

}



.idea-particle{


position:absolute;


max-width:260px;


line-height:1.4;


color:rgba(255,255,255,.22);


letter-spacing:1px;


white-space:normal;


animation:
floatIdea linear infinite;


}



.idea-particle:nth-child(1){

top:12%;

left:8%;

}


.idea-particle:nth-child(2){

top:22%;

right:8%;

}


.idea-particle:nth-child(3){

top:38%;

left:5%;

}


.idea-particle:nth-child(4){

top:55%;

right:12%;

}


.idea-particle:nth-child(5){

top:72%;

left:10%;

}


.idea-particle:nth-child(6){

top:15%;

left:55%;

}


.idea-particle:nth-child(7){

top:80%;

right:8%;

}


.idea-particle:nth-child(8){

top:45%;

left:65%;

}



@media(max-width:768px){


.idea-particle{

font-size:12px!important;

max-width:150px;

opacity:.55;

}



.idea-particle:nth-child(1){

top:10%;

left:5%;

}



.idea-particle:nth-child(2){

top:18%;

right:5%;

}



.idea-particle:nth-child(3){

top:78%;

left:8%;

}



.idea-particle:nth-child(4){

top:85%;

right:8%;

}



.idea-particle:nth-child(5){

display:none;

}



.idea-particle:nth-child(6){

display:none;

}



.idea-particle:nth-child(7){

display:none;

}



.idea-particle:nth-child(8){

display:none;

}


}



@keyframes floatIdea{


0%{

transform:
translateY(0px);

}


50%{

transform:
translateY(-30px);

}


100%{

transform:
translateY(0px);

}


}



`}

</style>


</div>

);


}