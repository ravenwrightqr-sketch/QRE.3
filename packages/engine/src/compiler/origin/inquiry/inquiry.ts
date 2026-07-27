import type {

    Inquiry

} from "./types.js";



export function createInquiry(

    question:string

):Inquiry {


    return {

        id:

            crypto.randomUUID(),


        question,


        intent:

            "understand deeper relationships",


        domain:

            "unknown",


        status:

            "open",


        importance:

            0.8,


        createdAt:

            Date.now()

    };


}