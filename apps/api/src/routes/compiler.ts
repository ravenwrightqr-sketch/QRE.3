import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";

import { experienceCompiler } from "@qre/engine";

const router = Router();


/**
 * =====================================================
 * EXPERIENCE COMPILER
 * =====================================================
 *
 * Converts:
 *
 * "Create a luxury Airbnb welcome experience"
 *
 * into:
 *
 * ExperienceIntent
 * FlowSteps
 * Preview
 *
 * No database writes.
 *
 * =====================================================
 */


router.post(
  "/create",
  requireAuth,
  async (req, res) => {

    try {

      const { prompt } = req.body;


      if (
        typeof prompt !== "string" ||
        prompt.trim().length === 0
      ) {

        return res.status(400).json({
          error:"Experience prompt required"
        });

      }

     const result =
  await experienceCompiler(
    prompt.trim()
  );


      return res.json({

        success:true,

        experience:result

      });


    } catch(error) {


      console.error(
        "COMPILER ERROR:",
        error
      );


      return res.status(500).json({

        success:false,

        error:
          "Experience generation failed"

      });

    }

  }
);


export default router;