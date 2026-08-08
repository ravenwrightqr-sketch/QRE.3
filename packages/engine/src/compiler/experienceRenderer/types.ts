export interface ExperienceOutput {

 title:string;

 opening:string;

 moments:ExperienceMomentOutput[];

 closing:string;

 shareMessage:string;

}


export interface ExperienceMomentOutput {

 order:number;

 title:string;

 description:string;

 status:string;

}