import {

    runOrigin

} from "../index.js";



const result = runOrigin({

    narrative:
        "memory, DNA, and culture preserve information",

    patterns:[

        "information transfer",

        "human meaning"

    ]

});



console.log(`
==============================
ORIGIN INQUIRY FLOW
==============================
`);



console.dir(

    result.inquiry,

    {
        depth:10
    }

);



if(

    !result.inquiry

){

    throw new Error(

        "Origin failed to create inquiry"

    );

}



if(

    result.inquiry.status !== "open"

){

    throw new Error(

        "Inquiry should start open"

    );

}



if(

    !result.inquiry.question.includes(
        "deeper relationship"
    )

){

    throw new Error(

        "Inquiry question missing"

    );

}



console.log(`
==============================
ORIGIN INQUIRY FLOW TEST PASSED
==============================
`);