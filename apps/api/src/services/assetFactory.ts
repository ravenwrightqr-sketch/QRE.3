import { db } from "@qre/db";
import { SaleChannel } from "@prisma/client";
import crypto from "crypto";


/**
 * =====================================================
 * ASSET FACTORY SERVICE
 * =====================================================
 *
 * Single Asset Creation Authority
 *
 * Responsibilities:
 *
 * - Create Asset identity
 * - Generate unique slug
 * - Apply creation defaults
 * - Enforce Prisma enum contracts
 *
 *
 * Does NOT:
 *
 * - Handle payments
 * - Create ownership
 * - Unlock assets
 * - Create flows
 *
 *
 * Architecture:
 *
 * Asset
 *    |
 *    +--> Experience Service
 *    |          |
 *    |          +--> Flow
 *    |
 *    +--> Stripe
 *               |
 *               +--> unlockAsset()
 *                         |
 *                         +--> Ownership
 *
 * =====================================================
 */



export type CreateAssetInput = {

  accountId?: string;

  displayName?: string;

  priceCents?: number;

  saleChannel?: SaleChannel;

};





/**
 * =====================================================
 * CREATE SINGLE ASSET
 * =====================================================
 */
export async function createAsset(
  input: CreateAssetInput
) {


  const slug =
    crypto
      .randomBytes(6)
      .toString("hex");



  const asset =
    await db.asset.create({

      data:{


        slug,


        displayName:
          input.displayName ??
          "Untitled Asset",



        status:
          "active",



        paid:
          false,



        priceCents:
          input.priceCents ??
          999,



        saleChannel:
          input.saleChannel ??
          SaleChannel.RETAIL,



        ...(input.accountId
          ? {
              accountId:
                input.accountId,
            }
          : {}
        ),


      },

    });



  return asset;

}





/**
 * =====================================================
 * CREATE ASSET INVENTORY BATCH
 * =====================================================
 *
 * Used for:
 *
 * - QR inventory
 * - NFC inventory
 * - Physical products
 *
 *
 * Does NOT:
 *
 * - Claim assets
 * - Assign accounts
 * - Create flows
 *
 * =====================================================
 */
export async function createAssetBatch(

  quantity: number,

  priceCents: number,

  saleChannel:
    SaleChannel = SaleChannel.RETAIL

) {


  if(
    !Number.isInteger(quantity) ||
    quantity <= 0 ||
    quantity > 10000
  ){

    throw new Error(
      "Invalid asset quantity"
    );

  }



  if(
    priceCents < 0
  ){

    throw new Error(
      "Invalid asset price"
    );

  }



  const assets = [];



  for(
    let i = 0;
    i < quantity;
    i++
  ){


    const asset =
      await createAsset({

        priceCents,

        saleChannel,

      });



    assets.push(asset);

  }



  return assets;

}