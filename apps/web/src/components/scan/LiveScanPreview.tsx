import GlassCard from "../ui/GlassCard";
import NeonButton from "../ui/NeonButton";


export default function LiveScanPreview({
  slug
}: {
  slug:string;
}) {


  function launchPlayer(){

    window.open(
      `/scan/${slug}`,
      "_blank"
    );

  }



  return (

    <GlassCard glow>


      <h3>
        LIVE EXPERIENCE CONTROL
      </h3>


      <div
        style={{
          fontSize:12,
          opacity:.6
        }}
      >

        Experience:
        {" "}
        {slug}

      </div>



      <div
        style={{
          marginTop:8,
          fontSize:12,
          opacity:.7
        }}
      >

        Runtime:
        {" "}
        Cinematic Engine

      </div>



      <div
        style={{
          marginTop:8,
          fontSize:12,
          opacity:.7
        }}
      >

        Status:
        {" "}
        Ready

      </div>



      <div
        style={{
          marginTop:16
        }}
      >

        <NeonButton
          onClick={launchPlayer}
        >

          ▶ OPEN EXPERIENCE

        </NeonButton>


      </div>



    </GlassCard>

  );

}