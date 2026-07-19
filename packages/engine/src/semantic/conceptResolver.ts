import type {
  ExperienceMomentType
} from "@qre/contracts";


export function resolveSemanticConcepts(
  concepts:string[]
):ExperienceMomentType[] {


const moments =
new Set<ExperienceMomentType>();


for(const concept of concepts){


switch(true){


case /memory|nostalgia|legacy|archive/.test(concept):

moments.add("memory");
break;


case /story|identity|life/.test(concept):

moments.add("story");
break;


case /cinematic|film|visual|movie/.test(concept):

moments.add("video");
break;


case /music|sound|audio|energy/.test(concept):

moments.add("soundtrack");
break;


case /hidden|secret|underground|mystery|rare/.test(concept):

moments.add("reveal");
break;


case /community|people|connection|social/.test(concept):

moments.add("share");
break;


case /premium|luxury|exclusive/.test(concept):

moments.add("reward");
break;


case /interactive|game|quest|challenge/.test(concept):

moments.add("interaction");
break;


default:

moments.add("introduction");

break;


}

}


return [...moments];

}