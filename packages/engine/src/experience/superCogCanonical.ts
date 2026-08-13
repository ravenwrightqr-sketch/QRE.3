/**
 * QRE SUPER COG — canonical boundary.
 * Normalizes subject and opportunity decisions without a template library.
 */

import { compileCognitiveExperience as compileRaw } from "./cognitiveExperienceCompiler.js";
import type { CompiledCognitiveExperience } from "@qre/contracts";

function resolveSubject(prompt: string, fallback: string): string {
  const candidates: Array<{ value: string; score: number }> = [];
  const add = (value: string | undefined, score: number) => {
    if (!value) return;
    const cleaned = value.replace(/^(?:a|an|the|my|our|this)\s+/i, "").replace(/\s+(?:tonight|today|forever|now)\b.*$/i, "").trim();
    if (cleaned.length > 1 && cleaned.length < 80) candidates.push({ value: cleaned, score });
  };
  const action = /\b(?:create|make|build|design|turn|preserve|teach|transform|run)\s+(?:a|an|the|my|our|this)?\s*([^,.!?;\n]+?)(?=\s+(?:for|about|involving|so|that|to|feel|into|but|is|wants|needs)\b|[,.!?;]|$)/gi;
  for (const match of prompt.matchAll(action)) add(match[1], 0.86);
  const target = prompt.match(/\bfor\s+(?:my|the|a|an)?\s*([^,.!?;\n]+)/i);
  if (target) add(target[1], 0.76);
  if (!/^(?:create|make|build|design|turn|preserve|teach|transform|run)\b/i.test(prompt)) {
    const declarative = prompt.match(/^(?:a|an|the|my|our|this)?\s*([^,.!?;\n]+?)\s+(?:is|are|was|were|wants|needs|has|have|just|can|should|must)\b/i);
    if (declarative) add(declarative[1], 0.9);
  }
  const involving = prompt.match(/\b(?:create|make|build)\s+([^,.!?;\n]+?)\s+involving\b/i);
  if (involving) add(involving[1], 0.94);
  const generic = /^(?:qr\s+)?experience$|^something$|^thing$|^program$|^story$/i;
  return candidates.map((candidate) => ({ ...candidate, score: candidate.score - (generic.test(candidate.value) ? 0.25 : 0) }))
    .sort((a, b) => b.score - a.score || a.value.length - b.value.length)[0]?.value ?? fallback;
}

const replace = (value: string, from: string, to: string): string => from && from !== to ? value.split(from).join(to) : value;

function opportunities(prompt: string, result: CompiledCognitiveExperience): CompiledCognitiveExperience["cognition"]["opportunities"] {
  const text = prompt.toLowerCase();
  const current = result.cognition.opportunities;
  return {
    ...current,
    discovery: current.discovery.length ? current.discovery : /\b(hunt|quest|puzzle|treasure|explore|discover|game)\b/i.test(text) ? [`Explore ${result.cognition.subject.value} through progressive discovery.`] : [],
    geographic: current.geographic.length ? current.geographic : /\b(travel|traveled|journey|destination|route|map|place|city|venue)\b/i.test(text) ? [`Use movement and place as evidence around ${result.cognition.subject.value}.`] : [],
    social: current.social.length ? current.social : /\b(nightclub|people|everyone|together|group|community|fans|crowd)\b/i.test(text) ? ["Let participant contribution alter the shared experience."] : [],
    commercial: current.commercial.length ? current.commercial : /\b(brand|shop|customer|loyalty|sell|launch|luxury|product)\b/i.test(text) ? [`Create value around ${result.cognition.subject.value} beyond the transaction.`] : [],
  };
}

export function compileSuperCogExperience(prompt: string): CompiledCognitiveExperience {
  const result = compileRaw(prompt);
  const oldSubject = result.cognition.subject.value;
  const subject = resolveSubject(prompt, oldSubject);
  const opportunitySet = opportunities(prompt, result);
  const malformed = oldSubject.length > 45 || /\b(?:someone|something|how|to|the experience|the thing)\b/i.test(oldSubject);
  const realize = (value: string) => malformed ? replace(value, oldSubject, subject) : value;

  const story = {
    ...result.story,
    title: replace(result.story.title, oldSubject, subject),
    hook: realize(result.story.hook),
    logline: replace(result.story.logline, oldSubject, subject),
    ending: realize(result.story.ending),
    continuation: result.story.continuation ? realize(result.story.continuation) : undefined,
    beats: result.story.beats.map((beat) => ({ ...beat, text: realize(beat.text), purpose: replace(beat.purpose, oldSubject, subject), entities: beat.entities.map((entity) => entity === oldSubject ? subject : entity) })),
  };
  const plan = {
    ...result.cognition.plan,
    centralSubject: subject,
    purpose: replace(result.cognition.plan.purpose, oldSubject, subject),
    whyInteract: result.cognition.plan.whyInteract.map((value) => replace(value, oldSubject, subject)),
    interactionModel: result.cognition.plan.interactionModel.map((value) => replace(value, oldSubject, subject)),
    progressionModel: result.cognition.plan.progressionModel.map((value) => replace(value, oldSubject, subject)),
    futureEvolution: result.cognition.plan.futureEvolution.map((value) => replace(value, oldSubject, subject)),
    creativePossibilities: result.cognition.plan.creativePossibilities.map((value) => replace(value, oldSubject, subject)),
  };
  const moments = result.moments.map((moment) => "text" in moment ? { ...moment, text: realize(moment.text) } : moment);
  const flowSteps = result.flowSteps.map((step) => ({ ...step, payload: { ...step.payload, beat: step.payload.beat ? { ...(step.payload.beat as Record<string, unknown>), text: realize(String((step.payload.beat as Record<string, unknown>).text ?? "")) } : step.payload.beat } }));
  const scenePlan = result.scenePlan.map((scene) => ({ ...scene, text: realize(scene.text), purpose: replace(scene.purpose, oldSubject, subject) }));
  const cinematicScenes = result.cinematicScenes.map((scene) => ({ ...scene, moment: "text" in scene.moment ? { ...scene.moment, text: realize(scene.moment.text) } : scene.moment }));
  const cognition = { ...result.cognition, subject: { ...result.cognition.subject, value: subject }, plan, opportunities: opportunitySet, memoryOpportunities: opportunitySet.memory, geographicOpportunities: opportunitySet.geographic, socialOpportunities: opportunitySet.social, discoveryOpportunities: opportunitySet.discovery, temporalOpportunities: opportunitySet.temporal, commercialOpportunities: opportunitySet.commercial, story };
  const blueprint = { ...result.blueprint, title: replace(result.blueprint.title, oldSubject, subject), cognitivePlan: plan, moments: result.blueprint.moments.map((moment) => ({ ...moment, title: replace(moment.title, oldSubject, subject), subtitle: moment.subtitle ? replace(moment.subtitle, oldSubject, subject) : moment.subtitle, description: realize(moment.description ?? "") })) };
  return { ...result, cognition, story, blueprint, flowSteps, moments, scenePlan, cinematicScenes, model: { ...result.model, title: blueprint.title, moments: blueprint.moments }, title: blueprint.title };
}
