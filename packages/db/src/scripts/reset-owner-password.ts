import bcrypt from "bcrypt";
import { db } from "../index.js";

async function main() {
  const password = await bcrypt.hash("test123", 10);

  const user = await db.user.update({
    where: {
      email: "owner@qre.com",
    },
    data: {
      password,
    },
  });

  console.log("Password reset:", user.email);
}

main()
  .catch(console.error)
  .finally(() => process.exit());
