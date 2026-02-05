import { resolve } from "https://deno.land/std@0.224.0/path/mod.ts";
import type { PiDefaultsConfig, PiDefaultsOverrides } from "../types.ts";

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
		const raw = await Deno.readTextFile(overridesPath);
		return JSON.parse(raw) as PiDefaultsOverrides;
	} catch (error) {
		if (error instanceof Deno.errors.NotFound) {
			return undefined;
		}
		throw error;
	}
}

export const getConfig = async (options?: {
	cwd?: string;
	overridesPath?: string;
}): Promise<PiDefaultsConfig> => {
	const cwd = options?.cwd ?? Deno.cwd();
	const overridesPath = options?.overridesPath
		? resolve(cwd, options.overridesPath)
		: resolve(cwd, "pi.defaults.json");

	const overrides = await readOverrides(overridesPath);
	return mergeConfig(overrides);
};