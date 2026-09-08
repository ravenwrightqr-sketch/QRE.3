import bcrypt from "bcrypt";
import { db } from "@qre/db";

async function main() {
  const userId = "ILOVEME";
  const newPassword = "FUCKYOUCUNT";

  const hash = await bcrypt.hash(newPassword, 10);

  const user = await db.user.update({
    where: { id: userId },
    data: { password: hash },
    select: { id: true, email: true },
  });

  console.log("PASSWORD RESET:", user);
  await db.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await db.$disconnect();
  process.exit(1);
});
