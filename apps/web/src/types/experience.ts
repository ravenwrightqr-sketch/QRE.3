export type BlockType =
  | "message"
  | "location"
  | "redirect"
  | "payment"
  | "reward"
  | "link"
  | "place"
  | "memory"
  | "media"
  | "review"
  | "notification"
  | "certificate";


export type ExperienceMedia = {

  images?: string[];

  videos?: string[];

  audio?: string[];

};



export type ExperienceActions = {

  onStart?: string[];

  onComplete?: string[];

};



export type ExperienceConditions = {

  requires?: string[];

};



export type ExperienceConfig = {

  location?: string;

  url?: string;

  mediaUrl?: string;

  musicId?: string;

  mediaId?: string;

  rewardCode?: string;

  paymentMethod?: string;

  paymentAccount?: string;

};



export type ExperienceBlock = {



  id:string;


  type:BlockType;


  title:string;


  text:string;


  duration:number;

    
  media?:ExperienceMedia;



  actions?:ExperienceActions;

 timer:number;

  conditions?:ExperienceConditions;



  config?:ExperienceConfig;



};



export type ExperienceBlueprint = {


  title:string;


  description?:string;


  blocks:ExperienceBlock[];


};