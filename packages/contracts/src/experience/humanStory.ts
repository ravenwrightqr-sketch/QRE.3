export interface HumanStory {



  text:string;

  emotion:string[];

}


export interface HumanExperienceStory {

  title:string;

  opening:string;

  moments:HumanStory[];


}