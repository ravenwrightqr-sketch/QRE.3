import type {
  CinematicScene,
} from "@qre/contracts";



type Props = {
  scene: CinematicScene;
};





function resolveSceneText(
  scene: CinematicScene
): string {


  const payload =
    scene.moment?.payload;



  if(
    payload &&
    typeof payload.text === "string"
  ){

    return payload.text;

  }



  if(
    scene.moment.description
  ){

    return scene.moment.description;

  }



  if(
    payload?.data
  ){

    return JSON.stringify(
      payload.data,
      null,
      2
    );

  }



  return "";

}





function resolveBackground(
  scene:CinematicScene
){

  return (

    scene.visual?.background ??

    "#030305"

  );

}







export default function SceneRenderer({
  scene,
}:Props){



  const text =
    resolveSceneText(scene);



  const media =
    scene.moment?.payload?.media ?? [];





  return (

    <section

      style={{

        minHeight:"100vh",

        display:"grid",

        placeItems:"center",

        textAlign:"center",

        padding:40,

        background:
          resolveBackground(scene),

        color:"#fff",

      }}

    >



      <div

        style={{

          maxWidth:1000,

          width:"100%"

        }}

      >



        {
          media.map(item=>(


            item.type === "video"

            ?

            <video

              key={item.id}

              src={item.url}

              autoPlay

              muted

              playsInline

              style={{

                width:"100%",

                borderRadius:30,

                marginBottom:30

              }}

            />


            :


            <img

              key={item.id}

              src={item.url}

              alt={item.title ?? ""}

              style={{

                width:"100%",

                borderRadius:30,

                marginBottom:30

              }}

            />


          ))
        }





        <h1

          style={{

            fontSize:
              "clamp(40px,8vw,100px)",

            fontWeight:900,

          }}

        >

          {
            scene.moment.title
          }


        </h1>





        {
          text &&

          <p

            style={{

              fontSize:26,

              maxWidth:900,

              margin:"30px auto",

              opacity:.85

            }}

          >

            {text}

          </p>

        }





        {
          scene.type === "cta" &&


          <button

            style={{

              padding:
                "18px 45px",

              borderRadius:999,

              color:"#fff",

              background:
                "rgba(0,255,180,.2)",

              border:
                "1px solid rgba(0,255,180,.5)",

              cursor:"pointer"

            }}

          >

            {
              scene.moment.title ||
              "Continue"
            }


          </button>

        }


      </div>



    </section>

  );


}