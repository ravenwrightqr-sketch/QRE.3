import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiPost } from "../../lib/api";

export default function CreateAsset() {
  const navigate = useNavigate();

  const [businessName, setBusinessName] = useState("");
  const [slug, setSlug] = useState("");

  const [prompt, setPrompt] = useState("");

  const [priceCents, setPriceCents] = useState(999);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const makeSlug = (value: string) =>
    value
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");


  async function create() {

    setError("");


    if (!businessName.trim()) {
      setError("Business name required");
      return;
    }


    if (!prompt.trim()) {
      setError("Experience prompt required");
      return;
    }


    try {

      setLoading(true);


      const finalSlug =
        slug.trim()
          ? makeSlug(slug)
          : makeSlug(businessName);



      const result =
        await apiPost(
          "/admin/assets/create-experience",
          {

            slug: finalSlug,

            priceCents,

            prompt,

          }
        );


      console.log(
        "CREATED EXPERIENCE:",
        result
      );


      navigate("/admin");


    } catch(err:any){

      console.error(err);


      setError(
        err.message ||
        "Failed creating experience"
      );


    } finally {

      setLoading(false);

    }

  }



  return (

    <div
      style={{
        maxWidth:650,
        margin:"0 auto",
        padding:30,
      }}
    >

      <h1>
        ⚡ Create QRE Experience
      </h1>


      <p style={{opacity:.7}}>
        Create a QR asset and generate the customer experience instantly.
      </p>



      <div style={{marginTop:30}}>


        <label>
          Business Name
        </label>


        <input

          placeholder="Bella Airbnb"

          value={businessName}

          onChange={(e)=>
            setBusinessName(e.target.value)
          }


          style={{
            width:"100%",
            padding:12,
            marginTop:6,
            marginBottom:20,
          }}

        />




        <label>
          Custom Slug (optional)
        </label>


        <input

          placeholder="bella-airbnb"

          value={slug}

          onChange={(e)=>
            setSlug(e.target.value)
          }


          style={{
            width:"100%",
            padding:12,
            marginTop:6,
            marginBottom:20,
          }}

        />





        <label>
          Experience Prompt
        </label>


        <textarea

          placeholder="Create a luxury Airbnb welcome experience with WiFi instructions, local recommendations, and checkout reminders."

          value={prompt}

          onChange={(e)=>
            setPrompt(e.target.value)
          }


          rows={6}


          style={{
            width:"100%",
            padding:12,
            marginTop:6,
            marginBottom:20,
          }}

        />






        <label>
          Unlock Price (cents)
        </label>


        <input

          type="number"

          value={priceCents}

          onChange={(e)=>
            setPriceCents(
              Number(e.target.value)
            )
          }


          style={{
            width:"100%",
            padding:12,
            marginTop:6,
            marginBottom:20,
          }}

        />





        {error && (

          <div
            style={{
              color:"red",
              marginBottom:20,
            }}
          >
            {error}
          </div>

        )}





        <button

          onClick={create}

          disabled={loading}


          style={{
            width:"100%",
            padding:14,
            fontSize:16,
          }}

        >

          {loading
            ? "Creating Experience..."
            : "⚡ Create QR Experience"}

        </button>



      </div>


    </div>

  );

}