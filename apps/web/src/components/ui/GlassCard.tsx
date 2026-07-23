/////legacy no boxes at all anywhere

import type { ReactNode } from "react";


export default function GlassCard({

  children,

  glow = false,

  style,

}: {

  children: ReactNode;

  glow?: boolean;

  style?: React.CSSProperties;

}) {


return (


<div

style={{


position:"relative",


padding:28,


background:

"linear-gradient(145deg, rgba(255,255,255,.09), rgba(255,255,255,.025))",



border:

glow

?

"1px solid rgba(255,255,255,.25)"

:

"1px solid rgba(255,255,255,.12)",




borderRadius:30,




boxShadow:

glow

?

`

0 40px 120px rgba(0,0,0,.75),

0 0 80px rgba(255,255,255,.08)

`

:

`

0 30px 100px rgba(0,0,0,.65)

`,





backdropFilter:

"blur(32px)",



WebkitBackdropFilter:

"blur(32px)",



overflow:"hidden",



transition:

"all .35s ease",



...style



}}



>


{/* cinematic glass reflection */}


<div

style={{


position:"absolute",


inset:0,


pointerEvents:"none",



background:


`

linear-gradient(

120deg,

transparent 20%,

rgba(255,255,255,.035),

transparent 70%

)

`



}}


/>





<div

style={{


position:"relative",


zIndex:1


}}

>


{children}


</div>





</div>


);


}