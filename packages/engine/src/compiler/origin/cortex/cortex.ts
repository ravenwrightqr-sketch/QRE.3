import type {

    CognitiveState

} from "../state/index.js";

import {

    createInquiry

} from "../inquiry/index.js";

export function tick(

state:CognitiveState

):CognitiveState {



state.history.push(

    "cortex tick executed"

);



state.observations.push(

    `Observed: ${state.input}`

);


state.questions.push(

    createInquiry(

        `What deeper structure exists inside ${state.input}?`

    )

);



state.curiosity += .1;



state.confidence += .05;



return state;


}