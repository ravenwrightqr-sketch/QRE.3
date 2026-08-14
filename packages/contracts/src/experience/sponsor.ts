export type SponsorPlacement =
  | "quiet_badge"
  | "end_card"
  | "useful_cta"
  | "contextual_credit"
  | "event_host"
  | "listing_agent";

export type SponsorFrequency = "once" | "end_only" | "contextual";

export type SponsorPolicy = {
  enabled: boolean;
  name?: string;
  role?: string;
  brandMarkUrl?: string;
  profileUrl?: string;
  placements: SponsorPlacement[];
  frequency: SponsorFrequency;
  maxExposures: number;
  respectUserFreedom: true;
  noForcedCapture: true;
  noInterruptiveAds: true;
  disclosure: "sponsored_by" | "created_by" | "hosted_by";
  usefulCta?: {
    label: string;
    url: string;
  };
};

export type SponsorSignal = {
  impression: boolean;
  interaction: boolean;
  dismissed: boolean;
  ctaClicked: boolean;
  returnVisit: boolean;
};
