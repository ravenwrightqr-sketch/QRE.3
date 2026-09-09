import { capabilityConfig, modelForCapability, type ModelCapability } from "./modelCapabilities.js";

export function capabilityHealth() {
  const config = capabilityConfig();
  return {
    ...config,
    isolated: config.vision !== config.author || !process.env.QRE_AUTHOR_FAST_MODEL,
  };
}

export function capabilityModel(capability: ModelCapability): string {
  return modelForCapability(capability);
}
