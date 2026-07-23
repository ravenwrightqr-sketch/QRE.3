import {
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  apiPost,
} from "../lib/api";

import {
  useAuth,
} from "../components/auth/authContext";

import AnimatedBackground from "../components/effects/AnimatedBackground";

import IdeaParticles from "../components/effects/IdeaParticles";



export default function Login(){


  const navigate = useNavigate();


  const {
    setUser,
  } = useAuth();



  const [
    email,
    setEmail,
  ] = useState("");



  const [
    password,
    setPassword,
  ] = useState("");



  const [
    mode,
    setMode,
  ] = useState<
    "login" | "register"
  >("login");



  const [
    loading,
    setLoading,
  ] = useState(false);



  const [
    error,
    setError,
  ] = useState("");





  async function handleSubmit(){


    setError("");



    try{


      setLoading(true);



      const endpoint =
        mode === "login"
        ?
        "/auth/login"
        :
        "/auth/register";



      const response =
        await apiPost(
          endpoint,
          {
            email,
            password,
          }
        );



      if(response?.token){

        localStorage.setItem(
          "token",
          response.token
        );

      }



      if(response?.user){

        setUser(
          response.user
        );

      }



      navigate(
        "/dashboard"
      );



    }
    catch(err:any){


      setError(
        err.message ??
        "Connection failed"
      );


    }
    finally{


      setLoading(false);


    }


  }





  return (

    <div

      style={{

        minHeight:"100vh",

        position:"relative",

        overflow:"hidden",

        background:"#030303",

        color:"#f5f5f5",

        display:"flex",

        alignItems:"center",

        justifyContent:"center",

      }}

    >


      <AnimatedBackground />
      
       <IdeaParticles />





      <main

        style={{

          position:"relative",

          zIndex:2,

          width:"100%",

          maxWidth:760,

          padding:"60px 30px",

          textAlign:"left",
          transform:"translateX(0px)",

        }}

      >


             <div
  style={{
    position: "fixed",
    top: 42,
    left: 42,
    zIndex: 5,
    fontSize: 12,
    letterSpacing: "14px",
    fontWeight: 600,
    color: "rgba(255,255,255,.32)",
    textTransform: "uppercase",
    userSelect: "none",
             }}
           >
             QRE
           </div>


        <h1

style={{

  margin:0,

  fontSize:"clamp(38px,8vw,60px)",

  lineHeight:1.08,

  fontWeight:500,

  letterSpacing:"-1.5px",

  color:"#f5f5f2",

  textShadow:
    "0 30px 100px rgba(255,255,255,.10)",

}}

>

Create

<br/>

something

<br/>

unforgettable.

</h1>


        





        <p

          style={{

            marginTop:35,

            fontSize:17,
           color:"rgba(255,255,255,.45)",
          letterSpacing:"1px",

            lineHeight:1.5,

          }}

        >

          Ideas become living experiences.

        </p>







        <section

          style={{

            marginTop:80,

            display:"flex",

            flexDirection:"column",

            alignItems:"center",

            gap:25,

          }}

        >




          <input

            value={email}

            onChange={
              e =>
              setEmail(
                e.target.value
              )
            }

            placeholder="Email"

            style={{

              width:"100%",

              maxWidth:420,

              padding:"18px 0",

              background:"transparent",

              border:"none",

              borderBottom:
                "1px solid rgba(255,255,255,.25)",

              color:"#fff",

              outline:"none",

              textAlign:"center",

              fontSize:18,

            }}

          />






          <input

            type="password"

            value={password}

            onChange={
              e =>
              setPassword(
                e.target.value
              )
            }

            placeholder="Password"

            style={{

              width:"100%",

              maxWidth:420,

              padding:"18px 0",

              background:"transparent",

              border:"none",

              borderBottom:
                "1px solid rgba(255,255,255,.25)",

              color:"#fff",

              outline:"none",

              textAlign:"center",

              fontSize:18,

            }}

          />







          <button

            disabled={loading}

            onClick={handleSubmit}

            style={{

              marginTop:30,

              padding:
                "18px 70px",

              borderRadius:100,

              border:
                "1px solid rgba(255,255,255,.35)",

              background:
                "#f5f5f5",

              color:"#050505",

              fontWeight:900,

              letterSpacing:3,

              cursor:"pointer",

            }}

          >

            {
              loading
              ?
              "ENTERING"
              :
              mode==="login"
              ?
              "ENTER QRE"
              :
              "CREATE ACCOUNT"
            }

          </button>







          <button

            onClick={()=>{

              setMode(
                current =>
                current==="login"
                ?
                "register"
                :
                "login"
              );

              setError("");

            }}

            style={{

              marginTop:20,

              background:"transparent",

              border:"none",

              color:"#999",

              cursor:"pointer",

            }}

          >

            {
              mode==="login"
              ?
              "New creator?"
              :
              "Already creating?"
            }

          </button>






          {
            error &&
            <p

              style={{

                color:"#aaa",

              }}

            >

              {error}

            </p>
          }



        </section>



      </main>



    </div>

  );


}