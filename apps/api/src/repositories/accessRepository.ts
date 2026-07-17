import { db } from "@qre/db";

import type {
  AccessRepository,
} from "@qre/engine";


export function createAccessRepository(): AccessRepository {

  return {

    async findAssetAccessState(
      assetId: string
    ) {

      const asset =
        await db.asset.findUnique({

          where: {
            id: assetId,
          },

          select: {

            id: true,

            slug: true,

            paid: true,

            ownership: {

              select: {

                accountId: true,

                status: true,

                account: {

                  select: {

                    plan: true,

                  },

                },

              },

            },

          },

        });



      if (!asset) {

        return null;

      }



      return {

        id:
          asset.id,


        slug:
          asset.slug,


        paid:
          asset.paid,


        accountId:
          asset.ownership?.accountId ?? null,


        ownershipStatus:
          asset.ownership?.status ?? null,


        ownerTier:
          asset.ownership?.account?.plan ?? "CONSUMER",

      };

    },

  };

}