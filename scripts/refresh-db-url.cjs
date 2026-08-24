const { execFileSync } = require("child_process");
const fs = require("fs");

const env = Object.fromEntries(
  fs
    .readFileSync(".env", "utf8")
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i), l.slice(i + 1).replace(/^"|"$/g, "")];
    })
);

function run(args) {
  return execFileSync(
    process.platform === "win32" ? "vercel.cmd" : "vercel",
    args,
    { stdio: ["ignore", "pipe", "pipe"], shell: true, encoding: "utf8" }
  );
}

for (const target of ["production", "preview"]) {
  try {
    run(["env", "rm", "DATABASE_URL", target, "--yes"]);
    console.log(`removed DATABASE_URL (${target})`);
  } catch {
    console.log(`no existing DATABASE_URL (${target})`);
  }
  run(["env", "add", "DATABASE_URL", target, "--yes", "--value", env.DATABASE_URL]);
  console.log(`added DATABASE_URL (${target})`);
}
