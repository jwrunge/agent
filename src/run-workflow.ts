/// <reference lib="deno.ns" />

import { load } from "https://deno.land/std@0.224.0/dotenv/mod.ts";
import {
	AuthStorage,
	createAgentSession,
	ModelRegistry,
} from "npm:@mariozechner/pi-coding-agent@^0.51.6";

import { getConfig } from "./config/config.ts";
import { ensureOllamaReady } from "./config/ollama.ts";
import { createInMemoryEmailClient } from "./email/email-client.ts";
import { createEmailTools } from "./email/email-tools.ts";
import { createStateMachine } from "./state-machine.ts";
import type { ModelConfig, ProviderConfig } from "./types.ts";

const encoder = new TextEncoder();
const write = (text: string) => {
	Deno.stdout.writeSync(encoder.encode(text));
};

const promptLine = (message: string): string => {
	const answer = globalThis.prompt?.(message);
	return (answer ?? "").trim();
};

const main = async (): Promise<void> => {
	await load({
		envPath: ".env",
		allowEmptyValues: true,
	});

	write("Initializing config...\n");
	const config = await getConfig();
	write("Config loaded.\n");

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
		write(`Registering provider: ${providerName}\n`);
		const modelsSource =
			providerConfig.models && providerConfig.models.length > 0
				? providerConfig.models
				: config.models;

		if (providerName === "ollama") {
			write("Ollama preflight...\n");
			await ensureOllamaReady(providerConfig, modelsSource);
			write("Ollama ready.\n");
		}

		modelRegistry.registerProvider(providerName, {
			...(providerConfig as ProviderConfig),
			models: normalizeModels(modelsSource),
		});
	}

	write("Creating agent session...\n");
	const emailClient = createInMemoryEmailClient();
	const customTools = createEmailTools(emailClient);
	const { session } = await createAgentSession({
		modelRegistry,
		customTools,
	});
	write("Session created.\n");

	session.subscribe((event) => {
		if (
			event.type === "message_update" &&
			event.assistantMessageEvent.type === "text_delta"
		) {
			write(event.assistantMessageEvent.delta);
		}
	});

	write("Chat ready. Type /exit to quit.\n");
	write("Use /mode chat|coding|planning to switch.\n");
	const stateMachine = createStateMachine("chat");
	
	while (true) {
		const trimmed = promptLine("\n> ");
		if (!trimmed || trimmed === "/exit" || trimmed === "/quit") {
			break;
		}
		if (trimmed.startsWith("/mode")) {
			const parts = trimmed.split(/\s+/);
			const mode = parts[1];
			if (mode === "chat" || mode === "coding" || mode === "planning") {
				stateMachine.setMode(mode);
				write(`Mode set to ${mode}.\n`);
			} else {
				write("Usage: /mode chat|coding|planning\n");
			}
			continue;
		}
		if (trimmed === "/state") {
			const { mode } = stateMachine.getState();
			write(`Current mode: ${mode}.\n`);
			continue;
		}
		write("\n");
		await session.prompt(stateMachine.buildPrompt(trimmed));
		write("\n");
	}


	write("\nDone.\n");
};

main().catch((error) => {
	console.error(error);
	Deno.exit(1);
});
