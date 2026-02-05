const rootUrl = new URL("..", import.meta.url);
const appConstUrl = new URL("src/config/appConst.ts", rootUrl);
const pkgUrl = new URL("package.json", rootUrl);
const targetUrl = new URL(
  "node_modules/@mariozechner/pi-coding-agent/dist/config.js",
  rootUrl
);

const appConst = await Bun.file(appConstUrl).text();
const pkg = await Bun.file(pkgUrl).json();

const appNameMatch = appConst.match(/APP_NAME\s*=\s*"([^"]+)"/);
const appName = appNameMatch ? appNameMatch[1] : "pi";
const version = pkg.version || "0.0.0";

const file = await Bun.file(targetUrl).text();

const replacement = `// =============================================================================\n// App Config (embedded defaults; package.json optional)\n// =============================================================================\nconst DEFAULT_APP_NAME = process.env.PI_APP_NAME || "${appName}";\nconst DEFAULT_CONFIG_DIR_NAME = ".pi";\nconst DEFAULT_VERSION = process.env.PI_VERSION || "${version}";\nconst pkg = {\n    piConfig: {\n        name: DEFAULT_APP_NAME,\n        configDir: DEFAULT_CONFIG_DIR_NAME,\n    },\n    version: DEFAULT_VERSION,\n};\nexport const APP_NAME = pkg.piConfig?.name || "pi";\nexport const CONFIG_DIR_NAME = pkg.piConfig?.configDir || ".pi";\nexport const VERSION = pkg.version;`;

const pattern = /\/\/ =============================================================================\n\/\/ App Config \(from package\.json piConfig\)\n\/\/ =============================================================================\nconst pkg = JSON\.parse\(readFileSync\(getPackageJsonPath\(\), "utf-8"\)\);\nexport const APP_NAME = pkg\.piConfig\?\.name \|\| "pi";\nexport const CONFIG_DIR_NAME = pkg\.piConfig\?\.configDir \|\| "\.pi";\nexport const VERSION = pkg\.version;/;

if (!pattern.test(file)) {
  console.log("No patch applied (pattern not found or already patched).");
  process.exit(0);
}

const updated = file.replace(pattern, replacement);
await Bun.write(targetUrl, updated);
console.log(`Patched pi-coding-agent config with APP_NAME=${appName}, VERSION=${version}`);
