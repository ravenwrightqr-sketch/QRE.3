/**
 * =====================================================
 * QRE ENTERPRISE EXPERIENCE COMPILER TEST
 * =====================================================
 *
 * Validates:
 *
 * Prompt
 *  ↓
 * Experience Compiler
 *  ↓
 * Blueprint
 *  ↓
 * FlowSteps
 *  ↓
 * Moments
 *  ↓
 * Cinematic Scenes
 *
 * =====================================================
 */

import {
  experienceCompiler,
} from "../experienceCompiler.js";



const tests = [

  {
    name: "PET EXPERIENCE",

    prompt:
      "Create a lost pet recovery experience for Max the dog with location tracking and social sharing.",
  },


  {
    name: "CANNABIS PASSPORT",

    prompt:
      "Create a premium cannabis strain passport with product education, rewards, and analytics.",
  },


  {
    name: "WEDDING MEMORY",

    prompt:
      "Create a cinematic wedding memory experience with photos, guest messages, timeline, and sharing.",
  },


];





console.log(
  "\n🟢 QRE ENTERPRISE COMPILER TEST\n"
);





for (const test of tests) {


  console.log(
    "\n=============================="
  );


  console.log(
    test.name
  );


  console.log(
    "==============================\n"
  );



  try {


    const result =
      experienceCompiler(
        test.prompt
      );



    console.log(
      "TITLE:",
      result.title
    );



    console.log(
      "INDUSTRY:",
      result.industry
    );



    console.log(
      "BLUEPRINT TYPE:",
      result.blueprint.type
    );



    console.log(
      "GOAL:",
      result.blueprint.goal
    );



    console.log(
      "MOMENTS:",
      result.momentCount
    );



    console.log(
      "FLOW STEPS:",
      result.flowSteps.length
    );



    console.log(
      "CINEMATIC SCENES:",
      result.cinematicScenes.length
    );

    console.log(
  "\nCINEMATIC TYPES:"
);

console.log(
  result.cinematicScenes.map(
    scene => scene.type
  )
);

    console.log(
      "\nMOMENT TYPES:"
    );


    console.log(

      result.moments.map(
        moment =>
          moment.type
      )

    );



    console.log(
      "\n✅ PASSED"
    );


  } catch(error){


    console.error(
      "\n🔴 FAILED"
    );


    console.error(
      error
    );


  }


}


console.log(
  "\n🟢 ENTERPRISE TEST COMPLETE\n"
);