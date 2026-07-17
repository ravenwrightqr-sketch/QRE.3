import type {
  AccessState,
} from "@qre/contracts";

import type {
  AccessRepository,
} from "./repositories/index.js";


type Input = {

  assetId:string;

  userId?:string;

};



type AssetState = {

  id:string;

  slug:string;

  paid:boolean;

  accountId:string|null;

  ownershipStatus:string|null;

  ownerTier:string;

};



export type AccessResult = {

  state:AccessState;

  asset:AssetState;

};



/**
 * =====================================================
 * ACCESS ENGINE
 * =====================================================
 *
 * Determines scan permission.
 *
 * Rules:
 *
 * 1. Claimed/active ownership
 *    -> UNLOCKED
 *
 * 2. Paid asset
 *    -> UNLOCKED
 *
 * 3. Everyone else
 *    -> DEMO
 *
 *
 * Subscription does NOT unlock assets.
 *
 * Account plans control:
 *
 * - dashboard
 * - experience creation
 * - editing
 * - analytics
 *
 * Asset access controls:
 *
 * - ownership
 * - payment
 *
 * =====================================================
 */


export async function resolveAccessEngine(

  input:Input,

  repo:AccessRepository

):Promise<AccessResult>{



  const asset =
    await repo.findAssetAccessState(
      input.assetId
    );



  if(!asset){

    throw new Error(
      "Asset not found"
    );

  }



  console.log(

    "[ACCESS ENGINE]",

    {

      assetId:asset.id,

      slug:asset.slug,

      accountId:asset.accountId,

      ownershipStatus:asset.ownershipStatus,

      userId:input.userId,

      paid:asset.paid,

    }

  );



  /**
   * OWNERSHIP ACCESS
   *
   * Account owns this QR/NFC asset.
   */
  if(

    asset.ownershipStatus === "CLAIMED" ||

    asset.ownershipStatus === "ACTIVE"

  ){

    console.log(
      "[ACCESS ENGINE] OWNERSHIP UNLOCK"
    );


    return {

      state:"UNLOCKED",

      asset,

    };

  }




  /**
   * PAID ASSET ACCESS
   *
   * Stripe confirmed purchase.
   */
  if(asset.paid){

    console.log(
      "[ACCESS ENGINE] PAID UNLOCK"
    );


    return {

      state:"UNLOCKED",

      asset,

    };

  }




  /**
   * DEMO MODE
   *
   * Visitor can preview.
   */
  console.log(
    "[ACCESS ENGINE] DEMO"
  );


  return {

    state:"DEMO",

    asset,

  };


}