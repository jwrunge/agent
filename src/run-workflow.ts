import {
	AuthStorage,
	createAgentSession,
	ModelRegistry,
} from "@mariozechner/pi-coding-agent";
import dotenv from "dotenv";

import { getConfig } from "./config/config.ts";
import { ensureOllamaReady } from "./config/ollama.ts";
import type { ModelConfig, ProviderConfig } from "./types.ts";

dotenv.config({
	path: new URL("../.env", import.meta.url),
});

const main = async (): Promise<void> => {
	process.stdout.write("Initializing config...\n");
	const config = await getConfig();
	process.stdout.write("Config loaded.\n");

	const authStorage = new AuthStorage();
	const modelRegistry = new ModelRegistry(authStorage);

	const normalizeModels = (models: ModelConfig[]) =>
		models.map((model) => ({
			id: model.id,
			name: model.name ?? model.id,
			api: model.api,
			reasoning: model.reasoning ?? false,
			input: model.input ?? ["text"],
			cost: model.cost ?? {
				input: 0,
				output: 0,
				cacheRead: 0,
				cacheWrite: 0,
			},
			contextWindow: model.contextWindow ?? 8192,
			maxTokens: model.maxTokens ?? 2048,
			headers: model.headers,
			compat: model.compat,
		}));

	for (const [providerName, providerConfig] of Object.entries(
		config.providers,
	)) {
		process.stdout.write(`Registering provider: ${providerName}\n`);
		const modelsSource =
			providerConfig.models && providerConfig.models.length > 0
				? providerConfig.models
				: config.models;

		if (providerName === "ollama") {
			process.stdout.write("Ollama preflight...\n");
			await ensureOllamaReady(providerConfig, modelsSource);
			process.stdout.write("Ollama ready.\n");
		}

		modelRegistry.registerProvider(providerName, {
			...(providerConfig as ProviderConfig),
			models: normalizeModels(modelsSource),
		});
	}

	process.stdout.write("Creating agent session...\n");
	const { session } = await createAgentSession({ modelRegistry });
	process.stdout.write("Session created.\n");

	session.subscribe((event) => {
		if (
			event.type === "message_update" &&
			event.assistantMessageEvent.type === "text_delta"
		) {
			process.stdout.write(event.assistantMessageEvent.delta);
		}
	});

	process.stdout.write("Prompting model...\n");
	await session.prompt(
		"Summarize the project status and propose next steps for this repo.",
	);
	process.stdout.write("\nDone.\n");
};

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
