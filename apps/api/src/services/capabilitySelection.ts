export type QreCapability = "author" | "vision" | "document";

export function selectedModel(capability: QreCapability): string {
  const byCapability: Record<QreCapability, string[]> = {
    author: ["QRE_AUTHOR_FAST_MODEL", "QRE_AUTHOR_MODEL", "QRE_LOCAL_MODEL"],
    vision: ["QRE_VISION_MODEL", "QRE_LOCAL_VISION_MODEL"],
    document: ["QRE_DOCUMENT_MODEL", "QRE_LOCAL_DOCUMENT_MODEL"],
  };

  for (const key of byCapability[capability]) {
    const value = process.env[key]?.trim();
    if (value) return value;
  }

  return "qwen2.5vl:7b";
}

export function fallbackModel(capability: QreCapability, primary: string): string | undefined {
  const key = capability === "author"
    ? "QRE_AUTHOR_FALLBACK_MODEL"
    : capability === "vision"
      ? "QRE_VISION_FALLBACK_MODEL"
      : "QRE_DOCUMENT_FALLBACK_MODEL";
  const value = process.env[key]?.trim();
  return value && value !== primary ? value : undefined;
}
