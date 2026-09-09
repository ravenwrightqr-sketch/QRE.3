import { capabilityConfig } from "./modelCapabilities.js";

export function capabilityHealth() {
  const config = capabilityConfig();
  return {
    ...config,
    isolated: config.vision !== config.author || !process.env.QRE_AUTHOR_FAST_MODEL,
  };
}
