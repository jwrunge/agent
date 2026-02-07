import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { getUserAppDir } from "./locations.ts";

const hasAppLayout = (dir: string): boolean => {
	// Minimal signal that the bundle is present.
	return existsSync(resolve(dir, "container", "Dockerfile"));
};

export const resolveAppDir = (): string => {
	const fromEnv = process.env.HARDSHELL_APP_DIR;
	if (fromEnv) return resolve(fromEnv);

	const cwd = process.cwd();
	if (hasAppLayout(cwd)) return cwd;

	const userAppDir = getUserAppDir();
	if (hasAppLayout(userAppDir)) return userAppDir;

	// Fall back to cwd; callers can error with a more specific message.
	return cwd;
};
