/////legacy 
import {
useState
} from "react";


import NeonButton from "../ui/NeonButton";


type Props={

initial?:string;

onSave:(name:string)=>void;

onClose:()=>void;

};


export default function FlowNameModal({

initial="",

onSave,

onClose,

}:Props){


const [name,setName]=
useState(initial);



return (

<div>


<h2>
Name this experience
</h2>


<input

value={name}

onChange={
e=>setName(e.target.value)
}

placeholder="
Example:
Grand Canyon Memory
"

/>



<div>

<NeonButton

onClick={()=>{

if(name.trim()){

onSave(name.trim());

}

}}

>
SAVE
</NeonButton>



<NeonButton

onClick={onClose}

>
CANCEL
</NeonButton>


</div>


</div>


)

}