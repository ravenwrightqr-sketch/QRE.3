/**
 * =====================================================
 * QRE EXPERIENCE SCENE CONTRACTS
 * =====================================================
 *
 * Narrative
 *      ↓
 * Scene Writer
 *      ↓
 * Scene Intent
 *
 *
 * CONTRACTS ONLY.
 *
 * NO ENGINE
 * NO DATABASE
 * NO PLAYER
 * NO MEDIA EXECUTION
 *
 * =====================================================
 */


/**
 * =====================================================
 *
 * EXPERIENCE SCENE
 *
 * A authored scene instruction.
 *
 * This is not the final cinematic runtime.
 * It is creative direction.
 *
 * =====================================================
 */
 export type ExperienceScene = {

  id:string;


  title:string;


  order:number;
  purpose:string;
  narration:string;
  /**
   * Visual direction for cinematic generation
   */
  visualIntent:string;
  /**
   * Emotional state movement
   */
  emotionalIntent:string[];

  /**
   * Environmental feeling
   */
  atmosphere:string[];
  /**
   * Why this scene exists
   */
  meaning:string;
  /**
   * What changes inside the experience
   */
  transformation:string;
  /**
   * Connection to memory systems
   */
  memoryAnchor:string;
  /**
   * Future consequence
   */
  futureEcho:string;
  /**
   * Scene sensory intelligence
   */
  sensory:{

    visual:string[];
    audio:string[];
    atmosphere:string;

  };



  duration:number;


  transition:string;



};



/**
 * =====================================================
 *
 * SCENE WRITER RESULT
 *
 * Narrative
 *      ↓
 * Scene Writer
 *
 * =====================================================
 */

export type SceneWriterResult = {

  title:string;

  scenes:ExperienceScene[];

  estimatedDuration:number;

  metadata:{

    generated:boolean;

    source:string;

    version:string;

  };

};