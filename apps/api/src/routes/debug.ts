import { Router } from "express";
import { db } from "@qre/db";

const router = Router();


/**
 * =====================================================
 * QRE DEBUG ROUTES
 *
 * Development inspection only.
 *
 * Shows:
 *
 * Asset
 * Account ownership
 * Ownership record
 * Claims
 * Sessions
 * Analytics
 * Flows
 * Memory
 *
 * No production usage.
 * =====================================================
 */


router.get(
  "/asset/:id",
  async (req, res) => {

    try {


      const assetId =
        req.params.id;



      const asset =
        await db.asset.findUnique({

          where:{
            id:assetId,
          },


          include:{


            /**
             * Account ownership layer
             *
             * Asset belongs to account.
             * Users access through AccountUser.
             */
             account:{

  include:{

    AccountUser:{

      include:{

        User:true,

      },

    },

  },

},



            /**
             * Ownership history
             */
            ownership:true,



            /**
             * Payment claims
             */
            claims:true,



            /**
             * Experience bindings
             */
            flows:{

              include:{

                flow:{

                  include:{

                    steps:{

                      orderBy:{

                        order:"asc",

                      },

                    },

                  },

                },

              },

            },



            /**
             * Scan sessions
             */
            sessions:{

              orderBy:{

                startedAt:
                  "desc",

              },


              take:10,


              include:{

                analyticsEvents:true,

                events:true,

              },

            },



            /**
             * Analytics history
             */
            analyticsEvents:{

              orderBy:{

                createdAt:
                  "desc",

              },


              take:50,

            },



            /**
             * Cinematic memory layer
             */
            memorySnapshots:{

              orderBy:{

                createdAt:
                  "desc",

              },


              take:5,

            },


          },

        });




      if(!asset){

        return res.status(404).json({

          success:false,

          error:
            "Asset not found",

        });

      }




      return res.json({

        success:true,

        asset,

      });


    }


    catch(error){

      console.error(
        "DEBUG ASSET ERROR",
        error
      );



      return res.status(500).json({

        success:false,

        error:
          "Debug lookup failed",

      });

    }

  }

);



export default router;