import type {
  ExperienceMoment,
} from "@qre/contracts";


type Props = {

  moment: ExperienceMoment;

};



function getPayloadValue(
  moment: ExperienceMoment,
  key:string
){

  return moment.payload?.[key];

}





export default function MomentRenderer({

  moment,

}: Props){



  const payload =
    moment.payload ?? {};



  const title =
    moment.title ?? "";



  const description =
    moment.description ??
    String(payload.text ?? "");





  const mediaUrl =
    typeof payload.mediaUrl === "string"
      ? payload.mediaUrl
      : null;




  const audioUrl =
    typeof payload.audioUrl === "string"
      ? payload.audioUrl
      : null;






  switch(moment.component){



    // =========================
    // CINEMATIC STORY
    // =========================

    case "hero":

    case "story":

    case "memory":

    case "timeline":

    case "legacy":

      return (

        <section

          style={{

            minHeight:"70vh",

            display:"grid",

            placeItems:"center",

            textAlign:"center",

            padding:40,

          }}

        >

          <div>


            <h1

              style={{

                fontSize:
                "clamp(40px,8vw,100px)",

                fontWeight:900,

                lineHeight:1,

              }}

            >

              {title}

            </h1>



            {
              description &&

              <p

                style={{

                  marginTop:30,

                  fontSize:22,

                  opacity:.75,

                  maxWidth:800,

                }}

              >

                {description}

              </p>

            }



          </div>


        </section>

      );





    // =========================
    // MEDIA EXPERIENCE
    // =========================

    case "video":

      return (

        <video

          src={mediaUrl ?? undefined}

          controls

          autoPlay

          style={{

            width:"100%",

            borderRadius:30,

          }}

        />

      );






    case "gallery":

    case "media":

      return (

        <div

          style={{

            display:"grid",

            gap:20,

          }}

        >


          {
            mediaUrl &&

            <img

              src={mediaUrl}

              alt={title}

              style={{

                width:"100%",

                borderRadius:30,

              }}

            />

          }


        </div>

      );






    // =========================
    // AUDIO EXPERIENCE
    // =========================

    case "soundtrack":

      return (

        <audio

          src={audioUrl ?? undefined}

          controls

          autoPlay

          style={{

            width:"100%",

          }}

        />

      );






    // =========================
    // GEO MEMORY
    // =========================

    case "geo_memory":

    case "map":

    case "location":


      return (

        <section

          style={{

            textAlign:"center",

            padding:40,

          }}

        >

          <h2>

            📍 {title}

          </h2>


          {
            description &&

            <p>

              {description}

            </p>

          }


        </section>

      );








    // =========================
    // BUSINESS / ACTION
    // =========================

    case "cta":

    case "payment":

    case "reward":


      const actionUrl =
        getPayloadValue(
          moment,
          "url"
        );


      return (

        <button

          onClick={()=>{


            if(
              typeof actionUrl === "string"
            ){

              window.location.href =
                actionUrl;

            }


          }}


          style={{

            padding:"18px 45px",

            borderRadius:999,

            background:
            "rgba(0,255,180,.15)",

            border:
            "1px solid rgba(0,255,180,.5)",

            color:"#fff",

            fontSize:18,

          }}

        >

          {title || "Continue"}

        </button>

      );






    // =========================
    // PROFILE / SOCIAL
    // =========================

    case "profile":

    case "social":


      return (

        <section

          style={{

            textAlign:"center",

            padding:40,

          }}

        >

          <h2>

            {title}

          </h2>


          <p>

            {description}

          </p>


        </section>

      );






    default:


      return (

        <section

          style={{

            padding:40,

            textAlign:"center",

            opacity:.5,

          }}

        >

          {title}

        </section>

      );


  }

}