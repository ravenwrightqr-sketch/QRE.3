import type {

    CognitiveState

} from "./types.js";



export function createState(

    input:string

):CognitiveState {



return {


id:

    crypto.randomUUID(),


input,


focus:[],


observations:[],


thoughts:[],


questions:[],


hypotheses:[],


simulations:[],


beliefs:[],


memories:[],


discoveries:[],


goals:[],


history:[

    "origin initialized"

],


confidence:.5,


curiosity:.5,


energy:1,


timestamp:

    Date.now()


};


}