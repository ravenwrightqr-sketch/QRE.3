/**
 * =============================================================
 * QRE SUPER COG — COGNITIVE NORMALIZATION BOUNDARY
 * =============================================================
 *
 * The raw compiler discovers evidence and hypotheses. This boundary
 * makes the chosen semantic subject authoritative across every
 * downstream representation before the experience is exposed.
 *
 * No template selection occurs here.
 * =============================================================
 */

import {
  compileCognitiveExperience as compileRaw,
} from "./cognitiveExperienceCompiler.js";

import type {
  CompiledCognitiveExperience,
} from "@qre/contracts";

function resolveSubject(prompt: string, fallback: string): string {
  const candidates: Array<{ value: string; score: number }> = [];
  const add = (value: string | undefined, score: number) => {
    if (!value) return;
    const cleaned = value
      .replace(/^(?:a|an|the|my|our|this)\s+/i, "")
      .replace(/\s+(?:tonight|today|forever|now)\b.*$/i, "")
      .trim();
    if (cleaned.length > 1 && cleaned.length < 80) {
      candidates.push({ value: cleaned, score });
    }
  };

  const action = /\b(?:create|make|build|design|turn|preserve|teach|transform|run|want)\s+(?:a|an|the|my|our|this)?\s*([^,.!?;\n]+?)(?=\s+(?:for|about|involving|so|that|to|feel|into|but|is|wants|needs)\b|[,.!?;]|$)/gi;
  for (const match of prompt.matchAll(action)) add(match[1], 0.86);

  const target = prompt.match(/\bfor\s+(?:my|the|a|an)?\s*([^,.!?;\n]+)/i);
  if (target) add(target[1], 0.76);

  const declarative = prompt.match(/^(?:a|an|the|my|our|this)?\s*([^,.!?;\n]+?)\s+(?:is|are|was|were|wants|needs|has|have|just|can|should|must)\b/i);
  if (declarative) add(declarative[1], 0.9);

  const involving = prompt.match(/\b(?:create|make|build)\s+([^,.!?;\n]+?)\s+involving\b/i);
  if (involving) add(involving[1], 0.94);

  const generic = /^(?:qr\s+)?experience$|^something$|^thing$|^program$|^story$/i;
  const ranked = candidates
    .map((candidate) => ({
      ...candidate,
      score: candidate.score - (generic.test(candidate.value) ? 0.25 : 0),
    }))
    .sort((a, b) => b.score - a.score || a.value.length - b.value.length);

  return ranked[0]?.value ?? fallback;
}

function replaceSubject(value: string, from: string, to: string): string {
  return from && from !== to ? value.split(from).join(to) : value;
}

export function compileSuperCogExperience(prompt: string): CompiledCognitiveExperience {
  const result = compileRaw(prompt);
  const oldSubject = result.cognition.subject.value;
  const subject = resolveSubject(prompt, oldSubject);

  if (subject === oldSubject) return result;

  const story = {
    ...result.story,
    title: replaceSubject(result.story.title, oldSubject, subject),
    hook: replaceSubject(result.story.hook, oldSubject, subject),
    logline: replaceSubject(result.story.logline, oldSubject, subject),
    ending: replaceSubject(result.story.ending, oldSubject, subject),
    continuation: result.story.continuation
      ? replaceSubject(result.story.continuation, oldSubject, subject)
      : undefined,
    beats: result.story.beats.map((beat) => ({
      ...beat,
      text: replaceSubject(beat.text, oldSubject, subject),
      purpose: replaceSubject(beat.purpose, oldSubject, subject),
      entities: beat.entities.map((entity) => entity === oldSubject ? subject : entity),
    })),
  };

  const plan = {
    ...result.cognition.plan,
    centralSubject: subject,
    purpose: replaceSubject(result.cognition.plan.purpose, oldSubject, subject),
    whyInteract: result.cognition.plan.whyInteract.map((value) => replaceSubject(value, oldSubject, subject)),
    interactionModel: result.cognition.plan.interactionModel.map((value) => replaceSubject(value, oldSubject, subject)),
    progressionModel: result.cognition.plan.progressionModel.map((value) => replaceSubject(value, oldSubject, subject)),
    futureEvolution: result.cognition.plan.futureEvolution.map((value) => replaceSubject(value, oldSubject, subject)),
    creativePossibilities: result.cognition.plan.creativePossibilities.map((value) => replaceSubject(value, oldSubject, subject)),
  };

  const moments = result.moments.map((moment) => "text" in moment
    ? { ...moment, text: replaceSubject(moment.text, oldSubject, subject) }
    : moment);

  const blueprint = {
    ...result.blueprint,
    title: replaceSubject(result.blueprint.title, oldSubject, subject),
    cognitivePlan: plan,
    moments: result.blueprint.moments.map((moment) => ({
      ...moment,
      title: replaceSubject(moment.title, oldSubject, subject),
      subtitle: moment.subtitle ? replaceSubject(moment.subtitle, oldSubject, subject) : moment.subtitle,
      description: moment.description ? replaceSubject(moment.description, oldSubject, subject) : moment.description,
      payload: moment.payload,
    })),
  };

  const cognition = {
    ...result.cognition,
    subject: {
      ...result.cognition.subject,
      value: subject,
    },
    plan,
    story,
  };

  return {
    ...result,
    cognition,
    story,
    blueprint,
    moments,
    model: {
      ...result.model,
      title: blueprint.title,
      moments: blueprint.moments,
    },
    title: blueprint.title,
  };
}
