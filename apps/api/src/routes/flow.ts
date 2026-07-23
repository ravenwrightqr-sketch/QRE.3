import express, {
  Request,
  Response,
} from "express";

import { db } from "@qre/db";
import type { Prisma } from "@prisma/client";

import {
  requireAuth,
  type AuthRequest,
} from "../middleware/requireAuth.js";


export const flowRouter = express.Router();


/**
 * =====================================================
 *
 * ASSET ACCESS
 *
 * Asset ownership:
 *
 * User
 *   |
 * AccountUser
 *   |
 * Account
 *   |
 * Asset.accountId
 *
 * =====================================================
 */

async function userHasAssetAccess(
  assetId: string,
  userId: string,
): Promise<boolean> {

  const asset =
    await db.asset.findUnique({

      where:{
        id: assetId,
      },

      select:{
        accountId:true,
      },

    });


  if(!asset?.accountId){

    return false;

  }


  const membership =
    await db.accountUser.findUnique({

      where:{
        accountId_userId:{
          accountId: asset.accountId,
          userId,
        },
      },

    });


  return Boolean(membership);

}


/**
 * =====================================================
 *
 * ASSIGN EXISTING FLOW TO ASSET
 *
 * Runtime library → Asset
 *
 * Does not create flows.
 *
 * =====================================================
 */

flowRouter.post(
  "/assign-flow",
  requireAuth,
  async(
    req:AuthRequest,
    res:Response,
  )=>{

    try{

      const {
        assetId,
        flowId,
        priority,
      } = req.body;


      if(
        !assetId ||
        !flowId
      ){

        return res.status(400).json({

          error:
            "assetId and flowId required",

        });

      }



      const asset =
        await db.asset.findUnique({

          where:{
            id:assetId,
          },

        });



      if(!asset){

        return res.status(404).json({

          error:
            "Asset not found",

        });

      }



      if(
        !(await userHasAssetAccess(
          asset.id,
          req.user!.userId,
        ))
      ){

        return res.status(403).json({

          error:
            "Not authorized",

        });

      }



      const flow =
        await db.flow.findUnique({

          where:{
            id:flowId,
          },

        });



      if(!flow){

        return res.status(404).json({

          error:
            "Flow not found",

        });

      }



      await db.assetFlow.updateMany({

        where:{
          assetId,
        },

        data:{
          active:false,
        },

      });



      const assetFlow =
        await db.assetFlow.upsert({

          where:{

            assetId_flowId:{
              assetId,
              flowId,
            },

          },


          update:{

            active:true,

            priority:
              priority ?? 0,

          },


          create:{

            assetId,

            flowId,

            active:true,

            priority:
              priority ?? 0,

          },

        });



      return res.json({

        success:true,

        assetFlow,

      });



    }catch(error:any){

      console.error(
        "assign flow failed",
        error,
      );


      return res.status(500).json({

        error:
          error.message,

      });

    }

  },
);



/**
 * =====================================================
 *
 * LIST FLOWS ATTACHED TO ASSET
 *
 * =====================================================
 */

flowRouter.get(
  "/asset/:assetId",
  requireAuth,
  async(
    req:AuthRequest,
    res:Response,
  )=>{

    try{

      const {
        assetId,
      } = req.params;



      if(
        typeof assetId !== "string"
      ){

        return res.status(400).json({

          error:
            "Invalid asset id",

        });

      }



      const asset =
        await db.asset.findUnique({

          where:{
            id:assetId,
          },


          include:{

            flows:{

              where:{

                active:true,

              },


              include:{

                flow:{

                  select:{

                    id:true,

                    name:true,

                    version:true,

                    status:true,

                    createdAt:true,

                  },

                },

              },

            },

          },

        });



      if(!asset){

        return res.status(404).json({

          error:
            "Asset not found",

        });

      }



      if(
        !(await userHasAssetAccess(
          asset.id,
          req.user!.userId,
        ))
      ){

        return res.status(403).json({

          error:
            "Not authorized",

        });

      }



      return res.json({

        flows:

          asset.flows.map(
            link => link.flow
          ),

      });



    }catch(error:any){

      console.error(
        "asset flow lookup failed",
        error,
      );


      return res.status(500).json({

        error:
          error.message,

      });

    }

  },
);
 /**
  * =====================================================
  *
  * UPDATE FLOW RUNTIME
  *
  * Replaces runtime steps.
  *
  * Does not compile.
  * Does not create.
  *
  * =====================================================
  */

