import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { installCommand } from "./install.ts";
import { launchCommand } from "./launch.ts";

const usage = () => {
	console.log("pi-agent-sandbox <command> [options]");
	console.log("");
	console.log("Commands:");
	console.log("  install   Check/install container prerequisites");
	console.log("  launch    Launch agent in container using sandbox config");
	console.log("");
	console.log("Global options:");
	console.log("  --config <path>   Sandbox config (default: ./agent-sandbox.json)");
	console.log("  --help");
};

type ParsedArgs = {
	command?: string;
	configPath: string;
	rest: string[];
};

const parseArgs = (argv: string[]): ParsedArgs => {
	const args = [...argv];
	const out: ParsedArgs = {
		command: args.shift(),
		configPath: resolve(process.cwd(), "agent-sandbox.json"),
		rest: [],
	};
	while (args.length) {
		const a = args.shift();
		if (!a) break;
		if (a === "--help" || a === "-h") {
			out.rest.push(a);
			continue;
		}
		if (a === "--config") {
			const v = args.shift();
			if (!v) throw new Error("--config requires a value");
			out.configPath = resolve(process.cwd(), v);
			continue;
		}
		out.rest.push(a);
	}
	return out;
};

const main = async () => {
	const parsed = parseArgs(process.argv.slice(2));
	if (
		!parsed.command ||
		parsed.command === "--help" ||
		parsed.command === "-h" ||
		parsed.rest.includes("--help") ||
		parsed.rest.includes("-h")
	) {
		usage();
		process.exit(0);
	}

	if (parsed.command === "install") {
		await installCommand(parsed);
		return;
	}
	if (parsed.command === "launch") {
		// Help users by auto-finding an example config.
		if (!existsSync(parsed.configPath)) {
			const example = resolve(process.cwd(), "agent-sandbox.example.json");
			if (existsSync(example)) {
				console.error(
					`Config not found at ${parsed.configPath}. Copy ${example} to agent-sandbox.json and edit it.`,
				);
			} else {
				console.error(`Config not found at ${parsed.configPath}.`);
			}
			process.exit(1);
		}

		await launchCommand(parsed);
		return;
	}

	console.error(`Unknown command: ${parsed.command}`);
	usage();
	process.exit(1);
};

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
