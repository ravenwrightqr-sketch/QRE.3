/**
 * QRE CREATIVE FRAME CONTRACT
 *
 * A frame is a perspective constraint applied to supplied reality.
 * It changes where cognition looks and how the experience can feel.
 * It is never permission to invent events, participants, places, actions,
 * outcomes, or chronology.
 */
export type CreativeFrameMode = "frame" | "none";

export type CreativeFrameSelection = {
  mode: CreativeFrameMode;
  frame: string;
  confidence: number;
  coreTension: string;
  creativeGain: string;
  templateRisk: string;
  evidenceEventIds: string[];
};
