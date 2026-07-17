import { scanEngine } from "@qre/engine";

export async function scanHandler(params: {
  slug: string;
  userId?: string;
}) {
  return scanEngine({
    slug: params.slug,
    userId: params.userId,
  });
}