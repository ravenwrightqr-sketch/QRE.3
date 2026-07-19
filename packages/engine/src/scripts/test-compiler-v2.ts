import { experienceCompiler } from "../compiler/experienceCompiler.js";


const tests = [

  // MEMORY / STORY
  "Create a cinematic memory experience for a childhood home where people unlock forgotten stories",


  // UNDERGROUND / CULTURE
  "Build an underground cyberpunk nightclub where guests discover secret rooms and hidden performances",


  // PET
  "Create a memorial journey for a dog that passed away with photos, videos, and messages from family",


  // LUXURY BUSINESS
  "Create a luxury hotel experience that makes guests feel like they entered another world",


  // FOOD
  "Make a restaurant experience where customers discover the chef story, menu secrets, and rewards",


  // PRODUCT
  "Create a futuristic product passport showing the origin, creator, and journey of an item",


  // ART
  "Create an interactive gothic art museum experience with mystery, music, and exploration",


  // GAMING
  "Create a treasure hunt adventure where players unlock clues around the city",


  // MUSIC
  "Create a festival experience where fans relive performances and share memories",


  // RANDOM WORLD TEST
  "Create something nobody has seen before that mixes technology, emotion, community, and surprise"

];



for (const prompt of tests) {


  try {


    const result =
      experienceCompiler(prompt);



    console.log("\n================================");
    console.log("PROMPT:");
    console.log(prompt);



    console.log("\nSEMANTIC MOMENTS:");

    console.log(
      result.blueprint.moments.map(
        m => m.type
      )
    );



    console.log("\nCOMPONENTS:");

    console.log(
      result.blueprint.moments.map(
        m => ({
          type:m.type,
          component:m.component,
          title:m.title
        })
      )
    );



    console.log("\nFLOW:");

    console.log(
      result.flowSteps.map(
        s => s.type
      )
    );



    console.log("\nCINEMATIC SCENES:");

    console.log(
      result.cinematicScenes.length
    );


  }

  catch(error) {


    console.error("\nFAILED:");
    console.error(prompt);

    console.error(error);

  }

}