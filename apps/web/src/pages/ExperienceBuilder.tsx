import {
  useEffect,
  useState,
} from "react";


type Draft = {
  title?: string;
  blueprint?: unknown;
  flowSteps?: unknown[];
  moments?: unknown[];
  cinematicScenes?: unknown[];
  prompt?: string;
};


export default function ExperienceBuilder(){

  const [draft,setDraft] =
    useState<Draft | null>(null);


  useEffect(()=>{

    const stored =
      sessionStorage.getItem(
        "experienceDraft"
      );


    if(stored){

      setDraft(
        JSON.parse(stored)
      );

    }

  },[]);



  if(!draft){

    return (
      <div>
        No experience draft found.
      </div>
    );

  }



  return (

    <div>

      <h1>
        Experience Builder
      </h1>


      <h2>
        {draft.title ?? "Untitled Experience"}
      </h2>


      <p>
        Moments:
        {" "}
        {draft.moments?.length ?? 0}
      </p>


      <pre>
        {JSON.stringify(
          draft.blueprint,
          null,
          2
        )}
      </pre>


    </div>

  );

}