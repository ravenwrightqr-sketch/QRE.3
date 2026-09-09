import { randomUUID } from "node:crypto";
import type { Readable } from "node:stream";

export type KnowledgeUploadTarget = {
  storageKey: string;
  uploadUrl: string;
  headers?: Record<string, string>;
};

export type KnowledgeStoredObject = {
  storageKey: string;
  contentHash?: string;
  mimeType: string;
  sizeBytes: number;
};

export interface KnowledgeObjectStore {
  createUploadTarget(input: {
    assetId: string;
    originalName?: string;
    mimeType: string;
    sizeBytes: number;
    contentHash?: string;
  }): Promise<KnowledgeUploadTarget>;
  put(input: { storageKey: string; content: Buffer; mimeType: string }): Promise<KnowledgeStoredObject>;
  get(storageKey: string): Promise<Buffer | Readable>;
  delete(storageKey: string): Promise<void>;
}

/**
 * Provider-neutral boundary. Production adapters can target R2/S3/GCS/etc.
 * The current proof deployment can use the inline transport while the intake
 * contract already speaks in durable object references.
 */
export class UnconfiguredKnowledgeObjectStore implements KnowledgeObjectStore {
  async createUploadTarget(input: {
    assetId: string;
    originalName?: string;
    mimeType: string;
    sizeBytes: number;
    contentHash?: string;
  }): Promise<KnowledgeUploadTarget> {
    const storageKey = `knowledge/${input.assetId}/${Date.now()}-${randomUUID()}${input.originalName ? `-${sanitizeName(input.originalName)}` : ""}`;
    throw new Error(`Knowledge object storage is not configured for direct upload target ${storageKey}.`);
  }

  async put(input: { storageKey: string; content: Buffer; mimeType: string }): Promise<KnowledgeStoredObject> {
    throw new Error(`Knowledge object storage is not configured for ${input.storageKey}.`);
  }

  async get(storageKey: string): Promise<Buffer> {
    throw new Error(`Knowledge object storage is not configured for ${storageKey}.`);
  }

  async delete(storageKey: string): Promise<void> {
    throw new Error(`Knowledge object storage is not configured for ${storageKey}.`);
  }
}

function sanitizeName(value: string): string {
  return value.trim().replace(/[^a-zA-Z0-9._-]+/g, "-").slice(0, 96);
}
