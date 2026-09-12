import type { AuthorBrainTruth, CanonicalAuthorResult, SequenceCandidate } from "@qre/contracts";
import { buildAuthorRealityGraph } from "./authorRealityGraph.js";
import { authorCognition } from "./authorCognition.js";
import { chooseAuthorProposition } from "./authorArtist.js";
import { buildSequencePlay, realizeAuthorSequence } from "./authorMouth.js";
import { judgeAuthorSequence } from "./authorJudge.js";
import { buildAuthorReadout } from "./authorReadout.js";

export async function authorBrainCanonical(input:AuthorBrainTruth):Promise<CanonicalAuthorResult>{
  const reality=buildAuthorRealityGraph(input);
  const cognition=await authorCognition({truth:input,reality});
  const candidates:SequenceCandidate[]=cognition.candidates.slice(0,6);
  const candidate=candidates[0];
  if(!candidate) throw new Error("Author could not find a grounded semantic candidate");
  const proposition=await chooseAuthorProposition({truth:input,candidate,alternatives:candidates,graph:reality,domainContext:input.domainContext});
  let drafts=await realizeAuthorSequence({graph:reality,candidate,proposition});
  let sequence=buildSequencePlay({subject:input.subject||candidate.lens,proposition,candidate,cuts:drafts});
  let judgment=judgeAuthorSequence({graph:reality,proposition,sequence});
  if(judgment.status==="REJECT"){
    drafts=await realizeAuthorSequence({graph:reality,candidate,proposition});
    sequence=buildSequencePlay({subject:input.subject||candidate.lens,proposition,candidate,cuts:drafts});
    judgment=judgeAuthorSequence({graph:reality,proposition,sequence});
  }
  if(judgment.status==="REJECT") throw new Error(`Author sequence rejected: ${judgment.reasons.join("; ")}`);
  return {readout:buildAuthorReadout({graph:reality,subject:input.subject}),reality,metamorphic:cognition.relations,cognition,proposition,sequence,judgment};
}
