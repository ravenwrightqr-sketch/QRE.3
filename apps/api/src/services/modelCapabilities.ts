/**
 * QRE model capability boundary.
 *
 * Model selection is capability-scoped. Author tuning must never silently
 * replace the model used for vision, document understanding, or other world
 * learning paths.
 */
export type ModelCapability = "author" | "vision" | "document";

function configured(name: string, fallback: string): string {
  const value = process.env[name]?.trim();
  return value || fallback;
}

export function modelForCapability(capability: ModelCapability): string {
  switch (capability) {
    case "author":
      return configured(
        "QRE_AUTHOR_FAST_MODEL",
        configured("QRE_AUTHOR_MODEL", configured("QRE_LOCAL_MODEL", "qwen2.5vl:7b")),
      );
    case "vision":
      return configured(
        "QRE_VISION_MODEL",
        configured("QRE_LOCAL_VISION_MODEL", "qwen2.5vl:7b"),
      );
    case "document":
      return configured(
        "QRE_DOCUMENT_MODEL",
        configured("QRE_LOCAL_DOCUMENT_MODEL", "qwen2.5vl:7b"),
      );
  }
}

export function capabilityConfig() {
  return {
    author: modelForCapability("author"),
    vision: modelForCapability("vision"),
    document: modelForCapability("document"),
  } as const;
}
