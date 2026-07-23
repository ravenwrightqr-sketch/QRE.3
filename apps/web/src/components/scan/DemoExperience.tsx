import CinematicScanPlayer from "./CinematicScanPlayer";
import type { ScanResponse } from "@qre/contracts";

type Props = {
  data: ScanResponse;
};


export default function DemoExperience({
  data,
}: Props) {

  return (
    <div
      style={{
        position:"relative",
        height:"100vh",
        width:"100%",
        background:"#050505",
      }}
    >

    <CinematicScanPlayer
    data={data}
    />
    
    
      <div
        style={{
          position:"absolute",
          bottom:40,
          left:"50%",
          transform:"translateX(-50%)",
          zIndex:10,
        }}
      >

        <button
          style={{
            padding:"14px 28px",
            borderRadius:30,
            border:"none",
            cursor:"pointer",
            fontSize:16,
          }}
          onClick={()=>{
            window.location.href =
              `/store/${data.asset?.slug}`;
          }}
        >
          Create Your Experience
        </button>

      </div>

    </div>
  );
}