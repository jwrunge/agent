import type { ModelConfig, ProviderConfig } from "../types.ts";

const write = (text: string) => {
	Bun.stdout.write(text);
};

const runWithInheritedStdio = async (
	command: string,
	args: string[],
): Promise<void> => {
	const proc = Bun.spawn([command, ...args], {
		stdin: "inherit",
		stdout: "inherit",
		stderr: "inherit",
	});
	const exitCode = await proc.exited;
	if (exitCode !== 0) {
		throw new Error(`${command} exited with code ${exitCode}`);
	}
};

export const ensureOllamaReady = async (
	providerConfig: ProviderConfig,
	models: ModelConfig[],
): Promise<void> => {
	const baseUrl = providerConfig.baseUrl ?? "";
	const isLocal =
		baseUrl.includes("localhost") || baseUrl.includes("127.0.0.1");

	if (!isLocal) {
		return;
	}

	const hasOllama = await commandExists("ollama");
	if (!hasOllama) {
		const installOk = await confirmPrompt(
			"Ollama is not installed on your system. Would you like to download it?",
		);
		if (!installOk) {
			throw new Error("Ollama is required for this provider.");
		}
		write("Installing Ollama...\n");
		await installOllama();
		write("Ollama installed.\n");
	}

	const modelId = models[0]?.id;
	if (!modelId) {
		return;
	}

	const hasModel = await ollamaHasModel(modelId);
	if (!hasModel) {
		const modelSize = await ollamaModelSize(modelId);
		const sizeNote = modelSize ? ` It is ${modelSize}.` : "";
		const pullOk = await confirmPrompt(
			`${modelId} model is not installed on your system.${sizeNote} Do you want to download it?`,
		);
		if (!pullOk) {
			throw new Error("Model download declined.");
		}
		write(`Pulling Ollama model: ${modelId}...\n`);
		await runWithInheritedStdio("ollama", ["pull", modelId]);
		write(`Model pulled: ${modelId}.\n`);
	}
};

const confirmPrompt = async (message: string): Promise<boolean> => {
	const answer = await readLine(`${message} (y/N) `);
	return answer.trim().toLowerCase().startsWith("y");
};

const commandExists = async (command: string): Promise<boolean> => {
	return Boolean(Bun.which(command));
};

const installOllama = async (): Promise<void> => {
	switch (process.platform) {
		case "darwin": {
			const hasBrew = await commandExists("brew");
			if (!hasBrew) {
				throw new Error(
					"Ollama is not installed and Homebrew is not available. Install Ollama manually from https://ollama.com/download.",
				);
			}
			await runWithInheritedStdio("brew", ["install", "ollama"]);
			return;
		}
		case "win32": {
			if (await commandExists("winget")) {
				await runWithInheritedStdio("winget", [
					"install",
					"-e",
					"--id",
					"Ollama.Ollama",
				]);
				return;
			}
			if (await commandExists("choco")) {
				await runWithInheritedStdio("choco", ["install", "ollama", "-y"]);
				return;
			}
			throw new Error(
				"Ollama is not installed and no supported package manager was found (winget/choco). Install it manually from https://ollama.com/download.",
			);
		}
		case "linux": {
			if (await commandExists("curl")) {
				await runWithInheritedStdio("sh", [
					"-c",
					"curl -fsSL https://ollama.com/install.sh | sh",
				]);
				return;
			}
			throw new Error(
				"Ollama is not installed and curl is not available. Install Ollama manually from https://ollama.com/download.",
			);
		}
		default:
			throw new Error(
				"Unsupported OS for automatic Ollama install. Install Ollama manually from https://ollama.com/download.",
			);
	}
};

const ollamaHasModel = async (modelId: string): Promise<boolean> => {
	try {
		const proc = Bun.spawn(["ollama", "list"], {
			stdout: "pipe",
			stderr: "pipe",
		});
		const stdout = await new Response(proc.stdout).text();
		const exitCode = await proc.exited;
		if (exitCode !== 0) {
			return false;
		}
		return stdout.split("\n").some((line) => line.startsWith(modelId));
	} catch {
		return false;
	}
};

const ollamaModelSize = async (modelId: string): Promise<string | null> => {
	try {
		const proc = Bun.spawn(["ollama", "show", modelId], {
			stdout: "pipe",
			stderr: "pipe",
		});
		const stdout = await new Response(proc.stdout).text();
		const exitCode = await proc.exited;
		if (exitCode !== 0) {
			return null;
		}
		const sizeLine = stdout
			.split("\n")
			.find((line) => line.toLowerCase().startsWith("size:"));
		if (!sizeLine) {
			return null;
		}
		const size = sizeLine.split(":")[1]?.trim();
		return size || null;
	} catch {
		return null;
	}
};

const readLine = async (prompt: string): Promise<string> => {
	write(prompt);
	const reader = Bun.stdin.stream().getReader();
	const decoder = new TextDecoder();
	let buffer = "";
	while (true) {
		const { value, done } = await reader.read();
		if (done) {
			return buffer.trim();
		}
		buffer += decoder.decode(value, { stream: true });
		const newlineIndex = buffer.indexOf("\n");
		if (newlineIndex >= 0) {
			const line = buffer.slice(0, newlineIndex).replace(/\r$/, "");
			return line.trim();
		}
	}
};
