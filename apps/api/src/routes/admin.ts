import express, {
  Response,
} from "express";


import {
  db,
} from "@qre/db";


import {
  requireAuth,
  type AuthRequest,
} from "../middleware/requireAuth.js";


import {
  createExperience,
} from "../services/experienceCreationServices.js";



const router =
  express.Router();



router.use(requireAuth);


/**
 * =====================================================
 * CREATE ASSET + EXPERIENCE
 * =====================================================
 *
 * User
 *   |
 * Account
 *   |
 * Asset
 *   |
 * Experience Service
 *   |
 * Experience
 *   |
 * Flow
 *   |
 * Ready To Scan
 *
 *
 * Architecture:
 *
 * Asset:
 * - QR/NFC identity
 * - belongs to Account
 *
 * Experience Service:
 * - owns compilation
 * - owns Experience creation
 * - owns Flow creation
 *
 * Routes:
 * - request handling only
 *
 * =====================================================
 */



router.post(
  "/assets/create-experience",
  async(
    req: AuthRequest,
    res: Response,
  ) => {


    try {


      const userId =
        req.user?.userId;



      if(!userId){


        return res.status(401).json({

          error:
            "Unauthorized",

        });

      }





      const {

        displayName,

        slug,

        prompt,

        priceCents,

      } =
        req.body;





      if(
        !slug ||
        !prompt
      ){


        return res.status(400).json({

          error:
            "slug and prompt required",

        });


      }

      /**
       * =================================================
       * RESOLVE ACCOUNT
       * =================================================
       */


      const membership =

        await db.accountUser.findFirst({

          where:{


            userId,


            role:{

              in:[

                "OWNER",

                "ADMIN",

              ],

            },


          },


          select:{


            accountId:true,


          },


        });


      if(!membership){


        return res.status(403).json({

          error:
            "No account available",

        });


      }

      const accountId =

        membership.accountId;

      /**
       * =================================================
       * CREATE ASSET
       * =================================================
       *
       * Asset is the identity.
       *
       * Experience is created after.
       *
       * =================================================
       */
       const asset =

       await db.asset.findUnique({

       where:{
       slug,
       },
    
       });


       if(!asset){

        return res.status(404).json({

        error:
      "Asset not found",

       });

       }
       
      /**
       * =================================================
       * CREATE EXPERIENCE
       * =================================================
       *
       * Asset
       *   ↓
       * Experience Service
       *   ↓
       * Engine Compiler
       *   ↓
       * Experience + Flow
       *
       * =================================================
       */



      const result =

        await createExperience({

          assetId:
            asset.id,


          prompt,


        });

      /**
       * =================================================
       * RESPONSE
       * =================================================
       */



      return res.json({


        success:
          true,



        accountId,



        assetId:
          asset.id,



        experienceId:
          result.experience.id,



        flowId:
          result.flow.id,



        slug:
          asset.slug,



        scanUrl:
          `/api/scan/${asset.slug}`,



      });




    }

    catch(error:any){



      console.error(

        "CREATE EXPERIENCE ERROR",

        error,

      );




      return res.status(500).json({


        error:
          error.message,


      });


    }



  },

);



export default router;