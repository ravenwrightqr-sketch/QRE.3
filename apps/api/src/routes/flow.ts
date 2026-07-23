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

import {
  blueprintToFlow,
} from "@qre/engine";

import {
  compileExperience,
} from "../services/experienceService.js";


export const flowRouter = express.Router();


/**
 * =====================================================
 *
 * ACCOUNT ASSET ACCESS
 *
 * Asset ownership model:
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
  userId: string
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
          accountId:
            asset.accountId,

          userId,
        },
      },

    });


  return Boolean(membership);

}

/**
 * =====================================================
 *
 * COMPILE EXPERIENCE PREVIEW
 *
 * Prompt
 *   ↓
 * Experience Compiler
 *   ↓
 * Blueprint
 *
 * No database writes
 *
 * =====================================================
 */

flowRouter.post(
  "/compile",
  async(
    req: Request,
    res: Response
  )=>{

    try{

      const {
        input,
      } = req.body;


      if(
        typeof input !== "string" ||
        !input.trim()
      ){

        return res.status(400).json({

          error:
            "input required",

        });

      }


      const compiled =
        await compileExperience(
          input.trim()
        );


      return res.json(
        compiled
      );


    }catch(error:any){

      console.error(
        "compile experience failed",
        error
      );


      return res.status(500).json({

        error:
          error.message,

      });

    }

  }
);

/**
 * =====================================================
 *
 * CREATE RAW FLOW
 *
 * Internal flow creation
 *
 * =====================================================
 */

flowRouter.post(
  "/create",
  async(
    req:Request,
    res:Response
  )=>{

    try{

      const {
        name,
        steps,
        actions,
        merchantId,
      } = req.body;



      if(
        !name ||
        !Array.isArray(steps)
      ){

        return res.status(400).json({

          error:
            "name and steps required",

        });

      }



      const flow =
        await db.flow.create({

          data:{

            name,

            version:1,

            merchantId,

            actions:
              actions ?? {},


            steps:{

              create:

                steps.map(
                  (
                    step:any
                  )=>({

                    order:
                      step.order ?? 0,


                    type:
                      step.type,


                    payload:
                      step.payload as Prisma.InputJsonValue,

                  })

                ),

            },

          },


          include:{

            steps:true,

          },

        });



      return res.json({

        success:true,

        flow,

      });


    }catch(error:any){

      console.error(
        "create flow failed",
        error
      );


      return res.status(500).json({

        error:
          error.message,

      });

    }

  }
);

/**
 * =====================================================
 *
 * CREATE + ATTACH EXPERIENCE
 *
 * Creates a new Flow.
 *
 * Does not overwrite existing flows.
 *
 * Asset
 *   |
 *   AssetFlow
 *   |
 *   Flow
 *
 * =====================================================
 */

