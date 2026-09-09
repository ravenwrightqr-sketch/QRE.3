import { qreModelFor } from "./modelSelection.js";

export function capabilityHealth() {
  return {
    author: qreModelFor("author"),
    vision: qreModelFor("vision"),
    document: qreModelFor("document"),
    isolated: qreModelFor("vision") !== qreModelFor("author") || !process.env.QRE_AUTHOR_FAST_MODEL,
  };
}
