/**
 * =====================================================
 * QRE EXPERIENCE COMPILER TEST
 * =====================================================
 *
 * Tests:
 *
 * Prompt
 *   ↓
 * Parser
 *   ↓
 * Intent Detector
 *   ↓
 * Blueprint Composer
 *   ↓
 * Flow Builder
 *
 * NO DATABASE
 * NO SCAN
 *
 * =====================================================
 */


import {
  experienceCompiler,
} from "../compiler/experienceCompiler.js";




const experiences = [


  {
    name:
      "Relationship Time Capsule",


    prompt:
      `
      Create a relationship time capsule keychain.

      We met Friday at 10pm at Apocalypse.
      Include our meeting location, photos,
      favorite memories, friends,
      and an anniversary replay.
      `,
  },



  {
    name:
      "Restaurant Loyalty QR",


    prompt:
      `
      Create a QR experience for my pizza restaurant.

      Customers should see the menu,
      daily specials,
      rewards,
      coupons,
      and leave reviews.
      `,
  },



  {
    name:
      "Airbnb Welcome Experience",


    prompt:
      `
      Create an Airbnb guest welcome experience.

      Include check in instructions,
      house information,
      local recommendations,
      and a thank you message.
      `,
  },



  {
    name:
      "Pet Adoption Memory Tag",


    prompt:
      `
      Create a QR pet adoption tag.

      Tell the dog's story,
      show photos,
      help people contact the shelter,
      and create an emotional connection.
      `,
  },


];






function run() {


  for (
    const experience of experiences
  ) {


    console.log(
      "\n================================="
    );


    console.log(
      experience.name
    );


    console.log(
      "=================================\n"
    );



    const result =
      experienceCompiler(
        experience.prompt
      );



    console.log(
      "BLUEPRINT:"
    );


    console.dir(
      result.blueprint,
      {
        depth: null,
      }
    );



    console.log(
      "\nFLOW STEPS:"
    );


    console.dir(
      result.flowSteps,
      {
        depth: null,
      }
    );



    console.log(
      "\nDURATION:",
      result.estimatedDuration,
      "ms"
    );


    console.log(
      "MOMENTS:",
      result.momentCount
    );

  }

}





try {

  run();

}
catch(error) {

  console.error(
    "COMPILER TEST FAILED:",
    error
  );


  process.exit(1);

}