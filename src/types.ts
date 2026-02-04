export type ProviderApi =
	| "openai-completions"
	| "openai-responses"
	| "anthropic-messages"
	| "google-generative-ai";

export type ModelInput = "text" | "image";

export interface ModelCost {
	input: number;
	output: number;
	cacheRead: number;
	cacheWrite: number;
}

export interface ModelConfig {
	id: string;
	name?: string;
	api?: ProviderApi;
	reasoning?: boolean;
	input?: ModelInput[];
	cost?: ModelCost;
	contextWindow?: number;
	maxTokens?: number;
	headers?: Record<string, string>;
	compat?: Record<string, unknown>;
}

export interface ProviderConfig {
	baseUrl?: string;
	api?: ProviderApi;
	apiKey?: string;
	headers?: Record<string, string>;
	authHeader?: boolean;
	models?: ModelConfig[];
}

export interface ModelsJsonConfig {
	providers: Record<string, ProviderConfig>;
}

export interface PiDefaultsConfig {
	providers: Record<string, ProviderConfig>;
	models: ModelConfig[];
}

export interface PiDefaultsOverrides {
	providers?: Record<string, Partial<ProviderConfig>>;
	models?: ModelConfig[];
}