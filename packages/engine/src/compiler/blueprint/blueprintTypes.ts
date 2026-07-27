/**
 * =====================================================
 * QRE EXPERIENCE BLUEPRINT
 * =====================================================
 *
 * Creation Architecture
 *        ↓
 * Experience Blueprint
 *
 * Converts meaning structure
 * into experiential structure.
 *
 * NO DATABASE
 * NO RUNTIME
 * NO INDUSTRY LOGIC
 *
 * =====================================================
 */


export interface ExperienceBlueprint {


  title:string;


  intention:string;


  moments:

    ExperienceBlueprintMoment[];


}



export interface ExperienceBlueprintMoment {


  id:string;


  phase:string;


  purpose:string;


  emotionalState:

    string[];


  humanAction:

    string;


  meaningAnchor:

    string;


}