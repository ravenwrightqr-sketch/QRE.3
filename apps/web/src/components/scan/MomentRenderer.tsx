import type { Moment } from "@qre/contracts";

type MomentProps = {
  moment: Moment;
};

export default function MomentRenderer({
  moment,
}: MomentProps) {

  const meta =
    (moment as any)?.meta ?? {};

  const text =
    (moment as any)?.text ??
    meta.text ??
    "";

  const url =
    (moment as any)?.url ??
    meta.url ??
    null;


  switch(moment.type) {


    /**
     * SYSTEM / ENGINE EVENTS
     */
    case "system":

      return (
        <div
          style={{
            padding:0,
            borderRadius:0,
            background:"transparent",
            border:"none",
            textAlign:"center",
            fontSize:"clamp(14px, 2.2vw, 20px)",
            opacity:.82,
            width:"100%",
            maxWidth:740,
            letterSpacing:"0.02em",
          }}
        >

          {text || "Experience Event"}

        </div>
      );



    /**
     * STORY MESSAGES
     */
    case "message":

      return (
        <div
          style={{
            width:"100%",
            maxWidth:940,
            minHeight:"62vh",
            padding:"28px 20px",
            borderRadius:0,
            background:"transparent",
            border:"none",
            fontSize:"clamp(32px, 7vw, 78px)",
            lineHeight:1.12,
            display:"grid",
            placeItems:"center",
            textAlign:"center",
            textShadow:
              "0 6px 36px rgba(0,0,0,.45)",
          }}
        >

          {text}

        </div>
      );



    /**
     * BUTTONS / REDIRECTS / PAYMENTS
     */
    case "action":

      return (
        <button

          onClick={()=>{
            if(url){
              window.location.href=url;
            }
          }}

          style={{
            width:"100%",
            padding:"16px 22px",
            borderRadius:18,
            border:
              "1px solid rgba(0,255,180,.4)",
            background:
              "rgba(0,255,180,.12)",
            color:"white",
            fontSize:16,
            cursor:"pointer",
            backdropFilter:"blur(10px)",
          }}

        >

          {meta.text ||
           text ||
           "Continue →"}

        </button>
      );



    /**
     * MEDIA EXPERIENCE
     */
    case "media":

      return (

        url ?

        <img

          src={url}

          alt={
            meta.text ??
            "experience media"
          }

          style={{
            width:"100%",
            borderRadius:20,
          }}

        />

        :

        <div>
          Media unavailable
        </div>

      );



    /**
     * GEO MEMORY
     */
    case "location":

      return (

        <div

          style={{
            padding:0,
            borderRadius:0,
            background:"transparent",
            width:"100%",
            maxWidth:940,
            textAlign:"center",
          }}

        >

          <h3 style={{ marginBottom: 8 }}>
            📍 {meta.label ?? "Location"}
          </h3>


          {
            meta.city &&
            <div>
              {meta.city}
              {meta.region &&
                `, ${meta.region}`
              }
            </div>
          }


        </div>

      );



    default:

      return (

        <div
          style={{
            opacity:.5,
            fontSize:12
          }}
        >

          Unknown experience event

        </div>

      );

  }

}