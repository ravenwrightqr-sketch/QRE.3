import GlassCard from "../ui/GlassCard";
import NeonButton from "../ui/NeonButton";


type Flow = {

  id:string;

  name:string;

  version:number;

};


type Props = {

  flow:Flow;

  attached?:boolean;


  onEdit:(id:string)=>void;

  onPlay:(id:string)=>void;

  onRename:(id:string)=>void;

  onDetach?:(id:string)=>void;

  onAttach?:(id:string)=>void;

};



export default function FlowCard({

flow,

attached,

onEdit,

onPlay,

onRename,

onDetach,

onAttach,

}:Props){


return (

<GlassCard glow>


<h3>
{flow.name}
</h3>


<p>
Version {flow.version}
</p>



<div
style={{
display:"flex",
gap:10,
flexWrap:"wrap"
}}
>



<NeonButton

onClick={()=>onEdit(flow.id)}

>

EDIT

</NeonButton>




<NeonButton

onClick={()=>onPlay(flow.id)}

>

PLAY

</NeonButton>




<NeonButton

onClick={()=>onRename(flow.id)}

>

RENAME

</NeonButton>



{

attached &&

<NeonButton

onClick={()=>onDetach?.(flow.id)}

>

DETACH

</NeonButton>

}



{

!attached &&

<NeonButton

onClick={()=>onAttach?.(flow.id)}

>

ATTACH

</NeonButton>

}



</div>



</GlassCard>

);

}