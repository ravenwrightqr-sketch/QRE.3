import type { MediaAsset } from "../media/media.js";

/**
 * Direct delivery target for a QRE creation.
 * Scan/NFC access is independent of direct delivery, so a receiver is optional.
 */
export type CreationReceiver = {
  email?: string;
  phone?: string;
};

/**
 * Universal QRE creation intake.
 *
 * Text is always required.
 * User-supplied media is optional and additive; it never replaces Author text.
 * A receiver is optional because the same creation may also be opened by
 * scanning/tapping its connected QRE asset.
 */
export type CreationInput = {
  prompt: string;
  receiver?: CreationReceiver;
  media?: MediaAsset[];
};
