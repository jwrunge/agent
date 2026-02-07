import { join, resolve } from "node:path";
import envPaths from "env-paths";

import { APP_NAME } from "../config/appConst.ts";

export type SandboxConfigSource = "local" | "user";

export const getLocalConfigPath = (profile?: string): string => {
	const name = profile ? `agent-sandbox.${profile}.json` : "agent-sandbox.json";
	return resolve(process.cwd(), name);
};

export const getUserSandboxDir = (): string => {
	const paths = envPaths(APP_NAME);
	return join(paths.config, "sandbox");
};

export const getUserAppDir = (): string => {
	const paths = envPaths(APP_NAME);
	return join(paths.data, "app");
};

export const getUserConfigPath = (profile?: string): string => {
	if (!profile) return join(getUserSandboxDir(), "agent-sandbox.json");
	return join(getUserSandboxDir(), "profiles", `${profile}.json`);
};
