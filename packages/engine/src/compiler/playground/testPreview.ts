import {
 generateCompilerPreview
} from "./compilerPreview.js";

const result = generateCompilerPreview(`

Make me an unforgettable journey
for Bella's grooming experience.

`);


console.log(
 JSON.stringify(
  result.humanStory,
  null,
  2
 )
);

