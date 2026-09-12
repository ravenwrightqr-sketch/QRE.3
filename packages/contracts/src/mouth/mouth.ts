/** QRE Mouth language-realization contracts. */
import type { RealizationObligations } from "./realizationObligations.js";
import type { MouthRealizationAuthority } from "./realizationAuthority.js";

export type SemanticRealization = { direction:string; eventIds:string[]; relationKinds:string[]; feltEffect?:string };
export type ViewerStateAttentionMove = "orient" | "interrupt" | "tighten" | "recontextualize" | "escalate" | "release" | "land";
export type ViewerStateCut = { beforeState:string; afterState:string; attentionMove:ViewerStateAttentionMove; curiosityPressure:number; contrast:number; interruption:number; accumulation:number; tempo:number; payoffPressure:number; stateShift:number; predictionError:number; evidenceEventIds:string[] };
export type MouthObserverExperienceObjective = { objective:string; surprise:string; curiosity:string; attention:string[]; landing:string; explanationForbidden:boolean; feltEffect?:string; viewerShift?:string; realizationDirection?:string };
export type MouthCandidateBeat = { order:number; role?:string; attentionFunction?:string; creativeMove?:string; realizationMode?:string; eventIds?:readonly string[]; change?:string; next?:string; frontier?:string; setsUp?:readonly string[]; paysOff?:readonly string[]; realizationObligations?:RealizationObligations; obligations?:readonly string[]; relationKinds?:readonly string[]; relationStrength?:number; viewerState?:ViewerStateCut; semanticRealization?:SemanticRealization; observerExperience?:MouthObserverExperienceObjective; realizationAuthority?:MouthRealizationAuthority; forbiddenMoves?:readonly string[] };
export type MouthCandidate = { text:string; beatOrder:number; supportedEventIds:string[]; supportedRelationPairs:string[]; groundingScore:number; meaningScore:number; observerDiscoveryScore:number; transitionScore:number; obligationCoverage:number; relationContractScore:number; forbiddenMoveRisk:number; cohesionScore:number; noveltyScore:number; compressionScore:number; inventionRisk:number; repetitionRisk:number; collageRisk:number; endpointExactness:number; score:number; reasons:string[] };
export type MouthCandidateSelection = { selected?:MouthCandidate; candidates:MouthCandidate[] };
export type MouthCandidateBatch = { variantsByBeat:Array<{order:number;variants:string[]}> };
export type MouthCandidatePool = { order:number; viewerState:ViewerStateCut; nextPromise?:string; frontier?:string; candidates:MouthCandidate[] };
export type MouthSequencePath = { candidates:MouthCandidate[]; texts:string[]; score:number };
export type MouthBeamOptions = { width?:number; candidatesPerBeat?:number };
export type MouthRepairObjective = { beatOrder:number; priority:"critical"|"high"|"medium"; failures:string[]; objective:string; preserve:string[]; forbid:string[] };
export type MouthSequence = { cuts:string[]; sourceEventIds:string[][] };
