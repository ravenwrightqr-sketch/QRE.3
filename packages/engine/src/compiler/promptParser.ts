/**
 * =========================
 * EXPERIENCE PROMPT PARSER
 * =========================
 *
 * Converts human experience requests into
 * structured compiler instructions.
 *
 * This layer does NOT create database records.
 * It only understands intent.
 *
 * Prompt
 *   ↓
 * Industry Detection
 *   ↓
 * Template Registry
 *   ↓
 * Blueprint Composer
 *
 * =========================
 */


import type {
  ExperienceIndustry,
} from "@qre/contracts";



export type ExperienceIntent = {

  title: string;

  industry:
    ExperienceIndustry;

  moments:
    ExperienceInstruction[];

};



export type ExperienceInstruction =

  | {
      type: "message";
      text: string;
    }

  | {
      type: "timer";
      duration: number;
    }

  | {
      type: "redirect";
      url: string;
      text?: string;
    }

  | {
      type: "payment";
      provider?: string;
      amount?: number;
      text?: string;
    }

  | {
      type: "location";
      label: string;
    };





function detectIndustry(
  prompt: string
): ExperienceIndustry {


  const value =
    prompt.toLowerCase();




  /*
   * =========================
   * MEMORY / LIFE
   * =========================
   */


  if (

    value.includes("memory") ||
    value.includes("time capsule") ||
    value.includes("memorial") ||
    value.includes("legacy")

  ) {

    return "memory";

  }



  if (

    value.includes("relationship") ||
    value.includes("anniversary") ||
    value.includes("love story") ||
    value.includes("couple")

  ) {

    return "relationship";

  }





  if (

    value.includes("dog") ||
    value.includes("cat") ||
    value.includes("pet") ||
    value.includes("rescue")

  ) {

    return "pet";

  }






  /*
   * =========================
   * CANNABIS / SESH
   * =========================
   */


  if (

    value.includes("cannabis") ||
    value.includes("weed") ||
    value.includes("dispensary") ||
    value.includes("420") ||
    value.includes("strain") ||
    value.includes("flower") ||
    value.includes("edible") ||
    value.includes("sesh")

  ) {

    return "cannabis";

  }






  /*
   * =========================
   * CREATOR / ARTIST
   * =========================
   */


  if(

    value.includes("artist") ||
    value.includes("creator") ||
    value.includes("gallery") ||
    value.includes("artwork") ||
    value.includes("painting") ||
    value.includes("portfolio") ||
    value.includes("album") ||
    value.includes("music release") ||
    value.includes("producer") ||
    value.includes("dj")

  ){

    return "artist";

  }



  /*
   * =========================
   * TRAVEL / HOSPITALITY
   * =========================
   */


  if (

    value.includes("airbnb") ||
    value.includes("vacation rental")

  ) {

    return "airbnb";

  }



  if (

    value.includes("hotel") ||
    value.includes("guest") ||
    value.includes("room") ||
    value.includes("stay")

  ) {

    return "hospitality";

  }






  /*
   * =========================
   * RESTAURANT
   * =========================
   */


  if (

    value.includes("restaurant") ||
    value.includes("menu") ||
    value.includes("chef") ||
    value.includes("food") ||
    value.includes("bar") ||
    value.includes("drink")

  ) {

    return "restaurant";

  }






  /*
   * =========================
   * REAL ESTATE
   * =========================
   */


  if (

    value.includes("real estate") ||
    value.includes("property") ||
    value.includes("listing") ||
    value.includes("house")

  ) {

    return "real_estate";

  }






  /*
   * =========================
   * EVENTS
   * =========================
   */


  if (

    value.includes("wedding")

  ) {

    return "wedding";

  }


  if(

    value.includes("concert") ||
    value.includes("live show") ||
    value.includes("tour") ||
    value.includes("performance") ||
    value.includes("gig")

  ){

    return "concert";

  }



  if(

    value.includes("festival") ||
    value.includes("party") ||
    value.includes("event") ||
    value.includes("rave") ||
    value.includes("show")
    || value.includes("convention")
  ){

    return "event";

  }



  /*
   * =========================
   * SERVICES
   * =========================
   */


  if (

    value.includes("appointment") ||
    value.includes("booking") ||
    value.includes("service") ||
    value.includes("instruction")

  ) {

    return "service";

  }






  /*
   * =========================
   * BUSINESS
   * =========================
   */


  if (

    value.includes("business") ||
    value.includes("store") ||
    value.includes("shop") ||
    value.includes("customer") ||
    value.includes("loyalty") ||
    value.includes("reward")

  ) {

    return "business";

  }





  return "generic";

}






function extractTitle(
  prompt: string
) {


  const cleaned =
    prompt
      .replace(/\n/g, " ")
      .trim();



  if (
    cleaned.length <= 60
  ) {

    return cleaned;

  }



  return (
    cleaned.slice(0,60)
    + "..."
  );

}






function extractDelay(
  text:string
) {


  const match =
    text.match(
      /(\d+)\s*(second|seconds|sec)/i
    );


  if (!match) {

    return null;

  }



  return Number(match[1]) * 1000;

}






function detectPayment(
  text:string
) {


  const value =
    text.toLowerCase();



  if (

    !value.includes("pay") &&
    !value.includes("tip") &&
    !value.includes("donate")

  ) {

    return null;

  }



  return {

    provider:

      value.includes("paypal")
        ? "paypal"
        : value.includes("cashapp")
          ? "cashapp"
          : undefined,

    amount:5,

    text,

  };

}






function detectRedirect(
 text:string
) {


 const value =
   text.toLowerCase();



 if (

  value.includes("link") ||
  value.includes("redirect") ||
  value.includes("website")

 ) {


  return {

    url:"",

    text,

  };


 }


 return null;

}







export function parseExperiencePrompt(
 prompt:string
):ExperienceIntent {


 const moments:
   ExperienceInstruction[] = [];



 const lines =
   prompt
    .split(/[.\n]/)
    .map(x=>x.trim())
    .filter(Boolean);




 for(const line of lines) {


   const delay =
     extractDelay(line);



   if(delay) {


    moments.push({

      type:"timer",

      duration:delay,

    });


    continue;

   }




   const payment =
     detectPayment(line);



   if(payment) {


    moments.push({

      type:"payment",

      provider:
        payment.provider,

      amount:
        payment.amount,

      text:
        payment.text,

    });


    continue;

   }





   const redirect =
     detectRedirect(line);



   if(redirect) {


    moments.push({

      type:"redirect",

      url:
        redirect.url,

      text:
        redirect.text,

    });


    continue;

   }





   if(
     line.toLowerCase()
     .includes("wifi")
   ) {


    moments.push({

      type:"message",

      text:
        "WiFi instructions will appear here.",

    });


    continue;

   }




   if(

    line.toLowerCase()
    .includes("local")

   ) {


    moments.push({

      type:"location",

      label:
        "Local recommendations",

    });


    continue;

   }





   moments.push({

    type:"message",

    text:line,

   });


 }



 if(moments.length===0) {


  moments.push({

    type:"message",

    text:prompt,

  });


 }





 return {


  title:
    extractTitle(prompt),



  industry:
    detectIndustry(prompt),



  moments,


 };


}