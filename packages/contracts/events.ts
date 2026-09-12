/**
 * =====================================================
 * QRE ENGINE EVENT CONTRACT
 * =====================================================
 *
 * Internal runtime events.
 *
 * Engine
 *    |
 *    v
 * EngineEvent
 *    |
 *    v
 * Analytics pipeline
 *
 * NO DATABASE
 * NO PRISMA
 *
 * =====================================================
 */


export const EngineEventTypes = {


  /**
   * =========================
   * SCAN RUNTIME
   * =========================
   */

  SCAN_START:
    "SCAN_START",


  SESSION_START:
    "SESSION_START",


  SESSION_END:
    "SESSION_END",



  /**
   * =========================
   * FLOW EXECUTION
   * =========================
   */

  FLOW_TRIGGERED:
    "FLOW_TRIGGERED",


  FLOW_START:
    "FLOW_START",


  FLOW_STEP:
    "FLOW_STEP",


  FLOW_COMPLETE:
    "FLOW_COMPLETE",


  FLOW_ABANDON:
    "FLOW_ABANDON",



  /**
   * =========================
   * ACCESS / POLICY
   * =========================
   */

  ACCESS_RESOLVED:
    "ACCESS_RESOLVED",


  FLOW_POLICY_APPLIED:
    "FLOW_POLICY_APPLIED",


  UNLOCK_GRANTED:
    "UNLOCK_GRANTED",



  /**
   * =========================
   * MEMORY / AI ENGINE
   * =========================
   */

  MEMORY_APPLIED:
    "MEMORY_APPLIED",


  MEMORY_CREATED:
    "MEMORY_CREATED",


  MEMORY_UPDATED:
    "MEMORY_UPDATED",


  AI_DECISION:
    "AI_DECISION",


  AI_MEMORY_USED:
    "AI_MEMORY_USED",



  /**
   * =========================
   * GEO / PRESENCE
   * =========================
   */

  GEO_MARK:
    "GEO_MARK",


  CHECK_IN:
    "CHECK_IN",


  CHECK_OUT:
    "CHECK_OUT",


  PRESENCE_JOIN:
    "PRESENCE_JOIN",


  PRESENCE_LEAVE:
    "PRESENCE_LEAVE",



  /**
   * =========================
   * USER ACTIONS
   * =========================
   */

  CTA_CLICK:
    "CTA_CLICK",


  REDIRECT:
    "REDIRECT",


  TEASER_VIEW:
    "TEASER_VIEW",



  /**
   * =========================
   * COMMERCE
   * =========================
   */

  PAYMENT_STARTED:
    "PAYMENT_STARTED",


  PAYMENT_COMPLETED:
    "PAYMENT_COMPLETED",


  CLAIM_STARTED:
    "CLAIM_STARTED",


  CLAIM_COMPLETED:
    "CLAIM_COMPLETED",



  /**
   * =========================
   * CREATOR ECONOMY
   * =========================
   */

  TIP_STARTED:
    "TIP_STARTED",


  TIP_COMPLETED:
    "TIP_COMPLETED",



  /**
   * =========================
   * SYSTEM
   * =========================
   */

  ERROR:
    "ERROR",


} as const;



export type EngineEventType =
  (typeof EngineEventTypes)[keyof typeof EngineEventTypes];