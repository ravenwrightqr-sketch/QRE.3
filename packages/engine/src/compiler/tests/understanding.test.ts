/**
 * =====================================================
 * QRE UNDERSTANDING KERNEL TEST
 * =====================================================
 *
 * Human Prompt
 *      ↓
 * Understanding Kernel
 *      ↓
 * ExperienceUnderstanding
 *
 * This validates:
 *
 * - intent extraction
 * - entity extraction
 * - emotion detection
 * - memory understanding
 * - audience understanding
 * - world inference
 * - creative DNA
 *
 * NO DATABASE
 * NO RUNTIME
 *
 * =====================================================
 */


import {
  understandExperience,
} from "../understanding/index.js";





const prompts = [


  `
  Create a magical birthday memory experience
  for my daughter at Disneyland.
  Capture the moment forever.
  `,



  `
  Build a cinematic underground music experience
  where people discover hidden worlds and connect.
  `,



  `
  Create a luxury travel memory capsule
  that preserves a couple's journey forever.
  `


];





for (const prompt of prompts) {


  console.log(
    "\n===================================="
  );


  console.log(
    "PROMPT:"
  );


  console.log(prompt.trim());



  console.log(
    "\nUNDERSTANDING:"
  );



  const understanding =
    understandExperience(prompt);



  console.log(
    JSON.stringify(
      understanding,
      null,
      2
    )
  );


}