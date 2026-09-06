import type { AuthorScene, LatentMovieCandidate, RealityGraph } from "@qre/contracts";

type RealizedScene = AuthorScene & { sourceEventIds: string[]; score?: number };

/** Independent judge for the VISIBLE film. It judges the artifact, not latent metadata. */
export type RealizedFilmJudgment = {
  accepted: boolean;
  score: number;
  reasons: string[];
  dimensions: {
    concreteGrounding: number;
    relationBridge: number;
    progression: number;
    landing: number;
    formDiversity: number;
    artisticTransformation: number;
    sourceCopyRisk: number;
    inventionRisk: number;
    explanationRisk: number;
    captionReelRisk: number;
  };
};

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();
const clamp = (value: number): number => Number(Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0)).toFixed(3));
const unique = (values: readonly string[]): string[] => [...new Set(values.map(clean).filter(Boolean))];
const tokenSet = (text: string): Set<string> => new Set((clean(text).toLowerCase().match(/\b[\w’'-]+\b/g) ?? []).filter((token) => token.length > 2));
function overlap(left: string, right: string): number { const a=tokenSet(left); const b=tokenSet(right); if(!a.size||!b.size)return 0; let hits=0; for(const token of a)if(b.has(token))hits+=1; return hits/Math.max(1,a.size); }
function relationExists(graph: RealityGraph, ids: readonly string[]): boolean { const set=new Set(ids); return graph.relations.some((r)=>set.has(r.from)&&set.has(r.to)); }
function eventCorpus(graph: RealityGraph): string { return graph.events.flatMap((e)=>[e.label,...e.entities,e.place,e.time]).filter(Boolean).join(" "); }
function eventText(event: RealityGraph["events"][number]): string { return [event.label,...event.entities,event.place,event.time].filter(Boolean).join(" "); }
function sceneGrounding(scene: RealizedScene, graph: RealityGraph): number { const source=scene.sourceEventIds.map((id)=>graph.events.find((e)=>e.id===id)).filter(Boolean); if(!source.length)return 0; return Math.max(...source.map((e)=>overlap(scene.text,eventText(e!)))); }
function concreteGrounding(scenes: readonly RealizedScene[], graph: RealityGraph): number { const nonFinal=scenes.slice(0,-1); if(!graph.events.length)return 1; if(!nonFinal.length)return 0; return clamp(nonFinal.reduce((sum,s)=>sum+sceneGrounding(s,graph),0)/nonFinal.length); }
function relationBridge(scenes: readonly RealizedScene[], graph: RealityGraph): number { if(graph.events.length<2)return 1; return scenes.some((s)=>s.sourceEventIds.length>=2&&relationExists(graph,s.sourceEventIds))?1:0; }
function progression(scenes: readonly RealizedScene[], graph: RealityGraph): number {
  if(scenes.length<2)return 0;
  const sources=scenes.map((s)=>new Set(s.sourceEventIds));
  const transitions=sources.slice(1).filter((set,index)=>{for(const id of set)if(!sources[index]!.has(id))return true; return false;}).length;
  const bridgeIndex=scenes.findIndex((s)=>s.sourceEventIds.length>=2&&relationExists(graph,s.sourceEventIds));
  const bridgeTiming=bridgeIndex>0?1:0;
  const distinctSources=new Set(scenes.flatMap((s)=>s.sourceEventIds)).size;
  return clamp((Math.min(1,transitions/Math.max(1,sources.length-1))*0.45)+(bridgeTiming*0.35)+(Math.min(1,distinctSources/2)*0.2));
}
function landing(scenes: readonly RealizedScene[], graph: RealityGraph): number { const last=scenes.at(-1); if(!last||scenes.length<2)return 0; const words=(last.text.match(/\b[\w’'-]+\b/g)??[]).length; const compact=words<=4?1:words<=7?.8:words<=11?.55:.2; const overlapRatio=overlap(last.text,eventCorpus(graph)); const interpretive=!/\b(?:this means|which means|this shows|the point is|the meaning is|because|therefore|in other words)\b/i.test(last.text)?1:0; const sourceIndependent=overlapRatio<.7?1:0; return clamp(compact*.35+interpretive*.25+sourceIndependent*.4); }
function formDiversity(scenes: readonly RealizedScene[]): number { if(scenes.length<3)return .55; const lengths=new Set(scenes.map((s)=>(s.text.match(/\b[\w’'-]+\b/g)??[]).length)).size; const kinds=unique(scenes.map((s)=>s.kind??"")).length; return clamp(Math.min(1,lengths/Math.min(4,scenes.length))*.5+Math.min(1,kinds/3)*.5); }
function artisticTransformation(scenes: readonly RealizedScene[], graph: RealityGraph): number { if(scenes.length<2)return 0; const corpus=eventCorpus(graph); const copyLike=scenes.slice(0,-1).filter((s)=>overlap(s.text,corpus)>=.78).length; const abstractFinal=/\b(?:ecstasy|bliss|joy|wonder|absurd|strange|beautiful|electric|tender|feral|sudden|pure|freedom|triumph|chaos|silence|afterglow)\b/i.test(scenes.at(-1)?.text??"")?1:0; return clamp((1-copyLike/Math.max(1,scenes.length-1))*.65+abstractFinal*.35); }
function sourceCopyRisk(scenes: readonly RealizedScene[], graph: RealityGraph): number { if(!scenes.length)return 1; const corpus=eventCorpus(graph); const risks=scenes.slice(0,-1).map((s)=>overlap(s.text,corpus)); return clamp(risks.filter((r)=>r>=.78).length/Math.max(1,risks.length)); }
function inventionRisk(scenes: readonly RealizedScene[], graph: RealityGraph): number { let bad=0; const checked=scenes.slice(0,-1); for(const s of checked){if(sceneGrounding(s,graph)<.18&&tokenSet(s.text).size>1)bad+=1;} return checked.length?clamp(bad/checked.length):0; }
function explanationRisk(scenes: readonly RealizedScene[]): number { const explanation=/\b(?:this means|which means|this shows|which shows|the point is|the meaning is|in other words|the relationship|the viewer|the audience|changes what is worth noticing|because this)\b/i; return clamp(scenes.filter((s)=>explanation.test(s.text)).length/Math.max(1,scenes.length)); }
function captionReelRisk(scenes: readonly RealizedScene[], graph: RealityGraph): number { if(scenes.length<3)return 0; const oneEvent=scenes.filter((s)=>s.sourceEventIds.length===1).length/scenes.length; const paraphrases=scenes.slice(0,-1).filter((s)=>s.sourceEventIds.length===1&&overlap(s.text,eventText(graph.events.find((e)=>e.id===s.sourceEventIds[0])!))>=.58).length/Math.max(1,scenes.length); const bridge=scenes.filter((s)=>s.sourceEventIds.length>=2&&relationExists(graph,s.sourceEventIds)).length/scenes.length; return clamp(oneEvent*.25+paraphrases*.55+(1-bridge)*.2); }

export function judgeRealizedFilm(input:{scenes:readonly RealizedScene[];movie:LatentMovieCandidate;graph:RealityGraph}):RealizedFilmJudgment {
  const dimensions={concreteGrounding:concreteGrounding(input.scenes,input.graph),relationBridge:relationBridge(input.scenes,input.graph),progression:progression(input.scenes,input.graph),landing:landing(input.scenes,input.graph),formDiversity:formDiversity(input.scenes),artisticTransformation:artisticTransformation(input.scenes,input.graph),sourceCopyRisk:sourceCopyRisk(input.scenes,input.graph),inventionRisk:inventionRisk(input.scenes,input.graph),explanationRisk:explanationRisk(input.scenes),captionReelRisk:captionReelRisk(input.scenes,input.graph)};
  const reasons:string[]=[];
  if(input.scenes.length<2)reasons.push("film needs at least two cuts");
  if(input.graph.events.length>1&&dimensions.concreteGrounding<.18)reasons.push("visible film loses contact with supplied reality");
  if(input.graph.events.length>1&&dimensions.relationBridge<1)reasons.push("visible film never bridges the discovered relationship");
  if(input.graph.events.length>1&&dimensions.progression<.35)reasons.push("visible film does not move attention");
  if(dimensions.landing<.65)reasons.push("ending does not earn a felt landing");
  if(dimensions.artisticTransformation<.35||dimensions.sourceCopyRisk>=.5)reasons.push("visible film copies source wording instead of transforming the reality");
  if(dimensions.inventionRisk>.35)reasons.push("visible film introduces unsupported concrete material");
  if(dimensions.explanationRisk>0)reasons.push("visible film explains instead of letting the art speak");
  if(dimensions.captionReelRisk>=.65)reasons.push("visible film collapses toward a caption reel");
  const score=clamp(dimensions.concreteGrounding*.12+dimensions.relationBridge*.16+dimensions.progression*.16+dimensions.landing*.22+dimensions.formDiversity*.08+dimensions.artisticTransformation*.14+(1-dimensions.sourceCopyRisk)*.04+(1-dimensions.inventionRisk)*.05+(1-dimensions.explanationRisk)*.01+(1-dimensions.captionReelRisk)*.02);
  return {accepted:reasons.length===0&&score>=.68,score,reasons,dimensions};
}
