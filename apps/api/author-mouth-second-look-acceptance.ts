import { createServer } from "node:http";
import { authorBrainCanonical } from "./src/services/authorBrainCanonical.js";

const initial = [
  "Milo.", "A leash appears.", "The scent of pork.",
  "---",
  "Milo.", "Walks.", "Bacon.",
  "---",
  "Milo.", "A name.", "A fondness.",
].join("\n");
const secondLook = [
  "Did I hear walk?", "Bacon has standing.", "Small dogs. Obviously.", "Priorities. Specific ones.",
  "---",
  "Walk?", "Bacon has standing.", "Small dogs. Obviously.", "Priorities. Specific ones.",
  "---",
  "Did I hear walk?", "Bacon has standing.", "Small dogs. Obviously.", "Bacon remains non-negotiable.",
].join("\n");
let calls = 0;
const server = createServer((_request, response) => {
  calls += 1;
  response.writeHead(200, { "content-type": "application/json" });
  response.end(JSON.stringify({ message: { role: "assistant", content: calls === 1 ? initial : secondLook } }));
});

try {
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Mock model did not start.");
  process.env.QRE_LOCAL_MODEL_URL = `http://127.0.0.1:${address.port}`;
  const result = await authorBrainCanonical({
    subject: "Milo",
    prompt: "Create a QRE experience from this supplied reality.",
    facts: ["Milo loves walks, bacon, small dogs"],
    sourceMoments: ["Milo loves walks, bacon, small dogs"],
  });
  if (calls !== 2 || result.diagnostics?.modelCalls !== 2) {
    throw new Error(`Failed to offer Mouth one second look: ${JSON.stringify({ calls, diagnostics: result.diagnostics })}`);
  }
  if (result.scenes.map((scene) => scene.text).join("|") === "Milo.|Walks.|Bacon.") {
    throw new Error(`Mouth chose the stitched source parade over the second look: ${JSON.stringify(result.diagnostics)}`);
  }
  console.log(JSON.stringify({ calls, scenes: result.scenes.map((scene) => scene.text), authored: result.diagnostics?.qualityStatus }, null, 2));
} finally {
  server.close();
}
