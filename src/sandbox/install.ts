import { spawnSync } from "node:child_process";
import { createInterface } from "node:readline";

import { isLinux, isMac, isWindows, isWsl } from "./platform.ts";
import { detectRuntime } from "./runtime.ts";

type ParsedArgs = {
	configPath: string;
	rest: string[];
};

const promptYesNo = async (question: string): Promise<boolean> => {
	const rl = createInterface({ input: process.stdin, output: process.stdout });
	const answer = await new Promise<string>((resolve) => rl.question(question, resolve));
	rl.close();
	return /^y(es)?$/i.test(answer.trim());
};

const run = (cmd: string, args: string[]) => {
	const res = spawnSync(cmd, args, { stdio: "inherit" });
	return res.status === 0;
};

export const installCommand = async (_args: ParsedArgs): Promise<void> => {
	const preferred = process.env.AGENT_CONTAINER_RUNTIME;

	if (isWindows()) {
		console.error("Windows detected.");
		console.error("This project requires WSL2 for the container sandbox.");
		console.error("Install WSL2 + a Linux distro (Ubuntu), then run this tool inside WSL.");
		const ok = await promptYesNo("Open WSL install docs in your browser? (y/N) ");
		if (ok) {
			console.error("Docs: https://learn.microsoft.com/windows/wsl/install");
		}
		process.exit(1);
	}

	if (isLinux() && isWsl()) {
		console.log("WSL detected (Linux environment). Good.");
	}

	const runtime = detectRuntime(preferred);
	if (runtime) {
		console.log(`Container runtime detected: ${runtime}`);
		return;
	}

	if (isMac()) {
		console.error("No container runtime detected on macOS.");
		console.error("Recommended free setup: Homebrew + Colima.");

		const hasBrew = run("brew", ["--version"]);
		if (!hasBrew) {
			console.error("Homebrew not found.");
			console.error("Install it from: https://brew.sh/");
			process.exit(1);
		}

		const yes = await promptYesNo("Install Docker CLI + Colima via brew now? (y/N) ");
		if (!yes) {
			console.error("Declined. Please install prerequisites and rerun: pi-agent-sandbox install");
			process.exit(1);
		}

		if (!run("brew", ["install", "colima", "docker"])) {
			process.exit(1);
		}
		console.log("Starting Colima...");
		run("colima", ["start"]);
		console.log("Done. You should now have a working `docker` CLI.");
		return;
	}

	if (isLinux()) {
		console.error("No container runtime detected on Linux.");
		console.error("Recommended: rootless Podman (or Docker Engine).");
		console.error("Podman docs: https://podman.io/docs/installation");
		console.error("Docker docs: https://docs.docker.com/engine/install/");
		process.exit(1);
	}

	console.error("Unsupported platform.");
	process.exit(1);
};
