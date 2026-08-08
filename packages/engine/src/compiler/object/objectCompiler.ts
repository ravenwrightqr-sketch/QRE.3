/**
 * QRE OBJECT GENOME COMPILER
 *
 * Converts explicit entity and prompt evidence into object-level structure.
 * It does not invent future events, ownership, emotional history, or legacy.
 */

import type { ObjectCompilationInput } from "./objectTypes.js";
import type { ObjectGenome, ObjectMoment, ObjectRelationship } from "@qre/contracts";
import { compileLifecycle } from "../lifecycle/lifecycleCompiler.js";

function unique(values: string[] = []): string[] {
  return [...new Set(values.filter(Boolean))];
}

function identity(input: ObjectCompilationInput) {
  const name = input.entities?.creatures?.[0]
    ?? input.entities?.objects?.[0]
    ?? input.entities?.products?.[0]
    ?? input.entities?.people?.[0]
    ?? input.entities?.places?.[0];

  const type = input.entities?.creatures?.length
    ? "animal"
    : input.entities?.people?.length
      ? "person"
      : input.entities?.places?.length
        ? "place"
        : input.entities?.products?.length
          ? "product"
          : input.entities?.objects?.length
            ? "object"
            : "unknown";

  return {
    name,
    type: type as "person" | "animal" | "place" | "object" | "artifact" | "vehicle" | "home" | "product" | "brand" | "organization" | "unknown",
    category: unique([
      ...(input.entities?.creatures ?? []),
      ...(input.entities?.objects ?? []),
      ...(input.entities?.products ?? []),
    ]),
    attributes: unique([
      ...(input.meaning?.desiredFeeling ?? []),
      ...(input.meaning?.symbols ?? []),
      ...(input.meaning?.themes ?? []),
      ...(input.emotions?.emotions ?? []),
    ]),
  };
}

function sentences(text: string): string[] {
  return text.replace(/\n/g, " ").split(/[.!?]/).map((value) => value.trim()).filter(Boolean);
}

function title(text: string): string {
  return text.split(/\s+/).slice(0, 8).join(" ");
}

function outcome(text: string): string | undefined {
  const match = text.match(/\bfrom\s+(.+?)\s+to\s+(.+)/i);
  return match ? `${match[1]} → ${match[2]}` : undefined;
}

function buildMoments(input: ObjectCompilationInput): ObjectMoment[] {
  return sentences(input.prompt).map((sentence) => ({
    id: globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2),
    title: title(sentence),
    description: sentence,
    timeline: ["human_described_event"],
    participants: input.entities?.people ?? [],
    emotions: input.emotions?.emotions ?? [],
    actions: [],
    objects: unique([
      ...(input.entities?.objects ?? []),
      ...(input.entities?.products ?? []),
      ...(input.entities?.creatures ?? []),
    ]),
    significance: input.emotions?.intensity ?? 0.5,
    sensory: {
      visual: [],
      audio: [],
      atmosphere: input.meaning?.themes ?? [],
    },
    outcome: outcome(sentence),
  }));
}

function relationships(input: ObjectCompilationInput): ObjectRelationship[] {
  return (input.relationships ?? [])
    .filter((value) => value?.subject && value?.object)
    .map((value) => ({
      subject: value.subject as string,
      relationship: "connected_to",
      object: value.object as string,
      confidence: typeof value.confidence === "number" ? value.confidence : 0.5,
    }));
}

export function compileObjectGenome(input: ObjectCompilationInput): ObjectGenome {
  if (!input) throw new Error("Object compilation input required.");

  const moments = buildMoments(input);
  const lifecycle = compileLifecycle({
    prompt: input.prompt,
    memory: input.memory,
    entities: input.entities,
    relationships: input.relationships,
  });
  const objectIdentity = identity(input);

  return {
    identity: objectIdentity,
    state: {
      current: "described",
      previous: [],
      transitions: [],
    },
    history: {
      origin: input.prompt,
      timeline: moments.map((moment) => moment.description),
      importantMoments: moments.map((moment) => moment.description),
    },
    experienceSignals: moments.map((moment, index) => ({
      phase: `moment_${index + 1}`,
      action: moment.actions.join(", "),
      description: moment.description,
      outcome: moment.outcome,
    })),
    lifecycle,
    relationships: relationships(input),
    moments,
    memory: {
      memories: input.memory?.memories ?? [],
      emotionalMarkers: input.memory?.markers ?? input.emotions?.emotions ?? [],
      locations: [],
      dates: [],
      associatedPeople: input.entities?.people ?? [],
      triggers: input.meaning?.themes ?? [],
    },
    legacy: {
      meaning: [],
      impact: [],
      preservation: input.memory?.timeCapsule ? ["preserved"] : [],
    },
    emotionalSignature: input.emotions?.emotions ?? [],
    symbolicMeaning: input.meaning?.symbols ?? [],
    futurePossibilities: [],
  };
}

export const objectCompiler = compileObjectGenome;
