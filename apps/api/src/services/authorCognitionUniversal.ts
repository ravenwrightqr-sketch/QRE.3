/* QRE UNIVERSAL COGNITION · one domain-neutral search brain */
import type { AuthorDomainContext, CreativeFrameSelection, LatentMovieCandidate, LatentMovieTrajectoryStep, RealityGraph } from "@qre/contracts";
import { localModelGenerate } from "./localModelRuntime.js";
import { buildAuthorCognitionIntelligence } from "./authorCognitionIntelligence.js";

export type AuthorCognitionInput = {
  prompt: string; lens?: string; subject?: string; place?: string; facts: string[]; sourceMoments: string[];
  realityGraph: RealityGraph; domainContext?: AuthorDomainContext; memoryContext?: string[]; trajectory?: string[];
  creativeLearningContext?: string[]; returning?: boolean; visitNumber?: number; movieMode?: boolean;
};
export type AuthorCreativeInterpretation = { id: string; thesis: string; creativeOpportunity: string; rationale: string; evidenceEventIds: string[]; confidence: number };
export type AuthorAdaptiveQuestion = { kind: "who"|"where"|"when"|"event"|"detail"; question: string; reason: string };
export type AuthorCognitionPlan = { selectedLens: string; frame: CreativeFrameSelection; interpretations: AuthorCreativeInterpretation[]; latentMovieCandidates: LatentMovieCandidate[]; selectedMovie?: LatentMovieCandidate; adaptiveQuestions: AuthorAdaptiveQuestion[]; attentionStrategy: string; reasoningSummary: string[]; model: string; modelCalls: number };

const clean = (v: unknown) => String(v ?? "").replace(/\s+/g," ").trim();
const clamp = (v: unknown, d=0) => { const n=Number(v); return Number.isFinite(n)?Math.max(0,Math.min(1,Number(n.toFixed(3)))):d; };
const unique = <T>(xs: readonly T[]) => [...new Set(xs)];
const OPS = new Set<LatentMovieTrajectoryStep["operation"]>(["establish","contrast","recur","reframe","escalate","converge","reveal","consequence","payoff"]);
const FRAMES = new Set(["comedy","funny","noir","romance","romantic","horror","heist","game","fierce","courtroom","military","documentary","deadpan","tender","surreal","wild","spy","mission","speedrun","tournament","investigation","backstage","transformation","race","restoration","expedition","quest","countdown","archive"]);
const GENERIC = /\b(?:a day|the journey|something special|special moment|good times|beautiful moment|it all started|the experience)\b/i;
const INTERNAL = /\b(?:cognition|planner|trajectory|candidate|viewer state|semantic turn|compiler|realizer|provenance|evidence id)\b/i;
const PSYCH = /\b(?:happy|happiness|sad|sadness|anxious|anxiety|contentment|motive|motivation|personality|felt)\b/i;