flowRouter.put(
  "/:flowId",
  requireAuth,
  async(
    req:Request<{flowId:string}> & AuthRequest,
    res:Response,
  )=>{

    try{

      const {
        flowId,
      } = req.params;


      const {
        steps,
      } = req.body;



      if(
        !flowId ||
        !Array.isArray(steps)
      ){

        return res.status(400).json({

          error:
            "flowId and steps required",

        });

      }



      const flow =
        await db.flow.findUnique({

          where:{
            id:flowId,
          },

        });



      if(!flow){

        return res.status(404).json({

          error:
            "Flow not found",

        });

      }



      const updated =
        await db.flow.update({

          where:{
            id:flowId,
          },


          data:{

            version:{

              increment:1,

            },


            steps:{

              deleteMany:{},


              create:

                steps.map(
                  (
                    step:any,
                    index:number,
                  )=>({

                    order:
                      index,


                    type:
                      step.type,


                    payload:
                      (
                        step.payload ??
                        step
                      ) as Prisma.InputJsonValue,

                  })

                ),

            },

          },


          include:{

            steps:true,

          },

        });



      return res.json({

        flow:
          updated,

      });



    }catch(error:any){

      console.error(
        "update flow failed",
        error,
      );


      return res.status(500).json({

        error:
          error.message,

      });

    }

  },
);



/**
 * =====================================================
 *
 * FLOW LIBRARY
 *
 * Runtime flows owned by creator.
 *
 * =====================================================
 */

flowRouter.get(
  "/library",
  requireAuth,
  async(
    req:AuthRequest,
    res:Response,
  )=>{

    try{

      const flows =
        await db.flow.findMany({

          where:{

            merchantId:
              req.user!.userId,

          },


          orderBy:{

            createdAt:
              "desc",

          },


          select:{

            id:true,

            name:true,

            version:true,

            status:true,

            createdAt:true,


            steps:{

              select:{

                id:true,

              },

            },

          },

        });



      return res.json({

        count:
          flows.length,


        flows:

          flows.map(
            flow => ({

              id:
                flow.id,


              name:
                flow.name,


              version:
                flow.version,


              status:
                flow.status,


              stepCount:
                flow.steps.length,


              createdAt:
                flow.createdAt,

            })

          ),

      });



    }catch(error:any){

      console.error(
        "flow library failed",
        error,
      );


      return res.status(500).json({

        error:
          error.message,

      });

    }

  },
);

/**
 * =====================================================
 *
 * DETACH FLOW FROM ASSET
 *
 * Deletes relationship only.
 *
 * Flow remains.
 *
 * =====================================================
 */

flowRouter.post(
  "/detach-flow",
  requireAuth,
  async(
    req:AuthRequest,
    res:Response,
  )=>{

    try{

      const {
        assetId,
        flowId,
      } = req.body;



      if(
        !assetId ||
        !flowId
      ){

        return res.status(400).json({

          error:
            "assetId and flowId required",

        });

      }



      const asset =
        await db.asset.findUnique({

          where:{
            id:assetId,
          },

        });



      if(!asset){

        return res.status(404).json({

          error:
            "Asset not found",

        });

      }



      if(
        !(await userHasAssetAccess(
          asset.id,
          req.user!.userId,
        ))
      ){

        return res.status(403).json({

          error:
            "Not authorized",

        });

      }



      await db.assetFlow.delete({

        where:{

          assetId_flowId:{

            assetId,

            flowId,

          },

        },

      });



      return res.json({

        success:true,

      });



    }catch(error:any){

      console.error(
        "detach flow failed",
        error,
      );


      return res.status(500).json({

        error:
          error.message,

      });

    }

  },
);



export default flowRouter;