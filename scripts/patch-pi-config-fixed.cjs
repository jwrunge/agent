const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const appConstPath = path.join(root, "src", "config", "appConst.ts");
const pkgPath = path.join(root, "package.json");
const targetPath = path.join(
  root,
  "node_modules",
  "@mariozechner",
  "pi-coding-agent",
  "dist",
  "config.js"
);

const appConst = fs.readFileSync(appConstPath, "utf8");
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));

const appNameMatch = appConst.match(/APP_NAME\s*=\s*"([^"]+)"/);
const appName = appNameMatch ? appNameMatch[1] : "pi";
const version = pkg.version || "0.0.0";

const file = fs.readFileSync(targetPath, "utf8");

const replacement = `// =============================================================================\n// App Config (embedded defaults; package.json optional)\n// =============================================================================\nconst DEFAULT_APP_NAME = process.env.PI_APP_NAME || "${appName}";\nconst DEFAULT_CONFIG_DIR_NAME = ".pi";\nconst DEFAULT_VERSION = process.env.PI_VERSION || "${version}";\nconst pkg = {\n    piConfig: {\n        name: DEFAULT_APP_NAME,\n        configDir: DEFAULT_CONFIG_DIR_NAME,\n    },\n    version: DEFAULT_VERSION,\n};\nexport const APP_NAME = pkg.piConfig?.name || "pi";\nexport const CONFIG_DIR_NAME = pkg.piConfig?.configDir || ".pi";\nexport const VERSION = pkg.version;`;

const pattern = /\/\/ =============================================================================\n\/\/ App Config \(from package\.json piConfig\)\n\/\/ =============================================================================\nconst pkg = JSON\.parse\(readFileSync\(getPackageJsonPath\(\), "utf-8"\)\);\nexport const APP_NAME = pkg\.piConfig\?\.name \|\| "pi";\nexport const CONFIG_DIR_NAME = pkg\.piConfig\?\.configDir \|\| "\.pi";\nexport const VERSION = pkg\.version;/;

if (!pattern.test(file)) {
  console.log("No patch applied (pattern not found or already patched).");
  process.exit(0);
}

const updated = file.replace(pattern, replacement);
fs.writeFileSync(targetPath, updated, "utf8");
console.log(`Patched pi-coding-agent config with APP_NAME=${appName}, VERSION=${version}`);