function parse(text: string): Record<string, unknown>|undefined {
  const t=clean(text).replace(/^```(?:json)?/i,"").replace(/```$/i,"").trim();
  try { const x=JSON.parse(t); return x&&typeof x==="object"?x as Record<string,unknown>:undefined; } catch {
    const a=t.indexOf("{"), b=t.lastIndexOf("}"); if(a<0||b<=a)return undefined;
    try { const x=JSON.parse(t.slice(a,b+1)); return x&&typeof x==="object"?x as Record<string,unknown>:undefined; } catch { return undefined; }
  }
}
function validIds(v: unknown,g: RealityGraph): string[] {
  const known=new Set(g.events.map(e=>e.id));
  const raw=Array.isArray(v)?v.filter((x):x is string=>typeof x==="string"):typeof v==="string"?[v]:[];
  return unique(raw.map(clean).filter(x=>known.has(x)));
}
function labels(g: RealityGraph, ids: readonly string[]): string[] { const m=new Map(g.events.map(e=>[e.id,e.label])); return unique(ids.map(id=>m.get(id)).filter((x):x is string=>Boolean(x))); }
function frame(parsed: Record<string,unknown>|undefined, explicit: string, g: RealityGraph): CreativeFrameSelection {
  const f=parsed?.frame&&typeof parsed.frame==="object"?parsed.frame as Record<string,unknown>:{};
  const requested=clean(parsed?.selectedLens??f.frame??explicit).toLowerCase();
  const normalized=requested.replace(/[^a-z0-9_-]/g,"");
  const chosen=explicit&&explicit.toLowerCase()!=="let qre decide"?requested:(FRAMES.has(normalized)?normalized:"");
  const ids=validIds(f.evidenceEventIds??parsed?.frameEvidenceEventIds,g);
  return { mode:chosen&&(explicit||ids.length)?"frame":"none", frame:chosen||"NONE", confidence:clamp(f.confidence??parsed?.frameConfidence,explicit?1:.4), coreTension:clean(f.coreTension??parsed?.coreTension), creativeGain:clean(f.creativeGain??parsed?.creativeGain), templateRisk:clean(f.templateRisk??parsed?.templateRisk), evidenceEventIds:ids };
}
function score(c: LatentMovieCandidate, returning: boolean): number {
  const semanticSteps=c.trajectory.filter(s=>s.eventIds.length>=2).length;
  const movement=Math.min(1, semanticSteps/2);
  const continuity=returning?c.callbackPotential:c.novelty;
  return clamp(c.attentionPotential*.17+c.novelty*.12+c.specificity*.12+c.distinctiveness*.14+c.informationValue*.1+c.consequencePotential*.1+continuity*.08+movement*.1+(1-c.truthRisk)*.07-c.repetitionRisk*.1);
}
function observationCandidates(g: RealityGraph, subject: string, returning: boolean): LatentMovieCandidate[] {
  const candidates: LatentMovieCandidate[] = [];
  for (const relation of g.relations.slice(0, 80)) {
    const from=g.events.find(e=>e.id===relation.from); const to=g.events.find(e=>e.id===relation.to);
    if(!from||!to)continue;
    const operation=operationForRelationKind(relation.kind)??"reveal";
    const c:LatentMovieCandidate={
      id:`universal-observation-${relation.from}-${relation.to}-${relation.kind}`,
      lens:"NONE",
      anchorEventIds:[relation.from,relation.to],
      supportingRelationKinds:[relation.kind],
      trajectory:[
        {order:1,operation:"establish",eventIds:[relation.from],viewerChange:"establish one supplied detail",nextQuestion:"What changes when its related detail enters?"},
        {order:2,operation,eventIds:[relation.from,relation.to],viewerChange:`the supplied ${relation.kind} relationship changes the reading`,nextQuestion:"What lingers after that change?"},
        {order:3,operation:"payoff",eventIds:[relation.to],viewerChange:"land on the supplied consequence of the relationship",nextQuestion:"What remains in the world after this moment?"},
      ],
      payoff:to.label,
      unresolvedQuestion:"What deserves another look?",
      evidence:[from.label,to.label],
      hypothesis:[`${subject}: two supplied details become more interesting when their existing relationship is made visible.`],
      truthRisk:0,
      novelty:.62,
      specificity:.95,
      informationValue:.7,
      uncertainty:.2,
      attentionPotential:.78,
      consequencePotential:relation.kind==="changes"||relation.kind==="causes"?.7:.4,
      callbackPotential:returning?.78:.18,
      compressionPotential:.88,
      repetitionRisk:.04,
      distinctiveness:.88,
      score:0,
    };
    c.score=score(c,returning); candidates.push(c);
  }
  if(candidates.length)return dedupe(candidates,10);
  return g.events.slice().sort((a,b)=>Number(Boolean(b.salient))-Number(Boolean(a.salient))).slice(0,4).map((e,i)=>{
    const c:LatentMovieCandidate={
      id:`universal-observation-${e.id}`,
      lens:"NONE",
      anchorEventIds:[e.id],
      supportingRelationKinds:[],
      trajectory:[{order:1,operation:returning?"recur":"establish",eventIds:[e.id],viewerChange:"hold the supplied detail in focus",nextQuestion:"What does another supplied detail make newly noticeable?"}],
      payoff:e.label,
      unresolvedQuestion:"What deserves another look?",
      evidence:[e.label],
      hypothesis:[`${subject}: ${e.label} is distinctive enough to carry the experience without invented plot.`],
      truthRisk:0,
      novelty:.52+i*.05,
      specificity:.95,
      informationValue:.62,
      uncertainty:.2,
      attentionPotential:.72,
      consequencePotential:.25,
      callbackPotential:returning?.8:.1,
      compressionPotential:.9,
      repetitionRisk:.08,
      distinctiveness:.86,
      score:0,
    };
    c.score=score(c,returning); return c;
  });
}
function deriveCutTrajectory(cuts: unknown[], g: RealityGraph): { ids:string[]; trajectory:LatentMovieTrajectoryStep[]; relationKinds:string[] }|undefined {
  const normalized=cuts.flatMap((cut):string[][]=>{
    if(!cut||typeof cut!=="object")return[];
    const r=cut as Record<string,unknown>;
    const ids=validIds(r.eventIds??r.evidenceEventIds??r.evidenceIds,g);
    return ids.length?[ids]:[];
  });
  if(normalized.length<2)return undefined;
  const allIds=unique(normalized.flat());
  if(allIds.length<2)return undefined;
  const first=normalized[0]![0];
  if(!first)return undefined;
  const trajectory:LatentMovieTrajectoryStep[]=[{order:1,operation:"establish",eventIds:[first],viewerChange:"establish the supplied opening detail",nextQuestion:"What changes when another supplied detail enters?"}];
  const relationKinds:string[]=[];
  let previousIds=[first];
  for(let i=1;i<normalized.length;i+=1){
    const current=normalized[i]!;
    const pair=current.find(id=>id!==previousIds[previousIds.length-1]) ?? current[0];
    const previous=previousIds[previousIds.length-1];
    if(!pair)continue;
    const relation=g.relations.find(r=>(r.from===previous&&r.to===pair)||(r.from===pair&&r.to===previous));
    if(relation){
      const operation=operationForRelationKind(relation.kind);
      if(operation){
        relationKinds.push(relation.kind);
        trajectory.push({order:trajectory.length+1,operation,eventIds:unique([previous,pair]),viewerChange:`the supplied relationship ${relation.kind} changes what is worth noticing`,nextQuestion:"What remains after that change?"});
      } else {
        trajectory.push({order:trajectory.length+1,operation:"reveal",eventIds:unique([previous,pair]),viewerChange:"the next supplied action changes the run",nextQuestion:"What becomes the next target?"});
      }
    } else {
      trajectory.push({order:trajectory.length+1,operation:"reveal",eventIds:unique([previous,pair]),viewerChange:"the next supplied real-world action advances the run",nextQuestion:"What is the next target, room, task, or state to reach?"});
    }
    previousIds=unique([...previousIds,...current]);
  }
  if(trajectory.length<2)return undefined;
  const last=previousIds.at(-1)!;
  trajectory.push({order:trajectory.length+1,operation:"payoff",eventIds:[last],viewerChange:"land the completed or changed state without adding a new event",nextQuestion:"What lingers after the supplied run?"});
  return {ids:allIds,trajectory,relationKinds:unique(relationKinds)};
}
function operationForRelationKind(kind: string): LatentMovieTrajectoryStep["operation"]|undefined {
  switch(kind){
    case "contrasts": return "contrast";
    case "changes": return "consequence";
    case "converges": return "converge";
    case "recontextualizes": return "reframe";
    case "repeats": return "recur";
    case "involves": return "reframe";
    case "causes": return "consequence";
    default: return undefined;
  }
}
function normalizeCanonicalTrajectory(value: unknown,g: RealityGraph): LatentMovieTrajectoryStep[] {
  if(!Array.isArray(value))return [];
  return value.flatMap((s,k)=>{
    if(!s||typeof s!=="object")return[];
    const z=s as Record<string,unknown>;
    const op=clean(z.operation).toLowerCase() as LatentMovieTrajectoryStep["operation"];
    const e=validIds(z.eventIds??z.eventId,g);
    return OPS.has(op)&&e.length?[{order:k+1,operation:op,eventIds:e,viewerChange:clean(z.viewerChange??z.attentionMove)||"the reading changes",nextQuestion:clean(z.nextQuestion??z.nextPromise)||"What becomes meaningful next?"}]:[];
  });
}
function normalizeModel(raw: unknown,g: RealityGraph,returning:boolean): LatentMovieCandidate[] {
  const rows=Array.isArray((raw as Record<string,unknown>|undefined)?.movies)?(raw as Record<string,unknown>).movies as unknown[]:[];
  return rows.slice(0,8).flatMap((x,i)=>{
    if(!x||typeof x!=="object")return[];
    const r=x as Record<string,unknown>;
    const explicitIds=validIds(r.evidenceEventIds??r.evidenceIds??r.anchorEventIds??r.eventIds,g);
    const canonical=normalizeCanonicalTrajectory(r.trajectory,g);
    const cutDerived=canonical.length?undefined:deriveCutTrajectory(Array.isArray(r.cuts)?r.cuts:[],g);
    const ids=unique(explicitIds.concat(cutDerived?.ids??canonical.flatMap(s=>s.eventIds)));
    let trajectory=canonical.length?canonical:(cutDerived?.trajectory??[]);
    const supporting=Array.isArray(r.supportingRelationKinds)?unique(r.supportingRelationKinds.filter((x):x is string=>typeof x==="string").map(clean)):[];
    if(!trajectory.length&&ids.length>=2){
      const pair=g.relations.find(rel=>ids.includes(rel.from)&&ids.includes(rel.to));
      if(pair){
        const operation=operationForRelationKind(pair.kind)??"reveal";
        trajectory=[
          {order:1,operation:"establish",eventIds:[pair.from],viewerChange:"establish the supplied opening detail",nextQuestion:"What changes when the related detail enters?"},
          {order:2,operation,eventIds:[pair.from,pair.to],viewerChange:`the supplied relationship ${pair.kind} changes the reading`,nextQuestion:"What remains after that change?"},
          {order:3,operation:"payoff",eventIds:[pair.to],viewerChange:"land without inventing a new event",nextQuestion:"What lingers?"},
        ];
        supporting.push(pair.kind);
      }
    }
    const thesis=clean(r.thesis??(Array.isArray(r.hypothesis)?r.hypothesis[0]:undefined));
    if(g.events.length&&(!ids.length||trajectory.length<2))return[];
    if(thesis&&(GENERIC.test(thesis)||PSYCH.test(thesis)||INTERNAL.test(thesis)))return[];
    const c:LatentMovieCandidate={
      id:clean(r.id??r.movieId)||`model-movie-${i+1}`,
      lens:clean(r.lens??r.frame)||"NONE",
      anchorEventIds:validIds(r.anchorEventIds??ids,g).slice(0,4),
      supportingRelationKinds:unique(supporting),
      trajectory,
      payoff:clean(r.payoff??r.finalMeaning)||labels(g,[ids.at(-1)??""]).at(-1)||"supplied reality",
      unresolvedQuestion:clean(r.unresolvedQuestion??r.nextQuestion)||"What changes this reading?",
      evidence:Array.isArray(r.evidence)?r.evidence.filter((x):x is string=>typeof x==="string").map(clean).filter(Boolean).slice(0,24):labels(g,ids),
      hypothesis:Array.isArray(r.hypothesis)?r.hypothesis.filter((x):x is string=>typeof x==="string").map(clean).filter(Boolean).slice(0,8):[thesis||"Grounded structural reading of supplied details."],
      truthRisk:clamp(r.truthRisk),
      novelty:clamp(r.novelty,.68),
      specificity:clamp(r.specificity,.84),
      informationValue:clamp(r.informationValue,.74),
      uncertainty:clamp(r.uncertainty,.3),
      attentionPotential:clamp(r.attentionPotential,.64),
      consequencePotential:clamp(r.consequencePotential,.5),
      callbackPotential:clamp(r.callbackPotential,returning?.78:.18),
      compressionPotential:clamp(r.compressionPotential,.76),
      repetitionRisk:clamp(r.repetitionRisk,.08),
      distinctiveness:clamp(r.distinctiveness,.72),
      score:0,
    };
    c.score=score(c,returning);
    return [c];
  });
}
function signature(c: LatentMovieCandidate): string { return `${c.trajectory.map(s=>s.operation).join(">")}|${c.trajectory.map(s=>s.eventIds.slice().sort().join("+")).join("|")}`; }
function dedupe(cs: LatentMovieCandidate[],limit=10): LatentMovieCandidate[] { const out:LatentMovieCandidate[]=[]; const seen=new Set<string>(); for(const c of cs.slice().sort((a,b)=>b.score-a.score)){const s=signature(c); if(seen.has(s))continue; seen.add(s); out.push(c); if(out.length>=limit)break;} return out; }
function questions(input: AuthorCognitionInput): AuthorAdaptiveQuestion[]{
  const out:AuthorAdaptiveQuestion[]=[]; if(!input.subject)out.push({kind:"who",question:"Who or what is this about?",reason:"The focal subject is missing."}); if(!input.place&&!input.realityGraph.events.some(e=>e.place))out.push({kind:"where",question:"Where did this happen?",reason:"Place may add meaningful context."}); if(!input.realityGraph.events.some(e=>e.time)&&!/(today|yesterday|tomorrow|morning|afternoon|evening|night|\d{1,2}:\d{2}|\d{4})/i.test(input.prompt))out.push({kind:"when",question:"When did this happen?",reason:"Time may establish useful continuity."}); return out.slice(0,3);
}
export async function buildAuthorCognitivePlan(input: AuthorCognitionInput): Promise<AuthorCognitionPlan>{
  const returning=Boolean(input.returning||(input.visitNumber??1)>1), explicit=clean(input.lens); const intelligence=buildAuthorCognitionIntelligence(input.realityGraph,returning,input.creativeLearningContext??[]);
  const compact={subject:clean(input.subject)||"unknown",place:clean(input.place)||"unknown",prompt:clean(input.prompt),returning,memory:(input.memoryContext??[]).slice(0,20),learning:(input.creativeLearningContext??[]).slice(0,20),events:input.realityGraph.events.map(e=>({id:e.id,label:e.label,salient:Boolean(e.salient),place:e.place,time:e.time,entities:e.entities})),relations:input.realityGraph.relations.map(r=>({from:r.from,to:r.to,kind:r.kind,strength:r.strength})),patterns:input.realityGraph.patterns??[],tensions:input.realityGraph.unresolvedTensions??[],sensory:input.realityGraph.sensorySignals??[]};
  let parsed:Record<string,unknown>|undefined; let model="deterministic"; let modelCalls=0;
  if(input.movieMode!==false){try{const r=await localModelGenerate([{role:"system",content:[
    "You are QRE universal cognition, not a writer.",
    "Reality is immutable. Never invent people, places, actions, outcomes, chronology, motives or emotions.",
    "Search the supplied RealityGraph for materially different creative structures. Do not force a genre, lens, narrator or fixed beat count.",
    "A Movie is a grounded creative structure made from supplied event IDs. It may emerge from explicit relationships OR from the structure of a real sequence of actions, objects, spaces, repetitions, interruptions, transformations, comparisons, returns or unusual details.",
    "Do not require an explicit graph relation before recognizing form. Ordered work can contain stages; stages can become rounds; rooms can become territory; a sequence can become a run; completion can become a finish; a real interruption can become an obstacle; before/after can become transformation.",
    "Search for active mechanics and material agency: mission, campaign, rounds, territory, race, speedrun, countdown, contest, hunt, showdown, boss room, elimination, rescue, repair, transformation, reversal, accumulation, status flip, object-as-character, food-as-character, car-as-contender, house-as-stage, room-as-arena, machine-as-opponent, tool-as-weapon, sign-as-sentinel or other metaphorical roles when supplied reality supports them.",
    "Material agency is expressive, not literal. A dish may 'enter the stage' in the film without claiming the food literally walked, spoke or chose. A car may be framed as a contender without inventing a race. A house may feel like a boss room without inventing a monster.",
    "Do not invent an opponent, danger, deadline, failure, victory, dialogue, motive, sensation or consequence merely to make something exciting. The energy must be extracted from real structure or clearly figurative language reserved for the Artist.",
    "Do not make one hypothesis per event. Do not treat a subject as narrator by default.",
    "A rich reality graph may justify a materially rich structure. A sparse graph may produce a compact structure. Do not collapse rich material merely because a compact answer is easier.",
    "Every concrete cut in downstream realization will be bound to supplied evidence. You may return movies using eventIds:[...] alone, cuts:[{eventIds:[...],duration?}], or canonical trajectory:[{operation,eventIds,viewerChange,nextQuestion}].",
    "Do not invent relationship kinds; when using trajectory operations, use only relationships visible in the supplied graph.",
    "Keep hypotheses diagnostic and non-psychological. No customer-facing prose.",
    "Return JSON only: selectedLens, frame, interpretations, movies, selectedMovieId, adaptiveQuestions, attentionStrategy, reasoningSummary."
  ].join("\n")},{role:"user",content:JSON.stringify({reality:compact,intelligence:{signals:intelligence.semanticSignals,moves:intelligence.candidateMoves,rules:intelligence.decisionRules,competition:intelligence.competitionProtocol,attention:intelligence.attention,antiFailure:intelligence.antiFailureChecks}})}],"json",{numPredict:1400,temperature:.9}); parsed=parse(r.text); model=r.model; modelCalls=1;}catch{} }
  const fr=frame(parsed,explicit,input.realityGraph), selectedLens=fr.mode==="frame"?fr.frame:"NONE";
  const modelCs=normalizeModel(parsed,input.realityGraph,returning);
  const observations=observationCandidates(input.realityGraph,clean(input.subject)||"the subject",returning);
  const candidates=dedupe(modelCs.length?modelCs:observations,10);
  const chosenRaw=parsed?.selectedMovieId;
  const chosenId=clean(chosenRaw);
  const numericChosen=Number(chosenId);
  const selectedMovie=candidates.find(c=>c.id===chosenId)
    ||(Number.isInteger(numericChosen)&&numericChosen>=0?candidates[numericChosen]:undefined)
    ||candidates[0];
  const ints=Array.isArray(parsed?.interpretations)?parsed.interpretations.slice(0,6).flatMap((x,i)=>{if(!x||typeof x!=="object")return[];const r=x as Record<string,unknown>;return [{id:clean(r.id)||`interpretation-${i+1}`,thesis:clean(r.thesis)||selectedMovie?.hypothesis[0]||"Find the strongest grounded reading.",creativeOpportunity:clean(r.creativeOpportunity)||"semantic progression",rationale:clean(r.rationale)||"grounded in supplied evidence",evidenceEventIds:validIds(r.evidenceEventIds,input.realityGraph),confidence:clamp(r.confidence,.6)}];}):[];
  const qs=Array.isArray(parsed?.adaptiveQuestions)?parsed.adaptiveQuestions.filter((x):x is Record<string,unknown>=>Boolean(x&&typeof x==="object")).map(x=>({kind:clean(x.kind) as AuthorAdaptiveQuestion["kind"],question:clean(x.question),reason:clean(x.reason)})).filter(x=>x.question&&["who","where","when","event","detail"].includes(x.kind)&&!PSYCH.test(x.question)).slice(0,3):[];
  return {selectedLens,frame:fr,interpretations:ints.length?ints:[{id:"interpretation-grounded",thesis:selectedMovie?.hypothesis[0]||"Find the strongest grounded reading.",creativeOpportunity:"semantic progression",rationale:"derived from supplied evidence",evidenceEventIds:selectedMovie?.anchorEventIds??[],confidence:selectedMovie?.score??.2}],latentMovieCandidates:candidates,selectedMovie,adaptiveQuestions:unique([...qs,...questions(input)].map(x=>JSON.stringify(x))).map(x=>JSON.parse(x) as AuthorAdaptiveQuestion).slice(0,4),attentionStrategy:clean(parsed?.attentionStrategy)||"notice what changes the meaning of another supplied detail",reasoningSummary:Array.isArray(parsed?.reasoningSummary)?parsed.reasoningSummary.filter((x):x is string=>typeof x==="string").map(clean).filter(Boolean).slice(0,10):[...intelligence.semanticSignals.slice(0,3),...intelligence.competitionProtocol.slice(0,4)],model,modelCalls};
}