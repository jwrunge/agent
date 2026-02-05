import type { PiDefaultsConfig, PiDefaultsOverrides } from "../types.ts";

const resolvePath = (base: string, target: string): string => {
	const isAbsolute = /^[A-Za-z]:[\\/]/.test(target) || target.startsWith("/");
	if (isAbsolute) {
		return target;
	}
	const trimmedBase = base.replace(/[\\/]+$/, "");
	const trimmedTarget = target.replace(/^[\\/]+/, "");
	return `${trimmedBase}/${trimmedTarget}`;
};

const DEFAULTS: PiDefaultsConfig = {
	providers: {
		ollama: {
			baseUrl: "http://localhost:11434/v1",
			api: "openai-completions",
			apiKey: "ollama",
			models: [],
		},
	},
	models: [{ id: "llama3.1:8b" }],
};

const mergeProviders = (
	base: PiDefaultsConfig["providers"],
	overrides?: PiDefaultsOverrides["providers"]
): PiDefaultsConfig["providers"] => {
	if (!overrides) {
		return base;
	}

	const merged: PiDefaultsConfig["providers"] = { ...base };

	for (const [providerName, providerOverride] of Object.entries(overrides)) {
		const existing = base[providerName];
		if (existing && providerOverride && typeof providerOverride === "object") {
			merged[providerName] = {
				...existing,
				...providerOverride,
				models:
					providerOverride.models ?? existing.models ?? [],
			};
		} else if (providerOverride) {
			// biome-ignore lint/style/noNonNullAssertion: We've checked that it's non-null
			merged[providerName] = providerOverride!;
		}
	}

	return merged;
};

const mergeConfig = (overrides?: PiDefaultsOverrides): PiDefaultsConfig => {
	return {
		providers: mergeProviders(DEFAULTS.providers, overrides?.providers),
		models: overrides?.models ?? DEFAULTS.models,
	};
};

const readOverrides = async (
	overridesPath: string
): Promise<PiDefaultsOverrides | undefined> => {
	try {
		const raw = await Bun.file(overridesPath).text();
		return JSON.parse(raw) as PiDefaultsOverrides;
	} catch (error) {
		const isNotFound =
			error instanceof Error &&
			"code" in error &&
			(error as { code?: string }).code === "ENOENT";
		if (isNotFound) {
			return undefined;
		}
		throw error;
	}
}

export const getConfig = async (options?: {
	cwd?: string;
	overridesPath?: string;
}): Promise<PiDefaultsConfig> => {
	const cwd = options?.cwd ?? process.cwd();
	const overridesPath = options?.overridesPath
		? resolvePath(cwd, options.overridesPath)
		: resolvePath(cwd, "pi.defaults.json");

	const overrides = await readOverrides(overridesPath);
	return mergeConfig(overrides);
};