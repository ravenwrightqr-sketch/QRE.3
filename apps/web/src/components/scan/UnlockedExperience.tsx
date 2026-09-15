import SequenceScanPlayer from "./SequenceScanPlayer";
import type { ScanResponse } from "@qre/contracts";


type Props = {
  data: ScanResponse;
};


export default function UnlockedExperience({
  data,
}: Props) {


  return (

    <SequenceScanPlayer

      data={data}

    />

  );

}