import type { CognitiveBeatDirective, CognitiveExperienceState, ExperienceBlueprint, ExperienceEntities, ExperienceGenome, ExperienceModel, ExperienceMoment, ExperienceStory, Moment, CinematicScene, StoryBeat, StoryBeatKind, StoryProvenance, StoryScenePlan } from "@qre/contracts";
import { understandExperience } from "../cognition/cognitiveEngine.js";
import { buildCognitivePremise } from "../cognition/premiseBuilder.js";
import { realizeCognitiveExperience } from "../cognition/cognitiveExperienceRealizer.js";
import { guardCognitiveStory } from "../cognition/cognitiveRealizationGuard.js";
import { composeCognitiveTrajectory } from "./cognitiveTrajectory.js";
import { realizePremiseBeat } from "./premiseRealizer.js";
import { realizeTransformationalBeat } from "./transformationEngine.js";
import { compileExperienceV16, type CompiledExperienceV16 } from "./experienceCompilerV16.js";
import type { ExperienceCompilerContext } from "./experienceCompilerContext.js";
import { augmentCreativeRealization } from "../cognition/superCogCreativeLayer.js";

export type ExperienceObservation={prompt:string;subject:string;activity:string;context:string[];entities:ExperienceEntities;explicitEmotions:string[];audience:string[];temporal:string[];affordances:string[];evidence:StoryProvenance[]};
export type CognitiveSituation={subject:string;actors:string[];activity:string;setting:string[];temporal:string[];social:"solo"|"shared"|"unknown";purpose:string;change:string;tension:string};
export type CognitiveCandidate={id:string;beats:StoryBeatKind[];score:number;rationale:string[]};
export type CognitiveCompiledExperience=Omit<CompiledExperienceV16,"moments"|"cinematicScenes">&{cognition:CognitiveExperienceState;observation:ExperienceObservation;situation:CognitiveSituation;candidates:CognitiveCandidate[];genome:ExperienceGenome;story:ExperienceStory;scenePlan:StoryScenePlan[];model:ExperienceModel;moments:Moment[];cinematicScenes:CinematicScene[]};

const u=(x:string[])=>[...new Set(x.map(v=>v.replace(/\s+/g," ").trim()).filter(Boolean))];
const pv=(c:CognitiveExperienceState):StoryProvenance[]=>c.subject.evidence.map(e=>({kind:e.source==="prompt"?"observed":e.source==="creative_realization"?"playful":"inferred",source:e.source,confidence:e.confidence}));
const names=(e:ExperienceEntities,s:string)=>u([s,...e.people,...e.places,...e.events,...e.products,...e.media]);

function directiveText(d: CognitiveBeatDirective | undefined): string | undefined {
  const text=typeof d?.action==="string"?d.action.replace(/\s+/g," ").trim():"";
  return text||undefined;
}

function repairOrdinarySubject(prompt:string,x:CognitiveExperienceState): CognitiveExperienceState {
  if (x.subject.status === "observed" && x.subject.value.trim().split(/\s+/).length <= 4) return x;
  const actorVerb = /^(?:a|an|the)\s+([a-z][a-z'-]*(?:\s+[a-z][a-z'-]*){0,3})\s+(?:arrives?|arrived|enters?|entered|walks?|walked|goes?|went|comes?|came|leaves?|left|returns?|returned|grooms?|groomed|cleans?|cleaned|washes?|washed|repairs?|repaired|fixes?|fixed|restores?|restored|builds?|built|makes?|made|creates?|created|designs?|designed|writes?|wrote|cooks?|cooked|serves?|served|prepares?|prepared|opens?|opened|closes?|closed|visits?|visited|travels?|traveled|drives?|drove|rides?|rode|paints?|painted|dances?|danced|sings?|sang|plays?|played|chooses?|chose|picks?|picked|selects?|selected|decides?|decided|touches?|touched|holds?|held|wears?|wore|tastes?|tasted|smells?|smelled|looks?|looked|sees?|saw|watches?|watched|shares?|shared|gives?|gave|takes?|took|brings?|brought|receives?|received|checks?|checked|inspects?|inspected|tests?|tested|measures?|measured|installs?|installed|removes?|removed|changes?|changed|turns?|turned|transforms?|transformed|upgrades?|upgraded|finishes?|finished|completes?|completed|photographs?|photographed|captures?|captured|records?|recorded|teaches?|taught|learns?|learned|discovers?|discovered|finds?|found|collects?|collected|organizes?|organized|decorates?|decorated|styles?|styled|trims?|trimmed|cuts?|cut|brushes?|brushed|dries?|dried|massages?|massaged|relaxes?|relaxed|pampers?|pampered|spoil(?:s|ed)?|treats?|treated|documents?|documented|shakes?|shook|chews?|chewed|runs?|ran|calls?|called)\b/i;
  const match=prompt.trim().match(actorVerb);
  const actor=match?.[1]?.replace(/\s+/g," ").trim();
  if(!actor || actor.length>60) return x;
  return {...x,subject:{...x.subject,value:actor,status:"observed",confidence:Math.max(x.subject.confidence,0.97),evidence:[...x.subject.evidence,{source:"prompt",detail:`ordinary actor subject: ${actor}`,confidence:0.97}]}};
}

