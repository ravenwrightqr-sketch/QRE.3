import { appendFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const args = process.argv.slice(2).filter((arg) => arg !== "--");
const cases = ["HOUSEKEEPING", "COCO", "COCO_BLIND", "MILO", "MILO_MEMORY", "RELATIONSHIP"];
if (args[0] === "--help") {
  console.log(`Usage: pnpm author:live [${cases.join("|")}]\nDefault: COCO, normal Discovery-to-Lens path.\nSaves stdout and stderr under .qre-debug/author-live/.`);
} else {
  const selectedCase = (args[0] || "COCO").toUpperCase();
  if (args.length > 1 || !cases.includes(selectedCase)) {
    console.error(`Choose one case: ${cases.join(", ")}`);
    process.exitCode = 1;
  } else {
    const directory = join(root, ".qre-debug", "author-live");
    mkdirSync(directory, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const logPath = join(directory, `${selectedCase}-${stamp}-${process.pid}.log`);
    writeFileSync(logPath, `AUTHOR LIVE CASE: ${selectedCase}\nPATH: normal Discovery -> Lens -> Mouth -> Grounding\n`, { flag: "wx" });
    console.log(`Saving complete output to: ${logPath}`);
    const child = spawn(process.execPath, [
      "--import", "tsx", "--require", "dotenv/config", "./author-universal-core-acceptance.ts",
    ], {
      cwd: join(root, "apps", "api"),
      env: { ...process.env, QRE_AUTHOR_CASE: selectedCase, QRE_AUTHOR_DIRECT_CREATIVE_EXPERIMENT: "false" },
      stdio: ["inherit", "pipe", "pipe"],
    });
    child.stdout.on("data", (chunk) => {
      appendFileSync(logPath, chunk);
      process.stdout.write(chunk);
    });
    child.stderr.on("data", (chunk) => {
      appendFileSync(logPath, chunk);
      process.stderr.write(chunk);
    });
    child.on("error", (error) => {
      appendFileSync(logPath, `\nRUNNER ERROR: ${error.message}\n`);
      console.error(error.message);
      process.exitCode = 1;
    });
    process.on("SIGINT", () => child.kill("SIGINT"));
    process.on("SIGTERM", () => child.kill("SIGTERM"));
    child.on("close", (code, signal) => {
      const status = `\nAUTHOR LIVE EXIT: ${code ?? signal}\n`;
      appendFileSync(logPath, status);
      console.log(`${status.trim()}\nSaved complete output: ${logPath}`);
      process.exitCode = code ?? 1;
    });
  }
}
