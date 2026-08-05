import bcrypt from "bcrypt";
import { db } from "../index.js";

process.env.DATABASE_URL =
  "postgresql://neondb_owner:npg_JKwUN2Ofh9xE@ep-soft-darkness-akeoiula-pooler.c-3.us-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

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