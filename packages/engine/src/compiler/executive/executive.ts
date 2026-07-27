import type {

    ExecutiveInput,
    ExecutiveDecision

} from "./types.js";



export function decide(

    state:ExecutiveInput

):ExecutiveDecision {



    if(

        state.surprise > .8

    ){

        return{

            action:"investigate",

            reason:"Unexpected information detected.",

            priority:.95

        };

    }



    if(

        state.confidence < .4

    ){

        return{

            action:"simulate",

            reason:"Confidence too low.",

            priority:.90

        };

    }



    if(

        state.curiosity > .8

    ){

        return{

            action:"explore",

            reason:"Novel information deserves exploration.",

            priority:.85

        };

    }



    if(

        state.continuity < .4

    ){

        return{

            action:"strengthen_memory",

            reason:"Maintain continuity.",

            priority:.75

        };

    }



    return{

        action:"continue",

        reason:"Current reasoning remains stable.",

        priority:.60

    };

}