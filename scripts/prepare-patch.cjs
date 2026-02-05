const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const appConstPath = path.join(root, "src", "config", "appConst.ts");
const pkgPath = path.join(root, "package.json");
const patchPath = path.join(
  root,
  "patches",
  "@mariozechner+pi-coding-agent+0.51.6.patch"
);

const appConst = fs.readFileSync(appConstPath, "utf8");
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));

const appNameMatch = appConst.match(/APP_NAME\s*=\s*"([^"]+)"/);
const appName = appNameMatch ? appNameMatch[1] : "pi";
const version = pkg.version || "0.0.0";

let patch = fs.readFileSync(patchPath, "utf8");
patch = patch
  .replace(/__APP_NAME__/g, appName)
  .replace(/__APP_VERSION__/g, version);

fs.writeFileSync(patchPath, patch, "utf8");
console.log(`Prepared patch with APP_NAME=${appName}, VERSION=${version}`);
