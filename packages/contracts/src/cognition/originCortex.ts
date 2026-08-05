import type {
    OriginCognitiveState
} from "./OriginState.js"


export interface Cortex {

    tick(

        state:OriginCognitiveState

    ):OriginCognitiveState;

}