import { appendFileSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const args = process.argv.slice(2).filter((arg) => arg !== "--");
if (args.includes("--help")) {
  console.log("Usage: pnpm author:discourse [--dry] [harness arguments]\nDefault: raw Coco, housekeeping and relationship, two runs each (six generation calls).\nReplay: pnpm author:discourse --authority-replay <saved-discoveries.json>\nReplay audits every saved discovery, grouped by supplied world in batches of up to three, without generating new words.\nLogs and discovery JSON are saved automatically under .qre-debug/open-discourse/.");
} else {
  const dry = args.includes("--dry");
  const forwarded = args.filter((arg) => arg !== "--dry" && arg !== "--live");
  const replayIndex = forwarded.indexOf("--authority-replay");
  if (replayIndex >= 0 && forwarded[replayIndex + 1]) forwarded[replayIndex + 1] = resolve(root, forwarded[replayIndex + 1]);
  const parameters = forwarded.length ? forwarded : ["--raw-only", "--domain", "coco,house,relationship", "--runs", "2"];
  const directory = join(root, ".qre-debug", "open-discourse");
  mkdirSync(directory, { recursive: true });
  const log = join(directory, `run-${Date.now()}-${process.pid}.log`);
  console.log(`Saving complete output: ${log}`);
  const child = spawn(process.execPath, ["--import", "tsx", "--require", "dotenv/config",
    "./author-open-discourse-discovery-harness.ts", ...(!dry ? ["--live"] : []), ...parameters],
  { cwd: join(root, "apps", "api"), env: process.env, stdio: ["inherit", "pipe", "pipe"] });
  for (const [stream, output] of [[child.stdout, process.stdout], [child.stderr, process.stderr]]) {
    stream.on("data", (chunk) => { appendFileSync(log, chunk); output.write(chunk); });
  }
  child.on("error", (error) => { appendFileSync(log, `${error.message}\n`); console.error(error.message); process.exitCode = 1; });
  process.on("SIGINT", () => child.kill("SIGINT"));
  process.on("SIGTERM", () => child.kill("SIGTERM"));
  child.on("close", (code, signal) => {
    console.log(`EXIT: ${code ?? signal}\nSaved complete output: ${log}`);
    process.exitCode = code ?? 1;
  });
}
