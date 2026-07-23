import { db } from "@qre/db";


/**
 * =====================================================
 * ASSET ACCOUNT ACCESS CONTROL
 * =====================================================
 *
 * Purpose:
 *
 * Verify that a user belongs to the Account
 * that owns an Asset.
 *
 *
 * Ownership model:
 *
 * User
 *   |
 * AccountUser
 *   |
 * Account
 *   |
 * Asset.accountId
 *
 *
 * This does NOT check:
 *
 * ❌ payment
 * ❌ ownership claim
 * ❌ subscription tier
 * ❌ scan unlock
 *
 *
 * Those belong to:
 *
 * Stripe / Ownership / Access Engine
 *
 * =====================================================
 */


export async function userHasAssetAccountAccess(
  assetId: string,
  userId: string,
): Promise<boolean> {


  const asset =
    await db.asset.findUnique({

      where:{
        id:assetId,
      },

      select:{
        accountId:true,
      },

    });



  if(
    !asset?.accountId
  ){

    return false;

  }



  const membership =
    await db.accountUser.findUnique({

      where:{

        accountId_userId:{

          accountId:
            asset.accountId,

          userId,

        },

      },

      select:{
        id:true,
      },

    });



  return Boolean(
    membership
  );

}