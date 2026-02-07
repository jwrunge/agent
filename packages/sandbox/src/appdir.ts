import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { getUserAppDir, type SandboxNames } from "./locations.ts";

const hasAppLayout = (dir: string): boolean => {
	return existsSync(resolve(dir, "container", "Dockerfile"));
};

export const resolveAppDir = (names: SandboxNames): string => {
	const fromEnv =
		process.env.SANDBOX_APP_DIR ??
		process.env.HARDSHELL_APP_DIR ??
		process.env.APP_DIR;
	if (fromEnv) return resolve(fromEnv);

	const cwd = process.cwd();
	if (hasAppLayout(cwd)) return cwd;

	const userAppDir = getUserAppDir(names);
	if (hasAppLayout(userAppDir)) return userAppDir;

	return cwd;
};
