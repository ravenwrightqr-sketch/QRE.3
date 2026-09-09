import {
  fallbackModelForCapability,
  modelForCapability,
  type ModelCapability,
} from "./modelCapabilities.js";

export type QreModelCapability = ModelCapability;

export function qreModelFor(capability: QreModelCapability): string {
  return modelForCapability(capability);
}

export function qreFallbackModel(capability: QreModelCapability, primary: string): string | undefined {
  return fallbackModelForCapability(capability, primary);
}
