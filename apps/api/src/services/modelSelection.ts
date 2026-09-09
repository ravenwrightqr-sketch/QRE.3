export type QreModelCapability = "author" | "vision" | "document";

export function qreModelFor(capability: QreModelCapability): string {
  const keys: Record<QreModelCapability, string[]> = {
    author: ["QRE_AUTHOR_FAST_MODEL", "QRE_AUTHOR_MODEL", "QRE_LOCAL_MODEL"],
    vision: ["QRE_VISION_MODEL", "QRE_LOCAL_VISION_MODEL"],
    document: ["QRE_DOCUMENT_MODEL", "QRE_LOCAL_DOCUMENT_MODEL"],
  };

  for (const key of keys[capability]) {
    const value = process.env[key]?.trim();
    if (value) return value;
  }

  return "qwen2.5vl:7b";
}

export function qreFallbackModel(capability: QreModelCapability, primary: string): string | undefined {
  const key = capability === "author"
    ? "QRE_AUTHOR_FALLBACK_MODEL"
    : capability === "vision"
      ? "QRE_VISION_FALLBACK_MODEL"
      : "QRE_DOCUMENT_FALLBACK_MODEL";
  const value = process.env[key]?.trim();
  return value && value !== primary ? value : undefined;
}
