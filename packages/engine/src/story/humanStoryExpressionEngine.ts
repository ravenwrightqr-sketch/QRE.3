import type {
  HumanStoryContext
} from "./humanStoryArchetypeResolver.js";

import type {
  HumanStoryArc
} from "./humanStoryArcResolver.js";

import type {
  HumanStory
} from "@qre/contracts";


interface ExpressionContext {

  entity:string;

  stage:string;

  emotion:string;

  archetype:string;

}


export function createHumanExpressions(

  context:HumanStoryContext,

  arc:HumanStoryArc

):HumanStory[] {


  return arc.stages.map(

    (stage,index)=>

      createExpression({

        entity:
          context.entity,

        stage,

        emotion:
          arc.emotionalMovement[index]
          ??
          "meaning",

        archetype:
          context.archetype

      })

  );

}



function createExpression(

  context:ExpressionContext

):HumanStory {


  const text =
    resolveHumanSentence(
      context
    );


  return {

    text,

    emotion:[
      context.emotion
    ]

  };

}




function resolveHumanSentence(

  context:ExpressionContext

):string {


switch(context.archetype){


case "companion_journey":

return companionStory(
  context.entity,
  context.stage
);



case "place_story":

return placeStory(
  context.entity,
  context.stage
);



case "artifact_story":

return artifactStory(
  context.entity,
  context.stage
);



case "brand_story":

return brandStory(
  context.entity,
  context.stage
);



case "human_journey":

return humanStory(
  context.entity,
  context.stage
);



default:

return discoveryStory(
  context.entity,
  context.stage
);


}


}




function companionStory(
entity:string,
stage:string
):string {


const moments:Record<string,string> = {


arrival:
`${entity} entered a moment that would reveal the bond already forming around them.`,


care:
`${entity} became part of a story shaped by attention, presence, and understanding.`,


bond:
`${entity}'s connection grew through the small moments that are often remembered most.`,


return:
`${entity} carried forward a feeling that lasted beyond the experience itself.`


};


return moments[stage]
??
`${entity} discovered a moment that became meaningful.`;


}





function placeStory(
entity:string,
stage:string
):string {


const moments:Record<string,string>={


arrival:
`${entity} became the beginning of a memory waiting to unfold.`,


discovery:
`${entity} revealed stories hidden inside ordinary surroundings.`,


belonging:
`${entity} became connected to the people and moments that shaped it.`,


legacy:
`${entity} remained because meaningful experiences leave traces behind.`


};


return moments[stage]
??
`${entity} became part of a larger human story.`;

}





function artifactStory(
entity:string,
stage:string
):string {


const moments:Record<string,string>={


creation:
`${entity} began as something created with intention.`,


meaning:
`${entity} gained significance through the people and moments connected to it.`,


ownership:
`${entity} became more than an object; it became part of someone's history.`,


preservation:
`${entity} carried a story forward through time.`


};


return moments[stage]
??
`${entity} carried meaning beyond itself.`;

}





function brandStory(
entity:string,
stage:string
):string {


const moments:Record<string,string>={


discovery:
`${entity} began with a reason for people to notice and connect.`,


interaction:
`${entity} created a moment where people felt recognized.`,


relationship:
`${entity} became associated with shared experiences and trust.`,


return:
`${entity} remained part of the stories people chose to remember.`


};


return moments[stage]
??
`${entity} created a meaningful human connection.`;

}





function humanStory(
entity:string,
stage:string
):string {


const moments:Record<string,string>={


beginning:
`${entity} entered a chapter that would shape what came next.`,


challenge:
`${entity} moved through uncertainty toward understanding.`,


growth:
`${entity} discovered change through experience.`,


reflection:
`${entity} carried the meaning of the journey forward.`


};


return moments[stage]
??
`${entity} experienced a meaningful transformation.`;

}





function discoveryStory(
entity:string,
stage:string
):string {


return (

`${entity} moved through ${stage}, revealing a deeper possibility within the moment.`

);


}