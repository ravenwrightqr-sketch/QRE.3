/**
 * =====================================================
 * QRE COMPILED EXPERIENCE CONTRACT
 * =====================================================
 *
 * ROLE:
 *
 * Canonical semantic artifact contract.
 *
 * This is the final shape produced by cognition.
 *
 *
 * PIPELINE:
 *
  * Physical World
 *       ↓
 * Presence
 *       ↓
 * Human Prompt
 *       ↓
 * Understanding Kernel
 *       ↓
 * Experience Genome
 *       ↓
 * Experience Compiler Intelligence
 *       ↓
 * Compiler Brain Orchestration
 *       ↓
 *       ↓
 * Experience World
 *       ↓
 * Blueprint
 *       ↓
 * Story
 *       ↓
 * Flow
 *       ↓
 * Moments
 *       ↓
 * Cinematic Scenes
 *       ↓
 * Compiled Experience
 *
 *
 * OWNS:
 *
 * - ExperienceCompilerIntelligence
 * - CompiledExperience
 * - Semantic artifact contracts
 *
 *
 * DOES NOT OWN:
 *
 * ❌ Database models
 * ❌ Storage state
 * ❌ API contracts
 * ❌ Runtime execution
 *
 *
 * INTELLIGENCE RULE:
 *
 * ExperienceCompilerIntelligence is the ONLY
 * canonical cognitive substrate.
 *
 * Do not create duplicate intelligence contracts.
 *
 *
 * Evolution:
 *
 * Experience
 *      ↓
 * Observation
 *      ↓
 * Reflection
 *      ↓
 * Learning
 *      ↓
 * Updated Intelligence
 *
 * =====================================================
 */


import type {
  ExperienceIntent,
} from "./experienceIntent.js";

import type {
  ExperienceMeaningContext,
} from "../cognition/MeaningContext.js";
import type {
  ExperienceGenome,
} from "./genome.js";


import type {
  ExperienceWorld,
} from "./world.js";


import type {
  ExperienceMeaning,
} from "./meaning.js";

import type {
 CognitiveEvolutionState
} from "../cognition/cognitionLoop.js";
import type {
  ExperienceBlueprint,
} from "./blueprint.js";
import type {
  ExperienceMoment,
} from "./moment.js";

import type {
  ExperienceNarrative,
} from "../cognition/ExperienceNarrative.js";

import type {
  ExperienceModel,
} from "./model.js";


import type {
  FlowStep,
} from "../flow.js";


import type {
  CinematicScene,
} from "../cinematic.js";


import type {
  SemanticIR,
} from "./semanticIR.js";


import type {
  MoverArc,
  MoverTopology,
} from "./moverArc.js";


import type {
  ExperienceCognitiveTrace,
} from "./cognitiveTrace.js";


import type {
  GeoStory,
} from "../geoStory.js";


import type {
  MemorySnapshot,
} from "../memorySnapshot.js";


import type {
  ServiceReceipt,
} from "../serviceReceipt.js";


import type {
  ExperienceUnderstanding,
} from "./experienceUnderstanding.js";

import type {
  NuvoField,
} from "../cognition/NuvoField.js";

import type {
  RevikField,
} from "../cognition/RevikField.js";
import type {
  KaivoField,
} from "../cognition/KaivoField.js";

import type {
  OrionField,
} from "../cognition/OrionField.js";
import { MemoryReveal } from "./memoryReveal.js";
import { ExperienceArc } from "../cognition/arc.js";

/**
 * =====================================================
 *
 * PRESENCE CONTEXT
 *
 * Physical world trigger.
 *
 * =====================================================
 */


export type ExperiencePresence = {

  source:
    | "qr"
    | "nfc"
    | "link"
    | "event"
    | "manual";


  object?: {

    id?: string;

    category?: string;

    label?: string;

  };


  location?: {

    latitude:number;

    longitude:number;

    label?:string;

  };


  actor?: {

    id?:string;

    role?:string;

    name?:string;

  };


  capturedAt:string;

};




