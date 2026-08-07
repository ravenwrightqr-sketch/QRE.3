import {
  generateCompilerPreview
} from "./compilerPreview.js";


const result = generateCompilerPreview(`

Create an unforgettable grooming experience
for Bella the dog.

Make it emotional, magical,
and something the owner remembers forever.

`);


console.log(
  JSON.stringify(
    result.humanStory,
    null,
    2
  )
);