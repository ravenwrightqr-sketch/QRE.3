import React from "react";
import AnimatedBackground from "../effects/AnimatedBackground";


export default function DashboardLayout({
children,
}:{
children:React.ReactNode;
}){


return (

<div

style={{

minHeight:"100vh",

position:"relative",

background:"#030509",

color:"#e8ffff",

overflow:"hidden"

}}

>


<AnimatedBackground />


<div

style={{

position:"relative",

zIndex:2,

padding:"40px",

maxWidth:1400,

margin:"0 auto",

fontFamily:
"'Courier New', monospace"

}}

>


{children}


</div>


</div>

);


}