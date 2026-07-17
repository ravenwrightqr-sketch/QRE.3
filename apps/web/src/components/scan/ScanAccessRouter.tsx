import type { ScanResponse } from "@qre/contracts";

import DemoExperience from "./DemoExperience";
import UnlockedExperience from "./UnlockedExperience";


type Props = {
  data: ScanResponse;
};


export default function ScanAccessRouter({
  data,
}: Props) {


  if(
    data.access === "UNLOCKED"
  ){

    return (

      <UnlockedExperience
        data={data}
      />

    );

  }



  return (

    <DemoExperience
      data={data}
    />

  );

}