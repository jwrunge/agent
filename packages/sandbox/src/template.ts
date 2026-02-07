import type { SandboxConfig } from "./config.ts";

const env = (key: string): string | undefined => {
	const v = process.env[key];
	return typeof v === "string" && v.trim() ? v : undefined;
};

export const defaultSandboxConfig = (): SandboxConfig => ({
	version: 1,
	image: {
		name: env("SANDBOX_DEFAULT_IMAGE_NAME") ?? "sandbox:local",
		build: {
			context: env("SANDBOX_DEFAULT_BUILD_CONTEXT") ?? ".",
			dockerfile: env("SANDBOX_DEFAULT_DOCKERFILE") ?? "container/Dockerfile",
			buildIfMissing: true,
		},
	},
	container: {
		workdir: "/workspace",
		readOnlyRootFs: true,
		interactive: true,
		tty: true,
		tmpfs: ["/tmp"],
		resources: {
			memory: "2g",
			cpus: 2,
			pidsLimit: 256,
		},
		network: {
			mode: "none",
		},
	},
	mounts: [
		{
			source: ".",
			target: "/workspace",
			mode: "ro",
		},
		{
			source: "./output",
			target: "/workspace/output",
			mode: "rw",
			createIfMissing: true,
		},
	],
	env: {
		passThrough: ["ANTHROPIC_API_KEY", "OPENAI_API_KEY", "OLLAMA_HOST"],
		set: {
			NODE_ENV: "production",
		},
	},
});
