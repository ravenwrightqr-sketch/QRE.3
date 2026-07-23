import CinematicScanPlayer from "./CinematicScanPlayer";
import type { ScanResponse } from "@qre/contracts";


type Props = {
  data: ScanResponse;
};


export default function UnlockedExperience({
  data,
}: Props) {


  return (

    <CinematicScanPlayer

      data={data}

    />

  );

}