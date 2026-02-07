import { join, resolve } from "node:path";
import envPaths from "env-paths";

export type SandboxConfigSource = "local" | "user";

export type SandboxNames = {
	appName: string;
	configName: string;
};

export const resolveSandboxNames = (overrides?: Partial<SandboxNames>): SandboxNames => {
	const appName =
		overrides?.appName ?? process.env.SANDBOX_APP_NAME ?? process.env.APP_NAME ?? "sandbox";
	const configName =
		overrides?.configName ??
		process.env.SANDBOX_CONFIG_NAME ??
		process.env.CONFIG_NAME ??
		"sandbox";

	return { appName, configName };
};

const localConfigFileName = (configName: string, profile?: string): string => {
	if (!profile) return `${configName}.json`;
	return `${configName}.${profile}.json`;
};

const userConfigFileName = (configName: string, profile?: string): string => {
	if (!profile) return `${configName}.json`;
	return `${configName}.${profile}.json`;
};

export const getLocalConfigPath = (names: SandboxNames, profile?: string): string => {
	return resolve(process.cwd(), localConfigFileName(names.configName, profile));
};

export const getUserSandboxDir = (names: SandboxNames): string => {
	const paths = envPaths(names.appName);
	return join(paths.config, "sandbox");
};

export const getUserAppDir = (names: SandboxNames): string => {
	const paths = envPaths(names.appName);
	return join(paths.data, "app");
};

export const getUserConfigPath = (names: SandboxNames, profile?: string): string => {
	if (!profile) return join(getUserSandboxDir(names), userConfigFileName(names.configName));
	return join(getUserSandboxDir(names), "profiles", userConfigFileName(names.configName, profile));
};
