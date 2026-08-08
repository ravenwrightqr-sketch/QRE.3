import {
  compileExperience
} from "../services/experienceService.js";


async function run(){


  const prompt = `

Create a memorial QR experience for a grandfather named James.

He loved fishing with his grandchildren.

Make the family feel his presence continues.

Include:
- origin story
- meaningful relationships
- important memories
- emotional journey
- future legacy

`;



  const experience =
    await compileExperience(
      prompt
    );


  const compiled =
    experience.compiled;



  console.log(
    "\n================================="
  );

  console.log(
    "QRE COMPILER TEST RESULT"
  );

  console.log(
    "=================================\n"
  );



  console.log(
    "TITLE:",
    compiled.title
  );


  console.log(
    "MOMENTS:",
    compiled.experienceMoments.length
  );


  console.log(
    "SCENES:",
    compiled.cinematicScenes.length
  );



  console.log(
    "\nCOGNITIVE INTELLIGENCE:"
  );


  console.log({


    understanding:
      !!experience.intelligence?.understanding,


    meaning:
      !!experience.intelligence?.meaning,


    genome:
      !!experience.intelligence?.genome,


    semanticIR:
      !!experience.intelligence?.semanticIR,


    cognitiveTrace:
      !!experience.intelligence?.cognitiveTrace,


    nuvo:
      !!experience.intelligence?.nuvo,


    revik:
      !!experience.intelligence?.revik,


    kaivo:
      !!experience.intelligence?.kaivo,


    orion:
      !!experience.intelligence?.orion


  });



  console.log(
    "\nNARRATIVE:"
  );


  console.log(
    experience.narrative
  );



  console.log(
    "\nFULL EXPERIENCE:"
  );


  console.log(

    JSON.stringify(

      experience,

      null,

      2

    )

  );


}



run()
.catch(

 error => {

  console.error(
    "COMPILER FAILURE:",
    error
  );


  process.exit(1);

 }

);