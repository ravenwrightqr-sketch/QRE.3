/**
 * =====================================================
 * QRE EXPERIENCE COMPILE ROUTE
 * =====================================================
 *
 * Human Prompt
 *        ↓
 * Experience Compiler
 *        ↓
 * Experience Blueprint
 *
 * API delivery layer only.
 *
 * - No database writes
 * - No Prisma
 * - No execution
 * - Authentication required
 *
 * =====================================================
 */


import { Router } from "express";
import { experienceCompiler } from "@qre/engine";
import { requireAuth } from "../middleware/requireAuth.js";


const router = Router();



/**
 * POST /experience/compile
 *
 * Body:
 * {
 *   "prompt": "Create a VIP nightclub experience..."
 * }
 *
 * Returns:
 *
 * {
 *   success:true,
 *
 *   experience:{
 *     title,
 *     industry,
 *     blueprint,
 *     flowSteps,
 *     moments,
 *     cinematicScenes,
 *     estimatedDuration,
 *     momentCount
 *   }
 * }
 *
 * =====================================================
 */


router.post(
  "/compile",
  requireAuth,
  async (req, res) => {

    try {


      const {
        prompt,
      } = req.body;



      if (
        typeof prompt !== "string" ||
        prompt.trim().length === 0
      ) {

        return res.status(400).json({

          success:false,

          error:
            "Experience prompt is required.",

        });

      }



      const experience =
        await experienceCompiler(
          prompt.trim()
        );



      return res.json({

        success:true,

        experience,

      });


    }

    catch(error){


      console.error(

        "Experience compile failed:",

        error

      );



      return res.status(500).json({

        success:false,

        error:
          "Failed to compile experience.",

      });

    }

  }

);



export default router;