function restoreConcreteCreativeActions(
  base:CognitiveExperienceState["plan"]["realization"],
  augmented:CognitiveExperienceState["plan"]["realization"],
) {
  if (!base || !augmented) return augmented;

  return {
    ...augmented,
    directives: augmented.directives.map((directive, index) => {
      const original = base.directives[index];
      const originalAction = directiveText(original);
      return originalAction
        ? { ...directive, action: originalAction }
        : directive;
    }),
  };
}

function compose(prompt:string,c:CompiledExperienceV16,x:CognitiveExperienceState){
  const t=composeCognitiveTrajectory({plan:x.plan,prompt}); const p=pv(x); const es=names(x.entities,x.subject.value||c.movie.subject);

  // First build semantic beats from the trajectory. V16 remains an artifact
  // substrate only; its prose is never the primary language authority here.
  const seeds:StoryBeat[]=t.beats.map((kind,i)=>{
    const src=c.movie.beats[i];
    const d=x.plan.realization?.directives.find(v=>v.kind===kind);
    const b:StoryBeat={id:`cognitive-${i+1}`,kind,order:i,purpose:d?.intent??kind,text:directiveText(d)??src?.text??"",emotionalTarget:x.emotionalIntent[i%(x.emotionalIntent.length||1)],entities:es,provenance:[...(src?.sourceFactIds??[]).map(id=>({kind:"observed" as const,source:id,confidence:1})),...p,...(d?.evidence??[]).filter(e=>e.source==="creative_realization").map(e=>({kind:"playful" as const,source:e.detail,confidence:e.confidence}))],directive:d};
    if(!b.text)b.text=realizePremiseBeat(b,x.plan);
    return b;
  });

  const guarded=guardCognitiveStory(seeds,x.plan);

  // The final customer-language decision is evidence-driven. This prevents
  // abstract Super Cog transformation prose from becoming the visible story
  // and prevents legacy V16 artifact prose from outranking the current premise.
  const rendered=guarded.map((b,i)=>({
    ...b,
    text:(realizeTransformationalBeat(b,x.plan)??b.text??c.movie.beats[i]?.text??realizePremiseBeat(b,x.plan)??`${x.subject.value||c.movie.subject} moves into the next moment.`).replace(/[.!?]+$/g,"")+"."
  }));

  const story:ExperienceStory={title:c.title,hook:rendered[0]?.text??c.title,logline:`${x.subject.value||c.movie.subject} unfolds through ${rendered.length} connected moments.`,beats:rendered,ending:rendered.at(-1)?.text??c.title,continuation:rendered.at(-1)?.text??c.movie.beats.at(-1)?.text,tone:[...c.blueprint.tone],provenance:p};
  const moments:Moment[]=rendered.map((b,i)=>({type:"message",order:i,text:b.text,meta:{beatId:b.id,kind:b.kind,duration:4000}}));
  const scenePlan:StoryScenePlan[]=rendered.map((b,i)=>({id:`cognitive-scene-${i+1}`,order:i,beatId:b.id,purpose:b.purpose,text:b.text,emotionalTarget:b.emotionalTarget,entities:b.entities,duration:4,transition:i===0?"none":i===rendered.length-1?"cinematic":"fade",visual:{theme:"cinematic",animation:i===0?"slow_zoom":"parallax"},provenance:b.provenance}));
  const scenes:CinematicScene[]=moments.map((m,i)=>({id:`cognitive-cinematic-${i+1}`,type:i===0?"intro":i===rendered.length-1?"emotion":"action",duration:4000,moment:m,order:i,transition:scenePlan[i]?.transition,visual:scenePlan[i]?.visual,preload:i<moments.length-1,meta:{beatId:rendered[i]?.id,kind:rendered[i]?.kind}}));
  return{story,moments,scenePlan,scenes,candidates:t.candidates};
}

