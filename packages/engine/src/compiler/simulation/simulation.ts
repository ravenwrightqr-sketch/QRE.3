import type {
    Simulation
} from "./types.js";


export function simulate(
    idea: string
): Simulation {


    const scenarios = [

        `${idea} continues to evolve.`,

        `${idea} transforms into a new pattern.`,

        `${idea} connects with another domain.`

    ];


    const predictions = scenarios.map(

        scenario =>
            `Possible future: ${scenario}`

    );


    return {

        input: idea,

        scenarios,

        predictions,

        confidence: 0.6

    };

}