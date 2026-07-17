import { db } from "@qre/db";


/**
 * =====================================================
 * ASSET ACCESS CONTROL
 *
 * Asset ownership:
 *
 * Asset.accountId
 *        |
 *        |
 * AccountUser
 *        |
 *        |
 * User
 *
 * =====================================================
 */


export async function canAccessAsset(
  assetId: string,
  userId: string
) {

  const asset =
    await db.asset.findUnique({

      where:{
        id:assetId,
      },

      select:{

        accountId:true,

      },

    });


  if(!asset){

    return false;

  }


  if(!asset.accountId){

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


  return Boolean(membership);

}