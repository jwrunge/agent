import { existsSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import {
	getLocalConfigPath,
	getUserConfigPath,
	type SandboxConfigSource,
	type SandboxNames,
} from "./locations.ts";
import { ensureDirExists } from "./paths.ts";
import { defaultSandboxConfig } from "./template.ts";

export type InitOptions = {
	profile?: string;
	source: SandboxConfigSource;
	names: SandboxNames;
	force?: boolean;
};

export const initConfig = (opts: InitOptions): string => {
	const targetPath =
		opts.source === "user"
			? getUserConfigPath(opts.names, opts.profile)
			: getLocalConfigPath(opts.names, opts.profile);

	if (existsSync(targetPath) && !opts.force) {
		return targetPath;
	}

	ensureDirExists(dirname(targetPath));
	const config = defaultSandboxConfig();
	writeFileSync(targetPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");
	return targetPath;
};
