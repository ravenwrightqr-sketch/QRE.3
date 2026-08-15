import { localModelGenerate } from "./src/services/localModelRuntime.js";

console.time("qre-local-one-pass");

const result = await localModelGenerate([
  {
    role: "system",
    content: "Write a funny, concise customer-facing memory. Use only the supplied facts. Do not invent details."
  },
  {
    role: "user",
    content: "Coco came in nervous, got a bath, stole a blue bow, and left looking fabulous."
  }
]);

console.timeEnd("qre-local-one-pass");
console.log("\nMODEL:\n" + result.text);
