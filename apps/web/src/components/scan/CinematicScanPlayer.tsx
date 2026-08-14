import {
  useEffect,
  useRef,
  useState,
} from "react";

import MomentRenderer from "./MomentRenderer";
import { startDefaultCinematicMusic, type MusicHandle } from "./defaultCinematicMusic";

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

const [
  musicStarted,
  setMusicStarted,
]=useState(false);

const musicRef = useRef<MusicHandle | null>(null);


useEffect(()=>{

setIndex(0);
setMusicStarted(false);

if (musicRef.current) {
  musicRef.current.stop();
  musicRef.current = null;
}

return () => {
  if (musicRef.current) {
    musicRef.current.stop();
    musicRef.current = null;
  }
};

},[data]);


useEffect(()=>{

const startMusic = () => {
  if (musicRef.current) return;
  const music = startDefaultCinematicMusic();
  if (music) {
    musicRef.current = music;
    setMusicStarted(true);
  }
};

window.addEventListener("pointerdown", startMusic, { passive: true, once: true });
window.addEventListener("keydown", startMusic, { once: true });

return () => {
  window.removeEventListener("pointerdown", startMusic);
  window.removeEventListener("keydown", startMusic);
};

}, [data]);


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
if (!musicRef.current) {
  const music = startDefaultCinematicMusic();
  if (music) {
    musicRef.current = music;
    setMusicStarted(true);
  }
}
}


if(!scene){

if (musicRef.current) {
  musicRef.current.stop();
  musicRef.current = null;
}

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
onPointerDown={() => {
  if (musicRef.current) return;
  const music = startDefaultCinematicMusic();
  if (music) {
    musicRef.current = music;
    setMusicStarted(true);
  }
}}
style={{
minHeight:"100vh",
width:"100%",
display:"flex",
alignItems:"center",
justifyContent:"center",
background:"#030305",
color:"#fff",
padding:"40px 20px",
position:"relative",
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

{!musicStarted && (
  <button
    type="button"
    onClick={(event) => {
      event.stopPropagation();
      const music = startDefaultCinematicMusic();
      if (music) {
        musicRef.current = music;
        setMusicStarted(true);
      }
    }}
    style={{
      position: "fixed",
      right: 18,
      bottom: 18,
      padding: "10px 14px",
      borderRadius: 999,
      border: "1px solid rgba(255,255,255,.2)",
      background: "rgba(0,0,0,.55)",
      color: "#fff",
      backdropFilter: "blur(12px)",
      cursor: "pointer",
      fontSize: 12,
      letterSpacing: 1,
    }}
  >
    SOUND ON
  </button>
)}

</div>
);


}