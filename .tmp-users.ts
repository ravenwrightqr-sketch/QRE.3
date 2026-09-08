import { db } from "@qre/db";

async function main() {
  const users = await db.user.findMany({
    select: { id: true, email: true },
    orderBy: { email: "asc" },
  });

  console.log(JSON.stringify(users, null, 2));
  await db.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await db.$disconnect();
  process.exit(1);
});
