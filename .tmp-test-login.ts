import readline from "node:readline";

function ask(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function main() {
  const password = await ask("Password: ");

  const response = await fetch("http://localhost:3000/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "owner@qre.com",
      password,
    }),
  });

  const body = await response.text();

  console.log("");
  console.log("STATUS:", response.status);
  console.log("RESPONSE:", body);
}

main().catch(console.error);
