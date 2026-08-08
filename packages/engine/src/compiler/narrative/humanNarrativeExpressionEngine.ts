/**
 * =====================================================
 * QRE HUMAN NARRATIVE EXPRESSION ENGINE
 * =====================================================
 *
 * Converts:
 *
 * Narrative Cognition
 *        ↓
 * Emotional Meaning
 *        ↓
 * Human Expression
 *
 * This is the voice layer.
 *
 * It does NOT decide the story.
 * It does NOT create fake templates.
 *
 * It interprets the meaning already discovered
 * by the narrative intelligence system.
 *
 * =====================================================
 */

import type {
  ExperienceGenome,
  ExperienceWorld
} from "@qre/contracts";


export interface HumanNarrativeExpression {

  expression:string;

  emotionalTone:string;

  dramaticShift:string;

  memoryImpact:string;

}



interface ExpressionContext {

  title:string;

  state:string;

  emotion:string;

  meaning:string;

}



function detectSubject(
  genome:ExperienceGenome
):string {

return (

  genome.entities.creatures?.[0]

  ??

  genome.entities.people?.[0]

  ??

  genome.entities.objects?.[0]

  ??

  "Someone"

);

}



function createOpening(
context:ExpressionContext,
world:ExperienceWorld
):string {


return (

`${context.title} entered a moment that seemed ordinary at first, ` +

`but something deeper was beginning beneath the surface. ` +

`${world.worldIdentity.promise}.`

);

}



function createConflict(
context:ExpressionContext
):string {


return (

`What began as ${context.state} carried an unexpected possibility: ` +

`a chance for ${context.meaning}.`

);

}



function createTransformation(
context:ExpressionContext
):string {


return (

`${context.title} discovered that the moment was never only about what happened. ` +

`It was about the connection, trust, and memory created along the way.`

);

}



function createMemoryImpact(
context:ExpressionContext
):string {


return (

`The experience became something worth remembering because it changed the meaning of the moment.`

);

}



export function createHumanNarrativeExpression(

state:string,

emotion:string,

meaning:string,

genome:ExperienceGenome,

world:ExperienceWorld

):HumanNarrativeExpression {


const subject =
detectSubject(
 genome
);


const context:ExpressionContext = {

title:
subject,

state,

emotion,

meaning

};



return {


expression:

[
createOpening(
 context,
 world
),

createConflict(
 context
),

createTransformation(
 context
)

].join(" "),



emotionalTone:

emotion,



dramaticShift:

`${state} transformed into ${meaning}`,



memoryImpact:

createMemoryImpact(
 context
)

};


}