function blueprint(b:ExperienceBlueprint,x:CognitiveExperienceState,m:Moment[]):ExperienceBlueprint{ const moments:ExperienceMoment[]=m.map((v,i)=>({type:i===0?"introduction":i===m.length-1?"completion":"story",component:"story",title:i===0?"The beginning":i===m.length-1?"The moment that stayed":"And then",subtitle:x.subject.value,description:v.type==="message"?v.text:"",editable:true,demo:false,order:i,payload:{beatId:v.meta?.beatId,source:"cognitive-experience"}})); return{...b,cognitivePlan:x.plan,moments,metadata:{...b.metadata,archetypes:u([...(b.metadata?.archetypes??[]),x.selectedHypothesis.kind]),dna:u([...(b.metadata?.dna??[]),"canonical-cognitive-compiler","premise-conserved","single-language-authority","super-cog-authoritative-realization","generic-actor-subject-repair","evidence-driven-final-realizer"])}}; }
function makeGenome(c:CompiledExperienceV16,x:CognitiveExperienceState,story:ExperienceStory):ExperienceGenome{return{intent:u([x.selectedHypothesis.kind,c.intent.purpose]),interpretation:{intent:[x.selectedHypothesis.kind],concepts:u([x.subject.value,...x.affordances]),emotionalSignals:x.emotionalIntent,worldSignals:[],cognitiveSignals:u([...x.plan.dynamicBehavior,...x.plan.futureEvolution]),confidence:x.selectedHypothesis.score},archetypes:[x.selectedHypothesis.kind],themes:x.emotionalIntent,emotions:x.emotionalIntent,meaning:c.blueprint.meaning,relationships:[],energy:"calm",pacing:"medium",social:x.participants.value.length>1?"shared":"solo",journey:story.beats.map((beat)=>beat.kind),discovery:x.selectedHypothesis.dimensions.discoveryPotential,memory:x.selectedHypothesis.dimensions.memoryPotential,commerce:x.selectedHypothesis.dimensions.commercialPotential,immersion:x.selectedHypothesis.dimensions.temporalPotential,interaction:x.selectedHypothesis.dimensions.interactionNaturalness,replay:x.selectedHypothesis.dimensions.temporalPotential,entities:x.entities,environments:x.entities.places,audience:u([...x.participants.value,...x.plan.audience]),dna:["canonical-cognitive-compiler","cognitive-trajectory","super-cog-authoritative-realization","evidence-driven-final-realizer"]};}

export function compileCognitiveExperience(prompt:string,context:ExperienceCompilerContext={}):CognitiveCompiledExperience{
  let x=repairOrdinarySubject(prompt,understandExperience(prompt,context)); x={...x,plan:{...x.plan,direction:x.selectedHypothesis.kind}};
  const premise=buildCognitivePremise({prompt,subject:x.subject,participants:x.participants,entities:x.entities,affordances:x.affordances,emotionalIntent:x.emotionalIntent,plan:x.plan,context});
  const baseRealization=realizeCognitiveExperience({plan:x.plan,premise,evidence:x.subject.evidence,hypothesisEvidence:x.selectedHypothesis.evidence,prompt});
  const augmentedRealization=augmentCreativeRealization({prompt,plan:x.plan,premise,realization:baseRealization});
  const realization=restoreConcreteCreativeActions(baseRealization,augmentedRealization);
  x={...x,plan:{...x.plan,premise,realization}};
  const c=compileExperienceV16(prompt,context); const r=compose(prompt,c,x); const bp=blueprint(c.blueprint,x,r.moments);
  const obs:ExperienceObservation={prompt,subject:x.subject.value||c.movie.subject,activity:r.story.beats[0]?.text??c.movie.beats[0]?.text??c.intent.purpose,context:u([c.intent.domain,...c.intent.signals]),entities:x.entities,explicitEmotions:x.emotionalIntent,audience:u([...x.participants.value,...x.plan.audience]),temporal:u([...x.entities.dates,...x.entities.times]),affordances:x.affordances,evidence:pv(x)};
  const model={title:c.title,description:x.plan.purpose,industry:"generic",goal:"storytelling",tone:[...c.blueprint.tone],moments:bp.moments} as ExperienceModel;
  return{...c,cognition:x,observation:obs,situation:{subject:obs.subject,actors:obs.audience,activity:obs.activity,setting:obs.context,temporal:obs.temporal,social:obs.audience.length>1?"shared":obs.audience.length?"solo":"unknown",purpose:x.plan.purpose,change:x.plan.realization?.semanticArc.at(-1)??"progress",tension:x.plan.storyStructure.join(" → ")},candidates:r.candidates,genome:makeGenome(c,x,r.story),story:r.story,blueprint:bp,flowSteps:r.story.beats.map((b,i)=>({id:`cognitive-flow-${i+1}`,order:i,type:"message",payload:{beat:b,beatId:b.id,subject:x.subject.value,source:"cognitive-experience"}})),moments:r.moments,cinematicScenes:r.scenes,scenePlan:r.scenePlan,model,title:r.story.title,estimatedDuration:Math.max(8,r.story.beats.length*4),momentCount:r.story.beats.length};
}
