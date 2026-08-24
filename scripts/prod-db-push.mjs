import { execFileSync } from "child_process";
import { readFileSync } from "fs";

const envFile = process.argv[2] || ".env.vercel.production";
const lines = readFileSync(envFile, "utf8").split(/\r?\n/);
const dbLine = lines.find((l) => l.startsWith("DATABASE_URL="));
if (!dbLine) {
  console.error("DATABASE_URL not found in", envFile);
  process.exit(1);
}
const url = dbLine.slice("DATABASE_URL=".length).replace(/^"|"$/g, "");
if (!url.startsWith("postgres")) {
  console.error("Invalid DATABASE_URL protocol");
  process.exit(1);
}

const env = { ...process.env, DATABASE_URL: url };
for (const cmd of ["prisma db push", "tsx prisma/seed.ts"]) {
  const [bin, ...args] = cmd.split(" ");
  execFileSync(`npx ${bin}`, args, { stdio: "inherit", env, shell: true });
}
