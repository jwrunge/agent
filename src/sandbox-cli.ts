import { main as sandboxMain } from "@hardshell/sandbox/cli";
import { APP_NAME } from "./config/appConst.ts";

process.env.SANDBOX_APP_NAME ??= APP_NAME;
process.env.SANDBOX_CONFIG_NAME ??= "agent-sandbox";
process.env.SANDBOX_DEFAULT_IMAGE_NAME ??= "pi-agent-bun:local";

sandboxMain().catch((err) => {
	console.error(err);
	process.exit(1);
});
