// Delega a compilação do Quiz Mobile para o builder principal (scripts/build.cjs)
const path = require("path");
const { execFileSync } = require("child_process");

execFileSync(
  process.execPath,
  [path.resolve(__dirname, "..", "..", "scripts", "build.cjs"), "--template=quiz-mobile"],
  { stdio: "inherit" }
);
