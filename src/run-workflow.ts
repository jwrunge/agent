import { createInterface } from "node:readline/promises";
import {
	AuthStorage,
	createAgentSession,
	ModelRegistry,
} from "@mariozechner/pi-coding-agent";
import dotenv from "dotenv";

import { getConfig } from "./config/config.ts";
import { ensureOllamaReady } from "./config/ollama.ts";
import { createInMemoryEmailClient } from "./email/email-client.ts";
import { createEmailTools } from "./email/email-tools.ts";
import { createStateMachine } from "./state-machine.ts";
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
	const emailClient = createInMemoryEmailClient();
	const customTools = createEmailTools(emailClient);
	const { session } = await createAgentSession({
		modelRegistry,
		customTools,
	});
	process.stdout.write("Session created.\n");

	session.subscribe((event) => {
		if (
			event.type === "message_update" &&
			event.assistantMessageEvent.type === "text_delta"
		) {
			process.stdout.write(event.assistantMessageEvent.delta);
		}
	});

	process.stdout.write("Chat ready. Type /exit to quit.\n");
	process.stdout.write("Use /mode chat|coding|planning to switch.\n");
	const stateMachine = createStateMachine("chat");
	const rl = createInterface({
		input: process.stdin,
		output: process.stdout,
	});

	try {
		while (true) {
			const input = await rl.question("\n> ");
			const trimmed = input.trim();
			if (!trimmed || trimmed === "/exit" || trimmed === "/quit") {
				break;
			}
			if (trimmed.startsWith("/mode")) {
				const parts = trimmed.split(/\s+/);
				const mode = parts[1];
				if (mode === "chat" || mode === "coding" || mode === "planning") {
					stateMachine.setMode(mode);
					process.stdout.write(`Mode set to ${mode}.\n`);
				} else {
					process.stdout.write(
						"Usage: /mode chat|coding|planning\n",
					);
				}
				continue;
			}
			if (trimmed === "/state") {
				const { mode } = stateMachine.getState();
				process.stdout.write(`Current mode: ${mode}.\n`);
				continue;
			}
			process.stdout.write("\n");
			await session.prompt(stateMachine.buildPrompt(trimmed));
			process.stdout.write("\n");
		}
	} finally {
		rl.close();
	}

	process.stdout.write("\nDone.\n");
};

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
