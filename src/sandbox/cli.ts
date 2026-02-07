import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { initConfig } from "./init.ts";
import { installCommand } from "./install.ts";
import { launchCommand } from "./launch.ts";
import {
	getLocalConfigPath,
	getUserConfigPath,
	type SandboxConfigSource,
} from "./locations.ts";
import { promptYesNo } from "./prompts.ts";

const usage = () => {
	console.log("pi-agent-sandbox <command> [options]");
	console.log("");
	console.log("Commands:");
	console.log("  init      Create a sandbox config (local or per-user)");
	console.log("  install   Check/install container prerequisites");
	console.log("  launch    Launch agent in container using sandbox config");
	console.log("");
	console.log("Global options:");
	console.log(
		"  --profile <name>  Use named profile (agent-sandbox.<name>.json)",
	);
	console.log("  --config <path>   Explicit sandbox config path");
	console.log(
		"  --local           For init: write config to current directory",
	);
	console.log(
		"  --user            For init: write config to per-user config dir (default)",
	);
	console.log("  --help");
};

type ParsedArgs = {
	command?: string;
	configPath?: string;
	profile?: string;
	configSource?: SandboxConfigSource;
	rest: string[];
};

const parseArgs = (argv: string[]): ParsedArgs => {
	const args = [...argv];
	const out: ParsedArgs = {
		command: args.shift(),
		configPath: undefined,
		profile: undefined,
		configSource: undefined,
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
		if (a === "--profile") {
			const v = args.shift();
			if (!v) throw new Error("--profile requires a value");
			out.profile = v;
			continue;
		}
		if (a === "--local") {
			out.configSource = "local";
			continue;
		}
		if (a === "--user") {
			out.configSource = "user";
			continue;
		}
		out.rest.push(a);
	}
	return out;
};

const resolveConfigForLaunch = (parsed: ParsedArgs): string | null => {
	if (parsed.configPath) return parsed.configPath;

	if (parsed.profile) {
		const localProfile = getLocalConfigPath(parsed.profile);
		if (existsSync(localProfile)) return localProfile;
		const userProfile = getUserConfigPath(parsed.profile);
		if (existsSync(userProfile)) return userProfile;
		return null;
	}

	const localDefault = getLocalConfigPath();
	if (existsSync(localDefault)) return localDefault;
	const userDefault = getUserConfigPath();
	if (existsSync(userDefault)) return userDefault;
	return null;
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
		await installCommand({ rest: parsed.rest, configPath: parsed.configPath });
		return;
	}
	if (parsed.command === "init") {
		const source = parsed.configSource ?? "user";
		const targetPath = initConfig({ profile: parsed.profile, source });
		console.log(`Wrote sandbox config: ${targetPath}`);
		return;
	}
	if (parsed.command === "launch") {
		const configPath = resolveConfigForLaunch(parsed);
		if (!configPath) {
			console.error("No sandbox config found.");
			console.error("Searched:");
			if (parsed.profile) {
				console.error(`  - ${getLocalConfigPath(parsed.profile)}`);
				console.error(`  - ${getUserConfigPath(parsed.profile)}`);
			} else {
				console.error(`  - ${getLocalConfigPath()}`);
				console.error(`  - ${getUserConfigPath()}`);
			}
			const ok = await promptYesNo(
				"Create a per-user sandbox config now? (y/N) ",
			);
			if (!ok) process.exit(1);
			const targetPath = initConfig({
				profile: parsed.profile,
				source: "user",
			});
			console.log(`Created: ${targetPath}`);
			console.log("Edit it, then rerun launch.");
			process.exit(1);
		}

		await launchCommand({ ...parsed, configPath });
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
