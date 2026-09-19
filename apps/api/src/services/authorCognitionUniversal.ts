/* QRE UNIVERSAL COGNITION · one domain-neutral search brain */
import type { AuthorDomainContext, LatentMovieCandidate, LatentMovieTrajectoryStep, RealityGraph } from "@qre/contracts";

type CreativeFrameSelection = {
  mode: "frame" | "none";
  frame: string;
  confidence: number;
  coreTension: string;
  creativeGain: string;
  templateRisk: string;
  evidenceEventIds: string[];
};
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
  const last=previousIds[previousIds.length - 1]!;
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
  const root = raw as Record<string,unknown>|undefined;
  const movies = root?.structures ?? root?.movies;
  const rows: Array<{ key?: string; value: unknown }> = Array.isArray(movies)
    ? movies.map((value) => ({ value }))
    : movies && typeof movies === "object"
      ? Object.entries(movies as Record<string, unknown>).map(([key, value]) => ({ key, value }))
      : [];
  return rows.slice(0,8).flatMap((row,i)=>{
    const x = row.value;
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
      id: clean(r.id ?? r.movieId ?? row.key) || `model-movie-${i+1}`,
      lens:clean(r.lens??r.frame)||"NONE",
      anchorEventIds:validIds(r.anchorEventIds??ids,g).slice(0,4),
      supportingRelationKinds:unique(supporting),
      trajectory,
      payoff: clean(r.payoff ?? r.finalMeaning) || (() => {
        const lastId = ids.length ? ids[ids.length - 1] : "";
        const lastLabels = labels(g, [lastId]);
        return lastLabels.length ? lastLabels[lastLabels.length - 1] : "supplied reality";
      })(),
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
function usableCognitionPayload(value: Record<string, unknown> | undefined): boolean {
  if (!value) return false;
  const structures = value.structures ?? value.movies;
  const rows = Array.isArray(structures)
    ? structures
    : structures && typeof structures === "object"
      ? Object.values(structures as Record<string, unknown>)
      : [];
  if (!rows.length) return false;
  return rows.some((row) => {
    if (!row || typeof row !== "object") return false;
    const item = row as Record<string, unknown>;
    const ids = item.eventIds ?? item.evidenceEventIds ?? item.anchorEventIds;
    const cuts = item.cuts;
    const trajectory = item.trajectory;
    return (Array.isArray(ids) && ids.length >= 2)
      || (Array.isArray(cuts) && cuts.length >= 2)
      || (Array.isArray(trajectory) && trajectory.length >= 2);
  });
}

export async function buildAuthorCognitivePlan(input: AuthorCognitionInput): Promise<AuthorCognitionPlan>{
  const returning=Boolean(input.returning||(input.visitNumber??1)>1), explicit=clean(input.lens); const intelligence=buildAuthorCognitionIntelligence(input.realityGraph,returning,input.creativeLearningContext??[]);
  const compact={subject:clean(input.subject)||"unknown",place:clean(input.place)||"unknown",prompt:clean(input.prompt),returning,memory:(input.memoryContext??[]).slice(0,20),learning:(input.creativeLearningContext??[]).slice(0,20),events:input.realityGraph.events.map(e=>({id:e.id,label:e.label,salient:Boolean(e.salient),place:e.place,time:e.time,entities:e.entities})),relations:input.realityGraph.relations.map(r=>({from:r.from,to:r.to,kind:r.kind,strength:r.strength})),patterns:input.realityGraph.patterns??[],tensions:input.realityGraph.unresolvedTensions??[],sensory:input.realityGraph.sensorySignals??[]};
  let parsed:Record<string,unknown>|undefined; let model="deterministic"; let modelCalls=0;
  if(input.movieMode!==false){
    const systemPrompt = [
      "You are QRE universal cognition. You are not the final writer.",
      "Reality is immutable. Never invent people, places, objects, actions, outcomes, chronology, motives, emotions, dialogue, sensory facts, or relationships.",
      "Your job is to notice what becomes newly perceptible when supplied events are considered together: change, recurrence, contrast, implication, character, status, progression, accumulation, interruption, transformation, or another grounded structure.",
      "Do not merely restate events. Do not output one relation object. Build at least one multi-event experience structure when the supplied reality supports it.",
      "Do not convert evidence into a stronger psychological or relationship claim than the evidence supports. Recurrence is not automatically anticipation. Long conversation is not automatically a bond. Feeling lighter afterward is not automatically deepening intimacy. Keep the discovered meaning at the strongest grounded level and leave the final human inference open.",
      "Prefer structural discoveries such as: an initial state reads differently after a later supplied state; recurrence changes the charge of an earlier event; duration makes an encounter harder to dismiss; a repeated action reveals pattern; an unchanged object becomes salient because everything around it changed.",
      "Your hypothesis should describe the accumulated relationship among supplied facts, not explain the person's inner life and not summarize the facts one by one.",
      "Ordered supplied actions may form a run, stages, rounds, progression, or completion without requiring a fabricated graph relation.",
      "A creative frame may pressure interpretation, but source domain never dictates a genre and framing never adds facts.",
      "The downstream Realizer needs accumulated meaning: what becomes newly noticeable only because multiple supplied details are considered together. Give it that relationship explicitly in each structure hypothesis.",
      "Use only supplied event IDs.",
      "Return JSON only with this exact top-level shape:",
      '{"selectedLens":"NONE or grounded treatment","frame":{"frame":"NONE or treatment","confidence":0.0,"evidenceEventIds":[]},"interpretations":[{"thesis":"what becomes newly noticeable","creativeOpportunity":"why it has experiential charge","rationale":"grounded reason","evidenceEventIds":["event-1","event-2"],"confidence":0.0}],"structures":[{"id":"structure-1","eventIds":["event-1","event-2"],"cuts":[{"eventIds":["event-1"]},{"eventIds":["event-2"]}],"hypothesis":["grounded accumulated reading"]}],"selectedStructureId":"structure-1","adaptiveQuestions":[],"attentionStrategy":"how understanding should accumulate","reasoningSummary":["brief grounded reason"]}',
      "Do not return any other top-level shape."
    ].join("\n");

    const userPayload = JSON.stringify({
      reality: compact,
      cognitionHints: {
        signals: intelligence.semanticSignals.slice(0, 10),
        moves: intelligence.candidateMoves.slice(0, 10),
        attention: intelligence.attention.slice(0, 8),
      },
    });

    try {
      const first = await localModelGenerate(
        [{role:"system",content:systemPrompt},{role:"user",content:userPayload}],
        "json",
        {numPredict:1400,temperature:.82},
      );
      parsed=parse(first.text);
      model=first.model;
      modelCalls=1;

      if (!usableCognitionPayload(parsed)) {
        const repair = await localModelGenerate(
          [
            {role:"system",content:systemPrompt},
            {role:"user",content:[
              userPayload,
              "",
              "Your previous response did not satisfy the QRE cognition contract.",
              "Return the required top-level object with structures containing at least one grounded multi-event structure.",
              "Do not return a bare relation, score, event pair, prose explanation, or final viewer-facing copy."
            ].join("\n")},
          ],
          "json",
          {numPredict:1400,temperature:.7},
        );
        parsed=parse(repair.text);
        model=repair.model;
        modelCalls=2;
      }
    } catch {}
  }
  const modelCs=normalizeModel(parsed,input.realityGraph,returning);
  const observations=observationCandidates(input.realityGraph,clean(input.subject)||"the subject",returning);
  const candidates=dedupe(modelCs.length?modelCs:observations,10);
  const chosenRaw=parsed?.selectedStructureId ?? parsed?.selectedMovieId;
  const chosenId=clean(chosenRaw);
  const numericChosen=Number(chosenId);
  const selectedMovie=candidates.find(c=>c.id===chosenId)
    ||(Number.isInteger(numericChosen)&&numericChosen>=0?candidates[numericChosen]:undefined)
    ||candidates[0];
  const baseFrame=frame(parsed,explicit,input.realityGraph);
  const autoFrameGrounded = !explicit && baseFrame.frame !== "NONE" && Boolean(selectedMovie?.anchorEventIds.length);
  const fr: CreativeFrameSelection = autoFrameGrounded && baseFrame.mode === "none"
    ? { ...baseFrame, mode: "frame", evidenceEventIds: selectedMovie?.anchorEventIds ?? [] }
    : baseFrame;
  const selectedLens=fr.mode==="frame"?fr.frame:"NONE";
  const interpretationValue = parsed?.interpretations;
  const interpretationRows: Array<{ key?: string; value: unknown }> = Array.isArray(interpretationValue)
    ? interpretationValue.map((value) => ({ value }))
    : interpretationValue && typeof interpretationValue === "object"
      ? Object.entries(interpretationValue as Record<string, unknown>).map(([key, value]) => ({ key, value }))
      : [];
  const ints=interpretationRows.slice(0,6).flatMap((row,i)=>{
    const x=row.value;
    if(typeof x==="string"){
      return [{id:row.key||`interpretation-${i+1}`,thesis:clean(x)||selectedMovie?.hypothesis[0]||"Find the strongest grounded reading.",creativeOpportunity:"semantic progression",rationale:"grounded in supplied evidence",evidenceEventIds:selectedMovie?.anchorEventIds??[],confidence:selectedMovie?.score??.6}];
    }
    if(!x||typeof x!=="object")return[];
    const r=x as Record<string,unknown>;
    return [{id:clean(r.id??row.key)||`interpretation-${i+1}`,thesis:clean(r.thesis)||selectedMovie?.hypothesis[0]||"Find the strongest grounded reading.",creativeOpportunity:clean(r.creativeOpportunity)||"semantic progression",rationale:clean(r.rationale)||"grounded in supplied evidence",evidenceEventIds:validIds(r.evidenceEventIds,input.realityGraph),confidence:clamp(r.confidence,.6)}];
  });
  const qs: AuthorAdaptiveQuestion[] = [];
  return {selectedLens,frame:fr,interpretations:ints.length?ints:[{id:"interpretation-grounded",thesis:selectedMovie?.hypothesis[0]||"Find the strongest grounded reading.",creativeOpportunity:"semantic progression",rationale:"derived from supplied evidence",evidenceEventIds:selectedMovie?.anchorEventIds??[],confidence:selectedMovie?.score??.2}],latentMovieCandidates:candidates,selectedMovie,adaptiveQuestions:unique([...qs,...questions(input)].map(x=>JSON.stringify(x))).map(x=>JSON.parse(x) as AuthorAdaptiveQuestion).slice(0,4),attentionStrategy:clean(parsed?.attentionStrategy)||"notice what changes the meaning of another supplied detail",reasoningSummary:Array.isArray(parsed?.reasoningSummary)?parsed.reasoningSummary.filter((x):x is string=>typeof x==="string").map(clean).filter(Boolean).slice(0,10):[...intelligence.semanticSignals.slice(0,3),...intelligence.competitionProtocol.slice(0,4)],model,modelCalls};
}