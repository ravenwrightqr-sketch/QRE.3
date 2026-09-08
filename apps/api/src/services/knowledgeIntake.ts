import crypto from "node:crypto";
import { db } from "@qre/db";
import { analyzeImageForKnowledge } from "./aiProvider.js";

type IntakeInput = {
  assetId: string;
  userId: string;
  sourceType: string;
  originalName?: string;
  mimeType?: string;
  content?: string;
  imageDataUrl?: string;
  text?: string;
};

function sha256(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function normalizeName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^\p{L}\p{N}\s._-]/gu, "");
}

function clampConfidence(value: unknown): number {
  return Math.max(0, Math.min(1, typeof value === "number" ? value : 0.5));
}

async function processIntake(jobId: string, input: IntakeInput): Promise<void> {
  try {
    await db.knowledgeIntakeJob.update({
      where: { id: jobId },
      data: { status: "processing", startedAt: new Date() },
    });

    const rawContent = input.imageDataUrl || input.text || input.content || "";
    const contentHash = rawContent ? sha256(rawContent) : undefined;

    const evidence = await db.knowledgeEvidence.create({
      data: {
        assetId: input.assetId,
        intakeJobId: jobId,
        type: input.mimeType || input.sourceType,
        source: input.sourceType,
        contentHash,
        text: input.text || undefined,
        metadata: {
          originalName: input.originalName,
          mimeType: input.mimeType,
          userId: input.userId,
        },
        confidence: 1,
      },
    });

    const facts = input.imageDataUrl?.startsWith("data:image/")
      ? await analyzeImageForKnowledge(input.imageDataUrl)
      : [];

    const catalogIds: string[] = [];
    const observationIds: string[] = [];

    for (const fact of facts) {
      const normalizedName = normalizeName(fact.label || fact.value);
      if (!normalizedName) continue;

      const existing = await db.catalogItem.findFirst({
        where: {
          assetId: input.assetId,
          normalizedName,
        },
      });

      const item = existing
        ? await db.catalogItem.update({
            where: { id: existing.id },
            data: {
              brand: existing.brand || undefined,
              category: fact.category || existing.category || undefined,
              description: existing.description || fact.notes || undefined,
            },
          })
        : await db.catalogItem.create({
            data: {
              assetId: input.assetId,
              kind: fact.category || "item",
              name: fact.label || fact.value,
              normalizedName,
              category: fact.category || undefined,
              description: fact.notes || undefined,
            },
          });

      catalogIds.push(item.id);

      await db.catalogAttribute.create({
        data: {
          catalogItemId: item.id,
          key: "value",
          value: fact.value,
          unit: fact.unit || undefined,
          confidence: clampConfidence(fact.confidence),
          evidenceId: evidence.id,
        },
      });

      const observation = await db.knowledgeObservation.create({
        data: {
          assetId: input.assetId,
          catalogItemId: item.id,
          evidenceId: evidence.id,
          type: "OBSERVED",
          value: {
            label: fact.label,
            value: fact.value,
            category: fact.category,
            unit: fact.unit,
          },
          source: input.sourceType,
          confidence: clampConfidence(fact.confidence),
          observedAt: new Date(),
        },
      });

      observationIds.push(observation.id);
    }

    await db.knowledgeIntakeJob.update({
      where: { id: jobId },
      data: {
        status: "completed",
        result: {
          evidenceId: evidence.id,
          catalogIds,
          observationIds,
          factCount: facts.length,
        },
        completedAt: new Date(),
      },
    });
  } catch (error) {
    console.error("[KnowledgeIntake] failed", jobId, error);

    await db.knowledgeIntakeJob.update({
      where: { id: jobId },
      data: {
        status: "failed",
        error: error instanceof Error ? error.message : "Knowledge intake failed",
        completedAt: new Date(),
      },
    });
  }
}

export async function enqueueKnowledgeIntake(input: IntakeInput) {
  const rawContent = input.imageDataUrl || input.text || input.content || "";
  const contentHash = rawContent ? sha256(rawContent) : undefined;

  if (contentHash) {
    const existing = await db.knowledgeIntakeJob.findFirst({
      where: {
        assetId: input.assetId,
        contentHash,
      },
      orderBy: { createdAt: "desc" },
    });

    if (existing) return { job: existing, duplicate: true };
  }

  const job = await db.knowledgeIntakeJob.create({
    data: {
      assetId: input.assetId,
      status: "queued",
      sourceType: input.sourceType,
      originalName: input.originalName,
      contentHash,
      payload: {
        mimeType: input.mimeType,
        content: input.content,
        imageDataUrl: input.imageDataUrl,
        text: input.text,
        userId: input.userId,
      },
    },
  });

  setImmediate(() => {
    void processIntake(job.id, input);
  });

  return { job, duplicate: false };
}