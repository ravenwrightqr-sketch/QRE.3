import type {

    CognitiveState

} from "../state/index.js";


export interface Cortex {

    tick(

        state:CognitiveState

    ):CognitiveState;

}