/**
 * QRE SEMANTIC IR BUILDER
 *
 * Builds a graph from discovered entities, emotions, meanings and themes.
 * Every node and edge must be traceable to compiler input.
 */

import type {
  SemanticIR,
  SemanticNode,
  SemanticEdge,
  SemanticEvidence,
  SemanticContradiction,
} from "@qre/contracts";
import type { CompilerMind } from "@qre/contracts";

function createId(prefix: string): string {
  return `${prefix}_${globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)}`;
}

function createNode(
  label: string,
  type: SemanticNode["type"],
  confidence: number,
): SemanticNode {
  return {
    id: createId(type),
    label,
    type,
    confidence,
    gravity: confidence,
    activation: 1,
    createdBy: "semantic_builder",
    updatedBy: "semantic_builder",
  };
}

function createEdge(
  from: string,
  to: string,
  relation: SemanticEdge["relation"],
  weight: number,
): SemanticEdge {
  return {
    from,
    to,
    relation,
    weight,
    confidence: weight,
    createdBy: "semantic_builder",
  };
}

function unique(values: unknown[]): string[] {
  return [...new Set(values.filter((value): value is string => typeof value === "string" && value.trim().length > 0))];
}

export function buildSemanticIR(mind: CompilerMind): SemanticIR {
  const nodes: SemanticNode[] = [];
  const edges: SemanticEdge[] = [];
  const evidence: SemanticEvidence[] = [];
  const contradictions: SemanticContradiction[] = [];
  const understanding = mind.understanding;

  const entityValues = unique([
    ...(understanding.entities?.people ?? []),
    ...(understanding.entities?.places ?? []),
    ...(understanding.entities?.organizations ?? []),
    ...(understanding.entities?.objects ?? []),
    ...(understanding.entities?.creatures ?? []),
    ...(understanding.entities?.products ?? []),
    ...(understanding.entities?.events ?? []),
    ...(understanding.entities?.concepts ?? []),
  ]);

  const entityNodes = entityValues.map((value) => createNode(value, "entity", 0.95));
  nodes.push(...entityNodes);

  const emotionNodes = unique(understanding.emotions?.emotions).map((value) => createNode(value, "emotion", 0.9));
  nodes.push(...emotionNodes);

  const meaningValues = unique([
    ...(mind.meaningContext.meanings ?? []),
    ...(mind.meaningContext.humanDesires ?? []),
    ...(mind.meaningContext.symbolicForces ?? []),
    ...(understanding.humanIntent?.motivations ?? []),
    ...(understanding.humanIntent?.desiredOutcome ?? []),
  ]);
  const meaningNodes = meaningValues.map((value) => createNode(value, "meaning", 0.85));
  nodes.push(...meaningNodes);

  const themeValues = unique([
    ...(understanding.world?.domains ?? []),
    ...(mind.meaningContext.themes ?? []),
  ]);
  nodes.push(...themeValues.map((value) => createNode(value, "theme", 0.8)));

  for (const entity of entityNodes) {
    for (const meaning of meaningNodes) {
      edges.push(createEdge(entity.id, meaning.id, "reveals", 0.75));
    }
  }

  for (const emotion of emotionNodes) {
    for (const meaning of meaningNodes) {
      edges.push(createEdge(emotion.id, meaning.id, "creates", 0.8));
    }
  }

  evidence.push({
    id: createId("evidence"),
    targetId: nodes[0]?.id ?? "",
    type: "prompt",
    source: mind.prompt,
    confidence: 0.95,
    createdBy: "semantic_builder",
  });

  const root = nodes[0];
  const firstMeaning = meaningNodes[0];
  const firstEmotion = emotionNodes[0];

  return {
    nodes,
    edges,
    evidence,
    contradictions,
    rootNodeId: root?.id ?? "",
    rootMeaningNodeId: firstMeaning?.id ?? "",
    dominantEmotionNodeId: firstEmotion?.id ?? "",
    transformationNodeId: "",
    primaryQuestionNodeId: "",
    emotionalGravity: firstEmotion?.label ?? "",
    transformation: "",
    unansweredQuestion: "",
    confidence: understanding.confidence ?? 0,
    coherence: meaningNodes.length || entityNodes.length ? 0.8 : 0.2,
    version: 2,
  };
}