/**
 * =====================================================
 *
 * EXPERIENCE LOOP
 *
 * Physical → Digital → Human → Next Experience
 *
 * =====================================================
 */


export type ExperienceLoop = {

  entry:string;

  action:string;

  reward?:string;

  continuation?:string;

  shareTrigger?:string;

  nextExperience?:string;

};




/**
 * =====================================================
 *
 * EXPERIENCE COMPILER INTELLIGENCE
 *
 * THE SINGLE COGNITIVE SUBSTRATE
 *
 * =====================================================
 *
 * Every real cognitive output enters here.
 *
 * This is NOT the compiler.
 *
 * This is the intelligence produced and carried
 * through the compiler pipeline.
 *
 * =====================================================
 */


export type ExperienceCompilerIntelligence = {

  understanding:
    ExperienceUnderstanding;

  meaningContext:
    ExperienceMeaningContext;

  meaning:
    ExperienceMeaning;

  genome:
    ExperienceGenome;

  cognitiveTrace:
    ExperienceCognitiveTrace;

  semanticIR:
    SemanticIR;
    
    cognitionLoop?:
    CognitiveEvolutionState;
  nuvo:
    NuvoField;

  revik:
    RevikField;

  moverArc:
    MoverArc;

  moverTopology:
    MoverTopology;

  kaivo:
    KaivoField;

  orion:
    OrionField;

  memoryReveal?:
    MemoryReveal;

  experienceArc?:
    ExperienceArc;

  worldObservations?:
    unknown;

};


export type ExperienceCompileContext = {


  assetId?:string;


  trigger?:string;


  event?:string;


  timestamp?:string;


  presence?:
    ExperiencePresence;


  world?:
    ExperienceWorld;

 metadata?:
{

  understanding?:
    ExperienceUnderstanding;


  meaningContext?:
    ExperienceMeaningContext;


  genome?:
    ExperienceGenome;


  semanticIR?:
    SemanticIR;


  nuvo?:
    NuvoField;


  revik?:
    RevikField;


  moverArc?:
    MoverArc;


  moverTopology?:
    MoverTopology;


  kaivo?:
    KaivoField;


  orion?:
    OrionField;

    worldObservations?:
    unknown;
  
      memoryReveal?:
    unknown;

      experienceArc?:
    unknown;

};

};







/**
 * =====================================================
 *
 * COMPILED EXPERIENCE
 *
 * THE MASTER OUTPUT
 *
 * =====================================================
 */


export type CompiledExperience = {


  id:string;


  /**
   * =====================================================
   *
   * COGNITIVE INTELLIGENCE LAYER
   *
   * Complete reasoning substrate.
   *
   * =====================================================
   */


  intelligence:
    ExperienceCompilerIntelligence;


   genome:
  ExperienceGenome;

  world:
    ExperienceWorld;

    narrative:
    ExperienceNarrative;

  blueprint:
    ExperienceBlueprint;



  direction?:
    Record<string,unknown>;



  intent?:
    ExperienceIntent;



  presence?:
    ExperiencePresence;



  loop?:
    ExperienceLoop;



  flowSteps:
    FlowStep[];



  experienceMoments:
    ExperienceMoment[];



  cinematicScenes:
    CinematicScene[];



  model:
    ExperienceModel;



  geoStory?:
    GeoStory;



  memorySnapshot?:
    MemorySnapshot;



  receipt?:
    ServiceReceipt;



  context?:
    ExperienceCompileContext;



  title:
    string;



  estimatedDuration:
    number;

   cognitionLoop?: CognitiveEvolutionState;

  momentCount:
    number;



  metadata?:
    {

      compilerVersion:string;

      semanticHash?:string;

      generatedAt?:string;

      source?:string;

      tags?:string[];

    };


};