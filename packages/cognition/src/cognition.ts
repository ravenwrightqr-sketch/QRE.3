
import {
  understandExperience,
} from "./understanding/index.js";

import {
  buildMeaningContext,
} from "./meaningEngines/meaningContextEngine.js";

import type {
  ExperienceMeaningContext,
  ExperienceUnderstanding,
} from "@qre/contracts";


export interface CognitionResult {
  understanding: ExperienceUnderstanding;
  meaningContext: ExperienceMeaningContext;
}


export function understand(
  prompt: string
): CognitionResult {

  const understanding =
    understandExperience(prompt);


  const meaningContext =
    buildMeaningContext(
      understanding
    );


  return {
    understanding,
    meaningContext,
  };

}