export type AccessState =
  | "DEMO"
  | "UNLOCKED";


export type TeaserBlock = {
  type: "text" | "action";
  text: string;
  url?: string;
};


export type ScanRuntimeResponse = {
  access: AccessState;

  sessionId: string;


  asset: {

    id: string;

    slug: string;

    status: string;

    priceCents: number;

    flowId: string | null;

    ownerId: string | null;

    paid: boolean;

  };


  teaser: TeaserBlock[];


  state:
    | "initial"
    | "scanning"
    | "completed";


  /**
   * True when runtime is showing
   * a non-owned demo experience.
   */
  preview: boolean;


  /**
   * Next runtime decision.
   *
   * DEMO:
   * CHECKOUT or STORE
   *
   * UNLOCKED:
   * RUN_FLOW
   */
  nextAction?:
    | "CHECKOUT"
    | "RUN_FLOW";


  actionUrl?: string | null;


  timestamp: string;
};