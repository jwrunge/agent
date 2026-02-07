import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { parseSandboxConfig } from "./config.ts";
import { readJsonFile } from "./io.ts";
import { ensureDirExists, toAbsoluteRealPath } from "./paths.ts";
import { isWindows } from "./platform.ts";
import { buildImage, detectRuntime, imageExists } from "./runtime.ts";

type ParsedArgs = {
	configPath: string;
	rest: string[];
};

const add = (args: string[], ...more: string[]) => {
	args.push(...more);
};

const mountArg = (source: string, target: string, mode: "ro" | "rw") => {
	// Both docker and podman accept the short -v syntax.
	return ["-v", `${source}:${target}:${mode}`];
};

export const launchCommand = async (args: ParsedArgs): Promise<void> => {
	if (isWindows()) {
		console.error("Run this launcher inside WSL2 (Linux).");
		process.exit(1);
	}

	const raw = readJsonFile(args.configPath);
	const config = parseSandboxConfig(raw);

	const preferred = process.env.AGENT_CONTAINER_RUNTIME;
	const runtime = detectRuntime(preferred);
	if (!runtime) {
		console.error("No container runtime found. Run: pi-agent-sandbox install");
		process.exit(1);
	}

	const imageName = config.image.name;
	const build = config.image.build;
	if (!imageExists(runtime, imageName)) {
		if (!build || build.buildIfMissing === false) {
			console.error(`Image not found: ${imageName}`);
			process.exit(1);
		}
		const dockerfile = resolve(process.cwd(), build.dockerfile);
		const context = resolve(process.cwd(), build.context);
		if (!existsSync(dockerfile)) {
			console.error(`Dockerfile not found: ${dockerfile}`);
			process.exit(1);
		}
		console.log(`Building image ${imageName} using ${runtime}...`);
		buildImage(runtime, imageName, dockerfile, context);
	}

	const runArgs: string[] = ["run", "--rm"];

	const c = config.container;
	if (c.interactive !== false) add(runArgs, "-i");
	if (c.tty !== false) add(runArgs, "-t");

	if (c.readOnlyRootFs !== false) add(runArgs, "--read-only");
	add(runArgs, "--cap-drop=ALL");
	add(runArgs, "--security-opt=no-new-privileges");

	for (const t of c.tmpfs ?? ["/tmp"]) {
		add(runArgs, "--tmpfs", `${t}:rw,noexec,nosuid,size=64m`);
	}

	if (c.resources?.memory) add(runArgs, "--memory", c.resources.memory);
	if (typeof c.resources?.cpus === "number")
		add(runArgs, "--cpus", String(c.resources.cpus));
	if (typeof c.resources?.pidsLimit === "number")
		add(runArgs, "--pids-limit", String(c.resources.pidsLimit));

	const netMode = c.network?.mode ?? "none";
	add(runArgs, "--network", netMode);

	const workdir = c.workdir ?? "/workspace";
	add(runArgs, "-w", workdir);

	// Mounts
	for (const m of config.mounts) {
		const srcAbs = toAbsoluteRealPath(m.source);
		if (m.createIfMissing) ensureDirExists(srcAbs);
		add(runArgs, ...mountArg(srcAbs, m.target, m.mode));
	}

	// Env
	for (const key of config.env?.passThrough ?? []) {
		const val = process.env[key];
		if (typeof val === "string") {
			add(runArgs, "-e", `${key}=${val}`);
		}
	}
	for (const [k, v] of Object.entries(config.env?.set ?? {})) {
		add(runArgs, "-e", `${k}=${v}`);
	}

	add(runArgs, imageName);

	const child = spawn(runtime, runArgs, { stdio: "inherit" });
	child.on("exit", (code) => process.exit(code ?? 1));
};