flowRouter.post(
  "/create-and-attach",
  requireAuth,
  async(
    req:AuthRequest,
    res:Response
  )=>{

    try{

      const {
        assetId,
        name,
        blueprint,
        actions,
      } = req.body;



      if(
        !assetId ||
        !blueprint
      ){

        return res.status(400).json({

          error:
            "assetId and blueprint required",

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



      const hasAccess =
        await userHasAssetAccess(
          asset.id,
          req.user!.userId
        );



      if(!hasAccess){

        return res.status(403).json({

          error:
            "Not authorized",

        });

      }



      const steps =
        blueprintToFlow(
          blueprint
        );



      if(!steps.length){

        return res.status(400).json({

          error:
            "Experience contains no moments",

        });

      }



      const flow =
        await db.flow.create({

          data:{

            name:
              name ??
              "Untitled Experience",


            version:1,


            merchantId:
              req.user!.userId,


            actions:
              actions ?? {},


            steps:{

              create:

                steps.map(
                  step=>({

                    order:
                      step.order,


                    type:
                      step.type,


                    payload:
                      step.payload as Prisma.InputJsonValue,

                  })

                ),

            },

          },


          include:{

            steps:true,

          },

        });



      await db.assetFlow.create({

        data:{

          assetId,


          flowId:
            flow.id,


          active:true,


          priority:0,

        },

      });



      return res.json({

        success:true,

        flow,

        assetId,

      });



    }catch(error:any){

      console.error(
        "create attach flow failed",
        error
      );

      return res.status(500).json({

        error:
          error.message,

      });

    }

  }
);

 
/**
 * =====================================================
 *
 * COMPILE → UPDATE EXISTING FLOW
 *
 * Requires:
 * assetId
 * flowId
 * input
 *
 * =====================================================
 */

flowRouter.post(
  "/compile-and-save",
  requireAuth,
  async(
    req:AuthRequest,
    res:Response
  )=>{

    try{

      const {
        assetId,
        flowId,
        input,
      } = req.body;



      if(
        !assetId ||
        !flowId ||
        !input
      ){

        return res.status(400).json({

          error:
            "assetId, flowId and input required",

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
          req.user!.userId
        ))
      ){

        return res.status(403).json({

          error:
            "Not authorized",

        });

      }



      const connection =
        await db.assetFlow.findUnique({

          where:{

            assetId_flowId:{

              assetId,

              flowId,

            },

          },

        });



      if(!connection){

        return res.status(403).json({

          error:
            "Flow is not attached to asset",

        });

      }



      const compiled =
       await compileExperience(
          input
        );



      const steps =
        compiled.flowSteps.map(
          step=>({

            order:
              step.order,


            type:
              step.type,


            payload:
              step.payload as Prisma.InputJsonValue,

          })
        );



      const updated =
        await db.flow.update({

          where:{
            id:flowId,
          },


          data:{

            name:
              compiled.title,


            actions:{

                category:
                 compiled.blueprint.type,


              estimatedDuration:
                compiled.estimatedDuration,


              momentCount:
                compiled.momentCount,

            },


            steps:{

              deleteMany:{},


              create:steps,

            },

          },


          include:{

            steps:true,

          },

        });



      return res.json({

        success:true,

        flowId:
          updated.id,

        assetId,

        steps,

      });



    }catch(error:any){

      console.error(
        "compile save failed",
        error
      );


      return res.status(500).json({

        error:
          error.message,

      });

    }

  }
);






/**
 * =====================================================
 *
 * ASSIGN EXISTING FLOW TO ASSET
 *
 * Flow library → Asset
 *
 * =====================================================
 */

flowRouter.post(
  "/assign-flow",
  requireAuth,
  async(
    req:AuthRequest,
    res:Response
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
          req.user!.userId
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
        error
      );


      return res.status(500).json({

        error:
          error.message,

      });

    }

  }
);







/**
 * =====================================================
 *
 * LIST ASSET FLOWS
 *
 * =====================================================
 */

flowRouter.get(
  "/asset/:assetId",
  requireAuth,
  async(
    req:AuthRequest,
    res:Response
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
          req.user!.userId
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
            link=>link.flow
          ),

      });



    }catch(error:any){

      console.error(
        "asset flow lookup failed",
        error
      );


      return res.status(500).json({

        error:
          error.message,

      });

    }

  }
);







/**
 * =====================================================
 *
 * UPDATE FLOW FROM EDITOR
 *
 * Replaces steps.
 *
 * =====================================================
 */

flowRouter.put(
  "/:flowId",
  requireAuth,
  async(
    req:Request<{flowId:string}> & AuthRequest,
    res:Response
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



      if(
        flow.merchantId !== req.user!.userId
      ){

        return res.status(403).json({

          error:
            "Not authorized",

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
                    index:number
                  )=>({

                    order:index,


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
        error
      );


      return res.status(500).json({

        error:
          error.message,

      });

    }

  }
);
 /**
 * =====================================================
 *
 * FLOW LIBRARY
 *
 * Returns flows created by current user.
 *
 * =====================================================
 */

flowRouter.get(
  "/library",
  requireAuth,
  async(
    req:AuthRequest,
    res:Response
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
            flow=>({

              id:
                flow.id,


              name:
                flow.name,


              version:
                flow.version,


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
        error
      );


      return res.status(500).json({

        error:
          error.message,

      });

    }

  }
);







/**
 * =====================================================
 *
 * DETACH FLOW FROM ASSET
 *
 * Deletes relationship only.
 *
 * Flow remains in library.
 *
 * =====================================================
 */

flowRouter.post(
  "/detach-flow",
  requireAuth,
  async(
    req:AuthRequest,
    res:Response
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
          req.user!.userId
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
        error
      );


      return res.status(500).json({

        error:
          error.message,

      });

    }

  }
);


export default flowRouter;