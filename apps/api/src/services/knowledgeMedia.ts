import { promises as fs } from "node:fs";
import path from "node:path";

const DEFAULT_ROOT = path.resolve(process.cwd(), ".qre-media");

function rootPath(): string {
  return path.resolve(process.env.QRE_MEDIA_ROOT || DEFAULT_ROOT);
}

function safeRelativeKey(key: string): string {
  const normalized = key.replace(/\\/g, "/").replace(/^\/+/, "");
  if (!normalized || normalized.includes("..") || normalized.includes("\0")) {
    throw new Error("Invalid knowledge media key.");
  }
  return normalized;
}

function absolutePath(key: string): string {
  const root = rootPath();
  const relative = safeRelativeKey(key);
  const resolved = path.resolve(root, relative);
  if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) {
    throw new Error("Knowledge media path escapes storage root.");
  }
  return resolved;
}

export async function writeKnowledgeMedia(key: string, bytes: Buffer): Promise<void> {
  const target = absolutePath(key);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, bytes);
}

export async function readKnowledgeMedia(key: string): Promise<Buffer> {
  return fs.readFile(absolutePath(key));
}

export async function deleteKnowledgeMedia(key: string): Promise<void> {
  await fs.rm(absolutePath(key), { force: true });
}

export function mediaDataUrl(bytes: Buffer, mimeType: string): string {
  return `data:${mimeType || "application/octet-stream"};base64,${bytes.toString("base64")}`;
}
