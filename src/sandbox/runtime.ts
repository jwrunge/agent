import { spawnSync } from "node:child_process";

export type ContainerRuntime = "docker" | "podman";

const canRun = (cmd: string, args: string[] = []): boolean => {
	const res = spawnSync(cmd, args, { stdio: "ignore" });
	return res.status === 0;
};

export const detectRuntime = (preferred?: string): ContainerRuntime | null => {
	const normalized = preferred?.trim();
	if (normalized === "docker" && canRun("docker", ["version"])) return "docker";
	if (normalized === "podman" && canRun("podman", ["version"])) return "podman";

	if (canRun("docker", ["version"])) return "docker";
	if (canRun("podman", ["version"])) return "podman";

	return null;
};

export const imageExists = (runtime: ContainerRuntime, image: string): boolean => {
	const res = spawnSync(runtime, ["image", "inspect", image], { stdio: "ignore" });
	return res.status === 0;
};

export const buildImage = (
	runtime: ContainerRuntime,
	image: string,
	dockerfile: string,
	context: string,
): void => {
	const res = spawnSync(
		runtime,
		["build", "-t", image, "-f", dockerfile, context],
		{ stdio: "inherit" },
	);
	if (res.status !== 0) {
		throw new Error(`${runtime} build failed with exit code ${res.status}`);
	}
};
