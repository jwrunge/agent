import { execFile, spawn } from "node:child_process";
import { createInterface } from "node:readline/promises";
import { promisify } from "node:util";

import type { ModelConfig, ProviderConfig } from "./types.js";

const execFileAsync = promisify(execFile);

async function runWithInheritedStdio(
	command: string,
	args: string[],
): Promise<void> {
	await new Promise<void>((resolve, reject) => {
		const child = spawn(command, args, { stdio: "inherit" });
		child.on("error", reject);
		child.on("close", (code) => {
			if (code === 0) {
				resolve();
			} else {
				reject(new Error(`${command} exited with code ${code}`));
			}
		});
	});
}

export async function ensureOllamaReady(
	providerConfig: ProviderConfig,
	models: ModelConfig[],
): Promise<void> {
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
		process.stdout.write("Installing Ollama...\n");
		await installOllama();
		process.stdout.write("Ollama installed.\n");
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
		process.stdout.write(`Pulling Ollama model: ${modelId}...\n`);
		await runWithInheritedStdio("ollama", ["pull", modelId]);
		process.stdout.write(`Model pulled: ${modelId}.\n`);
	}
}

async function confirmPrompt(message: string): Promise<boolean> {
	const rl = createInterface({
		input: process.stdin,
		output: process.stdout,
	});
	try {
		const answer = await rl.question(`${message} (y/N) `);
		return answer.trim().toLowerCase().startsWith("y");
	} finally {
		rl.close();
	}
}

async function commandExists(command: string): Promise<boolean> {
	try {
		await execFileAsync("/usr/bin/env", ["command", "-v", command]);
		return true;
	} catch {
		return false;
	}
}

async function installOllama(): Promise<void> {
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
}

async function ollamaHasModel(modelId: string): Promise<boolean> {
	try {
		const { stdout } = await execFileAsync("ollama", ["list"]);
		return stdout.split("\n").some((line) => line.startsWith(modelId));
	} catch {
		return false;
	}
}

async function ollamaModelSize(modelId: string): Promise<string | null> {
	try {
		const { stdout } = await execFileAsync("ollama", ["show", modelId]);
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
}
