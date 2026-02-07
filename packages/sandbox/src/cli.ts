import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { initConfig } from "./init.ts";
import { installCommand } from "./install.ts";
import { launchCommand } from "./launch.ts";
import {
	getLocalConfigPath,
	getUserConfigPath,
	resolveSandboxNames,
	type SandboxConfigSource,
	type SandboxNames,
} from "./locations.ts";
import { promptYesNo } from "./prompts.ts";

const usage = () => {
	const self = process.argv[1] ? process.argv[1].split("/").at(-1) : "sandbox";
	console.log(`${self} <command> [options]`);
	console.log("");
	console.log("Commands:");
	console.log("  init      Create a sandbox config (local or per-user)");
	console.log("  install   Check/install container prerequisites");
	console.log("  launch    Launch container using sandbox config");
	console.log("");
	console.log("Global options:");
	console.log("  --name <base>       Config basename (default: sandbox)");
	console.log("  --app-name <name>   App name for per-user dirs (default: sandbox)");
	console.log("  --profile <name>    Use named profile (<base>.<profile>.json)");
	console.log("  --config <path>     Explicit sandbox config path");
	console.log("  --local             For init: write config to current directory");
	console.log("  --user              For init: write config to per-user config dir (default)");
	console.log("  --help");
};

type ParsedArgs = {
	command?: string;
	configPath?: string;
	profile?: string;
	configSource?: SandboxConfigSource;
	names: SandboxNames;
	rest: string[];
};

type ParsedArgsRaw = {
	command?: string;
	configPath?: string;
	profile?: string;
	configSource?: SandboxConfigSource;
	appName?: string;
	configName?: string;
	rest: string[];
};

const parseArgs = (argv: string[]): ParsedArgs => {
	const args = [...argv];
	const out: ParsedArgsRaw = {
		command: undefined,
		configPath: undefined,
		profile: undefined,
		configSource: undefined,
		appName: undefined,
		configName: undefined,
		rest: [],
	};
	while (args.length) {
		const a = args.shift();
		if (!a) break;
		if (a === "init" || a === "install" || a === "launch") {
			if (!out.command) out.command = a;
			else out.rest.push(a);
			continue;
		}
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
		if (a === "--name") {
			const v = args.shift();
			if (!v) throw new Error("--name requires a value");
			out.configName = v;
			continue;
		}
		if (a === "--app-name") {
			const v = args.shift();
			if (!v) throw new Error("--app-name requires a value");
			out.appName = v;
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

	const names = resolveSandboxNames({ appName: out.appName, configName: out.configName });
	return {
		command: out.command,
		configPath: out.configPath,
		profile: out.profile,
		configSource: out.configSource,
		names,
		rest: out.rest,
	};
};

const resolveConfigForLaunch = (parsed: ParsedArgs): string | null => {
	if (parsed.configPath) return parsed.configPath;

	if (parsed.profile) {
		const localProfile = getLocalConfigPath(parsed.names, parsed.profile);
		if (existsSync(localProfile)) return localProfile;
		const userProfile = getUserConfigPath(parsed.names, parsed.profile);
		if (existsSync(userProfile)) return userProfile;
		return null;
	}

	const localDefault = getLocalConfigPath(parsed.names);
	if (existsSync(localDefault)) return localDefault;
	const userDefault = getUserConfigPath(parsed.names);
	if (existsSync(userDefault)) return userDefault;
	return null;
};

export const main = async (argv = process.argv.slice(2)) => {
	const parsed = parseArgs(argv);

	if (!parsed.command) parsed.command = "launch";
	if (
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
		const targetPath = initConfig({ profile: parsed.profile, source, names: parsed.names });
		console.log(`Wrote sandbox config: ${targetPath}`);
		return;
	}

	if (parsed.command === "launch") {
		let configPath = resolveConfigForLaunch(parsed);
		if (!configPath) {
			console.error("No sandbox config found.");
			console.error("Searched:");
			if (parsed.profile) {
				console.error(`  - ${getLocalConfigPath(parsed.names, parsed.profile)}`);
				console.error(`  - ${getUserConfigPath(parsed.names, parsed.profile)}`);
			} else {
				console.error(`  - ${getLocalConfigPath(parsed.names)}`);
				console.error(`  - ${getUserConfigPath(parsed.names)}`);
			}
			const ok = await promptYesNo(
				"Create a per-user sandbox config and continue? (Y/n) ",
			);
			if (!ok) process.exit(1);
			configPath = initConfig({ profile: parsed.profile, source: "user", names: parsed.names });
			console.log(`Created: ${configPath}`);
			console.log("Continuing with default config (edit it later to tighten permissions).");
		}

		await launchCommand({ ...parsed, configPath });
		return;
	}

	console.error(`Unknown command: ${parsed.command}`);
	usage();
	process.exit(1);
};
