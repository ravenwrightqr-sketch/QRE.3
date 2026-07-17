import express from "express";
import { db } from "@qre/db";
import {
 requireAuth,
 type AuthRequest,
} from "../middleware/requireAuth.js";


const router = express.Router();



router.get(
 "/:flowId",
 requireAuth,
 async(
 req:AuthRequest,
 res
 )=>{


 try{


const flowId =
req.params.flowId;


if(
typeof flowId !== "string"
){

return res.status(400).json({

error:"Invalid flow id"

});

}


const flow =
await db.flow.findUnique({

where:{
 id:flowId,
},

include:{
 steps:{
  orderBy:{
   order:"asc"
  }
 }

}

});



 if(!flow){

 return res.status(404).json({

 error:"Flow not found"

 });

 }



 return res.json({

 flow

 });


 }
 catch(error:any){


 console.error(
 "get flow failed",
 error
 );


 return res.status(500).json({

 error:error.message

 });


 }


 }

);


export default router;