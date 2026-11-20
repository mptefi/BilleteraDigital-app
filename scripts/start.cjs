const { spawnSync } = require("node:child_process");
const { createRequire } = require("node:module");
const { resolve } = require("node:path");

const requireFunctions = createRequire(resolve(__dirname, "../functions/package.json"));
try {
  requireFunctions.resolve("firebase-admin/app");
} catch (error) {
  if (error.code !== "MODULE_NOT_FOUND") throw error;
  console.log("Instalando las dependencias de validación QR…");
  const install = spawnSync(process.execPath, [process.env.npm_execpath, "--prefix", "functions", "ci"], { stdio: "inherit" });
  if (install.error) throw install.error;
  if (install.status !== 0) process.exit(install.status ?? 1);
}

const env = {
  ...process.env,
  EXPO_NO_DOTENV: "1",
  EXPO_PUBLIC_ALTOQUE_METRO_API: "1",
};
const expo = spawnSync(process.execPath, [
  require.resolve("expo/bin/cli"), "start", "--go", ...process.argv.slice(2),
], { env, stdio: "inherit" });
if (expo.error) throw expo.error;
process.exitCode = expo.status ?? (expo.signal === "SIGINT" ? 0 : 1);
